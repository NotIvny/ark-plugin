
## 嵌入面板伤害中：

ProfileDetail.js修改
```
//导入gsCfg
let characterID = Gscfg.roleNameToID(char.name,true) || Gscfg.roleNameToID(char.name,false)
import Gscfg from '../../../genshin/model/gsCfg.js'
//let renderData = ...前一行插入
let characterRank
const url = `http://8.147.110.49:3000/getRankData?id=${characterID}&uid=${uid}&version=0.1.0`
try{
  const response = await fetch(url)
  const ret = await response.json()
  switch(ret.retcode){
      case 100:
        characterRank = ret.rank
        break
  }
}
catch(error){}
if(characterRank){
  dmgCalc.dmgData[dmgCalc.dmgData.length] = {
    title: '全服伤害排名',
    unit: characterRank,
  }
}
```


## 嵌入排名中：

ProfileRank.js
```
//第286行上方插入
list.forEach(item => {
    const url = `http://8.147.110.49:3000/getRankData?id=${item.id}&uid=${item.uid}&update=false&version=0.1.0`
    try{
      const response = fetch(url)
      const ret = response.json()
      switch(ret.retcode){
          case 100:
            characterRank = ret.rank
            break
      }
      item.dmg.totalrank = characterRank || ''
    }
    catch(error){}
})
```
rank-profile-list.html
```
<!--替换第6~16行-->
<style>
body .container {
  width: 1040px;
}
</style>
{{else}}
<style>
body .container {
  width: 1000px;
}
</style>
```
rank-profile-list.css(可选)
```
.char-dmg {
  width: 135px;
}
```

