import lodash from 'lodash'
import fs from 'node:fs'
import { getProfileRefresh, getTargetUid } from '../../miao-plugin/apps/profile/ProfileCommon.js'
import ProfileList from '../../miao-plugin/apps/profile/ProfileList.js'
import ProfileChange from '../../miao-plugin/apps/profile/ProfileChange.js'
import { profileArtis } from '../../miao-plugin/apps/profile/ProfileArtis.js'
import { Data, Common, Format, Cfg, Meta  } from '../../miao-plugin/components/index.js'
import { Button, MysApi, ProfileRank, Weapon, Artifact, Player, Character, ArtifactSet, Avatar } from '../../miao-plugin/models/index.js'
import safeGsCfg from './safeGsCfg.js'
import api from '../../ark-plugin/model/api.js'
import ArkCfg from '../components/Cfg.js'
import { ProfileWeapon } from '../../miao-plugin/apps/profile/ProfileWeapon.js'
import { ArkApi } from './api.js'

let ProfileDetail
let CharRank
try {
  ProfileDetail = (await import('../../miao-plugin/apps/profile/ProfileDetail.js')).default
} catch (err) {
  // console.log(err)
}
try {
  CharRank = (await import('../../miao-plugin/apps/profile/ProfileRank.js')).default
} catch (err) {
  // console.log(err)
}

