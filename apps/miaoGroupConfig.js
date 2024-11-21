import lodash from 'lodash'
import { setLastMsg } from '../model/miaoConfig.js'
import Cfg from '../components/Cfg.js'
let keys = lodash.map(Cfg.getCfgSchemaMap(), (i) => i.key)
export class miaoGroupConfig extends plugin {
    constructor() {
        super({
            name: '喵喵独立群配置文件',
            dsc: '喵喵独立群配置文件',
            event: 'message',
            priority: -999999,
            rule: [
                {
                    reg: '^(.*)$',
                    fnc: 'groupConfig',
                    log: false
                }
            ]
        })
    }
    async groupConfig(e) {
        if (!Cfg.get('miaoGroupCfg', false)) {
            return false
        }
        let globalSysCfgReg = new RegExp(`^global\\s*#喵喵设置\\s*(${keys.join('|')})?\\s*(.*)$`)
        let sysCfgReg = new RegExp(`^#喵喵设置\\s*(${keys.join('|')})?\\s*(.*)$`)
        if (globalSysCfgReg.test(e.msg)) {
            e.msg = e.msg.replace('global', '').trim()
            e.raw_message = e.raw_message.replace('global', '').trim()
            setLastMsg('', '', e.sender_role, e.isMaster)
        } else {
            e.isGroup = true
            e.group_id = 66666666
            setLastMsg(e.isGroup ? e.group_id : '', '', e.sender_role, e.isMaster)
            if (sysCfgReg.test(e.msg) && !e.msg.includes('喵喵更新图像')) {
                e.isMaster = true
            }
        }
        return false
    }
}
