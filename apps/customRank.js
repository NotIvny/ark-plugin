﻿import { Common, Format } from '../../miao-plugin/components/index.js'
import { Character, Avatar } from '../../miao-plugin/models/index.js'
import { ArkApi } from '../model/api.js'


const ALLOWED_COLS = new Set([
  'level', 'promote', 'cons',
  'talent_a', 'talent_e', 'talent_q',
  'weapon_level', 'weapon_promote', 'weapon_affix',
  'dmg_avg', 'mark_score', 'data_time',
  'artis_sets',
  'pos1', 'pos2', 'pos3', 'pos4', 'pos5', 'pos6'
])
const ALIAS_MAP = {
  '等级': 'level', '突破': 'promote', '命座': 'cons', '命': 'cons',
  '普攻': 'talent_a', '战技': 'talent_e', '爆发': 'talent_q',
  '武器等级': 'weapon_level', '武器突破': 'weapon_promote', '精炼': 'weapon_affix',
  '伤害': 'dmg_avg', '评分': 'mark_score',
  '伤害均值': 'dmg_avg', '圣遗物评分': 'mark_score',
  '圣遗物': 'artis_sets', '套装': 'artis_sets'
}

const srStatNameMap = {
  '生命': 'hp', '大生命': 'hp', '生命值': 'hp',
  '攻击': 'atk', '大攻击': 'atk', '攻击力': 'atk',
  '防御': 'def', '大防御': 'def', '防御力': 'def',
  '速度': 'speed',
  '暴击': 'cpct', '暴击率': 'cpct',
  '爆伤': 'cdmg', '暴伤': 'cdmg', '暴击伤害': 'cdmg',
  '治疗': 'heal', '治疗加成': 'heal',
  '命中': 'effPct', '效果命中': 'effPct',
  '物伤': 'phy', '物理': 'phy', '物理属性伤害提高': 'phy',
  '火伤': 'fire', '火': 'fire', '火属性伤害提高': 'fire',
  '冰伤': 'ice', '冰': 'ice', '冰属性伤害提高': 'ice',
  '雷伤': 'elec', '雷': 'elec', '雷属性伤害提高': 'elec',
  '风伤': 'wind', '风': 'wind', '风属性伤害提高': 'wind',
  '量子伤': 'quantum', '量子': 'quantum', '量子属性伤害提高': 'quantum',
  '虚数伤': 'imaginary', '虚数': 'imaginary', '虚数属性伤害提高': 'imaginary',
  '击破': 'be', '击破特攻': 'be',
  '充能': 'recharge', '能量回复效率': 'recharge', '充能效率': 'recharge',
  '小生命': 'hpPlus',
  '小攻击': 'atkPlus'
}

const srMainIdx = { 
  "1": { "1": "hpPlus" }, 
  "2": { "1": "atkPlus" }, 
  "3": { "1": "hp", "2": "atk", "3": "def", "4": "cpct", "5": "cdmg", "6": "heal", "7": "effPct" }, 
  "4": { "1": "hp", "2": "atk", "3": "def", "4": "speed" }, 
  "5": { "1": "hp", "2": "atk", "3": "def", "4": "phy", "5": "fire", "6": "ice", "7": "elec", "8": "wind", "9": "quantum", "10": "imaginary" }, 
  "6": { "1": "be", "2": "recharge", "3": "hp", "4": "atk", "5": "def" }
}
const TOKENLESS_ALLOWED_COLS = new Set(['cons'])

function resolveCol (name) {
  if (/^pos[1-6]$/i.test(name)) return name.toLowerCase()
  if (/^部位[1-6]$/i.test(name)) return 'pos' + name.slice(2)
  return ALIAS_MAP[name] || name.toLowerCase()
}

