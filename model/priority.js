import loader from '../../../lib/plugins/loader.js'
import fs from 'fs'
class PriorityController {
    constructor() {
        this.refreshed = false
    }
    async refresh() {
        const priorities = await JSON.parse(fs.readFileSync('./plugins/ark-plugin/config/priority.json', 'utf-8'))
        loader.priority.forEach(plugin => {
            const match = priorities.find(
              item => item.key === plugin.key && item.name === plugin.name
            )
            if (match) {
                plugin.priority = match.priority
            }
        })
        loader.priority.sort((a, b) => a.priority - b.priority)
    }
    async add(idx1, idx2, priority) {
        let priorities = await JSON.parse(fs.readFileSync('./plugins/ark-plugin/config/priority.json', 'utf-8'))
        for (let i = idx1; i <= idx2; i++) {
            const plugin = loader.priority[i]
            const exist = priorities.find(
                item => item.key === plugin.key && item.name === plugin.name
            )
            if (exist) {
                exist.priority = priority
            } else {
                priorities.push({
                    key: plugin.key,
                    name: plugin.name,
                    default: plugin.priority,
                    priority: priority
                })
            }
        }
        fs.writeFileSync('./plugins/ark-plugin/config/priority.json', JSON.stringify(priorities, null, 2))
        this.refresh()
    }
    async remove(idx1, idx2) {
        const priorities = await JSON.parse(fs.readFileSync('./plugins/ark-plugin/config/priority.json', 'utf-8'))
        const newPriorities = priorities.filter((_, index) => index < idx1 || index > idx2)
        fs.writeFileSync('./plugins/ark-plugin/config/priority.json', JSON.stringify(newPriorities, null, 2))
        this.refresh()
    }
    async getPriority(type) {
        const priorities = JSON.parse(fs.readFileSync('./plugins/ark-plugin/config/priority.json', 'utf-8'))
        let list
        if (type) {
            list = priorities
        } else {
            list = loader.priority
        }
        const priorityList = list.map((plugin, index) => {
            let description = `序号：${index}，插件名: ${plugin.key}, 功能名: ${plugin.name}, 优先级: ${plugin.priority}`
            const match = !type ? priorities.find(item => item.key === plugin.key && item.name === plugin.name) : false
            if (match && match.priority !== match.default) {
                description += `（默认：${match.default}）`
            }
            return description
        })
        const msgList = []
        for (let i = 0; i < priorityList.length; i += 20) {
            const chunk = priorityList.slice(i, i + 20).join('\n')
            msgList.push(chunk)
        }
        return msgList
    }
}
export default new PriorityController()
