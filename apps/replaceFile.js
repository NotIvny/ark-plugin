import fs from 'fs'
export class replaceFile extends plugin {
    constructor() {
        super({
            name: '注入排名',
            dsc: '注入排名',
            event: 'message',
            priority: -3000,
            rule: [
                {
                    reg: '^#ark注入插件$',
                    fnc: 'replaceFile',
                    permission: 'master',
                },
                {
                    reg: '^#ark恢复插件$',
                    fnc: 'recoverFile',
                    permission: 'master',
                }
            ]
        })
    }
    async cp(src, dest){
        let msg = ''
        let count = 0
        fs.cp(src, dest, { recursive: true }, (err) => {
            if(err){
              msg += err + '\n'
              count++
            }
        })
        return [msg,count]
    }
    async rm(dest){
        fs.rm(dest, { recursive: true }, (err) => {
            if(err){}
        })
    }
    async replaceFile(e){
        let [msg,count] = []
        const cplist = [
            {src: './plugins/miao-plugin/apps/profile/ProfileDetail.js', dest: './plugins/ark-plugin/defset/miao-plugin-rank-backup/apps/profile/ProfileDetail.js'},
            {src: './plugins/miao-plugin/apps/profile/ProfileRank.js', dest: './plugins/ark-plugin/defset/miao-plugin-rank-backup/apps/profile/ProfileRank.js'},
            {src: './plugins/miao-plugin/resources/character/rank-profile-list.html', dest: './plugins/ark-plugin/defset/miao-plugin-rank-backup/resources/character/rank-profile-list.html'},
            {src: './plugins/miao-plugin/resources/character/rank-profile-list.css', dest: './plugins/ark-plugin/defset/miao-plugin-rank-backup/resources/character/rank-profile-list.css'}
        ]
        for(let item of cplist){
            let [msg_,count_] = await this.cp(item.src, item.dest)
            msg += msg_ + '\n'
            count += count_
        }
        if(count){
            e.reply(`备份文件时发生${count}个错误：\n${msg}\n操作已终止，请检查报错后重新执行`)
            return true
        }
        [msg,count] = await this.cp('./plugins/ark-plugin/defset/miao-plugin-rank/', './plugins/miao-plugin/')
        if(count){
            e.reply(`执行时发生${count}个错误：\n${msg}，请检查报错`)
        }else{
            e.reply(`执行完毕，重启后生效`)
        }     
    }
    async recoverFile(e){
        let [msg,count] = await this.cp('./plugins/ark-plugin/defset/miao-plugin-rank-backup/', './plugins/miao-plugin/')
        if(count){
            e.reply(`备份文件时发生${count}个错误：\n${msg}\n，请检查报错`)
            return true
        }
        await this.rm('./plugins/ark-plugin/defset/miao-plugin-rank-backup/')
        e.reply(`执行完毕，重启后生效`)
    }
}