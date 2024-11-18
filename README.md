# ark-plugin

适用于Yunzai-Bot的全服排行插件，提供角色全服排行，多文件备份等功能
### 插件安装
```
git clone https://github.com/NotIvny/ark-plugin.git ./plugins/ark-plugin
```
安装后输入 #ark替换文件miao-rank ,重启后即可使用全部功能

---

### 功能预览
<details>

<summary>展开查看</summary>

帮助图
![1723804352101 0815fa5c](https://github.com/user-attachments/assets/446622ae-5664-4892-8d64-52355bbe12d8)

设置
![1723804349434 4fe96648](https://github.com/user-attachments/assets/a285e42a-7c21-456d-8214-184247be4f0b)

嵌入面板中效果：

![8a6b16deee772c4d66d0fdae278335b6](https://github.com/NotIvny/yunzai-characterRank-js/assets/125482125/68b37c47-4642-4e86-a9c0-fb55498646c7)
嵌入排名效果：

![5dda9bdbcfe9d6926a3e38aa1bcb0a87](https://github.com/NotIvny/yunzai-characterRank-js/assets/125482125/625de99f-8bf0-47b3-be2a-cc177650731b)

排名统计：
![1723635427211 28e6e652](https://github.com/user-attachments/assets/e40c2214-b17e-406c-bbc2-0c62c62cfbe8)

</details> 

---
### 功能列表
<details>

<summary>展开查看</summary>
#### 群独立喵喵插件配置文件

为每个群提供独立的喵喵插件配置文件，通过 #ark设置喵喵群设置开启 启用

目前正在完善功能中，可能存在Bug
#### #xx排名 

最右侧新增角色全服排名
#### #xx面板 

伤害计算底部新增角色全服排名

#### #xx排名统计 

查看雷神排名统计图

#### #角色排名雷神uid 

手动获取角色排名

以上功能支持原神/星铁

使用 `#xx排名` 命令时，自动更新并获取角色排名

也可使用 `#角色排名雷神uid` 手动获取

示例：

`#角色排名雷神*********`

> uid:\*\*\*\*\*\*\*\*\*的雷电将军全服伤害排名为 459 / 718，伤害评分: \*\*.\*\*

`#雷神排名`

> uid:\*\*\*\*\*\*\*\*\*的雷电将军全服伤害排名为 459 / 718，伤害评分: \*\*.\*\*

`*总排名`

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

#### 文件替换与备份功能

`#ark创建备份`

创建备份时，需提供ID和以下两个文件夹路径：

src path: 替换用的文件所在的文件夹。

dest path: 被替换的文件所在的文件夹，即需要备份的文件所在的文件夹。

以上路径均为基于云崽根目录的绝对路径

创建备份后，插件会自动获取src path下的所有文件名，并储存在backup.json中，以后仅这些文件会被替换，备份文件将储存于backup文件夹中(以下称 dest-backup-path )。

注意: 与常规备份插件不同，本插件额外提供了一个"替换文件"的功能(src path => dest path)，以安全地修改插件代码，关系图如下所示。

src path => dest path <=> dest-backup path

如无需使用替换文件功能，请将 src path 和 dest path 都指定为需要备份的文件所在的文件夹

`#ark删除备份`

删除备份数据，src path 与 dest-backup path 都会被删除

`#ark替换文件`

将 src path 中的文件复制到 dest path 中。

`#ark备份文件`

使用 dest path 中的文件复制到 dest-backup path 中。

`#ark恢复文件`

使用 dest-backup path 中的文件复制到 dest path 中。
</details> 

---
### 其他

总排名数据源于用户更新面板，目前数据量在80k左右

原神伤害计算目前仍然基于敌人等级91，不久后将调整

插件只会上传用户uid和面板数据，不会上传其他信息

功能仅限内部交流与小范围使用，请勿将本插件用于以盈利为目的的场景

图片与其他素材均来自于网络，如有侵权请联系我删除

### 致谢

|                           Nickname                            | Contribution     |
|:-------------------------------------------------------------:|------------------|
|      [miao-plugin](miao-plugin)      | 喵喵插件 |
| [liangshi-calc](https://gitee.com/liangshi233/liangshi-calc/) | 梁氏伤害计算       |
|      [Miao-Yunzai](https://gitee.com/yoimiya-kokomi/Miao-Yunzai)      | 喵喵的 Miao-Yunzai          |
|     [TRSS-Yunzai](https://gitee.com/TimeRainStarSky/Yunzai)     | 时雨🌌星空的 TRSS-Yunzai        |
| [miao-plugin 测试角色面板](https://gitee.com/euiko/Panel) | 提供部分伤害计算数据             |

