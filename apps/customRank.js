﻿import { Common, Format } from '../../miao-plugin/components/index.js'
import { Character, Avatar } from '../../miao-plugin/models/index.js'
import { ArkApi } from '../model/api.js'

const ALLOWED_COLS = new Set([
  'level', 'promote', 'cons',
  'talent_a', 'talent_e', 'talent_q',
  'weapon_level', 'weapon_promote', 'weapon_affix',
  'dmg_avg', 'mark_score', 'data_time',
  'artis_sets'
])
const ALIAS_MAP = {
  '等级': 'level', '突破': 'promote', '命座': 'cons', '命': 'cons',
  '普攻': 'talent_a', '战技': 'talent_e', '爆发': 'talent_q',
  '武器等级': 'weapon_level', '武器突破': 'weapon_promote', '精炼': 'weapon_affix',
  '伤害': 'dmg_avg', '评分': 'mark_score',
  '伤害均值': 'dmg_avg', '圣遗物评分': 'mark_score',
  '圣遗物': 'artis_sets', '套装': 'artis_sets'
}

function resolveCol (name) {
  return ALIAS_MAP[name] || name.toLowerCase()
}

function parseRankArgs (raw) {
  const tokens = raw.split(/\s+/)
  let charName = ''
  const rank = { col: 'dmg_avg', order: 'desc' }
  const filter = []
  const OP_TO_RULE = { '>=': 0, '=': 1, '<=': 2, '>': 3, '<': 4, '!=': 5 }

  for (const t of tokens) {
    if (/^(升序|asc)$/i.test(t)) { rank.order = 'asc'; continue }
    if (/^(降序|desc)$/i.test(t)) { rank.order = 'desc'; continue }

    const sortMatch = /^(?:sort|排序)[:：]([\w\u4e00-\u9fff]+)$/i.exec(t)
    if (sortMatch) {
      const col = resolveCol(sortMatch[1])
      if (!ALLOWED_COLS.has(col)) throw new Error('不支持按 ' + sortMatch[1] + ' 排序')
      rank.col = col
      continue
    }

    const condMatch = /^([\w\u4e00-\u9fff]+)(>=|<=|!=|>|<|=)(.+)$/.exec(t)
    if (condMatch) {
      const col = resolveCol(condMatch[1])
      const opStr = condMatch[2]
      const val = Number(condMatch[3])
      if (!ALLOWED_COLS.has(col)) throw new Error('不支持筛选列 ' + condMatch[1])
      if (isNaN(val)) throw new Error(condMatch[1] + ' 的值必须是数字')
      if (OP_TO_RULE[opStr] == null) throw new Error('不支持运算符 ' + opStr)
      filter.push({ type: col, rule: OP_TO_RULE[opStr], value: val })
      continue
    }
    charName += t
  }
  return { charName, data: { rank, filter } }
}

