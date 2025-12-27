import Character from "../../miao-plugin/models/Character.js"
class safeGsCfg {
  constructor() {

  }
  roleNameToID(keyword, isSr) {
    let char = Character.get(keyword, isSr ? "sr" : "gs")
    return char?.id || false
  }
  roleIdToName(id) {
    let char = Character.get(id)
    return char?.name || ''
  }
}
export default new safeGsCfg()