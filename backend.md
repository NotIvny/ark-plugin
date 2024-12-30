## API后端更新日志

API基于云崽及miao-plugin实现，排名支持范围为：
- 原神：miao-plugin支持伤害计算的角色
- 星铁：1.0 - 2.4 完全支持，2.5之后的版本取决于miao-plugin本身

由于本人学业繁忙，无力配置新的伤害计算，欢迎提供可靠稳定的星铁伤害计算

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

### 2024/12/30

-同步miao-plugin@df8364c
-fix: refreshPanel错误的返回数据（虽然无关紧要）