function parseRankArgs (raw, allowedCols = ALLOWED_COLS, sortCol = 'dmg_avg', deniedMessage = '') {
  const tokens = raw.split(/\s+/)
  let charName = ''
  let nums = 20
  const rank = { col: sortCol, order: 'desc' }
  const filter = []
  const OP_TO_RULE = { '>=': 0, '=': 1, '<=': 2, '>': 3, '<': 4, '!=': 5 }
  const getDeniedError = (fallback) => new Error(deniedMessage || fallback)

  for (const t of tokens) {
    const numsMatch = /^(?:nums|数量)[:：=](\d+)$/i.exec(t)
    if (numsMatch) {
      nums = Math.min(Math.max(Number(numsMatch[1]), 1), 50)
      continue
    }

    if (/^(?:sort|排序)[:：]/i.test(t) || /^(?:升序|降序|asc|desc)$/i.test(t)) throw new Error('当前命令仅支持默认降序排序')

    const condMatch = /^([\w\u4e00-\u9fff]+)(>=|<=|!=|>|<|=)(.+)$/.exec(t)
    if (condMatch) {
      const col = resolveCol(condMatch[1])
      const opStr = condMatch[2]
      let val = condMatch[3]
      
      if (col.startsWith('pos')) {
      } else if (col !== 'artis_sets') {
        let numVal = Number(val)
        if (isNaN(numVal)) throw new Error(condMatch[1] + ' 的值必须是数字')
        val = numVal
      } else {
        const numVal = Number(val)
        if (!isNaN(numVal)) val = numVal
      }

      if (!allowedCols.has(col)) throw getDeniedError('不支持筛选列 ' + condMatch[1])
      if (OP_TO_RULE[opStr] == null) throw new Error('不支持运算符 ' + opStr)
      filter.push({ type: col, rule: OP_TO_RULE[opStr], value: val, rawValue: condMatch[3] })
      continue
    }
    charName += t
  }
  return { charName, data: { rank, filter, nums } }
}

