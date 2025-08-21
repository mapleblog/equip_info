# 代码规范配置说明

本项目已配置完整的代码规范工具链，包括 ESLint、Prettier、Husky 和 lint-staged。

## 🛠️ 已安装的工具

### ESLint
- **版本**: 9.33.0
- **配置文件**: `eslint.config.js`
- **功能**: JavaScript 代码质量检查和错误预防
- **规则**: 适用于原生 JavaScript ES6+ 和浏览器环境

### Prettier
- **配置文件**: `.prettierrc`
- **功能**: 代码格式化，确保代码风格一致
- **设置**: 4空格缩进，单引号，无尾随逗号

### Husky
- **配置目录**: `.husky/`
- **功能**: Git hooks 管理
- **已配置**: pre-commit hook

### lint-staged
- **配置**: 在 `package.json` 中
- **功能**: 只对暂存的文件运行 linting 和格式化

## 📝 可用的 npm 脚本

```bash
# 检查代码质量
npm run lint

# 自动修复可修复的 ESLint 问题
npm run lint:fix

# 格式化所有代码文件
npm run format

# 检查代码格式是否符合 Prettier 规范
npm run format:check
```

## 🔧 工作流程

### 开发时
1. 编写代码
2. 运行 `npm run lint:fix` 自动修复问题
3. 运行 `npm run format` 格式化代码

### 提交时
1. `git add .` 添加文件到暂存区
2. `git commit -m "提交信息"` 
3. pre-commit hook 自动运行：
   - 对 `.js` 文件运行 ESLint 修复和 Prettier 格式化
   - 对 `.css` 和 `.html` 文件运行 Prettier 格式化

## ⚙️ 配置详情

### ESLint 配置 (eslint.config.js)
- 基于 `@eslint/js` 推荐规则
- 集成 Prettier
- 支持浏览器环境和现代 JavaScript
- 包含 Firebase、DOM API 等全局变量

### Prettier 配置 (.prettierrc)
```json
{
  "semi": true,
  "trailingComma": "none",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 4,
  "useTabs": false
}
```

### lint-staged 配置
```json
{
  "*.js": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{css,html}": [
    "prettier --write"
  ]
}
```

## 🚨 常见问题

### ESLint 警告
- `no-console`: console 语句会产生警告，生产环境建议移除
- `no-alert`: alert/confirm 语句会产生警告

### 如何忽略特定规则
在代码中添加注释：
```javascript
// eslint-disable-next-line no-console
console.log('这行不会被检查');

/* eslint-disable no-console */
// 这个块内的 console 语句都不会被检查
console.log('调试信息');
/* eslint-enable no-console */
```

### 如何修改规则
编辑 `eslint.config.js` 文件中的 `rules` 部分：
```javascript
rules: {
  'no-console': 'off', // 关闭 console 警告
  'no-alert': 'error'  // 将 alert 警告升级为错误
}
```

## 📁 项目结构

```
project/
├── .husky/                 # Husky Git hooks
│   └── pre-commit         # pre-commit hook 脚本
├── node_modules/          # 依赖包
├── .gitignore            # Git 忽略文件
├── .prettierrc           # Prettier 配置
├── eslint.config.js      # ESLint 配置
├── package.json          # 项目配置和脚本
├── CODE_STANDARDS.md     # 本文档
└── [项目文件...]
```

## 🎯 最佳实践

1. **提交前检查**: 始终在提交前运行 `npm run lint:fix`
2. **定期格式化**: 定期运行 `npm run format` 保持代码整洁
3. **遵循规则**: 不要随意禁用 ESLint 规则
4. **团队协作**: 确保所有团队成员使用相同的配置

## 🔄 更新配置

如需更新配置，请修改相应的配置文件：
- ESLint: `eslint.config.js`
- Prettier: `.prettierrc`
- lint-staged: `package.json` 中的 `lint-staged` 字段

配置更新后，建议运行 `npm run lint:fix` 和 `npm run format` 确保所有文件符合新规范。