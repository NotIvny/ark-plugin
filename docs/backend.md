## API后端更新日志

API基于云崽及miao-plugin实现，排名支持范围为：
- 原神：miao-plugin支持伤害计算的角色
- 星铁：1.0 - 2.4 完全支持，2.5之后的版本支持绝大部分

API提供了以下接口
- getRankData
- refreshPanel
- selfAllRank
- groupAllRank
- uploadPanelData
- downloadPanelData
- getSpecificRank
- getVerifyCode
- verify
- getPanelData

目前暂不提供API文档，如需调用请自行通过插件代码了解API参数。
### 2025/5/7
- chore: 同步miao-plugin
- fix: API内部错误不返回结果
### 2025/4/20
- getSpecificRank接口支持artis字段

### 2025/4/12
- chore: 同步miao-plugin@39a2213

### 2025/4/2
- fix: 返回的排名可能比实际排名低一名

### 2025/3/4
- chore: 同步miao-plugin@4785376

### 2025/2/14
- feat: 支持获取圣遗物排名
- chore: 同步miao-plugin@74a9cfb

### 2025/1/23
- perf: API重置忘归人、星期日、灵砂的角色排名，使用喵喵默认伤害计算规则

### 2025/1/18

- feat: 支持忘归人、星期日、灵砂角色排名

### 2025/1/17

- fix: 部分情况下不返回数据
- feat: 支持大黑塔排名，其他缺省角色排名将逐渐补全
- fix: 部分情况下不返回伤害计算类型

### 2024/12/30

- chore: 同步miao-plugin@df8364c
- fix: refreshPanel错误的返回数据（虽然无关紧要）
