import fs from 'fs'
class Config{
    constructor(){
        this.init()
    }
    init(){
        if(!(fs.existsSync('./plugins/ark-plugin/config/backup.json'))){
            fs.cpSync('./plugins/ark-plugin/defset/config/backup.json', './plugins/ark-plugin/config/backup.json', { recursive: true })
        }
    }
}
export default new Config()