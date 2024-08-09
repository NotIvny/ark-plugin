export const cfgSchema = {
  apps: {
    title: '面板相关设置',
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
  },
  test: {
    title: '测试功能',
    cfg: {
      overrideTest: {
        title: '重写函数',
        key: '重写函数',
        def: false,
        desc: '通过重写函数实现排名功能，启用后仅需使用一次 #ark替换文件miao-rank，在后续更新不再需要替换文件。测试功能，可能存在Bug'
      }
    }
  }
}
