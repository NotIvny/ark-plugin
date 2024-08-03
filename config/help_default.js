export const helpCfg = {
  title: 'Ark帮助',
  subTitle: 'Yunzai-Bot & Ark-Plugin',
  colCount: 3,
  colWidth: 265,
  theme: 'all',
  themeExclude: ['default'],
  bgBlur: true
}
export const helpList = [{
  group: '角色面板相关',
  list: [{
    icon: 61,
    title: '#星铁|原神导入面板数据',
    desc: '从云端导入面板数据'
  }, {
    icon: 63,
    title: '#星铁|原神导出面板数据',
    desc: '导出面板数据到云端，有效期10分钟'
  }, {
    icon: 66,
    title: '#星铁|原神总排名',
    desc: '查看所有角色的全服排名'
  }]
}, {
  group: '文件备份，仅主人可用',
  auth: 'master',
  list: [{
    icon: 58,
    title: '#ark创建备份',
    desc: '创建备份'
  }, {
    icon: 59,
    title: '#ark删除备份',
    desc: '删除备份'
  }, {
    icon: 60,
    title: '#ark恢复文件miao-rank',
    desc: '恢复备份文件'
  }, {
    icon: 88,
    title: '#ark替换文件miao-rank',
    desc: '替换文件'
  }, {
    icon: 53,
    title: '#ark备份文件miao-rank',
    desc: '备份文件'
  }]
}, {
  group: '管理命令，仅主人可用',
  auth: 'master',
  list: [{
    icon: 85,
    title: '#ark设置面板全服排名开启/关闭',
    desc: '开启或关闭角色面板全服排名'
  }, {
    icon: 32,
    title: '#ark设置面板全服排名开启/关闭',
    desc: '开启或关闭群全服排名'
  }]
}]