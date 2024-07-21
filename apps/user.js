import { getTargetUid } from '../../miao-plugin/apps/profile/ProfileCommon.js'
import Gscfg from '../../genshin/model/gsCfg.js'
import fs from 'fs'
import api from '../model/api.js'
import Config from '../model/Config.js'
import { Button, ProfileRank, Player, Character } from '../../miao-plugin/models/index.js'
export class characterRank extends plugin {
    constructor() {
        super({
            name: '角色排名获取',
            dsc: '角色排名获取',
            event: 'message',
            priority: -3000,
            rule: [
                {
                    reg: '#(星铁|原神)?(导出面板数据)(.*)',
                    fnc: 'uploadPanelData',
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
                    reg: /^#(星铁|原神)?(群|群内)?.+(排名|排行)(榜)?$/,
                    fnc: 'playerRank',
                },
                {
                    reg: /^#(星铁|原神)?(全部面板更新|更新全部面板|获取游戏角色详情|更新面板|面板更新)\s*(\d{9,10})?$/,
                    fnc: 'refreshPanel',
                },
                {
                    reg: '^#ark设置面板全服排名(开启|关闭)$',
                    fnc: 'setPanelRank',
                    permission: 'master',
                },
                {
                    reg: '^#ark设置角色全服排名(开启|关闭)$',
                    fnc: 'setGroupRank',
                    permission: 'master',
                }
            ]
        })
    }
    async refreshPanel(e){
        let type = e.msg.includes("星铁") ? 'sr' : 'gs'
        let uid = type == 'sr' ? e.user?._games?.sr?.uid : e.user?._games?.gs?.uid
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
        let uid = id < 10000 ? e.user?._games?.sr?.uid : e.user?._games?.gs?.uid
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
        let ret = await api.sendApi('selfAllRank', {ids: profile, uid: uid, type: e.game})
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
    async setPanelRank(e){
        if(e.msg.includes('开启')){
            Config.set('config','panelRank',true)
        }else{
            Config.set('config','panelRank',false)
        }
        e.reply('设置成功')
    }
    async setGroupRank(e){
        if(e.msg.includes('开启')){
            Config.set('config','groupRank',true)
        }else{
            Config.set('config','groupRank',false)
        }
        e.reply('设置成功')
    }
    async uploadPanelData(e){
        e.game = e.game || 'gs'
        let prefix = e.game == 'gs' ? '#' : '*'
        let user = e?.runtime?.user || {}
        let uid = await getTargetUid(e)
        if (!user.hasCk && !e.isMaster) {
            e.reply('为确保数据安全，目前仅允许绑定CK用户导出自己UID的面板数据，请联系Bot主人导出...')
            return true
        }
        let playerData = fs.readFileSync(`./data/PlayerData/${e.game}/${uid}.json`,'utf8')
        let ret = await api.sendApi('uploadPanelData', {uid: uid, type: e.game, data: playerData})
        switch(ret.retcode){
            case 100:
                e.reply(`导出成功，请在另一个安装此插件的Bot上输入 ${prefix}导入面板数据${uid} ，有效期十分钟~`)
                break
            default:
                e.reply(await this.dealError(ret.retcode))
        }
    }
    async downloadPanelData(e){
        e.game = e.game || 'gs'
        let user = e?.runtime?.user || {}
        let uid = await getTargetUid(e)
        if (!user.hasCk && !e.isMaster) {
            e.reply('为确保数据安全，目前仅允许绑定CK用户导入自己UID的面板数据，请联系Bot主人导入...')
            return true
        }

        let ret = await api.sendApi('downloadPanelData', {uid: uid, type: e.game})
        switch(ret.retcode){
            case 100:
                fs.writeFileSync(`./data/playerData/${e.game}/${uid}.json`, JSON.stringify(ret.data, null, 2))
                e.reply('导入成功')
                break
            default:
                e.reply(await this.dealError(ret.retcode))
        }
    }
    async dealError(retcode){
       switch(retcode){
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
            default:
                return '未知错误'
       }
    }       
               
}

