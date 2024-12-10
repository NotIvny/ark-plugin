import fs from 'fs'
import lodash from 'lodash'
import cfgData from '../../miao-plugin/components/cfg/CfgData.js';
import Cfg from '../components/Cfg.js'
import Config from '../../../lib/config/config.js'
import { group } from 'console';
let lastMsg = {
    group_id: '',
    user_id: '',
    sender_role: '',
    isMaster: false,
}
let globalCfg = {}
export const setLastMsg = (group_id, user_id, sender_role, isMaster) => {
    lastMsg.group_id = group_id
    lastMsg.user_id = user_id
    lastMsg.sender_role = sender_role
    lastMsg.isMaster = isMaster
}
let importModule = async function (name, path = 'components/Cfg.js') {
    return await import(`../../${name}/${path}`)
}
let changeConfig = function (fnc, name = 'miao-plugin') {
    if (!Cfg.get('miaoGroupCfg', false)) {
        return false
    }
    fnc.default.get = (rote, def = '') => {
        if([
            'avatarList',
            'avatarCard',
            'uploadAbyssData',
            'roleCombat',
            'profileStat',
            'help',
            'gachaStat',
            'avatarPoke'
          ].includes(rote)
        ) {
            return true
        }
        let group_id = lastMsg.group_id
        let user_id = lastMsg.user_id
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
        let user_id = lastMsg.user_id
        if (!getAllowed(user_id, group_id, rote)) {
            return
        }
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
    fnc.default.getCfgSchema = () => {
        //let cfg = getPMFile(lastMsg.user_id, lastMsg.group_id)
        let schema = cfgData.getCfgSchema()
        Object.keys(schema).forEach(mainKey => {
            const mainObj = schema[mainKey];
            if (mainObj.cfg) {
                Object.keys(mainObj.cfg).forEach(subKey => {
                    const subObj = mainObj.cfg[subKey]
                    if (subObj.cfgKey && !getAllowed(lastMsg.user_id, lastMsg.group_id, subObj.cfgKey)) {
                        delete mainObj.cfg[subKey]
                    }
                })
            }
            if (Object.keys(mainObj.cfg).length === 0) {
                delete schema[mainKey]
            }
        })
        return schema
    }
}
let getAllowed = function (user_id, group_id, rote) {
    if (!group_id) {
        group_id = 'global'
    }
    let cfg = getPMFile(user_id, group_id)
    if (cfg[rote] <= getPMRule(user_id, group_id)) {
        return true
    } else {
        return false
    }
}
let getPMFile = function (user_id, group_id) {
    let cfg = {}
    try {
        cfg = JSON.parse(fs.readFileSync(`./plugins/miao-plugin/config/group/permission/${group_id}.json`, 'utf8'))
    } catch (error) {
        if(!(fs.existsSync(`./plugins/miao-plugin/config/group/permission/global.json`))){
            fs.cpSync('./plugins/ark-plugin/defset/permission/global.json', `./plugins/miao-plugin/config/group/permission/${group_id}.json`, { recursive: true })
        }
        if(!(fs.existsSync(`./plugins/miao-plugin/config/group/permission/${group_id}.json`))){
            fs.cpSync('./plugins/miao-plugin/config/group/permission/global.json', `./plugins/miao-plugin/config/group/permission/${group_id}.json`, { recursive: true })
        }
        cfg = JSON.parse(fs.readFileSync(`./plugins/miao-plugin/config/group/permission/${group_id}.json`, 'utf8'))
    }
    return cfg
}
let getPMRule = function (user_id, group_id) {
    if (pmRule) {
        return pmRule.getPM(lastMsg)
    } else {
        let pm = 0
        if (lastMsg.isMaster) {
            pm += 1000
        }
        if (lastMsg.sender_role == 'owner') {
            pm += 100
        }
        if (lastMsg.sender_role == 'admin') {
            pm += 10
        }
        return pm   
    }

}
let miaoCfg = await importModule('miao-plugin')
changeConfig(miaoCfg, 'miao-plugin')
globalCfg = await cfgData.getCfg()
let pmRule = ''
try {
    pmRule = await importModule('ark-plugin', 'model/custom/custom.js')
} catch (err) {}
export default { importModule, changeConfig }
