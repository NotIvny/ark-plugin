import fs from 'fs'
import path from 'path'
export class replaceFile extends plugin {
    constructor() {
        super({
            name: '注入排名',
            dsc: '注入排名',
            event: 'message',
            priority: -3000,
            rule: [
                {
                    reg: '^#ark创建备份$',
                    fnc: 'arkCreateFile',
                    permission: 'master',
                },
                {
                    reg: '^#ark恢复文件(.*)$',
                    fnc: 'arkRecoverFile',
                    permission: 'master',
                },
                {
                    reg: '^#ark替换文件(.*)$',
                    fnc: 'arkReplaceFile',
                    permission: 'master',
                }
            ]
        })
    }
    async arkCreateFile(e){
        this.e.reply('请输入ID')
        this.setContext('readID')
    }
    async arkReplaceFile(e){
        let ID = e.msg.replace("#ark替换文件", "").trim()
        await this.replaceFile(ID)
        e.reply('替换完毕，重启后生效')
    }
    async arkRecoverFile(e){
        let ID = e.msg.replace("#ark恢复文件", "").trim()
        await this.backupFile(ID, true)
        e.reply('恢复完毕，重启后生效')
    }
    async readID(){
        const id = this.e.msg
        let data = {
            ID: id
        }
        await redis.set(`ark-plugin:addfile${this.e.user_id}`, JSON.stringify(data), { EX: 300 })
        this.e.reply('请输入src path')
        this.finish('readID')
        this.setContext('readSrc')
    }
    async readSrc(){
        const src = this.e.msg
        let data = JSON.parse(await redis.get(`ark-plugin:addfile${this.e.user_id}`))
        data.src = src
        await redis.set(`ark-plugin:addfile${this.e.user_id}`, JSON.stringify(data), { EX: 300 })
        this.e.reply('请输入dest path')
        this.finish('readSrc')
        this.setContext('readDest')
    }
    async readDest(){
        const dest = this.e.msg
        let redisdata = JSON.parse(await redis.get(`ark-plugin:addfile${this.e.user_id}`))
        redisdata.dest = dest 
        await redis.set(`ark-plugin:addfile${this.e.user_id}`, JSON.stringify(redisdata), { EX: 300 })
        this.finish('readDest')
        let srcfile = []
        const readDirectory = (directory) => {
            const files = fs.readdirSync(directory);
            files.forEach((file) => {
                const filePath = path.join(directory, file)
                const relativePath = path.relative(redisdata.src, filePath)
                const stats = fs.statSync(filePath)
                if(stats.isFile()){
                    srcfile.push(relativePath)
                }else if(stats.isDirectory()){
                    readDirectory(filePath)
                }
            })
        }
        readDirectory(redisdata.src)
        srcfile = srcfile.map(path => path.replace(/\\/g, '/'))
        redisdata.srcfile = srcfile
        let data = JSON.parse(fs.readFileSync('./plugins/ark-plugin/config/backup.json', 'utf8'))
        logger.error(redisdata)
        data[redisdata.ID] = redisdata
        let ID = redisdata.ID
        delete data[redisdata.ID].ID
        fs.writeFileSync('./plugins/ark-plugin/config/backup.json', JSON.stringify(data, null, 2))
        this.e.reply(`创建成功！备份了${redisdata.srcfile.length}个文件\n`) 
        await this.backupFile(ID, false)
    }
    async replaceFile(ID){
        let data_ = JSON.parse(fs.readFileSync('./plugins/ark-plugin/config/backup.json', 'utf8'))
        let data = data_[ID]
        if(!data){
            this.e.reply(`未查找到ID:${ID}的备份数据`)
            return true
        }
        let src = data.src
        let dest = data.dest
        if(!src.endsWith('/')){
            src += "/"
        }
        if(!dest.endsWith('/')){
            dest += "/"
        }
        for(let i of data.srcfile){
            fs.cpSync(src + i, dest + i, { recursive: true }) 
        }
    }
    async backupFile(ID, recover){
        let data_ = JSON.parse(fs.readFileSync('./plugins/ark-plugin/config/backup.json', 'utf8'))
        let data = data_[ID]
        if(!data){
            this.e.reply(`未查找到ID:${ID}的备份数据`)
            return true
        }
        let src = data.src
        let dest = data.dest
        if(!src.endsWith('/')){
            src += "-backup/"
        }else{
            src = src.slice(0, -1) + "-backup/"
        }
        if(!dest.endsWith('/')){
            dest += "/"
        }
        logger.error(src)
        logger.error(dest)
        for(let i of data.srcfile){
            if(recover){
                fs.cpSync(src + i, dest + i, { recursive: true }) 
            }else{
                fs.cpSync(dest + i, src + i, { recursive: true }) 
            }
        }
    }
}