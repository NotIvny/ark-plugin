
## 嵌入面板伤害中：

ProfileDetail.js修改
```
//导入gsCfg和api
import Gscfg from '../../../genshin/model/gsCfg.js'
import api from '../../../example/api.js'
//let renderData = ...前一行插入
let characterID = Gscfg.roleNameToID(char.name,true) || Gscfg.roleNameToID(char.name,false)
let characterRank
let ret = await api.sendApi('getRankData',{id: characterID, uid: uid, update: 0})
switch(ret.retcode){
  case 100:
    characterRank = ret.rank
    dmgCalc.dmgData[dmgCalc.dmgData.length] = {
      title: '全服伤害排名',
      unit: characterRank,
    }
    break
}
```


## 嵌入排名中：

ProfileRank.js
```
//导入api
import api from '../../../example/api.js'
//const rankCfg = await ProfileRank.getGroupCfg(groupId)下方插入
let uids_ = []
list.forEach(item => {
  uids_.push(item.uid)
})
let ret = await api.sendApi('groupAllRank',{id: list[0].id, uids: uids_, update: 0})
let count = 0
switch(ret.retcode){
  case 100:
    ret.rank.forEach(item => {
      list[count].dmg.totalrank = item.rank || '暂无数据'
      count++;
    })
}
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
<!--第163行下方插入-->
<div class="char-dmg line">
      {{if ds.dmg}}
      <div class="dmg-title">全服排名</div>
      <div class="dmg-value">{{ds.dmg?.totalrank}}</div>
      {{else}}
      {{/if}}
    </div>
```
rank-profile-list.css(可选)
```
.char-dmg {
  width: 135px;
}
```

