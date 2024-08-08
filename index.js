import fs from 'node:fs'
import ArkInit from './model/init.js'
if (!global.segment) {
  global.segment = (await import("oicq")).segment
}
const files = fs.readdirSync('./plugins/ark-plugin/apps').filter(file => file.endsWith('.js'))
let ret = []
logger.info(logger.green("正在加载ark-plugin"))
files.forEach((file) => {
  ret.push(import(`./apps/${file}`))
})
ret = await Promise.allSettled(ret)
let apps = {}
for (let i in files) {
  let name = files[i].replace('.js', '')
  if (ret[i].status != 'fulfilled') {
    logger.error(`载入插件错误：${logger.red(name)}`)
    logger.error(ret[i].reason)
    continue
  }
  apps[name] = ret[i].value[Object.keys(ret[i].value)[0]]
}
ArkInit.init()
logger.info(logger.green("ark-plugin加载完毕"))
export { apps }