export class CustomRank extends plugin {
  constructor () {
    super({
      name: 'ark自定义排行',
      event: 'message',
      priority: 50,
      rule: [
        { reg: /^#ark自定义排行帮助$/, fnc: 'rankHelp' },
        { reg: /^#ark(?!伤害排行|圣遗物排行).+?(?:伤害|圣遗物)?排行\s*.*/, fnc: 'rank' }
      ]
    })
  }

  async rankHelp (e) {
    const token = await redis.get('ark-plugin:customRank:token')
    if (e.isMaster && token) {
      return e.reply([
        '【ark自定义排行 · 高级】',
        '用法：#ark<角色>排行 [筛选/数量...]（默认伤害）',
        '用法：#ark<角色>伤害排行 [筛选/数量...]',
        '用法：#ark<角色>圣遗物排行 [筛选/数量...]',
        '',
        '筛选：列+运算符+值，运算符支持 >= <= > < = !=',
        '可用列：命座(命) 等级 突破 普攻 战技 爆发 武器等级 武器突破 精炼 伤害 评分 圣遗物',
        '排序：由命令决定，伤害排行按伤害降序，圣遗物排行按圣遗物评分降序',
        '数量：nums:N 或 数量:N（1-50，默认20）',
        '星铁可筛部位主词条：部位1~6=词条，如 部位3=暴击',
        '',
        '示例：',
        '#ark胡桃排行 命=6',
        '#ark雷电将军伤害排行 等级>=90 精炼>=1 数量:10',
        '#ark符玄圣遗物排行 部位4=速度'
      ].join('\n'))
    }
    return e.reply([
      '【ark自定义排行】',
      '用法：#ark<角色>排行 [命座筛选]（默认伤害）',
      '用法：#ark<角色>伤害排行 [命座筛选]',
      '用法：#ark<角色>圣遗物排行 [命座筛选]',
      '',
      '普通用户仅支持按命座(cons)筛选，',
      '更多筛选项需主人 #ark配置token 后使用。',
      '命座列名：命座 / 命 / cons，运算符 >= <= > < = !=',
      '',
      '示例：',
      '#ark胡桃排行 cons=0',
      '#ark雷电将军圣遗物排行 命座<=2'
    ].join('\n'))
  }

  async rank (e) {
    const msg = e.original_msg || e.msg || ''
    const modeMatch = /^#ark(.+?)(伤害|圣遗物)排行\s*(.*)$/.exec(msg) || /^#ark(.+?)排行\s*(.*)$/.exec(msg)
    const rankType = modeMatch?.[3] != null ? modeMatch[2] : ''
    const args = modeMatch?.[3] != null ? modeMatch[3] : modeMatch?.[2]
    const raw = [modeMatch?.[1], args].filter(Boolean).join(' ').trim()
    const selectedSortCol = rankType === '圣遗物' ? 'mark_score' : 'dmg_avg'
    if (!raw) return e.reply('请输入角色名，如：#ark胡桃排行')
    const token = await redis.get('ark-plugin:customRank:token')
    const canUseAdvancedCols = e.isMaster && token
    const allowedCols = canUseAdvancedCols ? ALLOWED_COLS : TOKENLESS_ALLOWED_COLS
    const deniedMessage = !e.isMaster
      ? '除 cons 之外的筛选仅主人可用'
      : (!token ? '请先使用 #ark配置tokenxxxxxx 配置自定义排名 token' : '')

    let charName, data
    try {
      ({ charName, data } = parseRankArgs(raw, allowedCols, selectedSortCol, deniedMessage))
    } catch (err) {
      return e.reply(err.message)
    }
    if (!charName) return e.reply('请输入角色名')

    let char = Character.get(charName, 'gs') || Character.get(charName, 'sr')
    if (!char) return e.reply('找不到角色：' + charName)

    const game = char.id * 1 < 10000 ? 'sr' : 'gs'

    if (game === 'sr') {
      for (let f of data.filter) {
        if (f.type.startsWith('pos')) {
          const posNum = f.type.slice(3)
          let statName = srStatNameMap[f.value] || f.value
          let foundId = null
          const posMap = srMainIdx[posNum]
          if (posMap) {
            for (let [id, name] of Object.entries(posMap)) {
              if (name === statName) {
                foundId = Number(id)
                break
              }
            }
          }
          if (foundId !== null) {
            f.value = foundId
          } else {
            return e.reply(`部位 ${posNum} 不存在主词条：${f.rawValue}`)
          }
        }
      }
    } else {
      for (let f of data.filter) {
        if (f.type.startsWith('pos')) {
          return e.reply('原神暂不支持指定部位主词条筛选')
        }
      }
    }

    const sortCol = data.rank.col || 'dmg_avg'
    const mode = sortCol === 'mark_score' ? 'mark' : 'dmg'

    let apiRes
    try {
      apiRes = await ArkApi.req('rank/custom', { charId: char.id, data, game }, true)
    } catch (err) {
      return e.reply('排名服务暂不可用')
    }
    if (apiRes?.retcode !== 0) {
      const msg = apiRes?.message || '未知错误'
      if (apiRes?.retcode === 401 || apiRes?.retcode === 403 || apiRes?.retcode === 429) {
        return e.reply('查询失败：' + msg)
      }
      return e.reply('查询失败：' + (msg.includes('does not exist') ? '该角色暂无数据' : msg))
    }

    const result = apiRes?.data
    if (!result?.rows?.length) return e.reply(char.name + ' 暂无符合条件的排名数据')

    const dmgTitle = result?.dmgTitle || ''
    const isSr = game === 'sr'

    let list = []
    for (let row of result?.rows) {
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
    const RULE_LABEL = { 0: '>=', 1: '=', 2: '<=', 3: '>', 4: '<', 5: '!=' }
    const filterDesc = data.filter.length
      ? data.filter.map(f => {
          let typeLabel = f.type
          if (typeLabel.startsWith('pos')) typeLabel = '部位' + typeLabel.slice(3)
          let valLabel = f.rawValue ?? f.value
          return typeLabel + (RULE_LABEL[f.rule] || '?') + valLabel
        }).join(' ')
      : '无'
    const rankCfg = {
      time: '全服数据',
      limitTxt: '排序: ' + (sortLabel[sortCol] || sortCol) + ' 降序 / 筛选: ' + filterDesc,
      number: data.nums || 20
    }
    const isMemosprite = char?.weaponType === '记忆'
    const isJoy = char?.weaponType === '欢愉'
    const data_ = {
      title: '',
      isMemosprite,
      isJoy,
      style: `<style>body .container {width: ${(isMemosprite ? 1000 : isJoy ? 960 : e.isSr ? 930 : 850)}px;}</style>`
    }
    const bodyContainerStyle = `<style>body .container {width: ${(isMemosprite ? 1000 : isJoy ? 960 : e.isSr ? 930 : 850)}px;}</style>`
    const img = await Common.render('character/rank-profile-list', {
      save_id: char.id,
        game,
        list,
        title,
        elem: char.elem,
        data: data_,
        isMemosprite,
        isJoy,
        noRankFlag: true,
        bodyContainerStyle,
        bodyClass: 'char-' + char.name,
        rankCfg,
        mode,
        pageGotoParams: { waitUntil: 'networkidle2' }
    }, { e, scale: 1.4, retType: 'base64' })
    const msgRes = await e.reply([img])
    const queryId = result.query_id || result.queryId
    if (msgRes && queryId) {
      const message_id = [e.message_id]
      if (Array.isArray(msgRes.message_id)) {
        message_id.push(...msgRes.message_id)
      } else {
        message_id.push(msgRes.message_id)
      }
      for (const i of message_id) {
        if (!i) continue
        await redis.set(`miao:ark-query-cache:${i}`, JSON.stringify({
          query_id: queryId,
          game,
          charId: char.id,
          charName: char.name
        }), { EX: 300 })
      }
    }
    return true
  }
}