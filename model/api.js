import fetch from 'node-fetch'
import { Version } from '../components/index.js'
const version = Version.version
export const AkashaApi = {
  async req(url) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    try {
      const response = await fetch(`https://akasha.cv/api/${url}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'ark-plugin'
        },
        signal: controller.signal
      })
      clearTimeout(timeout)
      if (!response.ok) {
        return false
      }
      const ret = await response.json()
      return ret
    } catch (err) {
      return false
    }
  }
}

export const ArkApi = {
  async req(route, data = {}) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)
    try {
      if (typeof data !== 'object') data = {}
      data = {
        ...data,
        version: version
      }
      const headers = {
        'Content-Type': 'application/json'
      }
      const token = await redis.get('ark-plugin:customRank:token')
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
      const response = await fetch(`https://beta.ivny.top/${route}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        signal: controller.signal
      })
      if (!response.ok) {
        return false
      }
      return await response.json()
    } catch (err) {
      return false
    } finally {
      clearTimeout(timeout)
    }
  },
}
export default { AkashaApi, ArkApi }
