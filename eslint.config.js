import globals from 'globals'

export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        logger: 'readonly',
        plugin: 'readonly',
        segment: 'readonly',
        redis: 'readonly',
        Bot: 'readonly'
      }
    },
    rules: {
      // 引号：单引号
      'quotes': ['warn', 'single', { avoidEscape: true, allowTemplateLiterals: true }],

      // 缩进：tab
      'indent': ['warn', 2, { SwitchCase: 1 }],

      // 不强制分号（项目风格混用，不做硬性要求）
      'semi': 'off',

      // 变量声明：禁止 var
      'no-var': 'error',

      // 完全关闭，不检查和警告
      'prefer-const': 'off',

      // 未使用变量：警告，允许以 _ 开头的忽略
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', 'caughtErrors': 'none' }],

      // 禁止未声明变量
      'no-undef': 'error',

      // 禁止对同步函数使用 await
      'no-return-await': 'warn',

      // 空 catch 块警告
      'no-empty': ['warn', { allowEmptyCatch: true }],

      // 使用 === 和 !==
      'eqeqeq': ['warn', 'smart'],

      // 禁止重复导入
      'no-duplicate-imports': 'error',

      // 模板字符串优先
      'prefer-template': 'warn',

      // 箭头函数体风格
      'arrow-body-style': 'off',

      // 对象/数组尾逗号
      'comma-dangle': ['warn', 'only-multiline'],

      // 花括号间距
      'object-curly-spacing': ['warn', 'always'],

      // 关键字前后空格
      'keyword-spacing': 'warn',

      // 操作符前后空格
      'space-infix-ops': 'warn',

      // 块语句前空格
      'space-before-blocks': 'warn',

      // 逗号后空格
      'comma-spacing': 'warn',

      // 禁止多余空行
      'no-multiple-empty-lines': ['warn', { max: 2, maxEOF: 1 }],

      // console 不限制（项目使用 logger）
      'no-console': 'off',

      // 禁止 debugger
      'no-debugger': 'warn',

      // 禁止不必要的 return await
      'no-return-await': 'warn',

      // 禁止条件中赋值
      'no-cond-assign': 'error',

      // 禁止常量条件
      'no-constant-condition': 'warn',
    }
  },
  {
    // 忽略备份目录和资源文件
    ignores: ['backup/**', 'resources/**', 'node_modules/**']
  }
]
