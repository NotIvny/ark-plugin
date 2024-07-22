import fs from 'fs'
import yaml from 'yaml'
class Config{
    constructor(){
        this.init()
    }
    init(){
        if(!(fs.existsSync('./plugins/ark-plugin/config'))){
            fs.cpSync('./plugins/ark-plugin/defset/config', './plugins/ark-plugin/config', { recursive: true })
        }
    }
    get(name,arg){
        let data = this.getConfig(name) 
        if(data != null && data[arg]){
            return data[arg]
        }else{
            data = this.getDefaultConfig(name)
            return data[arg]
        }
    }
    set(name,arg,value){
        let file = `./plugins/ark-plugin/config/${name}.yaml`
        let data = yaml.parse(fs.readFileSync(file, "utf8"))
        data[arg] = value
        fs.writeFileSync(file,yaml.stringify(data), "utf8")
    }
    getConfig(name){
        let file = `./plugins/ark-plugin/config/${name}.yaml`
        let data = yaml.parse(fs.readFileSync(file, "utf8"))
        return data
    }
    getDefaultConfig(name){
        let file = `./plugins/ark-plugin/defset/config/${name}.yaml`
        let data = yaml.parse(fs.readFileSync(file, "utf8"))
        return data
    }
}
export default new Config()