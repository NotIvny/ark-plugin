import { getTargetUid } from '../../miao-plugin/apps/profile/ProfileCommon.js'
import Gscfg from '../../genshin/model/gsCfg.js'
import fs from 'fs'
import api from '../model/api.js'
import { getStygianVersion, getStygianPeriod } from '../model/calcVersion.js'
import { Button, ProfileRank, Player, Character } from '../../miao-plugin/models/index.js'
import { Cfg, Version, Common, Data } from '../components/index.js'
export class characterRank extends plugin {
	constructor() {
		super({
			name: '角色排名获取',
			dsc: '角色排名获取',
			event: 'message',
			priority: -3000,
			rule: [{
					reg: '^#(.*)排名统计$',
					fnc: 'getSpecificRank'
				},
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
					reg: '^#幽境危战排名$',
					fnc: 'stygian',
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
					reg: /^#ark绑定(星铁|原神)uid$/,
					fnc: 'arkGetBindUid',
				},
				{
					reg: /^#ark验证(星铁|原神)uid$/,
					fnc: 'arkBindUid',
				},
				{
					reg: /^#(星铁|原神)导出面板$/,
					fnc: 'exportPanel',
				}
			]
		})
	}
	async refreshPanel(e) {
		let type = e.msg.includes("星铁") ? 'sr' : 'gs'
		let uid = type == 'sr' ? e.user?._games?.sr?.uid : e.user?._games?.gs?.uid
		if (uid && Cfg.get('newUserPanel', false) && !fs.existsSync(`./data/PlayerData/${type}/${uid}.json`)) {
			let ret = await api.sendApi('getPanelData', { uid: uid, type: type, qq: e.user_id })
			switch (ret.retcode) {
				case 100:
					fs.writeFileSync(`./data/PlayerData/${type}/${uid}.json`, JSON.stringify(ret.data.playerData, null, 2))
					let player = new Player(uid, type)
            		player.reload()
					e.reply(`[ark-plugin]已自动从API获取${ Object.keys(ret.data.playerData.avatars).length }个数据`)
					break
			}
		}
		api.sendApi('refreshPanel', {
			uid: uid,
			type: type
		}, '0.2.0')
		return false
	}
	async getRank(e) {
		let msg = this.e.msg.replace('#角色排名', '').trim()
		const characterName = msg.replace(/\d+/g, '').trim()
		const uid = msg.replace(/\D+/g, '').trim()
		if (!characterName || !uid) {
			e.reply('命令格式错误，示例：#角色排名雷电将军123456789')
			return true
		}
		let name = characterName
		let id = Gscfg.roleNameToID(name, true) || Gscfg.roleNameToID(name, false)
		if (id) {
			name = Gscfg.roleIdToName(id)
		}
		let ret = await api.sendApi('getRankData', {
			uid: uid,
			id: id,
			update: 1
		})
		switch (ret.retcode) {
			case 100:
				e.reply(`uid:${uid}的${name}全服伤害排名为 ${ret.rank}，伤害评分: ${ret.score.toFixed(2)}`)
				break
			default:
				e.reply(await this.dealError(ret.retcode))
		}
		return false
	}
	async playerRank(e) {
		let name = e.msg.replace(/(#|星铁|最强|最高分|第一|词条|双爆|双暴|极限|最高|最多|最牛|圣遗物|遗器|评分|群内|群|排名|排行|面板|面版|详情|榜)/g, '')
		let id = Gscfg.roleNameToID(name, true) || Gscfg.roleNameToID(name, false)
		if (id) {
			name = Gscfg.roleIdToName(id)
		}
		let uid = id < 10000 ? e.user?._games?.sr?.uid : e.user?._games?.gs?.uid
		setTimeout(async () => {
			let ret = await api.sendApi('getRankData', {
				id: id,
				uid: uid,
				update: 1
			});
			switch (ret.retcode) {
				case 100:
					e.reply(`uid:${uid}的${name}全服伤害排名为 ${ret.rank}，伤害评分: ${ret.score.toFixed(2)}`)
					break
				case 101:
				case 102:
					break
				default:
					e.reply(await this.dealError(ret.retcode))
			}
		}, 0)
		return false
	}
	async getAllRank(e) {
		let uid = await getTargetUid(e)
		if (!uid) {
			e._replyNeedUid || e.reply(['请先发送【#绑定+你的UID】来绑定查询目标\n星铁请使用【#星铁绑定+UID】', new Button(e).bindUid()])
			return true
		}
		let isSelfUid = false
		if (e.runtime && e.runtime?.user) {
			let uids = []
			isSelfUid = uids.some(ds => ds === uid + '')
		}
		if (e.newChar) {
			msg = '获取角色面板数据成功'
			newChar = e.newChar
		}
		let player = Player.create(e)
		let profiles = player.getProfiles()
		let profile = []
		for (let id in profiles) {
			profile.push(id)
		}
		let ret = await api.sendApi('selfAllRank', {
			ids: profile,
			uid: uid,
			type: e.game
		})
		switch (ret.retcode) {
			case 100:
				let msg = ''
				let count = 0
				let type = e.game === 'sr' ? '星铁' : '原神'
				msg += `uid:${uid}的${type}全服排名数据:\n`
				ret.rank.forEach(ret => {
					if (ret.retcode === 100) {
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
	async uploadPanelData(e) {
		e.game = e.game || 'gs'
		let prefix = e.game == 'gs' ? '#' : '*'
		let user = e?.runtime?.user || {}
		let uid = await getTargetUid(e)
		if (!await this.checkPermission(e, user, 'exportPanelData')) {
			return true
		}
		let playerData = fs.readFileSync(`./data/PlayerData/${e.game}/${uid}.json`, 'utf8')
		let ret = await api.sendApi('uploadPanelData', {
			uid: uid,
			type: e.game,
			data: playerData
		})
		switch (ret.retcode) {
			case 100:
				e.reply(`导出成功，请在另一个安装此插件的Bot上输入 ${prefix}导入面板数据${uid} ，有效期十分钟~`)
				break
			default:
				e.reply(await this.dealError(ret.retcode))
		}
	}
	async downloadPanelData(e) {
		e.game = e.game || 'gs'
		let user = e?.runtime?.user || {}
		let uid = await getTargetUid(e)
		if (await this.checkPermission(e, user, 'importPanelData')) {
			return true
		}
		let ret = await api.sendApi('downloadPanelData', {
			uid: uid,
			type: e.game
		})
		switch (ret.retcode) {
			case 100:
				fs.writeFileSync(`./data/playerData/${e.game}/${uid}.json`, JSON.stringify(ret.data, null, 2))
				e.reply('导入成功')
				break
			default:
				e.reply(await this.dealError(ret.retcode))
		}
	}
	async checkPermission(e, user, type) {
		switch (Cfg.get(type, 3)) {
			case 0:
				return true
			case 1:
				if (!user.hasCk && !e.isMaster) {
					e.reply('为确保数据安全，目前仅允许绑定CK用户导入/导出自己UID的面板数据，请联系Bot主人导入/导出...')
					return false
				}
				break
			case 2:
				if (!e.isMaster) {
					e.reply('为确保数据安全，目前仅允许主人导入/导出自己UID的面板数据，请联系Bot主人导入/导出...')
					return false
				}
				break
			case 3:
				e.reply('当前功能已被禁用...')
				return false
			default:
				return false
		}
		return true
	}
	async getSpecificRank(e) {
		let name = this.e.msg.replace('排名统计', '').replace('#', '').replace('星铁','').trim()
		let id = Gscfg.roleNameToID(name, true) || Gscfg.roleNameToID(name, false)
		if (!name || !id) {
			return true
		}
		let characterName = Gscfg.roleIdToName(id)
		let ret = await api.sendApi('getSpecificRank', {
			id: id,
			percent: 0
		})
		switch (ret.retcode) {
			case 100:
				return await Common.render('graph/stats', {
					rankData: ret.data.scores,
					characterName: characterName,
					total: ret.data.total,
					dmgTitle: ret.data.name
				}, { e, scale: 1.4 })
			default:
				e.reply(await this.dealError(ret.retcode))
		}
	}
	async arkGetBindUid(e) {
		let type = ''
		if (e.msg.includes('原神')) {
			type = 'gs'
			e.game = 'gs'
		} else {
			type = 'sr'
			e.game = 'sr'
		}
		let ret = await api.sendApi('getVerifyCode',
			{
				uid: await getTargetUid(e),
				type: type
			}
		)
		switch (ret.retcode) {
			case 100:
				e.reply(`验证码: ${ret.data.verifyCode}\n使用方式：\n①原神：派蒙头像——右上角编辑资料——设置签名——填入验证码，待签名审核通过后输入 #ark验证原神uid\n②星铁：手机——右上角三点——漫游签证——设置签名——填入验证码，5-10分钟后输入 #ark验证星铁uid\n验证码有效期24小时，验证通过后自动与QQ绑定，在其他Bot上无需再次绑定`)
				break
			default:
				e.reply(await this.dealError(ret.retcode))
		}
	}
	async arkBindUid(e) {
		let type = ''
		if (e.msg.includes('原神')) {
			type = 'gs'
			e.game = 'gs'
		} else {
			type = 'sr'
			e.game = 'sr'
		}
		let ret = await api.sendApi('verify',
			{
				uid: await getTargetUid(e),
				qq: e.user_id,
				type: type
			}
		)
		switch (ret.retcode) {
			case 100:
				e.reply(`验证成功`)
				break
			default:
				e.reply(await this.dealError(ret.retcode))
		}
	}
	async exportPanel(e) {
		let user = e?.runtime?.user || {}
		let type = e.msg.includes("星铁") ? 'sr' : 'gs'
		let uid = type == 'sr' ? e.user?._games?.sr?.uid : e.user?._games?.gs?.uid
		if (!uid) {
			e.reply('请先绑定uid')
		}
		let ret = ''
		let pm = Cfg.get('exportPanelRequire', 1)
		if (pm == 1) {
			ret = await api.sendApi('verifyUser', { uid: uid, qq: e.user_id, type: type })
		} 
		if ((pm <= 2 && pm >= 1 && !user.hasCk) || (pm == 1 && ret?.retcode === 200) || pm === 3) {
			if (e.group?.sendFile)
				await e.group.sendFile(`./data/PlayerData/${type}/${uid}.json`)
			else if (e.friend?.sendFile)
				await e.friend.sendFile(`./data/PlayerData/${type}/${uid}.json`)
		}
	}
	async dealError(retcode) {
		switch (retcode) {
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
			case 301:
				return '请求类型仅支持原神/星铁'
			case 302:
				return '验证失败，个人签名不匹配，请五分钟后重试'
			case 303:
				return '验证失败，请稍后再试'
			case 304:
				return '该uid未验证号主，请通过 #ark验证原神/星铁uid 验证uid'
			case 305:
				return '验证超时，请重新绑定'
			case 306:
				return '验证失败，未获取到签名，请五分钟后重试'
			case 307:
				return '服务器中无该uid数据...'
			default:
				return '未知错误'
		}
	}
	async stygian(e){
		if (!e.isGroup) {
			return true
        } else {
			let stygianVersion = getStygianVersion()
			let stygianUids = await redis.zRangeWithScores(`ark-plugin:stygianRank:${stygianVersion}:${e.group_id}`, 0, -1);
			let uids = stygianUids.map(item => item.value)
			let ranks = stygianUids.map(item => item.score)
			let ret_ark = await api.sendApi('stygianRank', {
				uid: uids,
			})
			let uidsInfo = uids.map(uid => `[uid]${uid}`).join('')
            let ret_akasha = await api.sendAkashaApi(`leaderboards/stygian?sort=stygianScore&order=-1&size=20&page=1&uids=${uidsInfo}&p=&fromId=&li=&uid=251890729&version=6_0`)
			if(ret_ark.retcode != 100){
				ret_ark = null
			}
			if(ret_akasha){
				ret_akasha = ret_akasha.data
				.filter(item => item?.playerInfo?.nickname && 
								item?.stygianIndex !== undefined && 
								item?.stygianSeconds !== undefined && 
								item?.profilePictureLink &&
								item?.uid &&
								item?.index)
				.map(item => ({
					nickname: item.playerInfo.nickname,
					stygianIndex: item.stygianIndex,
					stygianSeconds: item.stygianSeconds,
					profilePictureLink: item.profilePictureLink,
					uid: item.uid,
					index: item.index
				}))
			}
			let list = []
			for (const [index, uid] of uids.entries()) {
				const item_akasha = ret_akasha ? ret_akasha?.find(element => element.uid === uid) : {}
				const item_ark = ret_ark?.data[index]
				let final_stygianSeconds = Math.min(item_akasha?.stygianSeconds || 99999, item_ark?.time || 99999, Number(ranks[index]) % 2048)
				if (final_stygianSeconds === 99999) final_stygianSeconds = '?'
				let final_stygianIndex = Math.min(item_akasha?.stygianIndex || 99999, item_ark?.hard || 99999, 6 - Math.floor(ranks[index] / 2048 || 99999))
				if (final_stygianIndex === 99999) final_stygianIndex = '?'
				let rank_ark = item_ark?.rank || '?' 
				let rank_akasha = item_akasha?.index || '?' 
				let sum = item_ark?.sum || '?'
				let img = ''
				if (final_stygianIndex == 6 && final_stygianSeconds <= 180) {
					img = `/character/img/medal_6_plus.png`
				} else{
					img = `/character/img/medal_${final_stygianIndex}.png`
				}
				let elem = {
					uid: uids[index],
					stygianIndex: {
						title: '难度',
						info: final_stygianIndex,
						img: img
					},
					stygianTime: {
						title: '时间',
						info: `${final_stygianSeconds}秒`
					},
					rank_ark: {
						title: '全服排名(ark)',
						info: `${rank_ark} / ${sum}`
					},
					rank_akasha: {
						title: '全服排名(akasha)',
						info: `${rank_akasha}`
					},
					qqFace: item_akasha?.profilePictureLink
				}
				if (uids[index]) {
					let userInfo = await ProfileRank.getUidInfo(uids[index])
					try {
						if (userInfo?.qq && e?.group?.pickMember) {
							let member = e.group.pickMember(userInfo.qq)
							if (member?.getAvatarUrl) {
								let img = await member.getAvatarUrl()
								if (img){
									elem.qqFace = img
								} 
								try{
									let username = await member.getInfo()
									elem.sName = username.card || username.nickname
								}catch(e){
								// do nothing
								}
							}
						}
					} catch (e) {
						// logger.error(e)
					}
					try{
					   let playerData = fs.readFileSync(`./data/PlayerData/gs/${uids[index]}.json`,'utf8')
					   let jsonData = JSON.parse(playerData)
					   if(jsonData.name && !elem.sName) elem.sName = jsonData.name
					   if(!jsonData.name && !elem.sName) elem.sName = ret_akasha.username || ''
					} catch (e) {
						logger.error(e)
					}
				}
				list.push(elem)
			}
			let period = getStygianPeriod()
			stygianVersion = `${stygianVersion / 9}.${stygianVersion % 9}`
			//e.reply(message)
			const data = {
				style: `<style>body .container {width: 820px;}</style>`
			}
			return e.reply([
				await Common.render("character/stygian-rank-list", {
					list,
					data,
					period,
					stygianVersion,
					pageGotoParams: { waitUntil: "networkidle2" }
				}, { e, scale: 1.4, retType: "base64" })
			  ])
		}
	}
}
