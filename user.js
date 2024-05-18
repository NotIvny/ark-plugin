import fetch from 'node-fetch'
import { getTargetUid } from '../../plugins/miao-plugin/apps/profile/ProfileCommon.js'
import Gscfg from '../../plugins/genshin/model/gsCfg.js'
export class characterRank extends plugin {
    constructor() {
        super({
            name: '角色排名获取',
            dsc: '角色排名获取',
            event: 'message',
            priority: -500,
            rule: [
                {
                    reg: '^#角色排名(.*)$',
                    fnc: 'getRank',
                },
                {
                    reg: /^#(星铁|原神)?(群|群内)?.+(排名|排行)(榜)?$/,
                    fnc: 'playerRank',
                }
            ]
        });
    }
    async getRank(e){
        let msg = this.e.msg.replace('#角色排名', '').trim()
        const characterName = msg.replace(/\d+/g, '').trim()
        const uid = msg.replace(/\D+/g, '').trim()
        if (!characterName || !uid) {
            e.reply('命令格式错误，示例：#角色排名雷电将军123456789')
            return true
        }
        let name = msg
        let id = Gscfg.roleNameToID(characterName,true)
        if(!id){
            id = Gscfg.roleNameToID(characterName,false)
        }
        if(id){
            name = Gscfg.roleIdToName(id)
        }
        const url = `http://8.147.110.49:3000/getRankData?id=${id}&uid=${uid}`
        try {
            const response = await fetch(url)
            if(!response.ok){
                e.reply('获取失败')
            }
            const ret = await response.json()
            switch(ret.retcode){
                case 101:
                    e.reply('角色名不存在')
                    break
                case 102:
                    e.reply(`未查询到uid:${uid}的数据，请稍后再试...`)
                    break
                case 100:
                    e.reply(`uid:${uid}的${name}全服伤害排名为 ${ret.rank}，伤害: ${ret.score.toFixed(2)}`)
                    break
                }
            }
        catch(error){
            e.reply('获取排名数据失败')
        }
    }
    async playerRank(e){
        let name = e.msg.replace(/(#|星铁|最强|最高分|第一|词条|双爆|双暴|极限|最高|最多|最牛|圣遗物|遗器|评分|群内|群|排名|排行|面板|面版|详情|榜)/g, '')
        let id = Gscfg.roleNameToID(name,true)
        if(!id){
            id = Gscfg.roleNameToID(name,false)
        }
        if(id){
            name = Gscfg.roleIdToName(id)
        }
        let uid = await getTargetUid(e)
        const url = `http://8.147.110.49:3000/getRankData?id=${id}&uid=${uid}`
        try {
            const response = await fetch(url)
            if(!response.ok){
                e.reply('获取失败')
            }
            const ret = await response.json()
            switch(ret.retcode){
                case 101:
                    //e.reply('角色名不存在')
                    break
                case 102:
                    //e.reply(`未查询到uid:${uid}的数据，请稍后再试...`)
                    break
                case 100:
                    e.reply(`uid:${uid}的${name}全服伤害排名为 ${ret.rank}，伤害: ${ret.score.toFixed(2)}`)
                    break
            }
        }catch(error){
            //e.reply('获取排名数据失败');
        }
        return false
    }
}
