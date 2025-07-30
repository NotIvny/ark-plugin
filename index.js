import fs from 'node:fs'
import { Version } from './components/index.js'
import path from 'path'
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
try {
  if (Version.isQsyhh) {
    ArkInit = (await import('./model/init-qsyhh.js')).default
    let ArkCfg = (await import('./components/Cfg.js')).default
    if (ArkCfg.get('lnFiles', false)) {
      let oriList = [
        "./plugins/miao-plugin/resources/character/profile-detail-ark.html",
        "./plugins/miao-plugin/resources/character/rank-profile-list-ark.css",
        "./plugins/miao-plugin/resources/character/rank-profile-list-ark.html",
      ]
      let destList = [
        '../../../ark-plugin/backup/miao-plugin-rank-qsyhh/resources/character/profile-detail.html',
        '../../../ark-plugin/backup/miao-plugin-rank-qsyhh/resources/character/rank-profile-list.css',
        '../../../ark-plugin/backup/miao-plugin-rank-qsyhh/resources/character/rank-profile-list.html'
      ]
      oriList.forEach((originPath, index) => {
        const destPath = destList[index]
        try {
          fs.lstatSync(originPath)
        } catch (err) {
          try {
            fs.symlinkSync(destPath, originPath, 'file')
            logger.info(`成功创建软链接: ${originPath} -> ${destPath}`)
          } catch (err) {
            logger.error(`软链接文件时出现问题` + err)
          }
        }
      })
    }
  } else {
    ArkInit = (await import('./model/init.js')).default
    let ArkCfg = (await import('./components/Cfg.js')).default
    if (ArkCfg.get('lnFiles', false)) {
      let oriList = [
        "./plugins/miao-plugin/resources/character/profile-detail-ark.html",
        "./plugins/miao-plugin/resources/character/rank-profile-list-ark.html",
      ]
      let destList = [
        '../../../ark-plugin/backup/miao-plugin-rank/resources/character/profile-detail.html',
        '../../../ark-plugin/backup/miao-plugin-rank/resources/character/rank-profile-list.html'
      ]
      oriList.forEach((originPath, index) => {
        const destPath = destList[index]
        try {
          fs.lstatSync(originPath)
        } catch (err) {
          try {
            fs.symlinkSync(destPath, originPath, 'file')
            logger.info(`成功创建软链接: ${originPath} -> ${destPath}`)
          } catch (err) {
            logger.error(`软链接文件时出现问题` + err)
          }
        }
      })
    }
  }
} catch (err) {
  logger.error('ProfileRank.js未被替换，请输入 #ark替换文件miao-rank 后重启，以使用完整功能！')
}
if(ArkInit != undefined){
  ArkInit.init()
}

logger.info(logger.green("ark-plugin加载完毕"))
export { apps }