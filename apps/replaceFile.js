import fs from 'fs'
import path from 'path'
import { Version } from '../components/index.js'
export class replaceFile extends plugin {
	constructor() {
		super({
			name: '替换文件',
			dsc: '替换文件',
			event: 'message',
			priority: -5,
			rule: [{
					reg: '^#ark创建备份$',
					fnc: 'arkCreateBackup',
					permission: 'master',
				},
				{
					reg: '^#ark删除备份$',
					fnc: 'arkRemoveBackup',
					permission: 'master',
				},
				{
					reg: '^#ark恢复文件(.*)$',
					fnc: 'arkRecoverFile',
					permission: 'master',
				},
				{
					reg: '^#ark替换文件(.*)$',
					fnc: 'arkReplaceFile',
					permission: 'master',
				},
				{
					reg: '^#ark备份文件(.*)$',
					fnc: 'arkBackupFile',
					permission: 'master',
				}
			]
		})
	}
	async arkCreateBackup(e) {
		e.reply('请输入ID')
		this.setContext('readID')
	}
	async arkRemoveBackup(e) {
		e.reply('请输入ID')
		this.setContext('getID')
	}
	async arkReplaceFile(e) {
		let ID = e.msg.replace("#ark替换文件", "").trim()
		await this.replaceFile(ID)
	}
	async arkRecoverFile(e) {
		let ID = e.msg.replace("#ark恢复文件", "").trim()
		await this.backupFile(ID, true)
	}
	async arkBackupFile(e) {
		let ID = e.msg.replace("#ark备份文件", "").trim()
		await this.backupFile(ID, false)
	}
	async readID() {
		const id = this.e.msg
		let data___ = JSON.parse(fs.readFileSync('./plugins/ark-plugin/config/backup.json', 'utf8'))
		let data__ = JSON.parse(fs.readFileSync('./plugins/ark-plugin/defset/config/backup-default.json', 'utf8'))
		let data_ = {...data___, ...data__}
		if (data_[id]) {
			this.e.reply(`ID:${id}已存在`)
			this.finish('readID')
			return true
		}
		let data = {
			ID: id
		}
		this.finish('readID')
		await redis.set(`ark-plugin:addfile${this.e.user_id}`, JSON.stringify(data), { EX: 300 })
		this.e.reply('请输入src path')
		this.setContext('readSrc')
	}
	async getID() {
		const ID = this.e.msg
		let data___ = JSON.parse(fs.readFileSync('./plugins/ark-plugin/config/backup.json', 'utf8'))
		let data__ = JSON.parse(fs.readFileSync('./plugins/ark-plugin/defset/config/backup-default.json', 'utf8'))
		let data = {...data___, ...data__}
		if (!data[ID]) {
			this.e.reply(`未找到ID:${ID}`)
			return true
		}
		this.finish('getID')
		fs.rmdirSync(`./plugins/ark-plugin/backup/${ID}-backup/`, {
			recursive: true
		})
		delete data[ID]
		fs.writeFileSync('./plugins/ark-plugin/config/backup.json', JSON.stringify(data, null, 2))
		this.e.reply(`删除ID:${ID}成功`)
	}
	async readSrc() {
		const src = this.e.msg
		let data___ = JSON.parse(fs.readFileSync('./plugins/ark-plugin/config/backup.json', 'utf8'))
		let data__ = JSON.parse(fs.readFileSync('./plugins/ark-plugin/defset/config/backup-default.json', 'utf8'))
		let data = {...data___, ...data__}
		data.src = src
		await redis.set(`ark-plugin:addfile${this.e.user_id}`, JSON.stringify(data), { EX: 300 })
		this.e.reply('请输入dest path')
		this.finish('readSrc')
		this.setContext('readDest')
	}
	async readDest() {
		const dest = this.e.msg
		let redisdata = JSON.parse(await redis.get(`ark-plugin:addfile${this.e.user_id}`))
		redisdata.dest = dest
		await redis.set(`ark-plugin:addfile${this.e.user_id}`, JSON.stringify(redisdata), { EX: 300 })
		this.finish('readDest')
		let srcfile = []
		const readDirectory = (directory) => {
			const files = fs.readdirSync(directory);
			files.forEach((file) => {
				const filePath = path.join(directory, file)
				const relativePath = path.relative(redisdata.src, filePath)
				const stats = fs.statSync(filePath)
				if (stats.isFile() && !relativePath.includes('node_modules')) {
					srcfile.push(relativePath)
				} else if (stats.isDirectory()) {
					readDirectory(filePath)
				}
			})
		}
		readDirectory(redisdata.src)
		srcfile = srcfile.map(path => path.replace(/\\/g, '/'))
		redisdata.srcfile = srcfile
		let data___ = JSON.parse(fs.readFileSync('./plugins/ark-plugin/config/backup.json', 'utf8'))
		let data__ = JSON.parse(fs.readFileSync('./plugins/ark-plugin/defset/config/backup-default.json', 'utf8'))
		let data = {...data___, ...data__}
		data[redisdata.ID] = redisdata
		let ID = redisdata.ID
		delete data[redisdata.ID].ID
		fs.writeFileSync('./plugins/ark-plugin/config/backup.json', JSON.stringify(data, null, 2))
		this.e.reply(`创建成功！备份了${redisdata.srcfile.length}个文件\n`)
		await this.backupFile(ID, false)
	}
	async replaceFile(ID) {
		let data___ = JSON.parse(fs.readFileSync('./plugins/ark-plugin/config/backup.json', 'utf8'))
		let data__ = JSON.parse(fs.readFileSync('./plugins/ark-plugin/defset/config/backup-default.json', 'utf8'))
		let data_ = { ...data___, ...data__ }
		if (ID === 'miao-rank' && Version.isQsyhh) {
			ID += '-qsyhh'
		}
		let data = data_[ID]
		if (!data) {
			this.e.reply(`未查找到ID:${ID}的备份数据`)
			return true
		}
		let src = data.src
		let dest = data.dest
		src = await this.addSlash(src)
		dest = await this.addSlash(dest)
		for (let i of data.srcfile) {
			fs.cpSync(src + i, dest + i, {
				recursive: true
			})
		}
		this.e.reply('替换完毕，重启后生效')
	}
	async backupFile(ID, recover) {
		let data___ = JSON.parse(fs.readFileSync('./plugins/ark-plugin/config/backup.json', 'utf8'))
		let data__ = JSON.parse(fs.readFileSync('./plugins/ark-plugin/defset/config/backup-default.json', 'utf8'))
		let data_ = {...data___, ...data__}
		let data = data_[ID]
		if (!data) {
			this.e.reply(`未查找到ID:${ID}的备份数据`)
			return true
		}
		let dest = data.dest
		let backup = `./plugins/ark-plugin/backup/${ID}-backup/`
		dest = await this.addSlash(dest)
		try {
			for (let i of data.srcfile) {
				if (recover) {
					fs.cpSync(backup + i, dest + i, { recursive: true })
				} else {
					fs.cpSync(dest + i, backup + i, { recursive: true })
				}
			}
		} catch (err) {
			this.e.reply(`${recover ? '恢复' : '备份'}失败\n${err.stack}`)
		}
		
		if (recover) {
			this.e.reply('恢复完毕,重启后生效')
		} else {
			this.e.reply('备份完毕,重启后生效')
		}

	}
	async addSlash(path_) {
		if (!path_.endsWith('/')) {
			path_ += '/'
		}
		return path_
	}
}