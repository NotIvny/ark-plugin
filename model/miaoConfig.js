import fs from 'fs'
import lodash from 'lodash'
import cfgData from '../../miao-plugin/components/cfg/CfgData.js';
import Cfg from '../components/Cfg.js'
let lastMsg = {
    group_id: '',
    user_id: ''
}
let globalCfg = {}
export const setLastMsg = (group_id, user_id) => {
    lastMsg.group_id = group_id
    lastMsg.user_id = user_id
}
let importModule = async function (name, path = 'components/Cfg.js') {
    return await import(`../../${name}/${path}`)
}
let changeConfig = function (fnc, name = 'miao-plugin') {
    if (!Cfg.get('miaoGroupCfg', false)) {
        return false
    }
    fnc.default.get = (rote, def = '') => {
        let group_id = lastMsg.group_id
        let cfg = globalCfg
        if (group_id) {
            try {
                cfg = JSON.parse(fs.readFileSync(`./plugins/miao-plugin/config/group/${group_id}/cfg.json`, 'utf8'))
            } catch (error) {
                if (!fs.existsSync(`./plugins/miao-plugin/config/group/${group_id}/cfg.json`)) {
                    fs.mkdirSync(`./plugins/miao-plugin/config/group/${group_id}`, { recursive: true })
                }
                fs.writeFileSync(`./plugins/miao-plugin/config/group/${group_id}/cfg.json`, JSON.stringify(cfg, null, '\t'))
            }
        }
        let ret = lodash.get(cfg, rote)
        return lodash.isUndefined(cfg) ? def : ret
    }
    fnc.default.set = (rote, val) => {
        let group_id = lastMsg.group_id
        let cfg = globalCfg
        if (group_id) {
            let cfg = JSON.parse(fs.readFileSync(`./plugins/miao-plugin/config/group/${group_id}/cfg.json`, 'utf8'))
            cfg[rote] = val
            fs.writeFileSync(`./plugins/miao-plugin/config/group/${group_id}/cfg.json`, JSON.stringify(cfg, null, '\t'))
        } else {
            cfg[rote] = val
            globalCfg = cfg
            cfgData.saveCfg(cfg)
        }
    }
    fnc.default.getCfg = () => {
        let group_id = lastMsg.group_id
        let cfg = globalCfg
        if (group_id) {
            try {
                cfg = JSON.parse(fs.readFileSync(`./plugins/miao-plugin/config/group/${group_id}/cfg.json`, 'utf8'))
            } catch (error) {
                if (!fs.existsSync(`./plugins/miao-plugin/config/group/${group_id}/cfg.json`)) {
                    fs.mkdirSync(`./plugins/miao-plugin/config/group/${group_id}`, { recursive: true })
                }
                fs.writeFileSync(`./plugins/miao-plugin/config/group/${group_id}/cfg.json`, JSON.stringify(cfg, null, '\t'))
            }
        }
        return cfg
    }
}
let miaoCfg = await importModule('miao-plugin')
changeConfig(miaoCfg, 'miao-plugin')
globalCfg = await cfgData.getCfg()
export default { importModule, changeConfig }
