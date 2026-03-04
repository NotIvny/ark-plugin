import { Version, Cfg } from '../../components/index.js'
import { execSync } from 'node:child_process'

// 获取 ark-plugin 的 git commit 信息
let gitInfo = ''
try {
  const pluginDir = `${process.cwd()}/plugins/ark-plugin`
  const hash = execSync('git rev-parse --short HEAD', { cwd: pluginDir, encoding: 'utf8' }).trim()
  const date = execSync('git log -1 --format=%cd --date=format:%Y%m%d', { cwd: pluginDir, encoding: 'utf8' }).trim()
  gitInfo = `（${hash}-${date}）`
} catch (e) {
  // git 不可用时忽略
}

const Render = {
  async render (path, params, cfg) {
    let { e } = cfg
    if (!e.runtime) {
      console.log('未找到e.runtime，请升级至最新版Yunzai')
    }
    return e.runtime.render(cfg.plugin || 'ark-plugin', path, params, {
      retType: cfg.retType || (cfg.retMsgId ? 'msgId' : 'default'),
      beforeRender ({ data }) {
        let pluginName = ''
        if (data.pluginName !== false) {
          pluginName = ` & ${data.pluginName || 'Ark-Plugin'}`
          if (data.pluginVersion !== false) {
            pluginName += `<span class="version">${data.pluginVersion || Version.version}`
          }
        }
        let resPath = data.pluResPath
        const layoutPath = `${process.cwd()}/plugins/ark-plugin/resources/common/layout/`
        return {
          _miao_path: resPath,
          ...data,
          _res_path: resPath,
          _layout_path: layoutPath,
          _tpl_path: `${process.cwd()}/plugins/ark-plugin/resources/common/tpl/`,
          defaultLayout: `${layoutPath}default.html`,
          elemLayout: `${layoutPath}elem.html`,
          sys: {
            scale: Cfg.scale(cfg.scale || 1)
          },
          copyright: `Created By ${Version.name}<span class="version">${Version.yunzai}</span>${pluginName}${gitInfo}</span>`,
          pageGotoParams: {
            waitUntil: 'networkidle2'
          }
        }
      }
    })
  }
}

export default Render
