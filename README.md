<div align="center">

# Ark-Plugin

<p align="center">
  <a href="https://github.com/NotIvny/ark-plugin">
    <img src="https://img.shields.io/badge/Yunzai-Plugin-red?style=flat-square" alt="Yunzai Plugin">
  </a>
  <a href="https://github.com/NotIvny/ark-plugin/tree/main">
    <img src="https://img.shields.io/badge/branch-main-blue?style=flat-square" alt="Branch">
  </a>
  <a href="https://github.com/NotIvny/ark-plugin/stargazers">
    <img src="https://img.shields.io/github/stars/NotIvny/ark-plugin?style=flat-square" alt="Stars">
  </a>
</p>

**适用于 Yunzai-Bot 的全服排行插件**

提供角色全服排行、多文件备份、面板功能拓展、圣遗物OCR等丰富功能。

[安装教程](#-安装) • [功能列表](#-功能列表) • [功能预览](#-功能预览) • [致谢](#-致谢)

</div>

---

## 📦 安装

推荐使用 `git` 进行安装。

**Github 源**
```bash
git clone https://github.com/NotIvny/ark-plugin.git ./plugins/ark-plugin
```

**Gitee 源 (网络不佳推荐)**
```bash
git clone https://gitee.com/Ivny/ark-plugin.git ./plugins/ark-plugin
```

## 🛠️ 配置与替换

主要功能需要替换 `miao-plugin` 的文件才能生效。

| 功能名 | 是否需要替换文件 | 替换命令 | 说明 |
| :--- | :---: | :--- | :--- |
| **角色排名拓展** | ✅ | `#ark替换文件miao-rank` | 实现排名、伤害变化、OCR等功能 |
| **喵喵帮助拓展** | ✅ | `#ark替换文件miao-help` | 不支持qsyhh/miao-plugin |
| **幽境危战排名** | ❌ | / |  |
| **喵喵设置扩展** | ❌ | / | 不支持qsyhh/miao-plugin |
| **插件优先级设置** | ❌ | / |  |
| **文件备份** | ❌ | / |  |

> [!TIP]
> 安装后输入 `#ark替换文件miao-rank`，**重启机器人**后即可使用全部功能。`#ark替换文件miao-help` **按需开启**。
> 
> 如需备份原文件，请在替换前输入 `#ark备份文件miao-rank` 或 `#ark备份文件miao-help`。

## ✨ 功能列表

详细的功能说明文档：

- 📖 [**喵喵帮助扩展**](docs/extendMiaoHelp.md)
- 📊 [**角色排名扩展**](docs/extendMiaoRank.md)
- ⚙️ [**喵喵设置扩展**](docs/extendMiaoSettings.md)
- 🖼️ [**面板功能拓展**](docs/extendMiaoPanel.md)
- 💾 [**文件备份**](docs/backupFile.md)
- ⚡ [**功能优先级**](docs/priority.md)

## 📸 功能预览

<details>
<summary><strong>📱 帮助菜单与设置 (点击展开)</strong></summary>

| 帮助菜单 | 插件设置 |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/446622ae-5664-4892-8d64-52355bbe12d8" width="300" alt="帮助图"> | <img src="https://github.com/user-attachments/assets/a285e42a-7c21-456d-8214-184247be4f0b" width="300" alt="设置"> |

</details>

<details>
<summary><strong>📊 面板集成与数据统计 (点击展开)</strong></summary>

| 嵌入面板效果 | 嵌入排名效果 | 排名统计 |
| :---: | :---: | :---: |
| <img src="https://github.com/NotIvny/yunzai-characterRank-js/assets/125482125/68b37c47-4642-4e86-a9c0-fb55498646c7" alt="嵌入面板中效果"> | <img src="https://github.com/NotIvny/yunzai-characterRank-js/assets/125482125/625de99f-8bf0-47b3-be2a-cc177650731b" alt="嵌入排名效果"> | <img src="https://github.com/user-attachments/assets/e40c2214-b17e-406c-bbc2-0c62c62cfbe8" alt="排名统计"> |

</details>

## ⚠️ 免责声明

1. 总排名数据源于用户更新面板，目前数据量在 320k 左右。
2. 插件只会上传用户 UID 和面板数据，OCR 上传的图片仅用于测试集和识别，不会上传其他个人信息。
3. 本插件仅限内部交流与小范围使用，**严禁**用于任何以盈利为目的的场景。
4. 图片与其他素材均来自于网络，如有侵权请联系删除。

## 🤝 致谢

感谢以下项目和开发者的贡献：

| 项目 / 开发者 | 贡献 |
| :--- | :--- |
| [**miao-plugin**](https://gitee.com/yoimiya-kokomi/miao-plugin) | 喵喵插件 |
| [**liangshi-calc**](https://gitee.com/liangshi233/liangshi-calc/) | 梁氏伤害计算 |
| [**Miao-Yunzai**](https://gitee.com/yoimiya-kokomi/Miao-Yunzai) | Miao-Yunzai |
| [**TRSS-Yunzai**](https://gitee.com/TimeRainStarSky/Yunzai) | TRSS-Yunzai |
| [**miao-plugin 测试角色面板**](https://gitee.com/euiko/Panel) | 提供部分伤害计算数据 |
| [**qsyhh/miao-plugin**](https://gitee.com/qsyhh/miao-plugin) | 提供伤害计算数据 |

## Star History

[![Star History Chart](https://api.star-history.com/image?repos=NotIvny/ark-plugin&type=date&legend=top-left)](https://www.star-history.com/?repos=NotIvny%2Fark-plugin&type=date&legend=top-left)
