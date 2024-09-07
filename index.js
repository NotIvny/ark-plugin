import fs from 'node:fs'
import { Data, Version, Cfg } from './components/index.js'

if (!global.segment) {
  global.segment = (await import("oicq")).segment
}
const files = fs.readdirSync('./plugins/ark-plugin/apps').filter(file => file.endsWith('.js'))
let ret = []
logger.info(logger.green(`正在加载ark-plugin`))
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

if(!(fs.existsSync('./plugins/ark-plugin/config/backup.json'))){
  fs.cpSync('./plugins/ark-plugin/defset/config/backup.json', './plugins/ark-plugin/config/backup.json', { recursive: true })
}
let ArkInit
try{
  ArkInit = (await import("./model/init.js")).default
}catch(err){
  logger.error('ProfileRank.js未被替换，请输入 #ark替换文件miao-rank 后重启，以使用完整功能！')
}
if(ArkInit != undefined){
  ArkInit.init()
}

logger.info(logger.green("ark-plugin加载完毕"))
export { apps }