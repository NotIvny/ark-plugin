import { Cfg, Common, Data } from '../../miao-plugin/components/index.js'
import Help from '../../miao-plugin/apps/help/Help.js'
import fs from 'node:fs'
import lodash from 'lodash'
import path from 'path'
import HelpTheme from '../../miao-plugin/apps/help/HelpTheme.js'
import { fileURLToPath } from 'url'
import config from '../../../lib/config/config.js'
import { Cfg as ArkCfg } from '../components/index.js'
import loader from '../../../lib/plugins/loader.js'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const miaoPath = path.join(__dirname, '..').replace('ark-plugin', 'miao-plugin')
const helpPath = `${miaoPath}/resources/help`
let extendMiaoHelp = ArkCfg.get('extendMiaoHelp', false)
if (extendMiaoHelp) {
  const legacyConfigs = [
    { file: 'help-cfg.js', name: 'help-cfg.js' },
    { file: 'help-list.js', name: 'help-list.js' }
  ]

  function calcPermLevel(e) {
    let pm = 0
    if (e.isMaster) pm += 1000
    if (e.sender_role === 'owner') pm += 100
    if (e.sender_role === 'admin') pm += 10
    return pm
  }

  function applyFilterAction(help, mode, desc) {
    if (mode === 1) return true
    if (mode === 2) {
      help.disable = 'filter: grayscale(100%)'
      help.desc = desc
    }
    return false
  }

  Help.render = async (e) => {
    if (!/喵喵/.test(e.msg) && !Cfg.get('help', false)) {
      return false
    }

    let custom = {}
    let help = {}
    for (let cfg of legacyConfigs) {
      let filePath = `${helpPath}/${cfg.file}`
      if (fs.existsSync(filePath)) {
        console.log(`miao-plugin: 检测到存在${cfg.name}配置\n建议将${cfg.name}移为config/help.js或重新复制config/help_default.js进行配置~`)
        help = await import(`file://${filePath}?version=${new Date().getTime()}`)
        break
      }
    }

    let { diyCfg, sysCfg } = await Data.importCfg('help')
    // 兼容一下旧字段
    custom = lodash.isArray(help.helpCfg)
      ? { helpList: help.helpCfg, helpCfg: {} }
      : help

    let helpConfig = lodash.defaults(diyCfg.helpCfg || {}, custom.helpCfg, sysCfg.helpCfg)
    let helpList = diyCfg.helpList || custom.helpList || sysCfg.helpList
    let helpGroup = []
    let groupCfg = config.getGroup(null, e.group_id)
    let miaoHelpDisable = ArkCfg.get('miaoHelpDisable', 0)
    let miaoHelpNotFound = ArkCfg.get('miaoHelpNotFound', 0)
    let pm = calcPermLevel(e)
    const priorityList = loader.priority.map((plugin) => plugin.name)
    lodash.forEach(helpList, (group) => {
      if (group.auth === 'master' && !e.isMaster) return true
      if (typeof group.auth === 'number' && group.auth > pm) return true

      group.list = group.list.filter((help) => {
        if (!help) return false

        if (typeof help.auth === 'number' && help.auth > pm) {
          return !applyFilterAction(help, miaoHelpDisable, '')
        }

        if (help.bind) {
          if (!priorityList.includes(help.bind)) {
            if (applyFilterAction(help, miaoHelpNotFound, '功能不可用')) return false
          }
          let isDisabled = groupCfg.enable
            ? !groupCfg.disable.includes(help.bind)
            : groupCfg.disable.includes(help.bind)
          if (isDisabled) {
            if (applyFilterAction(help, miaoHelpDisable, '已禁用')) return false
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
        return true
      })
      helpGroup.push(group)
    })
    let themeData = await HelpTheme.getThemeData(diyCfg.helpCfg || {}, sysCfg.helpCfg || {})
    // eslint-disable-next-line no-return-await
    return await Common.render('help/index', {
      helpCfg: helpConfig,
      helpGroup,
      ...themeData,
      element: 'default'
    }, {
      e,
      scale: 1.2
    })
  }
}
