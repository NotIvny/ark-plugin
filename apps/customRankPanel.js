import { ArkApi } from '../model/api.js'
import { Player, Character } from '../../miao-plugin/models/index.js'

const CUSTOM_RANK_QUERY_CACHE_PREFIX = 'miao:ark-query-cache:'

function getPanelData (ret) {
  return ret?.data?.info || ret?.data?.playerData || ret?.data
}

export class CustomRankPanel extends plugin {
  constructor () {
    super({
      name: 'ark自定义排行面板获取',
      event: 'message',
      priority: -3000,
      rule: [
        { reg: /^#ark获取面板\s*([1-9]|1[0-9]|20)$/i, fnc: 'getCustomRankPanel' }
      ]
    })
  }

  async getCustomRankPanel (e) {
    const match = /^#ark获取面板\s*([1-9]|1[0-9]|20)$/i.exec(e.msg || e.original_msg || '')
    if (!match) return false

    const index = Number(match[1]) - 1
    let source
    if (e.getReply) {
      source = await e.getReply()
    } else if (e.reply_id) {
      source = { message_id: e.reply_id }
    } else {
      if (!e.hasReply && !e.source) return false
      if (e.source?.user_id !== e.self_id) return false
      if (e.group?.getChatHistory) {
        source = (await e.group.getChatHistory(e.source.seq, 1)).pop()
      } else if (e.friend?.getChatHistory) {
        source = (await e.friend.getChatHistory(e.source.time, 1)).pop()
      }
      if (!(source?.message?.length === 1 && source?.message[0]?.type === 'image')) return false
    }
    if (!source?.message_id) return false

    const raw = await redis.get(`${CUSTOM_RANK_QUERY_CACHE_PREFIX}${source.message_id}`)
    const cache = raw ? JSON.parse(raw) : false

    if (!cache?.query_id) {
      e.reply('未找到该排行图片的查询缓存，请重新发送 #ark自定义排行 后再获取面板')
      return true
    }

    let ret
    try {
      ret = await ArkApi.req('rank/custom/specific', { query_id: cache.query_id, index })
    } catch {
      ret = false
    }

    if (!ret) {
      e.reply('面板服务暂不可用')
      return true
    }
    if (ret?.retcode !== 0) {
      e.reply('获取面板失败：' + (ret?.message || '未知错误'))
      return true
    }

    const panelData = getPanelData(ret)
    const uid = panelData?.uid
    const game = ['gs', 'sr'].includes(cache.game) ? cache.game : ''
    if (!uid || !game || !panelData?.avatars) {
      e.reply('获取面板失败：返回数据异常')
      return true
    }

    let player, profiles
    try {
      player = Object.create(Player.prototype)
      player.uid = uid
      player.game = game
      player.save = () => false
      player.setBasicData(panelData)
      player.setAvatars(panelData.avatars || [], true)
      profiles = player.getProfiles()
    } catch (err) {
      e.reply('获取面板失败：未找到对应角色面板')
      return true
    }

    const charId = String(cache.charId || '')
    const profile = profiles?.[charId] || Object.values(profiles || {})[0]
    const char = Character.get(cache.charId, game) || profile?.char
    const characterName = cache.charName || char?.name || profile?.char?.name || panelData.avatars?.[charId]?.name
    if (!characterName || !profile) {
      e.reply('获取面板失败：未找到对应角色面板')
      return true
    }

    const numericUid = /^(18|[1-9])\d{8}$/.test(uid) ? uid : ''
    e.game = game
    e.isSr = game === 'sr'
    e.uid = uid
    e.avatar = profile.id || cache.charId
    e._profile = profile
    e.msg = `${game === 'sr' ? '星铁' : '原神'}${characterName}面板${numericUid}`
    e.original_msg = e.msg
    e.raw_message = e.msg
    return false
  }
}