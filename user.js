import { getTargetUid } from '../../plugins/miao-plugin/apps/profile/ProfileCommon.js'
import Gscfg from '../../plugins/genshin/model/gsCfg.js'
import api from './api.js'
import { Common, Data } from '../miao-plugin/components/index.js'
import { Button, ProfileRank, Player, Character } from '../miao-plugin/models/index.js'
export class characterRank extends plugin {
    constructor() {
        super({
            name: '角色排名获取',
            dsc: '角色排名获取',
            event: 'message',
            priority: -3000,
            rule: [
                {
                    reg: '^#角色排名(.*)$',
                    fnc: 'getRank',
                },
                {
                    reg: '^#(星铁|原神)?总排名(.*)$',
                    fnc: 'getAllRank',
                },
                {
                    reg: /^#(星铁|原神)?(群|群内)?.+(排名|排行)(榜)?$/,
                    fnc: 'playerRank',
                },
                {
                    reg: /^#(星铁|原神)?(全部面板更新|更新全部面板|获取游戏角色详情|更新面板|面板更新)\s*(\d{9,10})?$/,
                    fnc: 'refreshPanel',
                }
            ]
        });
    }
    async refreshPanel(e){
        let type = e.msg.includes("星铁") ? 'sr' : 'gs'
        let uid = type == 'sr' ? e.user?._games?.sr?.uid : e.user?._games?.gs?.uid;
        api.sendApi('refreshPanel',{uid: uid, type: type}, '0.2.0')
        return false
    }
    async getRank(e){
        let msg = this.e.msg.replace('#角色排名', '').trim()
        const characterName = msg.replace(/\d+/g, '').trim()
        const uid = msg.replace(/\D+/g, '').trim()
        if (!characterName || !uid) {
            e.reply('命令格式错误，示例：#角色排名雷电将军123456789')
            return true
        }
        let name = characterName
        let id = Gscfg.roleNameToID(name,true) || Gscfg.roleNameToID(name,false)
        if(id){
            name = Gscfg.roleIdToName(id)
        }
        let ret = await api.sendApi('getRankData',{uid: uid, id: id, update: 1})
        switch(ret.retcode){
            case 100:
                e.reply(`uid:${uid}的${name}全服伤害排名为 ${ret.rank}，伤害评分: ${ret.score.toFixed(2)}`)
                break
            default:
                e.reply(await this.dealError(ret.retcode))
        }
        return false
    }
    async playerRank(e){
        let name = e.msg.replace(/(#|星铁|最强|最高分|第一|词条|双爆|双暴|极限|最高|最多|最牛|圣遗物|遗器|评分|群内|群|排名|排行|面板|面版|详情|榜)/g, '')
        let id = Gscfg.roleNameToID(name,true) || Gscfg.roleNameToID(name,false)
        if(id){
            name = Gscfg.roleIdToName(id)
        }
        let uid = id < 10000 ? e.user?._games?.sr?.uid : e.user?._games?.gs?.uid;
        let ret = await api.sendApi('getRankData',{id: id, uid: uid, update: 1})
        switch(ret.retcode){
            case 100:
                e.reply(`uid:${uid}的${name}全服伤害排名为 ${ret.rank}，伤害评分: ${ret.score.toFixed(2)}`)
                break
            default:
                e.reply(await this.dealError(ret.retcode))
        }
        return false
    }
    async getAllRank(e){
        let uid = await getTargetUid(e)
        if(!uid){
            e._replyNeedUid || e.reply(['请先发送【#绑定+你的UID】来绑定查询目标\n星铁请使用【#星铁绑定+UID】', new Button(e).bindUid()])
        return true
        }
        let isSelfUid = false
        if(e.runtime && e.runtime?.user){
            let uids = []
            /*
            let user = e.runtime.user
            */
            isSelfUid = uids.some(ds => ds === uid + '')
        }
        /*
        let rank = false
        let hasNew = false
        let newCount = 0
        let chars = []
        */
        let msg = ''
        let newChar = {}
        if (e.newChar) {
            msg = '获取角色面板数据成功'
            newChar = e.newChar
        }
        let player = Player.create(e)
        let profiles = player.getProfiles()
        let profile = []
        for(let id in profiles){
            profile.push(id)
        }
        let ret = await api.sendApi('selfAllRank', {ids: profile, uid: uid})
        switch(ret.retcode){
            case 100:
                let msg = ''
                let count = 0
                let type = e.game === 'sr' ? '星铁' : '原神'
                msg += `uid:${uid}的${type}全服排名数据:\n`
                ret.rank.forEach(ret => {
                    if(ret.retcode === 100){
                        msg += (`${Gscfg.roleIdToName(profile[count])}全服伤害排名为${ret.rank}，伤害评分: ${ret.score.toFixed(2)}\n`)
                    }
                    count++
                })
                e.reply(msg)
                break
            default:
                e.reply(await this.dealError(ret.retcode))
        }
    }
    async dealError(retcode){
       switch(retcode){
            case 101:
                return '角色ID不存在'
            case 102:
                return '未查询到角色信息'
            case 103:
                return '请求参数错误'
            case 104:
                return '请求超过速率限制'
       }
    }                    
}

