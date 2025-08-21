# 📁 项目结构说明

## 🏗️ 目录结构

```
product-manager/
├── index.html              # 主页面入口文件
├── .gitignore              # Git 忽略文件配置
├── .husky/                 # Git hooks 配置
│   └── pre-commit          # 预提交钩子
├── src/                    # 源代码目录
│   ├── styles.css          # 主样式文件
│   ├── script.js           # 主要业务逻辑
│   └── firebase-config.js  # Firebase 配置文件
├── config/                 # 配置文件目录
│   ├── .prettierrc         # Prettier 格式化配置
│   ├── eslint.config.js    # ESLint 代码检查配置
│   ├── package.json        # 项目依赖和脚本配置
│   ├── package-lock.json   # 依赖版本锁定文件
│   ├── firebase.json       # Firebase 项目配置
│   └── database.rules.json # Firebase 数据库规则
├── docs/                   # 文档目录
│   ├── README.md           # 项目说明文档
│   └── CODE_STANDARDS.md   # 代码规范文档
└── assets/                 # 静态资源目录
    └── favicon.svg         # 网站图标
```

## 📂 目录说明

### 🎯 根目录文件
- **index.html** - 应用主页面，项目入口点
- **.gitignore** - Git 版本控制忽略文件配置
- **.husky/** - Git hooks 配置，用于代码提交前的自动检查

### 💻 src/ - 源代码目录
存放应用的核心源代码文件：
- **styles.css** - 主样式文件，包含所有 CSS 样式和主题配置
- **script.js** - 主要业务逻辑，包含产品管理功能和 Firebase 集成
- **firebase-config.js** - Firebase 项目配置和初始化代码

### ⚙️ config/ - 配置文件目录
存放项目配置和依赖管理文件：
- **.prettierrc** - 代码格式化工具配置
- **eslint.config.js** - 代码质量检查工具配置
- **package.json** - Node.js 项目配置，包含依赖和脚本
- **package-lock.json** - 依赖版本锁定文件
- **firebase.json** - Firebase 项目配置文件
- **database.rules.json** - Firebase 实时数据库安全规则

### 📚 docs/ - 文档目录
存放项目相关文档：
- **README.md** - 项目详细说明文档
- **CODE_STANDARDS.md** - 代码规范和开发指南

### 🎨 assets/ - 静态资源目录
存放静态资源文件：
- **favicon.svg** - 网站图标文件

## 🚀 快速开始

### 开发环境设置
1. 确保已安装 Node.js (推荐 v16+)
2. 进入 config 目录：`cd config`
3. 安装依赖：`npm install`
4. 返回根目录：`cd ..`
5. 直接打开 `index.html` 或使用本地服务器运行

### 可用脚本命令
在 config 目录下运行以下命令：

```bash
# 代码检查
npm run lint

# 自动修复代码问题
npm run lint:fix

# 代码格式化
npm run format

# 检查代码格式
npm run format:check

# 运行所有检查
npm run check-all
```

## 🔧 开发工作流

### 代码提交流程
1. 修改代码后，Git 会自动运行预提交检查
2. 检查包括：代码格式化、ESLint 检查
3. 只有通过所有检查才能成功提交

### 文件修改指南
- **样式修改**：编辑 `src/styles.css`
- **功能修改**：编辑 `src/script.js`
- **Firebase 配置**：编辑 `src/firebase-config.js`
- **项目配置**：编辑 `config/` 目录下的相应文件
- **文档更新**：编辑 `docs/` 目录下的文档文件

## 📋 注意事项

### 路径引用
- 主页面 `index.html` 位于根目录
- CSS/JS 文件通过相对路径 `src/` 引用
- 静态资源通过相对路径 `assets/` 引用

### 配置文件
- 所有开发工具配置都在 `config/` 目录中
- Firebase 相关配置分别在 `src/firebase-config.js` 和 `config/firebase.json`

### 版本控制
- 使用 Git 进行版本控制
- 配置了自动代码检查和格式化
- 遵循统一的代码规范

## 🎯 项目特点

- **模块化结构**：清晰的目录分离，便于维护
- **代码规范**：集成 ESLint 和 Prettier，确保代码质量
- **自动化检查**：Git hooks 自动运行代码检查
- **文档完善**：详细的项目说明和开发指南
- **现代化工具链**：使用现代前端开发工具和最佳实践

---

*最后更新：2025年8月*