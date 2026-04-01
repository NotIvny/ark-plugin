import fs from 'node:fs'
import path from 'path'
import { Version } from '../components/index.js'

const CONFIG_PATH = './plugins/ark-plugin/config/backup.json'
const DEFAULT_PATH = './plugins/ark-plugin/defset/config/backup-default.json'
const BACKUP_DIR = './plugins/ark-plugin/backup'

export class replaceFile extends plugin {
  constructor() {
    super({
      name: '替换文件',
      dsc: '替换文件',
      event: 'message',
      priority: -5,
      rule: [
        { reg: '^#ark创建备份$', fnc: 'arkCreateBackup', permission: 'master' },
        { reg: '^#ark删除备份$', fnc: 'arkRemoveBackup', permission: 'master' },
        { reg: '^#ark恢复文件(.*)$', fnc: 'arkRecoverFile', permission: 'master' },
        { reg: '^#ark替换文件(.*)$', fnc: 'arkReplaceFile', permission: 'master' },
        { reg: '^#ark备份文件(.*)$', fnc: 'arkBackupFile', permission: 'master' },
      ]
    })
  }

  /** 读取并合并备份配置 */
  readBackupData() {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
    const defaults = JSON.parse(fs.readFileSync(DEFAULT_PATH, 'utf8'))
    return { ...config, ...defaults }
  }

  /** 写入备份配置 */
  writeBackupData(data) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2))
  }

  /** redis 缓存 key */
  redisKey() {
    return `ark-plugin:addfile${this.e.user_id}`
  }

  /** 路径末尾补斜杠 */
  ensureSlash(p) {
    return p.endsWith('/') ? p : `${p}/`
  }

  /** 从消息中提取 ID */
  extractID(e, prefix) {
    return e.msg.replace(prefix, '').trim()
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
    await this.replaceFile(this.extractID(e, '#ark替换文件'))
  }

  async arkRecoverFile(e) {
    await this.backupFile(this.extractID(e, '#ark恢复文件'), true)
  }

  async arkBackupFile(e) {
    await this.backupFile(this.extractID(e, '#ark备份文件'), false)
  }

  async readID() {
    const id = this.e.msg
    const data = this.readBackupData()
    if (data[id]) {
      this.e.reply(`ID:${id}已存在`)
      this.finish('readID')
      return true
    }
    this.finish('readID')
    await redis.set(this.redisKey(), JSON.stringify({ ID: id }), { EX: 300 })
    this.e.reply('请输入src path')
    this.setContext('readSrc')
  }

  async getID() {
    const ID = this.e.msg
    const data = this.readBackupData()
    if (!data[ID]) {
      this.e.reply(`未找到ID:${ID}`)
      return true
    }
    this.finish('getID')
    fs.rmSync(`${BACKUP_DIR}/${ID}-backup/`, { recursive: true, force: true })
    delete data[ID]
    this.writeBackupData(data)
    this.e.reply(`删除ID:${ID}成功`)
  }

  async readSrc() {
    const src = this.e.msg
    const redisdata = JSON.parse(await redis.get(this.redisKey()))
    if (!redisdata) {
      this.e.reply('会话已过期，请重新使用命令 #ark替换文件')
      return this.finish('readSrc')
    }
    redisdata.src = src
    await redis.set(this.redisKey(), JSON.stringify(redisdata), { EX: 300 })
    this.e.reply('请输入dest path')
    this.finish('readSrc')
    this.setContext('readDest')
  }

  async readDest() {
    const dest = this.e.msg
    const redisdata = JSON.parse(await redis.get(this.redisKey()))
    if (!redisdata) {
      this.e.reply('会话已过期，请重新使用命令 #ark替换文件')
      return this.finish('readDest')
    }
    redisdata.dest = dest
    this.finish('readDest')

    // 递归收集源文件列表
    const srcfile = []
    const readDirectory = (directory) => {
      for (const file of fs.readdirSync(directory)) {
        const filePath = path.join(directory, file)
        const stats = fs.statSync(filePath)
        if (stats.isDirectory()) {
          readDirectory(filePath)
        } else if (stats.isFile()) {
          const rel = path.relative(redisdata.src, filePath)
          if (!rel.includes('node_modules')) {
            srcfile.push(rel.replace(/\\/g, '/'))
          }
        }
      }
    }
    readDirectory(redisdata.src)
    redisdata.srcfile = srcfile

    const data = this.readBackupData()
    const ID = redisdata.ID
    delete redisdata.ID
    data[ID] = redisdata
    this.writeBackupData(data)

    this.e.reply(`创建成功！备份了${srcfile.length}个文件\n`)
    await this.backupFile(ID, false)
  }

  async replaceFile(ID) {
    const allData = this.readBackupData()
    const resolvedID = (ID === 'miao-rank' && Version.isQsyhh) ? 'miao-rank-qsyhh' : ID
    const data = allData[resolvedID]
    if (!data) {
      this.e.reply(`未查找到ID:${resolvedID}的备份数据`)
      return true
    }
    const src = this.ensureSlash(data.src)
    const dest = this.ensureSlash(data.dest)
    for (const i of data.srcfile) {
      fs.cpSync(src + i, dest + i, { recursive: true })
    }
    this.e.reply('替换完毕，重启后生效')
  }

  async backupFile(ID, recover) {
    const allData = this.readBackupData()
    const data = allData[ID]
    if (!data) {
      this.e.reply(`未查找到ID:${ID}的备份数据`)
      return true
    }
    const dest = this.ensureSlash(data.dest)
    const backup = `${BACKUP_DIR}/${ID}-backup/`
    const [from, to] = recover ? [backup, dest] : [dest, backup]
    try {
      for (const i of data.srcfile) {
        fs.cpSync(from + i, to + i, { recursive: true })
      }
    } catch (err) {
      this.e.reply(`${recover ? '恢复' : '备份'}失败\n${err.stack}`)
    }
    this.e.reply(`${recover ? '恢复' : '备份'}完毕,重启后生效`)
  }
}
