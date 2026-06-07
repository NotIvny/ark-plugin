export class ArkToken extends plugin {
  constructor () {
    super({
      name: 'ark配置token',
      event: 'message',
      priority: 100,
      rule: [
        {
          reg: /^#ark配置token\s*([\s\S]+)$/i,
          fnc: 'setToken'
        }
      ]
    })
  }

  async setToken (e) {
    if (!e.isMaster) {
      return false
    }

    const token = e.msg.replace(/^#ark配置token/i, '').trim()
    if (!token) {
      return e.reply('请输入 token，如：#ark配置tokenxxxxxx')
    }

    await redis.set('ark-plugin:customRank:token', token)
    const masked = token.length > 8 ? `${token.slice(0, 4)}****${token.slice(-4)}` : token
    return e.reply(`ark自定义排名token已保存：${masked}`)
  }
}
