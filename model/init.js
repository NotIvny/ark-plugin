import lodash from 'lodash'
import fs from 'fs'
import { getProfileRefresh } from '../../miao-plugin/apps/profile/ProfileCommon.js'
import ProfileDetail from '../../miao-plugin/apps/profile/ProfileDetail.js'
// import CharRank from '../../miao-plugin/apps/profile/ProfileRank.js'
import { Data, Common, Format, Cfg } from '../../miao-plugin/components/index.js'
import { Button, MysApi, ProfileRank, Weapon, Artifact, Player } from '../../miao-plugin/models/index.js'
import Gscfg from '../../genshin/model/gsCfg.js'
import api from '../../ark-plugin/model/api.js'
import ArkCfg from '../components/Cfg.js'
import { ProfileWeapon } from '../../miao-plugin/apps/profile/ProfileWeapon.js'
const ArkInit = {
    init() {
        //Don't change to false now, unless you know how to edit ProfileRank.js
        if(true){
            return
        }
        ProfileDetail.render = async (e, char, mode = 'profile', params = {}) => {
            let selfUser = await MysApi.initUser(e)

            if (!selfUser) {
            e.reply(['尚未绑定UID', new Button(e).bindUid()])
            return true
            }

            let { uid } = e

            if (char.isCustom) {
            e.reply(`暂不支持自定义角色${char.name}的面板信息查看`)
            return true
            }
            let profile = e._profile || await getProfileRefresh(e, char.id)
            if (!profile) {
            return true
            }
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
            lodash.forEach((isGs ? 'cpct,cdmg,recharge,dmg' : 'cpct,cdmg,recharge,dmg,effPct,effDef,heal,stance').split(','), (key) => {
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

            let enemyLv = isGs ? (await selfUser.getCfg('char.enemyLv', 91)) : 80
            let dmgCalc = await ProfileDetail.getProfileDmgCalc({ profile, enemyLv, mode, params })

            let rank = false
            if (e.group_id && !e._profile) {
            rank = await ProfileRank.create({ group: e.group_id, uid, qq: e.user_id })
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
            if (isSr) {
            let treeData = []
            let treeMap = {}
            // 属性
            lodash.forEach('0113355778'.split(''), (pos, idx) => {
                treeData[pos] = treeData[pos] || []
                let tmp = { type: 'tree', img: '/meta-sr/public/icons/tree-cpct.webp' }
                treeData[pos].push(tmp)
                treeMap[idx + 201 + ''] = tmp
            })
            // 属性建成后图标替换
            lodash.forEach(Object.keys(char.detail.tree), (id) => {
                let ret = /([12][01][0-9])$/.exec(id + '')
                if (ret && ret[1]) {
                let treeId = ret[1]
                if (treeId[0] === '2') {
                    treeMap[treeId].img = `/meta-sr/public/icons/tree-${char.detail?.tree?.[id]?.key}.webp`
                }
                }
            })
            // 能力
            lodash.forEach([2, 4, 6], (pos, idx) => {
                let tmp = { type: 'talent', img: data.imgs[`tree${idx + 1}`] }
                treeData[pos] = tmp
                treeMap[idx + 101 + ''] = tmp
            })
            // 点亮图标
            lodash.forEach(profile.trees, (id) => {
                let ret = /([12][01][0-9])$/.exec(id + '')
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
            //是否计算总排名
            
            if(ArkCfg.get('panelRank', true)){
            let characterID = Gscfg.roleNameToID(char.name,true) || Gscfg.roleNameToID(char.name,false)
            let characterRank,ret,jsonData
            //是否使用本地数据计算排名
            if(ArkCfg.get('localPanelRank', true)){
                jsonData = JSON.parse(JSON.stringify(profile))
                ret = await api.sendApi('getRankData',{id: characterID, uid: '999999999', update: 0, data: jsonData})
            }else{
                ret = await api.sendApi('getRankData',{id: characterID, uid: uid, update: 0})
            }
            switch(ret.retcode){
                case 100:
                const rankType = ArkCfg.get('RankType', 0)
                switch(rankType){
                    case 0:
                    characterRank = ret.rank
                    break
                    case 1:
                    characterRank = ret.percent
                    break
                    case 2:
                    characterRank = `${ret.rank} (${ret.percent}%)`
                    break
                }
                let title = '总伤害排名' + (ArkCfg.get('markRankType', false) ? '(本地)' : '')
                title = (e.msg.includes('喵喵面板变换') && ArkCfg.get('markRankType', false)) ? '总伤害排名(面板变换)' : title
                dmgCalc.dmgData[dmgCalc.dmgData.length] = {
                    title: title,
                    unit: characterRank,
                }
                break
            }
            }
            profile = false
            let renderData = {
            save_id: uid,
            uid,
            game,
            data,
            attr,
            elem: char.elem,
            dmgCalc,
            artisDetail,
            artisKeyTitle,
            bodyClass: `char-${char.name}`,
            mode,
            wCfg,
            changeProfile: e._profileMsg
            }
            // 渲染图像
            const msgRes = await e.reply([await Common.render('character/profile-detail', renderData, { e, scale: 1.6, retType: 'base64' }), new Button(e).profile(char, uid)])
            if (msgRes) {
            // 如果消息发送成功，就将message_id和图片路径存起来，3小时过期
            const message_id = [e.message_id]
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
            }
            }
            return true
        }
        let a = async function({ e, uids, char, mode, groupId }){
            let list = []
            for (let ds of uids) {
              let uid = ds.uid || ds.value
              let player = Player.create(uid, e.isSr ? 'sr' : 'gs')
              let avatar = player.getAvatar(ds.charId || char.id)
              if (!avatar) {
                continue
              }
              let profile = avatar.getProfile()
          
              if (profile) {
                let profileRank = await ProfileRank.create({ groupId, uid })
                let data = await profileRank.getRank(profile, true)
                let mark = data?.mark?.data
                let tmp = {
                  uid,
                  isMax: !char,
                  ...avatar.getData('id,star,name,sName,level,fetter,cons,weapon,elem,talent,artisSet,imgs'),
                  artisMark: Data.getData(mark, 'mark,markClass,valid,crit')
                }
                let dmg = data?.dmg?.data
                if (dmg && dmg.avg) {
                  let title = dmg.title
                  // 稍微缩短下title
                  if (title.length > 10) {
                    title = title.replace(/[ ·]*/g, '')
                  }
                  title = title.length > 10 ? title.replace(/伤害$/, '') : title
                  let tmpAvg = dmg.type !== 'text' ? Format.comma(dmg.avg, 1) : dmg.avg
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
                        if (img) {
                          tmp.qqFace = img
                        }
                      }
                    }
                  } catch (e) {
                    // console.log(e)
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
                星·同谐: '开拓者·同谐'
              }
              if (titleName[char.name]) {
                title = `${e.isSr ? '*' : '#'}${titleName[char.name]}${modeTitleMap[mode]}排行`
              } else {
                title = `${e.isSr ? '*' : '#'}${char.name}${modeTitleMap[mode]}排行`
              }
              list = lodash.sortBy(list, mode === 'dmg' ? '_dmg' : '_mark').reverse()
            } else {
              title = `${e.isSr ? '*' : '#'}${mode === 'mark' ? '最高分' : '最强'}排行`
              list = lodash.sortBy(list, ['uid', '_star', 'id'])
            }
          
            const rankCfg = await ProfileRank.getGroupCfg(groupId)
            if(ArkCfg.get('groupRank', true)){
              let uids_ = []
              list.forEach(item => {
                uids_.push(item.uid)
              })
              let ret = await api.sendApi('groupAllRank',{id: list[0].id, uids: uids_, update: 0})
              let count = 0,reqFromLocalList = [],data = []
              let game = e.isSr ? 'sr' : 'gs'
              switch(ret.retcode){
                case 100:
                  ret.rank.forEach(item => {
                    list[count].dmg.rankName = '总排名'
                    if(item.rank){
                      list[count].dmg.totalrank = item.rank 
                    }else{
                      list[count].dmg.totalrank = '暂无数据'
                      let playerData = fs.readFileSync(`./data/PlayerData/${game}/${uids_[count]}.json`,'utf8');
                      let jsonData = JSON.parse(playerData).avatars[list[0].id];
                      data.push(jsonData)
                      reqFromLocalList.push(uids_[count])
                    }
                    count++;
                  })
              }
              if(reqFromLocalList.length != 0 && ArkCfg.get('localGroupRank', false)){
                count = 0
                ret = await api.sendApi('groupAllRank',{id: list[0].id, uids: reqFromLocalList, update: 2, data: data})
                switch(ret.retcode){
                  case 100:
                    ret.rank.forEach(item => {
                      for(const id of list){
                        if(id.dmg.totalrank == '暂无数据'){
                          id.dmg.rankName = ArkCfg.get('markRankType', false) ? '总排名(本地)' : '总排名'
                          id.dmg.totalrank = item.rank 
                          break
                        }
                      }
                    })
                }
              }
            }
            // 渲染图像
            return e.reply([await Common.render('character/rank-profile-list', {
              save_id: char.id,
              game: e.isSr ? 'sr' : 'gs',
              list,
              title,
              elem: char.elem,
              bodyClass: `char-${char.name}`,
              rankCfg,
              mode,
              pageGotoParams: { waitUntil: 'networkidle2' }
            }, { e, scale: 1.4, retType: 'base64' }), new Button(e).profile(char)])
        }
    }   
}
export default ArkInit
    
