/*
* 此配置文件为系统使用，请勿修改，否则可能无法正常使用
*
* 如需自定义配置请复制修改上一级help_default.js
*
* */

export const helpCfg = {
  title: 'Ark帮助',
  subTitle: 'Yunzai-Bot & Ark-Plugin',
  columnCount: 3,
  colWidth: 265,
  theme: 'all',
  themeExclude: ['default'],
  style: {
    fontColor: '#ceb78b',
    descColor: '#eee',
    contBgColor: 'rgba(6, 21, 31, .5)',
    contBgBlur: 3,
    headerBgColor: 'rgba(6, 21, 31, .4)',
    rowBgColor1: 'rgba(6, 21, 31, .2)',
    rowBgColor2: 'rgba(6, 21, 31, .35)'
  }
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
    desc: '查看所有角色的总排名'
  }, {
    icon: 54,
    title: '#雷神排名统计',
    desc: '查看雷神排名统计图'
  },{
    icon: 56,
    title: '#ark绑定星铁|原神uid',
    desc: '获取验证码'
  },{
    icon: 57,
    title: '#ark验证星铁|原神uid',
    desc: '验证uid拥有者'
  },{
    icon: 58,
    title: '#星铁|原神导出面板',
    desc: '导出面板数据为文件'
  },]
}, {
  group: '管理插件优先级，仅主人可用',
  auth: 'master',
  list: [{
    icon: 11,
    title: '#刷新优先级',
    desc: '刷新插件优先级'
  }, {
    icon: 12,
    title: '#修改优先级',
    desc: '修改插件优先级'
  }, {
    icon: 13,
    title: '#重置优先级',
    desc: '重置插件优先级'
  }, {
    icon: 14,
    title: '#查询优先级',
    desc: '查询插件优先级'
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
    title: '#ark设置',
    desc: '配置ark-plugin功能'
  }]
}]

export const isSys = true
