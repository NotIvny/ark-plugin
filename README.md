# yunzai-characterRank-js

适用于Yunzai-Bot的全服角色排行插件

## 插件安装

下载js后放到./plugin/example下

## 使用方法

使用 #xx排名 命令时，自动更新并获取角色排名

也可使用 #角色排名雷神uid 手动获取

示例：

#角色排名雷神\*\*\*\*\*\*\*\*\*

> uid:\*\*\*\*\*\*\*\*\*的雷电将军全服伤害排名为 459 / 718，伤害评分: \*\*.\*\*

#雷神排名

> uid:\*\*\*\*\*\*\*\*\*的雷电将军全服伤害排名为 459 / 718，伤害评分: \*\*.\*\*

*总排名

> uid:*********的星铁全服排名数据:<br>
瓦尔特全服伤害排名为37 / 110，伤害评分: 24.82<br>
希儿全服伤害排名为159 / 488，伤害评分: 56.94<br>
景元全服伤害排名为215 / 265，伤害评分: 22.14<br>
刃全服伤害排名为105 / 324，伤害评分: 39.65<br>
符玄全服伤害排名为251 / 468，伤害评分: 14.95<br>
藿藿全服伤害排名为205 / 302，伤害评分: 58.43<br>
阮•梅全服伤害排名为608 / 624，伤害评分: 8.24<br>
真理医生全服伤害排名为65 / 359，伤害评分: 36.78<br>
花火全服伤害排名为455 / 538，伤害评分: 37.91<br>


## 常见问题

获取排名提示 
> "未查询到uid:${uid}的数据，请稍后再试..." 或 没有回复

请确保角色放置在展柜中

## 其他

嵌入面板伤害中：

ProfileDetail.js修改
```
//导入gsCfg
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
效果：
![8a6b16deee772c4d66d0fdae278335b6](https://github.com/NotIvny/yunzai-characterRank-js/assets/125482125/68b37c47-4642-4e86-a9c0-fb55498646c7)


全服排名数据源于用户更新面板，目前数据量在3000左右

当前插件正在快速迭代，由于js插件无法自动更新，请您及时手动更新

插件只会上传用户uid，不会上传其他信息

角色排名图、圣遗物排名、分段数据未来将更新

