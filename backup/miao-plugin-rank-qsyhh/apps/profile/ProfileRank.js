/* eslint-disable no-invalid-this */
/* eslint-disable import/no-unresolved */
import lodash from "lodash"
import ProfileDetail from "./ProfileDetail.js"
import { Data, Common, Format, Cfg } from "#miao"
import { Button, Character, ProfileRank, ProfileDmg, Player } from "#miao.models"
import api from '../../../ark-plugin/model/api.js'
import ArkCfg from '../../../ark-plugin/components/Cfg.js'
// const { stubFalse } = lodash
const CharRank = {
  async renderCharRankList({ e, uids, char, mode, groupId }, game = "gs") {
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

    const rankCfg = await ProfileRank.getGroupCfg(groupId, game)
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
      style: `<style>body .container {width: ${(isMemosprite ? 970 : e.isSr ? 900 : 820) + !noRankFlag * 180}px;}</style>`
    }
    cont_width = (isMemosprite ? 970 : e.isSr ? 900 : 820) + !noRankFlag * 180
    // 渲染图像
    return e.reply([
      await Common.render("character/rank-profile-list", {
        save_id: char.id,
        game: e.isSr ? "sr" : "gs",
        list,
        title,
        elem: char.elem,
        data,
        noRankFlag,
        cont_width: cont_width,
        bodyClass: `char-${char.name}`,
        rankCfg,
        mode,
        pageGotoParams: { waitUntil: "networkidle2" }
      }, { e, scale: 1.4, retType: "base64" }), new Button(e).profile(char)
    ])
  }
}

export async function groupRank(e) {
  const groupRank = Common.cfg("groupRank")
  let msg = e.original_msg || e.msg
  let type = ""
  if (/(排名|排行|列表)/.test(msg)) {
    type = "list"
  } else if (/(最强|最高|最多|最高分|最牛|第一)/.test(msg)) {
    type = "detail"
  } else if (/极限/.test(msg)) {
    type = "super"
  }
  let groupId = e.group_id
  if (!type || (!groupId && type !== "super")) return false

  let mode = /(分|圣遗物|遗器|评分|ACE)/.test(msg) ? "mark" : "dmg"
  mode = /(词条)/.test(msg) ? "valid" : mode
  mode = /(双爆|双暴)/.test(msg) ? "crit" : mode
  let name = msg.replace(/(#|星铁|最强|最高分|第一|词条|双爆|双暴|极限|最高|最多|最牛|圣遗物|遗器|评分|群内|群|排名|排行|面板|面版|详情|榜)/g, "")
  let game = e.isSr ? "sr" : "gs"
  let char = Character.get(name, game)
  if (!char) {
    // 名字不存在或不为列表模式，则返回false
    if (name || type !== "list") return false
  } else {
    e.isSr = char.game === "sr"
  }
  // 对鲸泽佬的极限角色文件增加支持
  if (type === "super") {
    let player = Player.create(100000000, game)
    if (player.getProfile(char.id)) {
      e.uid = 100000000
      if (!char.isRelease && Cfg.get("notReleasedData") === false) return e.reply("未实装角色面板已禁用...")
      return await ProfileDetail.render(e, char)
    } else {
      return true
    }
  }
  // 正常群排名
  let groupCfg = await ProfileRank.getGroupCfg(groupId, game)
  if (!groupRank) return e.reply("群面板排名功能已禁用，Bot主人可通过【#喵喵设置】启用...")
  if (groupCfg.status === 1) return e.reply("本群已关闭群排名，群管理员或Bot主人可通过【#启用排名】启用...")

  if (type === "detail") {
    let uid = await ProfileRank.getGroupMaxUid(groupId, char.id, mode)
    if (uid) {
      e.uid = uid
      return await ProfileDetail.render(e, char)
    } else {
      if (mode === "dmg" && !ProfileDmg.dmgRulePath(char.name, char.game)) {
        e.reply([ `暂无排名：${char.name}暂不支持伤害计算，无法进行排名..`, new Button(e).profile(char) ])
      } else {
        e.reply("暂无排名：请通过【#面板】查看角色面板以更新排名信息...")
      }
    }
  } else if (type === "list") {
    if (mode === "dmg" && char && !ProfileDmg.dmgRulePath(char.name, char.game)) {
      e.reply([ `暂无排名：${char.name}暂不支持伤害计算，无法进行排名..`, new Button(e).profile(char) ])
    } else {
      let uids = []
      if (char) {
        uids = await ProfileRank.getGroupUidList(groupId, char ? char.id : "", mode)
      } else {
        uids = await ProfileRank.getGroupMaxUidList(groupId, mode, game)
      }
      if (uids.length > 0) {
        return CharRank.renderCharRankList({ e, uids, char, mode, groupId }, game)
      } else {
        e.reply([ `暂无排名：请通过【${e.isSr ? "*" : "#"}面板】查看角色面板以更新排名信息...`, new Button(e).profile(char) ])
      }
    }
    return true
  }
}

export async function resetRank(e) {
  let groupId = e.group_id
  if (!groupId) return true
  if (!e.isMaster) return await e.reply("只有管理员可重置排名")

  let game = e.isSr ? "sr" : "gs"
  let msg = e.original_msg || e.msg
  let name = msg.replace(/(#|星铁|重置|重设|排名|排行|群|群内|面板|详情|面版)/g, "").trim()
  let char = ""
  let charId = ""
  let charName = "全部角色"
  if (name) {
    char = Character.get(name, game)
    if (!char) return await e.reply(`重置排名失败，角色：${name}不存在`)
    charId = char.id
    charName = char.name
  }
  await ProfileRank.resetRank(groupId, charId, game)
  await e.reply([ `本群${charName}排名已重置...`, name ? new Button(e).profile(char) : "" ])
}

/**
 * 刷新群排名信息
 * @param e
 * @returns {Promise<boolean>}
 */
export async function refreshRank(e) {
  let groupId = e.group_id || ""
  if (!groupId) return true

  if (!e.isMaster && !this.e.member?.is_admin) return await e.reply("只有主人及群管理员可刷新排名...")

  e.reply("面板数据刷新中，等待时间可能较长，请耐心等待...")
  let game = e.isSr ? "sr" : "gs"
  await ProfileRank.resetRank({ groupId, game })
  let uidMap = await ProfileRank.getUserUidMap(e, game)
  let count = 0
  for (let uid in uidMap) {
    let { qq, type } = uidMap[uid]
    let player = new Player(uid, game)
    let profiles = player.getProfiles()
    // 刷新rankLimit
    await ProfileRank.setUidInfo({ uid, profiles, qq, uidType: type })
    let rank = await ProfileRank.create({ groupId, uid, qq }, game)
    for (let id in profiles) {
      if (id == "game") continue
      let profile = profiles[id]
      if (!profile.hasData) continue
      await rank.getRank(profile, true)
    }
    if (rank.allowRank) {
      count++
    }
  }
  e.reply(`本群排名已刷新，共刷新${count}个UID数据...`)
}

export async function manageRank(e) {
  let groupId = e.group_id
  if (!groupId) return true

  let isClose = /(关闭|禁用)/.test(e.msg)
  if (!e.isMaster && !this.e.member?.is_admin) return await e.reply(`只有主人及群管理员可${isClose ? "禁用" : "启用"}排名...`)

  await ProfileRank.setGroupStatus(groupId, isClose ? 1 : 0)
  e.reply(`当前群排名功能${isClose ? "已禁用..." : "已启用...\n如数据有问题可通过【#刷新排名】命令来刷新当前群内排名"}`)
}

export default CharRank