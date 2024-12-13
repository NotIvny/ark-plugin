export const cfgSchema = {
  apps: {
    title: '喵喵排名扩展',
    cfg: {
      panelRank: {
        title: '面板排名',
        key: '面板排名',
        def: true,
        desc: '启用后会在面板伤害计算中显示总排名'
      },
      groupRank: {
        title: '群排名',
        key: '群排名',
        def: true,
        desc: '启用后会在群排行中显示总排名'
      },
      RankType: {
        title: '排名展示类型',
        key: '排名类型',
        type: 'num',
        def: 0,
        input: (n) => /[0-2]{1}/.test(n) ? (n * 1) : 0,
        desc: '排名展示类型：0-位次排名，1-百分比排名, 2-混合排名'
      },
      localPanelRank: {
        title: '本地数据面板排名',
        key: '本地面板排名',
        def: true,
        desc: '启用后将允许使用本地数据计算面板排名'
      },
      localGroupRank: {
        title: '本地数据群排名',
        key: '本地群排名',
        def: true,
        desc: '启用后将允许使用本地数据计算群排名'
      },
      exportPanelData: {
        title: '导出面板数据',
        key: '导出面板数据',
        type: 'num',
        def: 1,
        input: (n) => /[0-3]{1}/.test(n) ? (n * 1) : 0,
        desc: '允许导出面板数据：0-任何人，1-有ck或主人，2-仅主人，3-禁用'
      },
      importPanelData: {
        title: '导入面板数据',
        key: '导入面板数据',
        type: 'num',
        def: 2,
        input: (n) => /[0-3]{1}/.test(n) ? (n * 1) : 0,
        desc: '允许导入面板数据：0-任何人，1-有ck或主人，2-仅主人，3-禁用'
      },
      markRankType: {
        title: '注明本地数据',
        key: '注明本地数据',
        def: false,
        desc: '注明本地数据，如总排名(本地)、总排名(面板替换)'
      },
      newUserPanel: { 
        title: '首次更新自动获取面板',
        key: '自动获取面板',
        def: false,
        desc: '测试配置，首次更新面板时，自动从API获取面板数据（需验证uid）'
      }
    }
  },
  miaoGroupCfg: {
    title: '喵喵设置扩展',
    cfg: {
      miaoGroupCfg: {
        title: '喵喵群设置',
        key: '喵喵群设置',
        def: false,
        desc: '是否为喵喵插件提供各群独立配置文件'
      }
    }
  },
  miaoHelp: {
    title: '喵喵帮助扩展',
    cfg: {
      extendMiaoHelp: {
        title: '喵喵帮助扩展功能',
        key: '喵喵帮助扩展',
        def: false,
        desc: '是否启用喵喵帮助扩展'
      },
      miaoHelpDisable: {
        title: '功能禁用处理',
        key: '功能禁用',
        type: 'num',
        def: 0,
        input: (n) => /[0-2]{1}/.test(n) ? (n * 1) : 0,
        desc: '当绑定的命令不在白名单/处于黑名单里时的处理：0-不处理，1-不显示在帮助图中，2-显示禁用'
      },
      miaoHelpNotFound: {
        title: '绑定功能处理',
        key: '绑定功能',
        type: 'num',
        def: 0,
        input: (n) => /[0-2]{1}/.test(n) ? (n * 1) : 0,
        desc: '当绑定的命令不存在时处理：0-不处理，1-不显示在帮助图中，2-显示不可用'
      }
    }
  },
  sys: {
    title: '系统设置',
    cfg: {
      renderScale: {
        title: '渲染精度',
        key: '渲染',
        type: 'num',
        def: 100,
        input: (n) => Math.min(200, Math.max(50, (n * 1 || 100))),
        desc: '可选值50~200，建议100。设置高精度会提高图片的精细度，但因图片较大可能会影响渲染与发送速度'
      }
    }
  }
}
