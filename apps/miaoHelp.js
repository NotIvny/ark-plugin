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
		let miaoHelpDisable = ArkCfg.get('miaoHelpDisable', 0)
		let miaoHelpNotFound = ArkCfg.get('miaoHelpNotFound', 0)
		const priorityList = loader.priority.map((plugin) => {return plugin.name})
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
					if (e.sender_role === 'owner') pm += 100
					if (e.sender_role === 'admin') pm += 10
					if (help.auth > pm) {
						if (miaoHelpDisable == 1) {
							group.list.splice(index, 1)
							index--
							return true
						}
					} 
				}
				if (help.bind) {
					if (!priorityList.includes('help.bind')) {
						if (miaoHelpNotFound == 1) {
							group.list.splice(index, 1)
							index--
							return true
						} else if (miaoHelpNotFound == 2) {
							help.disable = 'filter: grayscale(100%)'
							help.desc = '功能不可用'
						}
					}
					if ((groupCfg.enable && !groupCfg.disable.includes(help.bind)) || (!groupCfg.enable && groupCfg.disable.includes(help.bind))) {
						if (miaoHelpDisable == 1) {
							group.list.splice(index, 1)
							index--
							return true
						} else if (miaoHelpDisable == 2) {
							help.disable = 'filter: grayscale(100%)'
							help.desc = '已禁用'
						}
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
		}, {
			e,
			scale: 1.2
		})
	}
}