let defWeapon = {
  bow: '西风猎弓',
  catalyst: '西风秘典',
  claymore: '西风大剑',
  polearm: '西风长枪',
  sword: '西风剑'
}
const ArkInit = {
  init() {
    if (ArkCfg.get('profileChangeOCR') && ProfileDetail) {
      ProfileChange.getProfile = (uid, charid, ds, game = 'gs') => {
        if (!charid) return false
        const isGs = game === 'gs'

        let player = Player.create(uid, game)

        let source = player.getProfile(charid)
        let dc = ds.char || {}
        if (!source || !source.hasData) source = {}

        let char = Character.get({ id: dc?.char || source.id || charid, elem: dc?.elem })
        if (!char) return false

        let level = dc.level || source.level || 90
        let promote = level === source.level ? source.promote : undefined

        let profiles = {}
        if (source && source.id) profiles[`${player.uid}:${source.id}`] = source
        // 获取source
        let getSource = function(cfg) {
          if (!cfg || !cfg.char) return source
          let cuid = cfg.uid || uid
          let id = cfg.char || source.id
          let key = `${cuid  }:${  id}`
          if (!profiles[key]) {
            let cPlayer = Player.create(cuid, game)
            profiles[key] = cPlayer.getProfile(id) || {}
          }
          return profiles[key]?.id ? profiles[key] : source
        }
        // 初始化profile
        let ret = new Avatar({
          uid,
          id: char.id,
          level,
          cons: Data.def(dc.cons, source.cons, 0),
          fetter: source.fetter || 10,
          elem: char.elem || source.char?.elem,
          dataSource: 'change',
          _source: 'change',
          promote,
          trees: lodash.extend([], Data.def(dc.trees, source.trees))
        }, char.game)
        // 设置武器
        let wCfg = ds.weapon || {}
        let wSource = getSource(wCfg).weapon || {}
        let weapon = Weapon.get(wCfg?.weapon || wSource?.name || defWeapon[char.weaponType], char.game, char.weaponType)
        if (char.isGs) {
          if (!weapon || weapon.type !== char.weaponType) weapon = Weapon.get(defWeapon[char.weaponType], char.game)
        }

        let wDs = {
          name: weapon.name,
          star: weapon.star,
          level: Math.min(weapon.maxLv || 90, wCfg.level || wSource.level || 90)
        }
        if (wSource.level === wDs.level) wDs.promote = wSource.promote
        wDs.affix = Math.min(weapon.maxAffix || 5, wCfg.affix || ((wDs.star === 5 && wSource.star !== 5) ? 1 : (wSource.affix || 5)))
        ret.setWeapon(wDs)

        // 设置天赋
        if (ds?.char?.talent) {
          ret.setTalent(ds?.char?.talent, 'level')
        } else {
          ret.setTalent(source?.originalTalent || (isGs ? { a: 9, e: 9, q: 9 } : { a: 6, e: 8, t: 8, q: 8 }), 'original')
        }

        // 设置圣遗物
        let artis = getSource(ds.artis)?.artis?.toJSON() || {}
        for (let idx = 1; idx <= (isGs ? 5 : 6); idx++) {
          if (ds[`arti${  idx}`]) {
            if (ds[`arti${  idx}`].mode === 'ocr') {
              delete ds[`arti${  idx}`].mode
              artis[idx] = ds[`arti${  idx}`]
            } else {
              let source = getSource(ds[`arti${  idx}`])
              if (source && source.artis && source.artis[idx]) artis[idx] = lodash.cloneDeep(source.artis[idx])
            }
          }
          let artisIdx = (isGs ? '00111' : '001122')[idx - 1]
          if (artis[idx] && ds.artisSet && ds.artisSet[artisIdx]) {
            let as = ArtifactSet.get(ds.artisSet[artisIdx], game)
            if (as) {
              artis[idx].id = as.getArti(idx)?.getIdByStar(artis[idx].star || 5)
              artis[idx].name = as.getArtiName(idx)
              artis[idx].set = as.name
            }
          }
        }
        ret.setArtis(artis)
        ret.calcAttr()
        return ret
      }
      this.matchMsg = async (msg, imgUrls = []) => {
        if (!/(变|改|换)/.test(msg)) return false
        let game = /星铁/.test(msg) ? 'sr' : 'gs'
        msg = msg.toLowerCase().replace(/uid ?:? ?/, '').replace('星铁', '')
        let regRet = /^#*(\d{9,10})?(.+?)(详细|详情|面板|面版|圣遗物|伤害[1-7]?)?\s*(\d{9,10})?[变换改](.*)/.exec(msg)
        if (!imgUrls && (!regRet || !regRet[2])) return false
        let ret = {}
        let change = {}
        let char = Character.get(lodash.trim(regRet[2]).replace(/\d{9,10}/g, ''), game)
        if (char.isTraveler) this.isTraveler = true
        game = char.isSr ? 'sr' : 'gs'
        if (!char) return false
        const isGs = game === 'gs'
        const keyMap = isGs
          ? {
            artis: '圣遗物',
            arti1: '花,生之花',
            arti2: '毛,羽,羽毛,死之羽',
            arti3: '沙,沙漏,表,时之沙',
            arti4: '杯,杯子,空之杯',
            arti5: '头,冠,理之冠,礼冠,帽子,帽',
            weapon: '武器'
          }
          : {
            artis: '圣遗物,遗器',
            arti1: '头,帽子,头部',
            arti2: '手,手套,手部',
            arti3: '衣,衣服,甲,躯干,',
            arti4: '鞋,靴,鞋子,靴子,脚,脚部',
            arti5: '球,位面球',
            arti6: '绳,线,链接绳,连接绳',
            weapon: '武器,光锥'
          }
        let keyTitleMap = {}
        lodash.forEach(keyMap, (val, key) => {
          lodash.forEach(val.split(','), (v) => {
            keyTitleMap[v] = key
          })
        })
        const keyReg = new RegExp(`^(\\d{9,10})?\\s*(.+?)\\s*(\\d{9,10})?\\s*((?:${lodash.keys(keyTitleMap).join('|')}|\\+)+)$`)

        ret.char = char.id
        ret.mode = regRet[3] === '换' ? '面板' : regRet[3]
        ret.uid = regRet[1] || regRet[4] || ''
        ret.game = game
        msg = regRet[5]
        if (imgUrls.length > 0) {
          const results = await Promise.all(imgUrls.map(async (imageUrl) => {
            try {
              return await ArkApi.req(`ocr/profilechange/${char.game}`, { body: JSON.stringify({ image: imageUrl }) })
            } catch (err) {
              return null
            }
          }))
          for (const res of results) {
            if (res) {
              change[res?.data?.type] = res?.data?.data
            }
          }
        }
        // 更换匹配
        msg = msg.replace(/[变改]/g, '换')
        lodash.forEach(msg.split('换'), (txt) => {
          txt = lodash.trim(txt)
          if (!txt) return true
          // 匹配圣遗物
          let keyRet = keyReg.exec(txt)
          if (keyRet && keyRet[4]) {
            let char = Character.get(lodash.trim(keyRet[2]), game)
            if (char) {
              lodash.forEach(keyRet[4].split('+'), (key) => {
                key = lodash.trim(key)
                let type = keyTitleMap[key]
                change[type] = {
                  char: char.id || '',
                  uid: keyRet[1] || keyRet[3] || '',
                  type
                }
              })
            } else if (keyRet[4].length > 2) {
              return true
            }
          }

          // 匹配圣遗物套装
          let asMap = Meta.getAlias(game, 'artiSet')
          let asKey = asMap.sort((a, b) => b.length - a.length).join('|')
          let asReg = new RegExp(`^(${asKey})套?[2,4]?\\+?(${asKey})?套?[2,4]?\\+?(${asKey})?套?[2,4]?$`)
          let asRet = asReg.exec(txt)
          let getSet = (idx) => {
            let set = ArtifactSet.get(asRet[idx])
            return set ? set.name : false
          }
          if (asRet && asRet[1] && getSet(1)) {
            if (game === 'gs') {
              change.artisSet = [ getSet(1), getSet(2) || getSet(1) ]
            } else if (game === 'sr') {
              for (let idx = 1; idx <= 3; idx++) {
                let as = ArtifactSet.get(asRet[idx])
                if (as) { // 球&绳
                  change.artisSet = change.artisSet || []
                  let ca = change.artisSet
                  ca[as.idxs?.[1] ? (ca[0] ? 1 : 0) : 2] = as.name
                }
              }
              let ca = change.artisSet
              if (ca && ca[0] && !ca[1]) ca[1] = ca[0]
            }
            return true
          }

          // 匹配武器
          let wRet = /^(?:等?级?([1-9][0-9])?级?)?\s*(?:([1-5一二三四五满])(精炼?|叠影?)|(精炼?|叠影?)([1-5一二三四五]))?\s*(?:等?级?([1-9][0-9])?级?)?\s*(.*)$/.exec(txt)
          if (wRet && wRet[7]) {
            let weaponName = lodash.trim(wRet[7])
            if (/专武/.test(weaponName)) {
              let char = Character.get(weaponName.replace('专武', '') || lodash.trim(regRet[2]).replace(/\d{9,10}/g, ''), ret.char.game)
              weaponName = `${char.name}专武`
            }
            let weapon = Weapon.get(weaponName, game, ret.char.game)
            if (weapon || weaponName === '武器' || Weapon.isWeaponSet(weaponName)) {
              let affix = wRet[2] || wRet[5]
              affix = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 满: 5 }[affix] || affix * 1
              let tmp = {
                weapon: (Weapon.isWeaponSet(weaponName) ? weaponName : weapon?.name) || '',
                affix: affix || '',
                level: wRet[1] * 1 || wRet[6] * 1 || ''
              }
              if (lodash.values(tmp).join('')) change.weapon = tmp
              return true
            }
          }
          let char = change.char || {}
          // 命座匹配
          let consRet = /([0-6零一二三四五六满])(命|魂|星魂)/.exec(txt)
          if (consRet && consRet[1]) {
            let cons = consRet[1]
            char.cons = Math.max(0, Math.min(6, lodash.isNaN(cons * 1) ? '零一二三四五六满'.split('').indexOf(cons) : cons * 1))
            txt = txt.replace(consRet[0], '')
          }

          // 行迹树匹配
          let treeRet = /满行迹/.exec(txt)
          if (!isGs && treeRet) {
            char.trees = [ '101', '102', '103', '201', '202', '203', '204', '205', '206', '207', '208', '209', '210', '301', '302', '501' ]
            txt = txt.replace(treeRet[0], '')
          }

          // 天赋匹配
          // TODO 之后要适配 标记一下
          let talentRet = (isGs
            ? /(?:天赋|技能|行迹)((?:[1][0-5]|[1-9])[ ,]?)((?:[1][0-5]|[1-9])[ ,]?)([1][0-5]|[1-9])/
            : /(?:天赋|技能|行迹)((?:[1][0-5]|[1-9])[ ,]?)((?:[1][0-5]|[1-9])[ ,]?)((?:[1][0-5]|[1-9])[ ,]?)((?:[1][0-5]|[1-9])[ ,]?)((?:[1][0-5]|[1-9])[ ,]?)?([1][0-5]|[1-9])?/).exec(txt)
          if (talentRet) {
            char.talent = {}
            lodash.forEach((isGs ? 'a,e,q' : 'a,e,t,q,me,mt').split(','), (key, idx) => {
              char.talent[key] = talentRet[idx + 1] * 1 || 1
            })
            txt = txt.replace(talentRet[0], '')
          }

          let lvRet = /等级(?:^|[^0-9])(100|95|[1-9]|[1-8][0-9]|90)(?![0-9])|(?:^|[^0-9])(100|95|[1-9]|[1-8][0-9]|90)(?![0-9])级/.exec(txt)
          if (lvRet && (lvRet[1] || lvRet[2])) {
            char.level = (lvRet[1] || lvRet[2]) * 1
            txt = txt.replace(lvRet[0], '')
          }
          txt = lodash.trim(txt)
          if (txt) {
            if (this.isTraveler) txt = txt.replace(/元素/, '主')
            let chars = Character.get(txt, game)
            if (chars) {
              char.char = chars.id
              char.elem = chars.elem
            }
          }
          if (!lodash.isEmpty(char)) change.char = char
        })
        ret.change = lodash.isEmpty(change) ? false : change
        return ret
      }
        ProfileDetail.detail = async (e) => {
          let msg = e.msg || e.original_msg
          if (!msg) return false
          if (!/详细|详情|面板|面版|圣遗物|遗器|伤害|武器|换/.test(msg)) return false
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

          let mode = 'profile'
          let profileChange = false
          let changeMsg = msg
          let pc = await this.matchMsg(msg, imgUrls)

          if (pc && pc.char && pc.change) {
            if (!Cfg.get('profileChange')) return e.reply('面板替换功能已禁用...')
            e.game = pc.game
            e.isSr = e.game === 'sr'
            e.uid = ''
            e.msg = '#喵喵面板变换'
            e.uid = pc.uid || await getTargetUid(e)
            profileChange = ProfileChange.getProfile(e.uid, pc.char, pc.change, pc.game)
            if (profileChange && profileChange.char) {
              msg = `#${profileChange.char?.name}${pc.mode || '面板'}`
              e._profile = profileChange
              e._profileMsg = changeMsg
            }
          }
          let uidRet = /(18|[1-9])[0-9]{8}/g.exec(msg)
          if (uidRet) {
            e.uid = uidRet[0]
            msg = msg.replace(uidRet[0], '')
          }

          let name = msg.replace(/#|老婆|老公|星铁|原神/g, '').trim()
          msg = msg.replace('面版', '面板')
          let dmgRet = /(?:伤害|武器)(\d*)$/.exec(name)
          let dmgIdx = 0; let idxIsInput = false
          if (/(最强|最高|最高分|最牛|第一)/.test(msg)) {
            mode = /(分|圣遗物|遗器|评分|ACE)/.test(msg) ? 'rank-mark' : 'rank-dmg'
            name = name.replace(/(最强|最高分|第一|最高|最牛|圣遗物|遗器|评分|群)/g, '')
          }
          if (/(详情|详细|面板|面版)\s*$/.test(msg) && !/更新|录入|输入/.test(msg)) {
            mode = 'profile'
            name = name.replace(/(详情|详细|面板)/, '').trim()
          } else if (dmgRet) {
            // mode = /武器/.test(msg) ? 'weapon' : 'dmg'
            mode = 'dmg'
            name = name.replace(/(伤害|武器)+\d*/, '').trim()
            if (dmgRet[1]) {
              dmgIdx = dmgRet[1] * 1
              // 标识是用户指定的序号
              idxIsInput = true
            }
          } else if (/(详情|详细|面板)更新$/.test(msg) || (/更新/.test(msg) && /(详情|详细|面板)$/.test(msg))) {
            mode = 'refresh'
            name = name.replace(/详情|详细|面板|更新/g, '').trim()
          } else if (/圣遗物|遗器/.test(msg)) {
            mode = 'artis'
            name = name.replace(/圣遗物|遗器/, '').trim()
          }
          if (!Cfg.get('avatarProfile')) return false // 面板开关关闭
          let char = Character.get(name.trim(), e.game)
          if (!char) return false

          if (/星铁/.test(msg) || char.isSr) {
            e.game = 'sr'
            e.isSr = true
          }

          let uid = e.uid || await getTargetUid(e)
          if (!uid) return true

          e.uid = uid
          e.avatar = char.id
          if (char.isCustom) return e.reply('自定义角色暂不支持此功能')

          if (!char.isRelease) {
            // 预设面板支持未实装角色
            if (!profileChange && Number(e.uid) > 100000006) return e.reply('角色尚未实装')
            // 但仅在未实装开启时展示
            if (Cfg.get('notReleasedData') === false) return e.reply('未实装角色面板已禁用...')
          }

          if (mode === 'profile' || mode === 'dmg' || mode === 'weapon') {
            return ProfileDetail.render(e, char, mode, { dmgIdx, idxIsInput })
          } else if (mode === 'refresh') {
            await ProfileList.refresh(e)
            return true
          } else if (mode === 'artis') {
            return profileArtis(e)
          }
          return true
        }
    }
    if (ProfileDetail && CharRank) {
        ProfileDetail.render = async (e, char, mode = 'profile', params = {}) => {
          let selfUser = await MysApi.initUser(e)
      
          if (!selfUser) return e.reply([ `尚未绑定UID，请先发送【${e.isSr ? '*' : '#'}绑定+你的UID】来绑定查询目标\n示例：${e.isSr ? '*' : '#'}绑定100000000`, new Button(e).bindUid() ])

          let { uid } = e

          if (char.isCustom) return e.reply(`暂不支持自定义角色${char.name}的面板信息查看`)

          let profile = e._profile || await getProfileRefresh(e, char.id)
          if (!profile) return true
          profile.uid = e.uid
          char = profile.char || char
          let a = profile.attr
          let base = profile.base
          let attr = {}
          let game = char.game
          let isGs = game === 'gs'
          let isSr = !isGs
          lodash.forEach((isGs ? 'hp,def,atk,mastery' : 'hp,def,atk,speed').split(','), (key) => {
            let fn = (n) => Format.comma(n, key === 'hp' ? 0 : 1)
            attr[key] = fn(a[key])
            attr[`${key}Base`] = fn(base[key])
            attr[`${key}Plus`] = fn(a[key] - base[key])
          })
          lodash.forEach((isGs ? 'cpct,cdmg,recharge,dmg' : 'cpct,cdmg,recharge,dmg,effPct,effDef,heal,stance,elation').split(','), (key) => {
            let fn = Format.pct
            let key2 = key
            if (key === 'dmg') {
              if (isGs) {
                if (a.phy > a.dmg) {
                  key2 = 'phy'
                }
              }
            }
            attr[key] = fn(a[key2])
            attr[`${key}Base`] = fn(base[key2])
            attr[`${key}Plus`] = fn(a[key2] - base[key2])
          })

          let weapon = Weapon.get(profile?.weapon?.name, game)
          let w = profile.weapon
          let wCfg = {}
          if (mode === 'weapon') {
            wCfg = weapon.calcAttr(w.level, w.promote)
            wCfg.weapons = await ProfileWeapon.calc(profile)
          }

          let enemyLv = isGs ? (await selfUser.getCfg('char.enemyLv', 103)) : 80
          let dmgCalc = await ProfileDetail.getProfileDmgCalc({ profile, enemyLv, mode, params })

          let rank = false
          if (e.group_id && !e._profile) {
            rank = await ProfileRank.create({ group: e.group_id, uid, qq: e.user_id }, game)
            await rank.getRank(profile, true)
          }
      
          let artisDetail = profile.getArtisMark()
          // 处理一下allAttr，确保都有9个内容，以获得比较好展示效果
          let allAttr = profile.artis.getAllAttr() || []
          allAttr = lodash.slice(allAttr, 0, 9)
          for (let idx = allAttr.length; idx < 9; idx++) {
            allAttr[idx] = {}
          }
          artisDetail.allAttr = allAttr

          let artisKeyTitle = Artifact.getArtisKeyTitle(game)
          let data = profile.getData('name,abbr,cons,level,talent,dataSource,updateTime,imgs,costumeSplash')
          data.charWeapon = char.weaponType
          if (isSr) {
            let treeData = []
            let treeMap = {}
            // 属性
            lodash.forEach('0113355778'.split(''), (pos, idx) => {
              treeData[pos] = treeData[pos] || []
              let tmp = { type: 'tree', img: '/meta-sr/public/icons/tree-cpct.webp' }
              treeData[pos].push(tmp)
              treeMap[`${idx + 201  }`] = tmp
            })
            // 属性建成后图标替换
            lodash.forEach(Object.keys(char.detail.tree), (id) => {
              let ret = /([125][01][0-9])$/.exec(`${id  }`)
              if (ret && ret[1]) {
                let treeId = ret[1]
                if (treeId[0] === '2') {
                  treeMap[treeId].img = `/meta-sr/public/icons/tree-${char.detail?.tree?.[id]?.key}.webp`
                }
              }
            })
            // 能力
            lodash.forEach([ 2, 4, 6 ], (pos, idx) => {
              let tmp = { type: 'talent', img: data.imgs[`tree${idx + 1}`] }
              treeData[pos] = tmp
              treeMap[`${idx + 101  }`] = tmp
            })
            treeMap['501'] = { type: 'talent', img: data.imgs.tree4 }
            // 点亮图标
            lodash.forEach(profile.trees, (id) => {
              let ret = /([125][01][0-9])$/.exec(`${id  }`)
              if (ret && ret[1]) {
                let treeId = ret[1]
                if (treeMap?.[treeId]) {
                  treeMap[treeId].value = 1
                }
              }
            })
            data.treeData = treeData
          }
          data.weapon = profile.getWeaponDetail()
          const isProfileChange = e.msg.includes('喵喵面板变换')
          if (isProfileChange && ArkCfg.get('profileChangeDiff', true)) {
            let player = Player.create(uid, game)
            let origin = player.getProfile(char.id)
            if (origin) {
              let dmgCalc_ = await ProfileDetail.getProfileDmgCalc({ profile: origin, enemyLv, mode, params })
              if (dmgCalc_ && dmgCalc_.dmgData) {
                const num = (str) => {
                  if (!str || str === 'NaN') return NaN
                  return parseFloat(String(str).replace(/,/g, ''))
                }
                const getDiff = (currStr, oldStr) => {
                  let curr = num(currStr)
                  let old = num(oldStr)
                  if (isNaN(curr) || isNaN(old) || old === 0) return '--'  
                  let diff = ((curr - old) / old * 100).toFixed(1)
                  if (diff > 0) return ` ↑${diff}%`
                  if (diff < 0) return ` ↓${Math.abs(diff)}%`
                  if (diff === 0) return `${diff}%`
                  return '--'
                }
                dmgCalc.dmgData = dmgCalc.dmgData.map(item => {
                  let matchedItem = dmgCalc_.dmgData.find(d => d.title === item.title)   
                  if (matchedItem) {
                    return {
                      ...item,
                      dmg: item.dmg,
                      dmg_diff: getDiff(item.dmg, matchedItem.dmg),
                      avg: item.avg,
                      avg_diff: getDiff(item.avg, matchedItem.avg)
                    }
                  }
                  return item
                })
              }
            }
          }
          let selfRank = []
          let scoreAndRank = []
          let ret1, ret2
          //是否计算总排名
          if (ArkCfg.get('panelRank', true) && dmgCalc.dmgData !== undefined) {
            let characterID = safeGsCfg.roleNameToID(char.name, true) || safeGsCfg.roleNameToID(char.name, false)
            let ret, jsonData
            let queryType = ArkCfg.get('queryType', 2)
            const query = {
              0: 'dmg',
              1: 'mark',
              2: 'all',
              3: 'all',
            }[queryType]
            //是否使用本地数据计算排名
            if (ArkCfg.get('localPanelRank', true)) {
              jsonData = JSON.parse(JSON.stringify(profile))
              ret = await api.sendApi('getRankData', {
                id: characterID,
                uid: '999999999',
                update: 0,
                query: query,
                data: jsonData
              })
            } else {
              ret = await api.sendApi('getRankData', {
                id: characterID,
                uid: uid,
                query: query,
                update: 0
              })
            }
            const getRank = (index, baseTitle) => {
              const retItem = ret[index]
              const rankType = ArkCfg.get('RankType', 0)
              if (retItem?.retcode !== 100 && rankType !== 2) return
              const characterRank = {
                0: retItem?.rank || '暂无数据',
                1: retItem?.percent || '暂无数据',
                2: retItem?.rank ? `${retItem?.rank} (${retItem?.percent}%)` : '暂无数据',
              }[rankType]
              const markRankType = ArkCfg.get('markRankType', false)
              const isSpecialPanel = isProfileChange && markRankType
              const title = isSpecialPanel 
                ? `${baseTitle}(面板变换)` 
                : `${baseTitle}${markRankType ? '(本地)' : ''}`
              if (queryType === 3) {
                scoreAndRank[index] = characterRank
                selfRank.push(...[
                  ret[index]?.percent || -100,
                  ret[index]?.score || -100
                ])
              } else {
                dmgCalc.dmgData.push({ title, unit: characterRank })
              }
            }
            ret = Array.isArray(ret) ? ret : [ret]
            switch (queryType) {
              case 0:
                getRank(0, '总伤害排名')
                break
              case 1:
                getRank(0, '圣遗物排名')
                break
              case 2:
                getRank(0, '总伤害排名')
                getRank(1, '圣遗物排名')
                break
              case 3:
                getRank(0, '总伤害排名')
                getRank(1, '圣遗物排名')
                ret1 = await api.sendApi('getSpecificRank', {
                  id: characterID,
                  percent: 0
                })
                ret2 = await api.sendApi('getSpecificRank', {
                  id: characterID,
                  artis: true,
                  percent: 0
                })
                break
            }
          }
          let background = await Common.getBackground('profile')
          let renderData = {
            dmgRankData: ret1?.data?.scores?.map(score => (score / (ret1?.data?.top1 ?? 1)) * 100),
            artisRankData: ret2?.data?.scores,
            top1: ret2?.data?.top1,
            scoreAndRank,
            selfRank,
            save_id: uid,
            uid,
            game,
            data,
            attr,
            elem: char.elem,
            dmgCalc,
            artisDetail,
            artisKeyTitle,
            background: background?.text,
            bodyClass: `char-${char.name}`,
            mode,
            wCfg,
            changeProfile: e._profileMsg
          }
          // 渲染图像
          let exPath = ArkCfg.get('lnFiles', false) ? '-ark' : ''
          const msgRes = await e.reply([ await Common.render(`character/profile-detail${exPath}`, renderData, { e, scale: 1.6, retType: 'base64' }), new Button(e).profile(char, uid) ])
          if (msgRes) {
            // 如果消息发送成功，就将message_id和图片路径存起来，3小时过期
            const message_id = [ e.message_id ]
            if (Array.isArray(msgRes.message_id)) {
              message_id.push(...msgRes.message_id)
            } else {
              message_id.push(msgRes.message_id)
            }
            for (const i of message_id) {
              await redis.set(`miao:original-picture:${i}`, JSON.stringify({
                type: 'profile',
                img: renderData?.data?.costumeSplash
              }), { EX: 3600 * 3 })
              await redis.set(`miao:original-background:${i}`, JSON.stringify({
                type: 'background',
                img: background?.url || ''
              }), { EX: 3600 * 3 })
            }
          }
          return true
        }

      CharRank.renderCharRankList = async function({ e, uids, char, mode, groupId }, game = 'gs') {
        let list = []
        let _dmg
        for (let ds of uids) {
          let uid = ds.uid || ds.value
          let player = Player.create(uid, e.isSr ? 'sr' : 'gs')
          let avatar = player.getAvatar(ds.charId || char.id)
          if (!avatar) continue

          let profile = avatar.getProfile()

          if (profile) {
            let profileRank = await ProfileRank.create({ groupId, uid }, game)
            let data = await profileRank.getRank(profile, true)
            let mark = data?.mark?.data
            let tmp = {
              uid,
              isMax: !char,
              ...avatar.getData('id,star,name,sName,level,fetter,cons,weapon,elem,talent,artisSet,imgs'),
              artisMark: Data.getData(mark, 'mark,markClass,valid,crit')
            }
            _dmg = data?.dmg?.data
            if (_dmg && _dmg.avg) {
              let title = _dmg.title
              // 稍微缩短下title
              if (title.length > 10) title = title.replace(/[ ·]*/g, '')
              title = title.length > 10 ? title.replace(/伤害$/, '') : title
              let tmpAvg = _dmg.type !== 'text' ? Format.comma(_dmg.avg, 1) : _dmg.avg
              tmp.dmg = {
                title,
                avg: tmpAvg,
                rank: data.dmg.rank
              }
            }
            if (uid) {
              let userInfo = await ProfileRank.getUidInfo(uid)
              try {
                if (userInfo?.qq && e?.group?.pickMember) {
                  let member = e.group.pickMember(userInfo.qq)
                  if (member?.getAvatarUrl) {
                    let img = await member.getAvatarUrl()
                    if (img) tmp.qqFace = img
                  }
                }
              
              } catch (e) {
                // logger.error(e)
              }
            }

            if (mode === 'crit') {
              tmp._mark = mark?._crit * 6.6044 || 0
            } else if (mode === 'valid') {
              tmp._mark = mark?._valid || 0
            } else {
              tmp._mark = mark?._mark || 0
            }
            tmp._formatmark = Format.comma(tmp._mark, 1)
            tmp._dmg = (0 - tmp.dmg?.rank) || 0
            tmp._star = 5 - tmp.star
            list.push(tmp)
          }
        }
        let title
        if (char) {
          let modeTitleMap = {}
          if (e.isSr) {
            modeTitleMap = {
              dmg: '',
              mark: '遗器评分',
              crit: '双爆副词条',
              valid: '加权有效词条'
            }
          } else {
            modeTitleMap = {
              dmg: '',
              mark: '圣遗物评分',
              crit: '双爆副词条',
              valid: '加权有效词条'
            }
          }

          // 特殊处理开拓者的情况
          let titleName = {
            穹·毁灭: '开拓者·毁灭',
            星·毁灭: '开拓者·毁灭',
            穹·存护: '开拓者·存护',
            星·存护: '开拓者·存护',
            穹·同谐: '开拓者·同谐',
            星·同谐: '开拓者·同谐',
            穹·记忆: '开拓者·记忆',
            星·记忆: '开拓者·记忆'
          }
          if (titleName[char.name]) {
            title = `${e.isSr ? '*' : '#'}${titleName[char.name]}${modeTitleMap[mode]}排行`
          } else {
            title = `${e.isSr ? '*' : '#'}${char.name}${modeTitleMap[mode]}排行`
          }
          list = lodash.sortBy(list, mode === 'dmg' ? '_dmg' : '_mark').reverse()
        } else {
          title = `${e.isSr ? '*' : '#'}${mode === 'mark' ? '最高分' : '最强'}排行`
          list = lodash.sortBy(list, [ 'uid', '_star', 'id' ])
        }

        const rankCfg = await ProfileRank.getGroupCfg(groupId)
        let noRankFlag = true
        if (ArkCfg.get('groupRank', true)) {
          let data = [], uids_ = list.map(item => item.uid), ret
          let game = e.isSr ? 'sr' : 'gs'
        
          //读取排名列表中用户的数据
          if (ArkCfg.get('localGroupRank', false)) {
            uids_.forEach(uid => {
              try {
                data.push(JSON.parse(fs.readFileSync(`./data/PlayerData/${game}/${uid}.json`, 'utf8')).avatars[list[0].id])
              
              } catch (error) {
                data.push(null)
              }
            })
          }
          if (mode === 'dmg' || mode === 'mark') {
            let query = mode === 'mark' ? 'mark' : 'dmg'
            let rankTitle = mode === 'mark' ? '圣遗物' : '伤害'
            ret = await api.sendApi('groupAllRank', {
              id: list[0]?.id,
              uids: uids_,
              update: 2,
              query: query,
              data: data.length ? data : null
            })
            switch (ret.retcode) {
              case 100:
                ret?.rank?.forEach((item, index) => {
                  if (list[index] && list[index].dmg) {
                    list[index].dmg.rankName = (ArkCfg.get('markRankType', false) && ArkCfg.get('localGroupRank', false)) ? `${rankTitle}排名(本地)` : `${rankTitle}排名`
                    list[index].dmg.totalrank = item.rank || '暂无数据'
                    if (item.rank) {
                      noRankFlag = false
                    }
                  }
                })
            }
          } 
        }
        const isMemosprite = e.isSr && char.weaponType === '记忆'
        const isJoy = e.isSr && char.weaponType === '欢愉'
        const data = {
          title: _dmg?.title,
          isMemosprite,
          isJoy,
          style: `<style>body .container {width: ${(isMemosprite ? 1000 : e.isSr ? 930 : 850) + !noRankFlag * 180}px;}</style>`
        }
        // 渲染图像
        let exPath = ArkCfg.get('lnFiles', false) ? '-ark' : ''
        return e.reply([
          await Common.render(`character/rank-profile-list${exPath}`, {
            save_id: char.id,
            game: e.isSr ? 'sr' : 'gs',
            list,
            title,
            elem: char.elem,
            data,
            noRankFlag,
            bodyClass: `char-${char.name}`,
            rankCfg,
            mode,
            pageGotoParams: { waitUntil: 'networkidle2' }
          }, { e, scale: 1.4, retType: 'base64' }), new Button(e).profile(char)
        ])
      }
    }
  }   
}      
export default ArkInit 
    