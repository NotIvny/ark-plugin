import { getTargetUid } from '../../miao-plugin/apps/profile/ProfileCommon.js'
import safeGsCfg from '../model/safeGsCfg.js'
import fs from 'node:fs'
import api from '../model/api.js'
import { getStygianVersion, getStygianPeriod } from '../model/calcVersion.js'
import { Button, ProfileRank, Player, Character, Avatar } from '../../miao-plugin/models/index.js'
import { Cfg, Common } from '../components/index.js'
import ProfileDetail from '../../miao-plugin/apps/profile/ProfileDetail.js'
import lodash from 'lodash'
export class characterRank extends plugin {
  constructor() {
    super({
      name: '角色排名获取',
      dsc: '角色排名获取',
      event: 'message',
      priority: -3000,
      rule: [{
        reg: '^#(.*)排名统计$',
        fnc: 'getSpecificRank'
      },
      {
        reg: '^#(星铁|原神)?(导出面板数据)(.*)',
        fnc: 'uploadPanelData',
      },
      {
        reg: '^#(星铁|原神)?ark重塑识别$',
        fnc: 'arkReforgeRecog'
      },
      {
        reg: '#(星铁|原神)?(导入面板数据)(.*)',
        fnc: 'downloadPanelData',
      },
      {
        reg: '^#角色排名(.*)$',
        fnc: 'getRank',
      },
      {
        reg: '^#(星铁|原神)?总排名(.*)$',
        fnc: 'getAllRank',
      },
      {
        reg: '^#(top)?幽境危战排名(\\d+\.\\d+)?$',
        fnc: 'stygian',
      },
      {
        reg: /^#(星铁|原神)?(群|群内)?.+(排名|排行)(榜)?$/,
        fnc: 'playerRank',
      },
      {
        reg: /^#(星铁|原神)?(全部面板更新|更新全部面板|获取游戏角色详情|更新面板|面板更新)\s*(\d{9,10})?$/,
        fnc: 'refreshPanel',
      },
      {
        reg: /^#ark绑定(星铁|原神)uid$/,
        fnc: 'arkGetBindUid',
      },
      {
        reg: /^#ark验证(星铁|原神)uid$/,
        fnc: 'arkBindUid',
      },
      {
        reg: /^#(星铁|原神)导出面板$/,
        fnc: 'exportPanel',
      }
      ]
    })
  }
  async refreshPanel(e) {
    let type = e.msg.includes('星铁') ? 'sr' : 'gs'
    let uid = type === 'sr' ? e.user?._games?.sr?.uid : e.user?._games?.gs?.uid
    if (uid && Cfg.get('newUserPanel', false) && !fs.existsSync(`./data/PlayerData/${type}/${uid}.json`)) {
      let ret = await api.sendApi('getPanelData', { uid: uid, type: type, qq: e.user_id })
      switch (ret.retcode) {
        case 100:
          fs.writeFileSync(`./data/PlayerData/${type}/${uid}.json`, JSON.stringify(ret.data.playerData, null, 2))
          let player = new Player(uid, type)
            		player.reload()
          e.reply(`[ark-plugin]已自动从API获取${ Object.keys(ret.data.playerData.avatars).length }个数据`)
          break
      }
    }
    api.sendApi('refreshPanel', {
      uid: uid,
      type: type
    }, '0.2.0')
    return false
  }
  async getRank(e) {
    let msg = this.e.msg.replace('#角色排名', '').trim()
    const characterName = msg.replace(/\d+/g, '').trim()
    const uid = msg.replace(/\D+/g, '').trim()
    if (!characterName || !uid) {
      e.reply('命令格式错误，示例：#角色排名雷电将军123456789')
      return true
    }
    let name = characterName
    let id = safeGsCfg.roleNameToID(name, true) || safeGsCfg.roleNameToID(name, false)
    if (id) {
      name = safeGsCfg.roleIdToName(id)
    }
    let ret = await api.sendApi('getRankData', {
      uid: uid,
      id: id,
      update: 1
    })
    switch (ret.retcode) {
      case 100:
        e.reply(`uid:${uid}的${name}全服伤害排名为 ${ret?.rank}，伤害评分: ${ret?.score?.toFixed(2)}`)
        break
      default:
        e.reply(await this.dealError(ret.retcode))
    }
    return false
  }
  async playerRank(e) {
    let name = e.msg.replace(/(#|星铁|最强|最高分|第一|词条|双爆|双暴|极限|最高|最多|最牛|圣遗物|遗器|评分|群内|群|排名|排行|面板|面版|详情|榜)/g, '')
    let id = safeGsCfg.roleNameToID(name, true) || safeGsCfg.roleNameToID(name, false)
    if (id) {
      name = safeGsCfg.roleIdToName(id)
    }
    let uid = id < 10000 ? e.user?._games?.sr?.uid : e.user?._games?.gs?.uid
    setTimeout(async () => {
      let ret = await api.sendApi('getRankData', {
        id: id,
        uid: uid,
        update: 1
      });
      switch (ret.retcode) {
        case 100:
          e.reply(`uid:${uid}的${name}全服伤害排名为 ${ret?.rank}，伤害评分: ${ret?.score?.toFixed(2)}`)
          break
        case 101:
        case 102:
          break
        default:
          e.reply(await this.dealError(ret.retcode))
      }
    }, 0)
    return false
  }
  async getAllRank(e) {
    let uid = await getTargetUid(e)
    if (!uid) {
      e._replyNeedUid || e.reply(['请先发送【#绑定+你的UID】来绑定查询目标\n星铁请使用【#星铁绑定+UID】', new Button(e).bindUid()])
      return true
    }
    let player = Player.create(e)
    let profiles = player.getProfiles()
    let profile = []
    for (let id in profiles) {
      profile.push(id)
    }
    let ret = await api.sendApi('selfAllRank', {
      ids: profile,
      uid: uid,
      type: e.game
    })
    switch (ret.retcode) {
      case 100:
        let msg = ''
        let count = 0
        let type = e.game === 'sr' ? '星铁' : '原神'
        msg += `uid:${uid}的${type}全服排名数据:\n`
        ret?.rank?.forEach(ret => {
          if (ret.retcode === 100) {
            msg += (`${safeGsCfg.roleIdToName(profile[count])}全服伤害排名为${ret?.rank}，伤害评分: ${ret?.score?.toFixed(2)}\n`)
          }
          count++
        })
        e.reply(msg)
        break
      default:
        e.reply(await this.dealError(ret.retcode))
    }
  }
  async arkReforgeRecog(e) {
    let uid = await getTargetUid(e)
    if (!uid) {
      e.reply('请先绑定UID')
      return true
    }
    let imgUrls = []
    if (e.getReply) {
      let source = await e.getReply()
      if (source && source.message) {
        source.message.forEach(item => {
          if (item.type === 'image') imgUrls.push(item.url)
        })
      }
    } else if (e.source) {
      let source
      if (e.group?.getChatHistory) {
        source = (await e.group.getChatHistory(e.source?.seq, 1)).pop()
      } else if (e.friend?.getChatHistory) {
        source = (await e.friend.getChatHistory((e.source?.time + 1), 1)).pop()
      }
      if (source && source.message) {
        source.message.forEach(item => {
          if (item.type === 'image') imgUrls.push(item.url)
        })
      }
    }
    if (e.message) {
      e.message.forEach(item => {
        if (item.type === 'image') imgUrls.push(item.url)
      })
    }
    let ret = await api.ArkApi.req(`ocr/profilechange/${e.isSr ? 'sr' : 'gs'}`, { body: JSON.stringify({ image: imgUrls[0], forge: true }) })
   
    let original = ret.data[0]
    let replacement = ret.data[1]
    if (original.data) {
      original = original.data
    }
    if (replacement.data) {
      replacement = replacement.data
    }
    let isSr = false
    if (original.attrIds && original.attrIds.length > 0 && typeof original.attrIds[0] === 'string') {
      isSr = true
    }

    let game = isSr ? 'sr' : 'gs'
    let dataPath = `./data/PlayerData/${game}/${uid}.json`
    
    if (!fs.existsSync(dataPath)) {
      e.reply(`未找到UID:${uid}的${isSr ? '星铁' : '原神'}本地数据，请先更新面板`)
      return true
    }

    let playerData = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
    let targetCharId = null
    let targetSlot = null

    const matchAttrs = (localAttrs, remoteAttrs) => {
      if (!localAttrs || !remoteAttrs) return false
      
      if (isSr) {
        if (localAttrs.length !== remoteAttrs.length) return false
        
        const parse = (str) => {
          const [id, count, step] = str.split(',').map(Number)
          return { id, count, step }
        }

        const l = localAttrs.map(parse).sort((a, b) => a.id - b.id)
        const r = remoteAttrs.map(parse).sort((a, b) => a.id - b.id)

        const isMatch = l.every((a, i) => {
          const b = r[i]
          if (a.id !== b.id) {
            return false
          }
          // 速度特殊处理，只匹配词条数
          if (a.id === 7) {
            if (a.count !== b.count) {
              logger.mark(`[Ark] Speed count mismatch: ${a.count} vs ${b.count}`)
              return false
            }
            return true
          }
          if (a.count !== b.count || a.step !== b.step) {
            logger.mark(`[Ark] Attr mismatch ID ${a.id}: ${a.count},${a.step} vs ${b.count},${b.step}`)
            return false
          }
          return true
        })
        if (isMatch) logger.mark(`[Ark] Attrs matched!`)
        return isMatch
      } else {
        const getType = (id) => Math.floor(id / 10)
        const l = localAttrs.map(getType).sort((a, b) => a - b)
        const r = remoteAttrs.map(getType).sort((a, b) => a - b)
        const isMatch = lodash.isEqual(l, r)
        if (isMatch) logger.mark(`[Ark] GS Attrs matched!`)
        return isMatch
      }
    }

    let candidates = []
    for (let charId in playerData.avatars) {
      let avatar = playerData.avatars[charId]
      if (!avatar.artis) continue

      for (let slot in avatar.artis) {
        let arti = avatar.artis[slot]
        if (matchAttrs(arti.attrIds, original.attrIds)) {
          candidates.push({ charId, slot, arti })
        }
      }
    }

    if (candidates.length > 0) {
      //优先匹配mainId
      let best = candidates.find(c => c.arti.mainId === original.mainId)
      if (best) {
        logger.mark(`[Ark] Found perfect match (Attrs + MainId) on ${best.charId} slot ${best.slot}`)
        targetCharId = best.charId
        targetSlot = best.slot
      } else {
        logger.mark(`[Ark] Found attr match but mainId mismatch. Using first candidate on ${candidates[0].charId} slot ${candidates[0].slot}`)
        targetCharId = candidates[0].charId
        targetSlot = candidates[0].slot
      }
    }

    if (!targetCharId) {
      e.reply('未在本地数据中找到匹配的圣遗物/遗器')
      return true
    }

    let char = Character.get(targetCharId)
    if (!char) {
      e.reply(`未找到角色ID:${targetCharId}`)
      return true
    }
    let player = new Player(uid, game)
    let profile = player.getProfile(targetCharId)
    if (!profile) {
      e.reply(`未找到UID:${uid} 角色:${targetCharId} 的面板数据`)
      return true
    }

    let rawData = profile.toJSON()
    rawData = lodash.cloneDeep(rawData)
    
    if (rawData.artis && rawData.artis[targetSlot]) {
      rawData.artis[targetSlot] = {
        ...rawData.artis[targetSlot],
        ...replacement,
        attrIds: replacement.attrIds,
        mainId: replacement.mainId,
        level: replacement.level
      }
    } else {
      e.reply('修改圣遗物数据失败：找不到对应槽位')
      return true
    }

    let newProfile = new Avatar(rawData, profile.game)
    newProfile.calcAttr()

    e.avatar = newProfile.char.id
    e.game = game
    e.uid = uid
    e._profile = newProfile
    e.msg = '#喵喵面板变换'

    e.reply(`找到匹配圣遗物，正在生成重铸建议面板...`)
    await ProfileDetail.render(e, newProfile.char, 'profile', { dmgIdx: 1, idxIsInput: false })
    
    return true
  }

  async uploadPanelData(e) {
    e.game = e.game || 'gs'
    let prefix = e.game === 'gs' ? '#' : '*'
    let user = e?.runtime?.user || {}
    let uid = await getTargetUid(e)
    if (!await this.checkPermission(e, user, 'exportPanelData')) {
      return true
    }
    let playerData = fs.readFileSync(`./data/PlayerData/${e.game}/${uid}.json`, 'utf8')
    let ret = await api.sendApi('uploadPanelData', {
      uid: uid,
      type: e.game,
      data: playerData
    })
    switch (ret.retcode) {
      case 100:
        e.reply(`导出成功，请在另一个安装此插件的Bot上输入 ${prefix}导入面板数据${uid} ，有效期十分钟~`)
        break
      default:
        e.reply(await this.dealError(ret.retcode))
    }
  }
  async downloadPanelData(e) {
    e.game = e.game || 'gs'
    let user = e?.runtime?.user || {}
    let uid = await getTargetUid(e)
    if (!await this.checkPermission(e, user, 'importPanelData')) {
      return true
    }
    let ret = await api.sendApi('downloadPanelData', {
      uid: uid,
      type: e.game
    })
    switch (ret.retcode) {
      case 100:
        fs.writeFileSync(`./data/playerData/${e.game}/${uid}.json`, JSON.stringify(ret.data, null, 2))
        e.reply('导入成功')
        break
      default:
        e.reply(await this.dealError(ret.retcode))
    }
  }
  async checkPermission(e, user, type) {
    switch (Cfg.get(type, 3)) {
      case 0:
        return true
      case 1:
        if (!user.hasCk && !e.isMaster) {
          e.reply('为确保数据安全，目前仅允许绑定CK用户导入/导出自己UID的面板数据，请联系Bot主人导入/导出...')
          return false
        }
        break
      case 2:
        if (!e.isMaster) {
          e.reply('为确保数据安全，目前仅允许主人导入/导出自己UID的面板数据，请联系Bot主人导入/导出...')
          return false
        }
        break
      case 3:
        e.reply('当s前功能已被禁用...')
        return false
      default:
        return false
    }
    return true
  }
  async getSpecificRank(e) {
    let name = this.e.msg.replace('排名统计', '').replace('#', '').replace('星铁', '').trim()
    let id = safeGsCfg.roleNameToID(name, true) || safeGsCfg.roleNameToID(name, false)
    logger.debug(id)
    if (!name || !id) {
      return true
    }
    let characterName = safeGsCfg.roleIdToName(id)
    let ret = await api.sendApi('getSpecificRank', {
      id: id,
      percent: 0
    })
    switch (ret.retcode) {
      case 100:
        // eslint-disable-next-line no-return-await
        return await Common.render('graph/stats', {
          rankData: ret.data.scores,
          characterName: characterName,
          total: ret.data.total,
          dmgTitle: ret.data.name
        }, { e, scale: 1.4 })
      default:
        e.reply(await this.dealError(ret.retcode))
    }
  }
  async arkGetBindUid(e) {
    let type = ''
    if (e.msg.includes('原神')) {
      type = 'gs'
      e.game = 'gs'
    } else {
      type = 'sr'
      e.game = 'sr'
    }
    let ret = await api.sendApi('getVerifyCode',
      {
        uid: await getTargetUid(e),
        type: type
      }
    )
    switch (ret.retcode) {
      case 100:
        e.reply(`验证码: ${ret.data.verifyCode}\n使用方式：\n①原神：派蒙头像——右上角编辑资料——设置签名——填入验证码，待签名审核通过后输入 #ark验证原神uid\n②星铁：手机——右上角三点——漫游签证——设置签名——填入验证码，5-10分钟后输入 #ark验证星铁uid\n验证码有效期24小时，验证通过后自动与QQ绑定，在其他Bot上无需再次绑定`)
        break
      default:
        e.reply(await this.dealError(ret.retcode))
    }
  }
  async arkBindUid(e) {
    let type = ''
    if (e.msg.includes('原神')) {
      type = 'gs'
      e.game = 'gs'
    } else {
      type = 'sr'
      e.game = 'sr'
    }
    let ret = await api.sendApi('verify',
      {
        uid: await getTargetUid(e),
        qq: e.user_id,
        type: type
      }
    )
    switch (ret.retcode) {
      case 100:
        e.reply(`验证成功`)
        break
      default:
        e.reply(await this.dealError(ret.retcode))
    }
  }
  async exportPanel(e) {
    let user = e?.runtime?.user || {}
    let type = e.msg.includes('星铁') ? 'sr' : 'gs'
    let uid = type === 'sr' ? e.user?._games?.sr?.uid : e.user?._games?.gs?.uid
    if (!uid) {
      e.reply('请先绑定uid')
    }
    let ret = ''
    let pm = Cfg.get('exportPanelRequire', 1)
    if (pm === 1) {
      ret = await api.sendApi('verifyUser', { uid: uid, qq: e.user_id, type: type })
    } 
    if ((pm <= 2 && pm >= 1 && !user.hasCk) || (pm === 1 && ret?.retcode === 200) || pm === 3) {
      let filePath = `./data/PlayerData/${type}/${uid}.json`
      if (!fs.existsSync(filePath)) {
        e.reply('面板数据文件不存在，请先更新面板数据')
        return true
      }
      if (e.group?.sendFile)
        await e.group.sendFile(filePath)
      else if (e.friend?.sendFile)
        await e.friend.sendFile(filePath)
      else
        e.reply('当前环境不支持发送文件')
    }
  }
  async dealError(retcode) {
    switch (retcode) {
      case -1:
        return '插件版本过低，请更新插件'
      case 101:
        return '角色ID不存在'
      case 102:
        return '未查询到角色信息'
      case 103:
        return '请求参数错误'
      case 104:
        return '请求超过速率限制'
      case 105:
        return '未知错误'
      case 106:
        return '数据过大，请确保导出的数据小于2MB'
      case 201:
        return '请求超过速率限制，请5分钟后重试'
      case 202:
        return '未发现该用户的数据，请重新导出面板'
      case 301:
        return '请求类型仅支持原神/星铁'
      case 302:
        return '验证失败，个人签名不匹配，请五分钟后重试'
      case 303:
        return '验证失败，请稍后再试'
      case 304:
        return '该uid未验证号主，请通过 #ark验证原神/星铁uid 验证uid'
      case 305:
        return '验证超时，请重新绑定'
      case 306:
        return '验证失败，未获取到签名，请五分钟后重试'
      case 307:
        return '服务器中无该uid数据...'
      default:
        return '未知错误'
    }
  }
  async stygian(e) {
    if (!e.isGroup) return true
    const regex = /^#(top)?幽境危战排名(?:(\d+\.\d+))?$/
    const match = e.msg.match(regex)
    //let hasTop = !!match[1]
    let version = match[2] || null
    if (version) {
      const [bVersion, sVersion] = version.split('.').map(Number)
      version = (bVersion * 9 + sVersion >= 52) ? bVersion * 9 + sVersion : null
    }
    let stygianVersion = getStygianVersion()
    	const queryOld = version && version !== stygianVersion
    let uidsOld = [] //, ranksOld = []
    let stygianUids = await redis.zRangeWithScores(`ark-plugin:stygianRank:${stygianVersion}:${e.group_id}`, 0, -1);
    let uids = stygianUids.map(item => item.value)
    let ranks = stygianUids.map(item => item.score)
    if (queryOld) {
      const stygianUidsOld = await redis.zRangeWithScores(`ark-plugin:stygianRank:${version}:${e.group_id}`, 0, -1)
      uidsOld = stygianUidsOld.map(item => item.value)
      //ranksOld = stygianUidsOld.map(item => item.score)
      stygianVersion = version
      const mergedMap = new Map(uids.map(uid => [uid, null]))
      uidsOld.forEach((uid, index) => !mergedMap.has(uid) && mergedMap.set(uid, ranks[index]))
      uids = Array.from(mergedMap.keys())
      ranks = Array.from(mergedMap.values())
    }
    let stygianData = Cfg.get('stygianDataFrom', 2) 
    let [enableArk, enableAkasha] = [[0, 2].includes(stygianData), [1, 2].includes(stygianData)]
    //仅支持6.0+版本，下个版本再支持查询旧版本的
    let ret_ark = (enableArk && !queryOld) ? await api.sendApi('stygianRank', { uid: uids }) : null
    if (ret_ark?.retcode !== 100) {
      ret_ark = null
    }
    let uidsInfo = uids.map(uid => `[uid]${uid}`).join('')
    //5.7+
    let ret_akasha = enableAkasha ? await api.sendAkashaApi(`leaderboards/stygian?sort=stygianScore&order=-1&size=50&page=1&uids=${uidsInfo}&p=&fromId=&li=&uid=251890729&version=${Math.floor(stygianVersion / 9)}_${Number(stygianVersion) % 9}`) : null
    let ret_akasha_to_get_total = enableAkasha ? await api.sendAkashaApi(`leaderboards/stygian?sort=stygianScore&order=1&size=1&page=1&uids=&p=&fromId=&li=&uid=&version=${Math.floor(stygianVersion / 9)}_${Number(stygianVersion) % 9}`) : null
    if (ret_akasha) {
      ret_akasha = ret_akasha.data
        .filter(item => item?.playerInfo?.nickname && 
							item?.stygianIndex !== undefined && 
							item?.stygianSeconds !== undefined && 
							item?.profilePictureLink &&
							item?.uid &&
							item?.index)
        .map(item => ({
          nickname: item.playerInfo.nickname,
          stygianIndex: item.stygianIndex,
          stygianSeconds: item.stygianSeconds,
          profilePictureLink: item.profilePictureLink,
          uid: item.uid,
          index: item.index
        }))
    }
    let akasha_total_players = null
    if (ret_akasha_to_get_total) {
      akasha_total_players = ret_akasha_to_get_total?.data[0]?.index
    }
    let list = []
    for (const [index, uid] of uids.entries()) {
      const item_akasha = ret_akasha ? ret_akasha?.find(element => element.uid === uid) : {}
      const item_ark = ret_ark?.data[index]
      let final_stygianSeconds = Math.min(item_akasha?.stygianSeconds || 99999, item_ark?.time || 99999, Number(ranks[index]) % 2048 || 99999)
      if (final_stygianSeconds === 99999) continue
      let final_stygianIndex = Math.min(item_akasha?.stygianIndex || 99999, item_ark?.hard || 99999, (6 - Math.floor(ranks[index] / 2048) || 99999))
      if (final_stygianIndex === 99999) continue
      let rank_ark = item_ark?.rank || '?' 
      let rank_akasha = item_akasha?.index || '?' 
      let sum = item_ark?.sum || '?'
      let img = ''
      if (final_stygianIndex === 6 && final_stygianSeconds <= 180) {
        img = `/character/img/medal_6_plus.png`
      } else {
        img = `/character/img/medal_${final_stygianIndex}.png`
      }
      let elem = {
        uid,
        stygianIndex: {
          title: '难度',
          info: final_stygianIndex,
          img: img
        },
        stygianTime: {
          title: '时间',
          info: `${final_stygianSeconds}秒`
        },
        rank_ark: {
          title: '全服排名(ark)',
          info: `${rank_ark} / ${sum}`
        },
        rank_akasha: {
          title: '全服排名(akasha)',
          info: akasha_total_players ? `${rank_akasha} / ${akasha_total_players}` : `${rank_akasha}`
        },
        qqFace: item_akasha?.profilePictureLink
      }
      if (uid) {
        let userInfo = await ProfileRank.getUidInfo(uid)
        try {
          if (userInfo?.qq && e?.group?.pickMember) {
            let member = e.group.pickMember(userInfo.qq)
            if (member?.getAvatarUrl) {
              let img = await member.getAvatarUrl()
              if (img) {
                elem.qqFace = img
              } 
              try {
                let username = await member.getInfo()
                elem.sName = username.card || username.nickname
               
              } catch (e) {
                // do nothing
              }
            }
          }
         
        } catch (e) {
          // logger.error(e)
        }
        try {
          let playerData = fs.readFileSync(`./data/PlayerData/gs/${uid}.json`, 'utf8')
          let jsonData = JSON.parse(playerData)
          if (!elem.sName) elem.sName = jsonData.name || ret_akasha.username || ''
         
        } catch (e) {
          //logger.error(e)
        }
      }
      list.push(elem)
    }
    let validList = list.filter(elem => 
      elem && (elem.stygianTime?.info?.includes('秒') || elem.stygianIndex?.info != null)
    ).sort((a, b) => {
      const getValue = elem => {
        const seconds = parseInt(elem.stygianTime?.info?.match(/(\d+)秒/)?.[1] || 0)
        const index = parseFloat(elem.stygianIndex?.info) || 0
        return seconds + (6 - index) * 2048
      }
      return getValue(a) - getValue(b)
    })
    if (validList.length === 0) {
      e.reply('当前版本无排名....')
      return true
    }
    validList.hasArk = !!ret_ark
    validList.hasAkasha = !!ret_akasha
    const period = getStygianPeriod(stygianVersion)
    stygianVersion = `${Math.floor(stygianVersion / 9)}.${Number(stygianVersion) % 9}`
    const data = {
      style: `<style>body .container {width: ${860 - (!validList.hasArk + !validList.hasAkasha) * 140}px;}</style>`
    }
    return e.reply([
      await Common.render('character/stygian-rank-list', {
        list: validList,
        data,
        period,
        stygianVersion,
        pageGotoParams: { waitUntil: 'networkidle2' }
      }, { e, scale: 1.4, retType: 'base64' })
    ])
		
  }
}
