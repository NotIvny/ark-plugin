/*
import { Cfg, Common, Data } from '../../miao-plugin/components/index.js'
import Help from '../../miao-plugin/apps/help/Help.js'
import fs from 'node:fs'
import lodash from 'lodash'
import path from 'path'
import HelpTheme from '../../miao-plugin/apps/help/HelpTheme.js'
import { fileURLToPath } from 'url'
import config from '../../../lib/config/config.js'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const miaoPath = path.join(__dirname, '..').replace('ark-plugin', 'miao-plugin')
const helpPath = `${miaoPath}/resources/help`

Help.render = async (e) => {
    if (!/喵喵/.test(e.msg) && !Cfg.get('help', false)) {
      return false
    }

    let custom = {}
    let help = {}
    if (fs.existsSync(`${helpPath}/help-cfg.js`)) {
      console.log('miao-plugin: 检测到存在help-cfg.js配置\n建议将help-cfg.js移为config/help.js或重新复制config/help_default.js进行配置~')
      help = await import(`file://${helpPath}/help-cfg.js?version=${new Date().getTime()}`)
    } else if (fs.existsSync(`${helpPath}/help-list.js`)) {
      console.log('miao-plugin: 检测到存在help-list.js配置，建议将help-list.js移为config/help.js或重新复制config/help_default.js进行配置~')
      help = await import(`file://${helpPath}/help-list.js?version=${new Date().getTime()}`)
    }

    let { diyCfg, sysCfg } = await Data.importCfg('help')
    // 兼容一下旧字段
    if (lodash.isArray(help.helpCfg)) {
      custom = {
        helpList: help.helpCfg,
        helpCfg: {}
      }
    } else {
      custom = help
    }

    let helpConfig = lodash.defaults(diyCfg.helpCfg || {}, custom.helpCfg, sysCfg.helpCfg)
    let helpList = diyCfg.helpList || custom.helpList || sysCfg.helpList

    let helpGroup = []
    let groupCfg = config.getGroup(null, e.group_id)
    lodash.forEach(helpList, (group) => {
      if (group.auth && group.auth === 'master' && !e.isMaster) {
        return true
      }
      if (group.auth && typeof group.auth === 'number') {
        let pm = 0
        if (e.isMaster) pm += 1000
        if (e.isOwner) pm += 100
        if (e.isAdmin) pm += 10
        if (group.auth > pm) return true  
      }
        lodash.forEach(group.list, (help, index) => {
        if (!help) {
            return true
        }
        if (help.auth && typeof help.auth === 'number') {
            let pm = 0
            if (e.isMaster) pm += 1000
            if (e.isOwner) pm += 100
            if (e.isAdmin) pm += 10
            if (help.auth > pm) {
                group.list.splice(index, 1)
                index--
                return true
            } 
        }
        if (help.bind) {
            logger.error(groupCfg)
            if (groupCfg.enable && !groupCfg.disable.includes(help.bind)) {
                group.list.splice(index, 1)
                index--
                return true
            }
            if (!groupCfg.enable && groupCfg.disable.includes(help.bind)) {
                group.list.splice(index, 1)
                index--
                return true
            }
        }
        let icon = help.icon * 1
        if (!icon) {
          help.css = 'display:none'
        } else {
          let x = (icon - 1) % 10
          let y = (icon - x - 1) / 10
          help.css = `background-position:-${x * 50}px -${y * 50}px`
        }
      })

      helpGroup.push(group)
    })
    let themeData = await HelpTheme.getThemeData(diyCfg.helpCfg || {}, sysCfg.helpCfg || {})
    return await Common.render('help/index', {
      helpCfg: helpConfig,
      helpGroup,
      ...themeData,
      element: 'default'
    }, { e, scale: 1.2 })
}
*/