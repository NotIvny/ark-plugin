import { ArkApi } from '../model/api.js'

const PERMISSION_NAMES = ['普通', '高级']

function formatUsageResult(result) {
  if (result == null) {
    return '查询失败'
  }
  if (typeof result === 'string') {
    return result
  }
  if (result.retcode !== 0 || !result.data) {
    return result.message || '查询失败'
  }

  const { auth = {}, quota = {} } = result.data
  const rank = quota.rank || {}
  const custom = quota.custom || {}
  const remaining = (item) => (item && item.remaining != null ? item.remaining : '-')

  const lines = [
    `权限类型：${PERMISSION_NAMES[auth.permission] ?? '普通'}`,
    `全部请求剩余额度：${remaining(rank.minute)}/${remaining(rank.hour)}/${remaining(rank.day)}`,
    `自定义排名请求额度倍率：${auth.limit_normal ?? 1}x`,
    `自定义排名普通请求剩余额度：${remaining(custom.normal)}`,
    `自定义排名高级请求剩余额度：${remaining(custom.advanced)}`
  ]
  return lines.join('\n')
}

export class ArkUsage extends plugin {
  constructor () {
    super({
      name: 'ark查询token用量',
      event: 'message',
      priority: 100,
      rule: [
        {
          reg: /^#arktoken用量$/i,
          fnc: 'usage'
        }
      ]
    })
  }

  async usage (e) {
    if (!e.isMaster) {
      return false
    }

    const result = await ArkApi.req('auth/usage')
    if (!result) {
      return e.reply('查询失败，服务暂不可用')
    }
    return e.reply(formatUsageResult(result))
  }
}
