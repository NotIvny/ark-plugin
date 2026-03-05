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
      'quotes': ['warn', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      'indent': ['warn', 2, { SwitchCase: 1 }],
      'semi': 'off',
      'no-var': 'error',
      'prefer-const': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', 'caughtErrors': 'none' }],
      'no-undef': 'error',
      'no-return-await': 'warn',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'eqeqeq': ['warn', 'smart'],
      'no-duplicate-imports': 'error',
      'prefer-template': 'warn',
      'arrow-body-style': 'off',
      'comma-dangle': ['warn', 'only-multiline'],
      'object-curly-spacing': ['warn', 'always'],
      'keyword-spacing': 'warn',
      'space-infix-ops': 'warn',
      'space-before-blocks': 'warn',
      'comma-spacing': 'warn',
      'no-multiple-empty-lines': ['warn', { max: 2, maxEOF: 1 }],
      'no-console': 'off',
      'no-debugger': 'warn',
      'no-cond-assign': 'error',
      'no-constant-condition': 'warn',
    }
  },
  {
    // 忽略备份目录和资源文件
    ignores: ['backup/**', 'resources/**', 'node_modules/**']
  }
]