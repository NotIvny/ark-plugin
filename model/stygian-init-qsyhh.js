import lodash from 'lodash'
import ProfileList from '../../miao-plugin/apps/profile/ProfileList.js'
import { getTargetUid } from '../../miao-plugin/apps/profile/ProfileCommon.js'
import { Common } from '../../miao-plugin/components/index.js'
import { Button, MysApi, Player } from '../../miao-plugin/models/index.js'
import { getStygianVersion } from '../../ark-plugin/model/calcVersion.js'
import ProfileReq from '../../miao-plugin/models/serv/ProfileReq.js'
import Character from "../../miao-plugin/models/Character.js"
import ArkCfg from '../components/Cfg.js'
const stygianInit = {
    init(){
        if (!ArkCfg.get('stygianRank', false)) {
            return false
        }
        ProfileList.doRefresh = async (e) => {
            let uid = await getTargetUid(e)
            if (!uid) return e._replyNeedUid || e.reply([ `请先发送【${e.isSr ? "*" : "#"}绑定+你的UID】来绑定查询目标\n示例：${e.isSr ? "*" : "#"}绑定100000000`, new Button(e).bindUid() ])
    
            // 数据更新
            let player = Player.create(e)
            player.e.isfromMys = /米游社|mys/.test(e.msg)
            let fromMys = player.e.isfromMys || Common.cfg("mysRefresh")
            if (fromMys) {
            player.e.noTips = fromMys
            let mys = await MysApi.init(player.e, "cookie")
            if (!mys || !await mys.checkCk()) {
                fromMys = false
                if (player.e.isfromMys) e.reply(`UID：${uid} ${mys ? "Cookie失效，请重新登录或尝试【#刷新ck】" : "尚未绑定Cookie"}，将切换至面板服务以更新数据...`)
            }
            }
            await player.refreshProfile(2, fromMys)
    
            if (!player?._update?.length) {
            e._isReplyed || e.reply([ `获取${e.isSr ? "星铁" : "原神"}UID：${uid} 角色面板数据失败，请确认角色已在游戏内橱窗展示，并开放了查看详情。设置完毕后请5分钟后再进行请求~`, new Button(e).profileList(uid) ])
            e._isReplyed = true
            } else {
            let ret = {}
            let update = {}
            lodash.forEach(player._update, (id) => {
                let char = Character.get(id)
                if (char) {
                ret[char.name] = true
                if (player._hasUpdate.includes(id)) update[char.name] = true
                }
            })
            let bindThisUid = false
            if (e.runtime && e.runtime?.user && e.game == 'gs') {
                let user = e.runtime.user
                bindThisUid = user.hasUid(uid, e.game)
            }
            if (uid && e.group_id && bindThisUid) {
                let stygianVersion = getStygianVersion()
                let stygianTime = await redis.get(`ark-plugin:stygianInfo:${stygianVersion}:${uid}`)
                if (stygianTime && stygianTime != -1) {
                logger.error("push")
                await redis.zAdd(`ark-plugin:stygianRank:${stygianVersion}:${e.group_id}`, { 
                    score: stygianTime, 
                    value: String(uid) 
                })
                }
            }
            if (lodash.isEmpty(ret)) {
                e._isReplyed || e.reply([ `获取${e.isSr ? "星铁" : "原神"}UID：${uid} 角色面板数据失败，未能请求到角色数据。请确认角色已在游戏内橱窗展示，并开放了查看详情。设置完毕后请5分钟后再进行请求~`, new Button(e).profileList(uid) ])
                e._isReplyed = true
            } else {
                e.newChar = ret
                e.updateChar = update
                e.isNewCharFromMys = fromMys
                return await ProfileList.render(e)
            }
            }
            return true
        }
        ProfileReq.prototype.requestProfile = async function(player, serv) {
            let self = this
            this.serv = serv
            let uid = this.uid
            let reqParam = await serv.getReqParam(uid, player.game)
            let cdTime = await this.inCd()
            if (cdTime && !process.argv.includes("web-debug")) {
                // return this.err(`请求过快，请${cdTime}秒后重试..`)
            }
            await this.setCd(20)
            // 若3秒后还未响应则返回提示
            setTimeout(() => {
                if (self._isReq && !player.e?.isfromMys) this.e.reply(`开始获取uid:${uid}的数据，可能会需要一定时间~`)
            }, 2000)
            // 发起请求
            this.log(`${logger.yellow("开始请求数据")}，面板服务：${serv.name}...`)
            const startTime = new Date() * 1
            let data = {}
            try {
                let params = reqParam.params || {}
                params.timeout = params.timeout || 1000 * 20
                self._isReq = true
                const mys = player.e._mys
                switch (serv._cfg.id) {
                case "mysPanel":
                    // 获取所有的 Character ID
                    // TODO: 要不要从 player._avatars 里面直接提取所有键作为 character_ids？
                    //       不这样做主要是不知道 player._avatars 角色是否为最新
                    //
                    // TODO: 加入仅利用米游社更新部分角色面板，其中部分角色是所有角色的子集
                    const character = await mys.getCharacter()
                    const character_ids = lodash.map(character.list, (c) => c.id) // .toString() // .slice(0, 2)
                    data = JSON.stringify(await mys.getCharacterDetail(character_ids)) // 跟下面的保持一致
                    break
                case "mysPanelHSR":
                    // 这里的 MysApi 没有完成对星铁 API 的封装，所以暂时先直接使用 getData 调用获取角色面板
                    // 值得注意的是原神的角色面板 API 是需要传带查询角色列表的；但是星铁的角色面板 API 是不需要传待查询角色列表的
                    data = JSON.stringify(await mys.getData("avatarInfo")) // 跟下面的保持一致
                    break
                default:
                    const req = await fetch(reqParam.url, params)
                    data = await req.text()
                }
                self._isReq = false
                const reqTime = new Date() * 1 - startTime
                this.log(`${logger.green(`请求结束，请求用时${reqTime}ms`)}，面板服务：${serv.name}...`)
                if (data[0] === "<") {
                let titleRet = /<title>(.+)<\/title>/.exec(data)
                if (titleRet && titleRet[1]) {
                    data = { error: titleRet[1] }
                } else {
                    return this.err("error", 60)
                }
                } else {
                data = JSON.parse(data)
                }
            } catch (e) {
                logger.error("面板请求错误", e)
                self._isReq = false
                data = {}
            }
            data = await serv.response(data, this, player.game)
            let stygianVersion = getStygianVersion()
            if (data?.playerInfo?.stygianSeconds && data?.playerInfo?.stygianIndex && data?.uid && stygianVersion != -1) {
                await redis.set(`ark-plugin:stygianInfo:${stygianVersion}:${data.uid}`, data.playerInfo.stygianSeconds + (6 - data.playerInfo.stygianIndex) * 2048)
            } else if (data?.uid && stygianVersion != -1) {
                await redis.set(`ark-plugin:stygianInfo:${stygianVersion}:${data.uid}`, -1)
            }
        
            // 设置CD
            cdTime = serv.getCdTime(data)
            if (cdTime) await this.setCd(cdTime)
            if (data === false) return false
            await serv.updatePlayer(player, data)
            cdTime = serv.getCdTime(data)
            if (cdTime) await this.setCd(cdTime)
            return player
        }
    }
}
export default stygianInit 