import lodash from 'lodash'
import fs from 'fs'
import {getProfileRefresh } from '../../miao-plugin/apps/profile/ProfileCommon.js'
import ProfileDetail from '../../miao-plugin/apps/profile/ProfileDetail.js'
import ProfileList from '../../miao-plugin/apps/profile/ProfileList.js'
import CharRank from '../../miao-plugin/apps/profile/ProfileRank.js'
import { getTargetUid } from '../../miao-plugin/apps/profile/ProfileCommon.js'
import { Data, Common, Format, Cfg } from '../../miao-plugin/components/index.js'
import { Button, MysApi, ProfileRank, Weapon, Artifact, Player } from '../../miao-plugin/models/index.js'
import safeGsCfg from './safeGsCfg.js'
import api from '../../ark-plugin/model/api.js'
import { getStygianVersion } from '../../ark-plugin/model/calcVersion.js'
import ArkCfg from '../components/Cfg.js'
import { ProfileWeapon } from '../../miao-plugin/apps/profile/ProfileWeapon.js'
const ArkInit = {
    init() {
        ProfileDetail.render = async (e, char, mode = 'profile', params = {}) => {
          let selfUser = await MysApi.initUser(e)
          
          if (!selfUser) return e.reply([ `尚未绑定UID，请先发送【${e.isSr ? "*" : "#"}绑定+你的UID】来绑定查询目标\n示例：${e.isSr ? "*" : "#"}绑定100000000`, new Button(e).bindUid() ])

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
          let isGs = game === "gs"
          let isSr = !isGs

          lodash.forEach((isGs ? "hp,def,atk,mastery" : "hp,def,atk,speed").split(","), (key) => {
            let fn = (n) => Format.comma(n, key === "hp" ? 0 : 1)
            attr[key] = fn(a[key])
            attr[`${key}Base`] = fn(base[key])
            attr[`${key}Plus`] = fn(a[key] - base[key])
          })
          lodash.forEach((isGs ? "cpct,cdmg,recharge,dmg" : "cpct,cdmg,recharge,dmg,effPct,effDef,heal,stance").split(","), (key) => {
            let fn = Format.pct
            let key2 = key
            if (key === "dmg") {
              if (isGs) {
                if (a.phy > a.dmg) {
                  key2 = "phy"
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
          if (mode === "weapon") {
            wCfg = weapon.calcAttr(w.level, w.promote)
            wCfg.weapons = await ProfileWeapon.calc(profile)
          }

          let enemyLv = isGs ? (await selfUser.getCfg("char.enemyLv", 103)) : 80
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
          let data = profile.getData("name,abbr,cons,level,talent,dataSource,updateTime,imgs,costumeSplash")
          data.charWeapon = char.weaponType
          if (isSr) {
            let treeData = []
            let treeMap = {}
            // 属性
            lodash.forEach("0113355778".split(""), (pos, idx) => {
              treeData[pos] = treeData[pos] || []
              let tmp = { type: "tree", img: "/meta-sr/public/icons/tree-cpct.webp" }
              treeData[pos].push(tmp)
              treeMap[idx + 201 + ""] = tmp
            })
            // 属性建成后图标替换
            lodash.forEach(Object.keys(char.detail.tree), (id) => {
              let ret = /([125][01][0-9])$/.exec(id + "")
              if (ret && ret[1]) {
                let treeId = ret[1]
                if (treeId[0] === "2") {
                  treeMap[treeId].img = `/meta-sr/public/icons/tree-${char.detail?.tree?.[id]?.key}.webp`
                }
              }
            })
            // 能力
            lodash.forEach([ 2, 4, 6 ], (pos, idx) => {
              let tmp = { type: "talent", img: data.imgs[`tree${idx + 1}`] }
              treeData[pos] = tmp
              treeMap[idx + 101 + ""] = tmp
            })
            treeMap["501"] = { type: "talent", img: data.imgs.tree4 }
            // 点亮图标
            lodash.forEach(profile.trees, (id) => {
              let ret = /([125][01][0-9])$/.exec(id + "")
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
          let selfRank = []
          let scoreAndRank = []
          let ret1,ret2
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
              if (retItem?.retcode !== 100 && rankType != 2) return
              const characterRank = {
                0: retItem?.rank || '暂无数据',
                1: retItem?.percent || '暂无数据',
                2: retItem?.rank ? `${retItem?.rank} (${retItem?.percent}%)` : '暂无数据',
              }[rankType]
              const markRankType = ArkCfg.get('markRankType', false)
              const isSpecialPanel = e.msg.includes('喵喵面板变换') && markRankType
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
          let background = await Common.getBackground("profile")
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
          const msgRes = await e.reply([ await Common.render(`character/profile-detail${exPath}`, renderData, { e, scale: 1.6, retType: "base64" }), new Button(e).profile(char, uid) ])
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
                type: "profile",
                img: renderData?.data?.costumeSplash
              }), { EX: 3600 * 3 })
              await redis.set(`miao:original-background:${i}`, JSON.stringify({
                type: "background",
                img: background?.url || ""
              }), { EX: 3600 * 3 })
            }
          }
          return true
        }
        CharRank.renderCharRankList = async function({ e, uids, char, mode, groupId }, game = "gs"){
          let list = []
          let _dmg
          for (let ds of uids) {
            let uid = ds.uid || ds.value
            let player = Player.create(uid, e.isSr ? "sr" : "gs")
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
                ...avatar.getData("id,star,name,sName,level,fetter,cons,weapon,elem,talent,artisSet,imgs"),
                artisMark: Data.getData(mark, "mark,markClass,valid,crit")
              }
              _dmg = data?.dmg?.data
              if (_dmg && _dmg.avg) {
                let title = _dmg.title
                // 稍微缩短下title
                if (title.length > 10) title = title.replace(/[ ·]*/g, "")
                title = title.length > 10 ? title.replace(/伤害$/, "") : title
                let tmpAvg = _dmg.type !== "text" ? Format.comma(_dmg.avg, 1) : _dmg.avg
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

              if (mode === "crit") {
                tmp._mark = mark?._crit * 6.6044 || 0
              } else if (mode === "valid") {
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
                dmg: "",
                mark: "遗器评分",
                crit: "双爆副词条",
                valid: "加权有效词条"
              }
            } else {
              modeTitleMap = {
                dmg: "",
                mark: "圣遗物评分",
                crit: "双爆副词条",
                valid: "加权有效词条"
              }
            }

            // 特殊处理开拓者的情况
            let titleName = {
              穹·毁灭: "开拓者·毁灭",
              星·毁灭: "开拓者·毁灭",
              穹·存护: "开拓者·存护",
              星·存护: "开拓者·存护",
              穹·同谐: "开拓者·同谐",
              星·同谐: "开拓者·同谐",
              穹·记忆: "开拓者·记忆",
              星·记忆: "开拓者·记忆"
            }
            if (titleName[char.name]) {
              title = `${e.isSr ? "*" : "#"}${titleName[char.name]}${modeTitleMap[mode]}排行`
            } else {
              title = `${e.isSr ? "*" : "#"}${char.name}${modeTitleMap[mode]}排行`
            }
            list = lodash.sortBy(list, mode === "dmg" ? "_dmg" : "_mark").reverse()
          } else {
            title = `${e.isSr ? "*" : "#"}${mode === "mark" ? "最高分" : "最强"}排行`
            list = lodash.sortBy(list, [ "uid", "_star", "id" ])
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
                  ret.rank.forEach((item, index) => {
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
          const isMemosprite = e.isSr && char.weaponType === "记忆"
          const data = {
            title: _dmg?.title,
            isMemosprite,
            style: `<style>body .container {width: ${(isMemosprite ? 1000 : e.isSr ? 930 : 850) + !noRankFlag * 180}px;}</style>`
          }
          // 渲染图像
          let exPath = ArkCfg.get('lnFiles', false) ? '-ark' : ''
          return e.reply([
            await Common.render(`character/rank-profile-list${exPath}`, {
              save_id: char.id,
              game: e.isSr ? "sr" : "gs",
              list,
              title,
              elem: char.elem,
              data,
              noRankFlag,
              bodyClass: `char-${char.name}`,
              rankCfg,
              mode,
              pageGotoParams: { waitUntil: "networkidle2" }
            }, { e, scale: 1.4, retType: "base64" }), new Button(e).profile(char)
          ])
        }
        
    }   
}
export default ArkInit 
    