import fetch from 'node-fetch'
import { Version } from '../components/index.js'
const version = Version.version

export const AkashaApi = {
  async req(url) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    try {
      const response = await fetch(`https://akasha.cv/${url}`, {
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
    try {
      data = {
        data: data,
        version: version
      }
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000)
      const response = await fetch(`https://beta.ivny.top/${route}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        signal: controller.signal
      })
      clearTimeout(timeout)
      if (!response.ok) {
        return false
      }
      return await response.json()
    } catch (err) {
      return false
    }
  },
}
export default { AkashaApi, ArkApi }