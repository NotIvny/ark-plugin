import { poolDetail } from '../../miao-plugin/resources/meta-gs/info/pool.js'
export function getStygianVersion() {
  const versionMap = new Map()
  poolDetail.forEach(item => {
    const [a, b] = item.version.split('.').map(Number)
    const resolveVersion = a * 9 + b
    if (!versionMap.has(resolveVersion)) {
      versionMap.set(resolveVersion, [])
    }
    versionMap.get(resolveVersion).push(item)
  })
  const maxResolveVersion = Math.max(...versionMap.keys())
  const maxVersionItems = versionMap.get(maxResolveVersion).filter(item => item.half === '上半')
  if (maxVersionItems.length === 0) {
    return -1
  }
  const targetItem = maxVersionItems[0]
  const now = new Date()
  const fromDate = new Date(targetItem.from)
  const timeDiff = now - fromDate
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24)
  //幽境危战 - 卡池上半开启 = 7.16666天
  const adjustedDays = daysDiff - 7.16666
  //除以版本周期
  const dividedValue = Math.floor(adjustedDays / 42)
  const [a, b] = targetItem.version.split('.').map(Number)
  const resolveVersion = a * 9 + b
  const finalVersion = dividedValue + resolveVersion
  return finalVersion
}

export function getStygianPeriod() {
  const version = getStygianVersion()
  const offsetDays = (version - 54) * 42
  const offsetMs = offsetDays * 24 * 60 * 60 * 1000
  const baseStart = new Date('2025-09-10T10:00:00+08:00')
  const baseEnd = new Date('2025-10-21T03:59:59+08:00')
  const start = new Date(baseStart.getTime() + offsetMs)
  const end = new Date(baseEnd.getTime() + offsetMs)
  const formatDate = (date) => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '-')
  }
  return {
    start: formatDate(start),
    end: formatDate(end),
    startTimestamp: start.getTime(),
    endTimestamp: end.getTime()
  }
}
export default { getStygianVersion, getStygianPeriod}