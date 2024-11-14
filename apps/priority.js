import Priority from '../model/priority.js'
import common from '../../../lib/common/common.js'
import priority from '../model/priority.js'
export class Help extends plugin {
    constructor() {
        super({
            name: '设置优先级',
            dsc: '设置优先级',
            event: 'message',
            priority: 1146,
            rule: [
                {
                    reg: '^#刷新优先级(.*)$',
                    fnc: 'refreshPriority'
                },
                {
                    reg: '#修改优先级$',
                    fnc: 'changePriority'
                },
                {
                    reg: '#重置优先级$',
                    fnc: 'resetPriority'
                },
                {
                    reg: '#查询优先级$',
                    fnc: 'getPriority'
                },
                {
                    reg: '(.*)$',
                    fnc: 'firstRefresh',
                    log: false
                }
            ]
        })
    }
    async firstRefresh() {
        if (!Priority.refreshed) {
            await Priority.refresh()
            priority.refreshed = true
        }
        return false
    }
    async refreshPriority(e) {
        await Priority.refresh()
        e.reply('刷新完成')
    }
    async changePriority(e) {
        let msgList = await Priority.getPriority(0)
        msgList.unshift(`输入：\"起始序号 (终止序号) 优先级\" 来修改，如0 5 -1000`)
        let forwardMsg = await common.makeForwardMsg(e, msgList)
        e.reply(forwardMsg)
        this.setContext('getChangeResult')
        
    }
    async getChangeResult() {
        if (this.e.msg.includes('取消')) {
            this.e.reply('已取消')
            this.finish('getChangeResult')
            return true
        }
        let [idx1, idx2, priority] = this.e.msg.replace('#修改优先级', '').trim().split(' ', 3)
        if (!idx1 || !idx2) {
            this.e.reply('缺少参数')
            return true
        } else if (!priority) {
            priority = idx2
            idx2 = idx1
        }
        await Priority.add(idx1, idx2, parseInt(priority))
        this.e.reply('操作成功')
        this.finish('getChangeResult')
    }
    async resetPriority(e) {
        let msgList = await Priority.getPriority(1)
        msgList.unshift(`输入：\"起始序号 (终止序号)\" 来修改，如0 5`)
        let forwardMsg = await common.makeForwardMsg(e, msgList)
        e.reply(forwardMsg)
        this.setContext('getResetResult')
        
    }
    async getResetResult() {
        if (this.e.msg.includes('取消')) {
            this.e.reply('已取消')
            this.finish('getResetResult')
            return true
        }
        let [idx1, idx2] = this.e.msg.replace('#重置优先级', '').trim().split(' ', 2)
        if (!idx1) {
            this.e.reply('缺少参数')
            return true
        } else if (!idx2) {
            idx2 = idx1
        }
        await Priority.remove(idx1, idx2)
        this.e.reply('操作成功')
        this.finish('getResetResult')
    }
    async getPriority(e) {
        let msgList = await Priority.getPriority(0)
        let forwardMsg = await common.makeForwardMsg(e, msgList)
        e.reply(forwardMsg)
    }
}