export class CustomRank extends plugin {
  constructor () {
    super({
      name: 'ark自定义排行',
      event: 'message',
      priority: 50,
      rule: [{ reg: /^#ark自定义排行\s+.+/, fnc: 'rank' }]
    })
  }

  async rank (e) {
    const raw = (e.original_msg || e.msg || '').replace(/^#ark自定义排行\s*/, '').trim()
    if (!raw) return e.reply('请输入角色名，如：#自定义排行 胡桃')

    let charName, data
    try {
      ({ charName, data } = parseRankArgs(raw))
    } catch (err) {
      return e.reply(err.message)
    }
    if (!charName) return e.reply('请输入角色名')

    let char = Character.get(charName, 'gs') || Character.get(charName, 'sr')
    if (!char) return e.reply('找不到角色：' + charName)

    const game = char.id * 1 < 10000 ? 'sr' : 'gs'
    const sortCol = data.rank.col || 'dmg_avg'
    const mode = sortCol === 'mark_score' ? 'mark' : 'dmg'

    let apiRes
    try {
      apiRes = await ArkApi.req('rank/query', { charId: char.id, data, game })
      if (!apiRes) throw new Error('接口返回为空')
    } catch (err) {
      logger.error('ArkAPI 请求失败:', err.message)
      return e.reply('排名服务暂不可用')
    }

    if (apiRes.retcode !== 0) {
      const msg = apiRes.message || '未知错误'
      return e.reply('查询失败：' + (msg.includes('does not exist') ? '该角色暂无数据' : msg))
    }

    const result = apiRes.data
    if (!result.rows.length) return e.reply(char.name + ' 暂无符合条件的排名数据')

    const dmgTitle = result.dmgTitle || ''
    const isSr = game === 'sr'

    let list = []
    for (let row of result.rows) {
      let avatar = Avatar.create({ id: char.id }, game)
      if (!avatar) continue

      const talent = { a: row.talent_a || 0, e: row.talent_e || 0, q: row.talent_q || 0 }
      if (isSr) {
        talent.t = row.talent_t || 0
        talent.me = row.talent_me || 0
        talent.mt = row.talent_mt || 0
      }

      const weapon = isSr
        ? { id: row.weapon_id || 0, level: row.weapon_level || 0, promote: row.weapon_promote || 0, affix: row.weapon_affix || 0 }
        : { name: row.weapon_name || '', level: row.weapon_level || 0, promote: row.weapon_promote || 0, affix: row.weapon_affix || 0 }

      avatar.setAvatar({
        id: char.id,
        level: row.level || (isSr ? 80 : 90),
        cons: row.cons ?? 0,
        promote: row.promote ?? 0,
        fetter: 0,
        elem: char.elem || '',
        talent, weapon,
        _source: 'custom',
        _time: Date.now()
      })

      let tmp = {
        uid: row.uid,
        isMax: false,
        ...avatar.getData('id,star,name,sName,level,fetter,cons,weapon,elem,talent,imgs'),
        artisSet: row.artisSet || {}
      }

      tmp._mark = row.mark_score || 0
      tmp._formatmark = Format.comma(tmp._mark, 1)
      tmp._star = 5 - tmp.star

      let avgMark = tmp._mark / (isSr ? 6 : 5)
      let markClass = 'D'
      const scoreMap = [['D', 7], ['C', 14], ['B', 21], ['A', 28], ['S', 35], ['SS', 42], ['SSS', 49], ['ACE', 56], ['MAX', 70]]
      for (let [cls, threshold] of scoreMap) {
        if (avgMark < threshold) { markClass = cls; break }
        markClass = cls
      }
      tmp.artisMark = { mark: tmp._formatmark, markClass }

      if (row.dmg_avg != null) {
        tmp.dmg = { title: dmgTitle, avg: Format.comma(row.dmg_avg, 1) }
      }
      tmp._dmg = 0 - (row.dmg_avg || 0)
      list.push(tmp)
    }

    const modeTitleMap = { dmg: '', mark: '圣遗物评分' }
    const title = '#' + char.name + (modeTitleMap[mode] || '') + '排行'

    const sortLabel = { dmg_avg: '伤害均值', mark_score: '圣遗物评分' }
    const orderLabel = (data.rank.order || 'desc') === 'asc' ? '升序' : '降序'
    const RULE_LABEL = { 0: '>=', 1: '=', 2: '<=', 3: '>', 4: '<', 5: '!=' }
    const filterDesc = data.filter.length
      ? data.filter.map(f => f.type + (RULE_LABEL[f.rule] || '?') + f.value).join(' ')
      : '无'
    const rankCfg = {
      time: '全服数据',
      limitTxt: '排序: ' + (sortLabel[sortCol] || sortCol) + ' ' + orderLabel + ' / 筛选: ' + filterDesc,
      number: 20
    }

    return e.reply([
      await Common.render('character/rank-profile-list', {
        save_id: char.id, game, list, title,
        elem: char.elem,
        data: { title: '', style: '<style>body .container {width: 850px;}</style>' },
        noRankFlag: true,
        bodyClass: 'char-' + char.name,
        rankCfg, mode,
        pageGotoParams: { waitUntil: 'networkidle2' }
      }, { e, scale: 1.4, retType: 'base64' })
    ])
  }
}
