import Character from "../../miao-plugin/models/Character.js"
class safeGsCfg {
  constructor() {

  }
  roleNameToID(keyword, isSr) {
    let char = Character.get(keyword, isSr ? "sr" : "gs")
    return char?.id || false
  }
}
export default new safeGsCfg()