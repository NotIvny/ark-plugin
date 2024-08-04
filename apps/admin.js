import fs from 'node:fs'
import lodash from 'lodash'
import { Cfg, Common, Data, Version} from '../components/index.js'

let keys = lodash.map(Cfg.getCfgSchemaMap(), (i) => i.key)
let sysCfgReg = new RegExp(`^#ark设置\\s*(${keys.join('|')})?\\s*(.*)$`)
const _path = process.cwd()
const resPath = `${_path}/plugins/ark-plugin/resources/`
const plusPath = `${resPath}/miao-res-plus/`
export class Admin extends plugin {
  constructor() {
    super({
      name: "ark设置",
      event: "message",
      priority: 100,
      rule: [

        {
          reg: "^#ark设置(.*)$",
          fnc: "sysCfg"
        }
      ]
    })
  }
  async checkAuth (e) {
    if (!e.isMaster) {
      return false
    }
    return true
  }
  async sysCfg(e) {
    if (!await this.checkAuth(e)) {
      return true
    }
  
    let cfgReg = sysCfgReg
    let regRet = cfgReg.exec(e.msg)
    let cfgSchemaMap = Cfg.getCfgSchemaMap()
    if (!regRet) {
      return true
    }
  
    if (regRet[1]) {
      // 设置模式
      let val = regRet[2] || ''
  
      let cfgSchema = cfgSchemaMap[regRet[1]]
      if (cfgSchema.input) {
        val = cfgSchema.input(val)
      } else if (cfgSchema.type === 'str') {
        val = (val || cfgSchema.def) + ''
      } else {
        val = cfgSchema.type === 'num' ? (val * 1 || cfgSchema.def) : !/关闭/.test(val)
      }
      Cfg.set(cfgSchema.cfgKey, val)
    }
    let schema = Cfg.getCfgSchema()
    let cfg = Cfg.getCfg()
    let imgPlus = fs.existsSync(plusPath)
  
    // 渲染图像
    return await Common.render('admin/index', {
      schema,
      cfg,
      imgPlus,
      isMiao: Version.isMiao
    }, { e, scale: 1.4 })
  }
}