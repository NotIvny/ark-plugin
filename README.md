# ark-plugin

适用于Yunzai-Bot的全服排行插件，提供角色全服排行，多文件备份等功能

### 插件安装
```
git clone https://github.com/NotIvny/ark-plugin.git ./plugins/ark-plugin
```
如果网络不好，也可从gitee克隆
```
git clone https://gitee.com/Ivny/ark-plugin.git ./plugins/ark-plugin
```

|                           功能名                            | 是否需要替换文件     | 替换文件命令     |
|:-------------------------------------------------------------:|------------------|------------------|
| 角色排名拓展 | 需要 | #ark替换文件miao-rank |
| 喵喵帮助拓展 | 需要 | #ark替换文件miao-help |
| 幽境危战排名 | 不需要 | / |
| 喵喵设置扩展 | 不需要 | / |
| 插件优先级设置 | 不需要 | / |
| 文件备份 | 不需要 | / |

安装后输入 #ark替换文件miao-rank、#ark替换文件miao-help ,重启后即可使用全部功能

如需备份文件，可在替换前输入#ark备份文件miao-rank / #ark备份文件miao-help
---

### 功能预览

| 帮助图 | 设置 | 嵌入面板中效果 | 嵌入排名效果 | 排名统计 |
|:------:|:----:|:------------:|:------------:|:-------:|
| ![1723804352101 0815fa5c](https://github.com/user-attachments/assets/446622ae-5664-4892-8d64-52355bbe12d8) | ![1723804349434 4fe96648](https://github.com/user-attachments/assets/a285e42a-7c21-456d-8214-184247be4f0b) | ![8a6b16deee772c4d66d0fdae278335b6](https://github.com/NotIvny/yunzai-characterRank-js/assets/125482125/68b37c47-4642-4e86-a9c0-fb55498646c7) | ![5dda9bdbcfe9d6926a3e38aa1bcb0a87](https://github.com/NotIvny/yunzai-characterRank-js/assets/125482125/625de99f-8bf0-47b3-be2a-cc177650731b) | ![1723635427211 28e6e652](https://github.com/user-attachments/assets/e40c2214-b17e-406c-bbc2-0c62c62cfbe8) |

---
### 功能列表
[喵喵帮助扩展](https://github.com/NotIvny/ark-plugin/blob/main/docs/extendMiaoHelp.md)

[角色排名扩展](https://github.com/NotIvny/ark-plugin/blob/main/docs/extendMiaoRank.md)

[喵喵设置扩展](https://github.com/NotIvny/ark-plugin/blob/main/docs/extendMiaoSettings.md)

[面板功能拓展](https://github.com/NotIvny/ark-plugin/blob/main/docs/extendMiaoPanel.md)

[文件备份](https://github.com/NotIvny/ark-plugin/blob/main/docs/backupFile.md)

[功能优先级](https://github.com/NotIvny/ark-plugin/blob/main/docs/priority.md)


### 其他

总排名数据源于用户更新面板，目前数据量在300k左右

插件只会上传用户uid和面板数据，OCR上传的图片将用于测试集，不会上传其他信息

功能仅限内部交流与小范围使用，请勿将本插件用于以盈利为目的的场景

图片与其他素材均来自于网络，如有侵权请联系我删除

### 致谢

|                           Nickname                            | Contribution     |
|:-------------------------------------------------------------:|------------------|
|      [miao-plugin](https://gitee.com/yoimiya-kokomi/miao-plugin)      | 喵喵插件 |
| [liangshi-calc](https://gitee.com/liangshi233/liangshi-calc/) | 梁氏伤害计算       |
|      [Miao-Yunzai](https://gitee.com/yoimiya-kokomi/Miao-Yunzai)      | 喵喵的 Miao-Yunzai          |
|     [TRSS-Yunzai](https://gitee.com/TimeRainStarSky/Yunzai)     | 时雨🌌星空的 TRSS-Yunzai        |
| [miao-plugin 测试角色面板](https://gitee.com/euiko/Panel) | 提供部分伤害计算数据             |
|      [qsyhh/miao-plugin](https://gitee.com/qsyhh/miao-plugin)      | 提供伤害计算数据 |

