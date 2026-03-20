import { exec } from 'child_process'
import util from 'util'

const execAsync = util.promisify(exec)
const _path = process.cwd() + '/plugins/ark-plugin'

export class arkUpdate extends plugin {
  constructor() {
    super({
      name: 'ark-plugin切换分支',
      dsc: '#ark切换分支',
      event: 'message',
      priority: 1000,
      rule: [
        {
          reg: '^#ark分支列表$',
          fnc: 'branchList',
          permission: 'master'
        },
        {
          reg: '^#ark切换分支\\s*(.*)$',
          fnc: 'switchBranch',
          permission: 'master'
        }
      ]
    })
  }

  async branchList(e) {
    await e.reply('正在获取远程分支列表...')
    try {
      await execAsync('git fetch', { cwd: _path })
      let { stdout: branchOut } = await execAsync('git branch -r', { cwd: _path })
      let { stdout: currentOut } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: _path }).catch(() => ({ stdout: '' }))
      
      let current = currentOut.trim()
      let branches = branchOut.split('\n')
        .map(b => b.trim())
        .filter(b => b && !b.includes('->'))
        .map(b => b.replace(/^origin\//, ''))
        
      if (branches.length === 0) {
        return await e.reply('未找到远程分支。')
      }
      
      let msg = 'ark-plugin 可用分支列表：\n' + branches.map(b => b === current ? `${b} <- 当前` : b).join('\n')
      await e.reply(msg)
    } catch (error) {
      logger.error('ark-plugin获取分支列表失败：', error)
      await e.reply(`获取分支列表失败：\n${error.message}`)
    }
    return true
  }

  async switchBranch(e) {
    let branch = e.msg.replace(/^#ark切换分支\s*/, '').trim()
    if (!branch) {
      return await e.reply('请指定要切换的分支名称，例如：#ark切换分支 master')
    }

    await e.reply(`正在尝试拉取并切换到分支：${branch}...`)

    try {
      let cmd = `git fetch && git checkout ${branch} && git pull`
      let { stdout, stderr } = await execAsync(cmd, { cwd: _path })
      
      let msg = `成功切换到分支 ${branch} 并更新。\n`
      if (stdout) msg += `${stdout.trim()}\n`
      if (stderr) msg += `${stderr.trim()}`
      
      await e.reply(msg.trim())
    } catch (error) {
      logger.error(`ark-plugin切换分支失败：`, error)
      await e.reply(`切换失败：\n${error.message}\n${error.stderr || ''}`)
    }
    return true
  }
}
