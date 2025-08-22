# 🚀 Vercel 部署指南

本指南将帮助您将产品保修管理系统部署到 Vercel 平台。

## 📋 部署前准备

### 1. 环境变量配置

在部署之前，您需要准备以下 Firebase 配置信息：

- `VITE_FIREBASE_API_KEY` - Firebase API 密钥
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase 认证域名
- `VITE_FIREBASE_DATABASE_URL` - Firebase 实时数据库 URL
- `VITE_FIREBASE_PROJECT_ID` - Firebase 项目 ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase 存储桶
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase 消息发送者 ID
- `VITE_FIREBASE_APP_ID` - Firebase 应用 ID
- `VITE_FIREBASE_MEASUREMENT_ID` - Firebase 测量 ID（可选）

### 2. 获取 Firebase 配置

1. 访问 [Firebase 控制台](https://console.firebase.google.com/)
2. 选择您的项目
3. 进入 **项目设置** > **常规**
4. 在 **您的应用** 部分找到 Web 应用
5. 点击 **Firebase SDK snippet** > **配置**
6. 复制配置信息

## ⚠️ 常见部署错误

### 错误1："The 'functions' property cannot be used in conjunction with the 'builds' property"

**原因**：在 `vercel.json` 中同时使用了 `functions` 和 `builds` 属性。对于静态网站，应该只使用 `builds` 属性。

**解决方案**：
1. 移除 `vercel.json` 中的 `functions` 属性
2. 使用 `builds` 配置静态文件构建
3. 简化路由配置，只保留必要的规则

### 错误2：routes 和其他属性冲突

**错误信息**：`If 'rewrites', 'redirects', 'headers', 'cleanUrls' or 'trailingSlash' are used, then 'routes' cannot be present`

**解决方案**：
- 移除 `routes` 属性
- 使用 `rewrites` 替代 `routes` 处理SPA路由
- 将缓存策略移到 `headers` 配置中
- 保留 `headers`、`cleanUrls`、`trailingSlash` 配置

**routes vs rewrites 区别**：
- `routes`：旧版本的路由配置方式
- `rewrites`：新版本推荐的重写规则
- 不能同时使用 `routes` 和现代配置属性

### 错误3：headers 中的正则表达式语法错误

**错误信息**：`Header at index 0 has invalid 'source' pattern`

**原因**：复杂的正则表达式语法导致 Vercel 无法正确解析

**解决方案**：
1. 避免使用复杂的正则表达式模式
2. 使用简单的路径匹配代替文件扩展名匹配
3. 分别为不同目录设置缓存规则

**正确的配置示例**：
```json
"headers": [
  {
    "source": "/src/(.*)",
    "headers": [
      {
        "key": "Cache-Control",
        "value": "public, max-age=31536000, immutable"
      }
    ]
  },
  {
    "source": "/assets/(.*)",
    "headers": [
      {
        "key": "Cache-Control",
        "value": "public, max-age=31536000, immutable"
      }
    ]
  }
]
```

**避免的错误模式**：
- `"/(.*)\\.(?:js|css|svg)$"` - 复杂的文件扩展名匹配
- `"/(.*\\.(js|css|svg))"` - 转义字符问题
- 使用捕获组和复杂的正则表达式语法

**错误信息**："Header at index 0 has invalid 'source' pattern"

**解决方案**：
- 修正正则表达式语法，避免复杂的转义字符
- 使用非捕获组 `(?:)` 而不是捕获组 `()`
- 在文件扩展名匹配中使用 `$` 结束符
- 正确的模式：`"/(.*)\\.(?:js|css|svg|png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot)$"`

**Vercel 正则表达式最佳实践**：
```json
// ✅ 正确：简单的文件扩展名匹配
"source": "/(.*)\\.(?:js|css|svg)$"

// ❌ 错误：复杂的转义字符
"source": "/(.*\\.(js|css|svg))"

// ✅ 正确：匹配所有路径
"source": "/(.*)"

// ✅ 正确：匹配特定目录
"source": "/api/(.*)"
```

**正确的 vercel.json 配置示例**：
```json
{
  "version": 2,
  "builds": [
    {
      "src": "**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*\\.(js|css|svg|png|jpg|jpeg|gif|ico))",
      "dest": "/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### 静态网站 vs Serverless 函数

- **静态网站**：使用 `builds` 属性，适合纯前端应用
- **Serverless 函数**：使用 `functions` 属性，适合需要后端逻辑的应用
- **不能同时使用**：Vercel 不允许在同一个项目中混合使用这两种配置

## 🌐 Vercel 部署步骤

### 方法一：通过 Vercel Dashboard（推荐）

1. **连接 GitHub 仓库**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 点击 **New Project**
   - 选择您的 GitHub 仓库
   - 点击 **Import**

2. **配置项目设置**
   - **Framework Preset**: 选择 "Other"
   - **Root Directory**: 保持默认（根目录）
   - **Build Command**: 留空（静态站点）
   - **Output Directory**: 留空
   - **Install Command**: 留空

3. **设置环境变量**
   - 在项目配置页面，找到 **Environment Variables** 部分
   - 添加以下环境变量：

   ```
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
   VITE_FIREBASE_DATABASE_URL=your_database_url_here
   VITE_FIREBASE_PROJECT_ID=your_project_id_here
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
   VITE_FIREBASE_APP_ID=your_app_id_here
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id_here
   ```

4. **部署项目**
   - 点击 **Deploy** 按钮
   - 等待部署完成

### 方法二：通过 Vercel CLI

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   ```bash
   # 在项目根目录执行
   vercel
   
   # 按照提示配置项目
   # 选择团队（如果有）
   # 确认项目名称
   # 确认项目目录
   ```

4. **设置环境变量**
   ```bash
   vercel env add VITE_FIREBASE_API_KEY
   vercel env add VITE_FIREBASE_AUTH_DOMAIN
   vercel env add VITE_FIREBASE_DATABASE_URL
   vercel env add VITE_FIREBASE_PROJECT_ID
   vercel env add VITE_FIREBASE_STORAGE_BUCKET
   vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
   vercel env add VITE_FIREBASE_APP_ID
   vercel env add VITE_FIREBASE_MEASUREMENT_ID
   ```

5. **重新部署**
   ```bash
   vercel --prod
   ```

## ⚙️ 配置说明

### vercel.json 配置

项目已包含 `vercel.json` 配置文件，包含以下设置：

- **静态文件服务**: 配置了静态资源的缓存策略
- **路由规则**: 设置了 SPA 路由支持
- **安全头**: 添加了安全相关的 HTTP 头
- **环境变量**: 配置了环境变量映射

### 环境变量处理

- 项目使用 `VITE_` 前缀的环境变量
- Vercel 会自动注入这些变量到构建过程
- `firebase-config.js` 会自动读取这些环境变量

## 🔧 部署后配置

### 1. 验证部署

部署完成后，访问您的 Vercel 域名，检查：

- [ ] 页面正常加载
- [ ] Firebase 连接正常
- [ ] 产品数据正常显示
- [ ] 添加/编辑/删除功能正常

### 2. 自定义域名（可选）

1. 在 Vercel Dashboard 中进入项目设置
2. 点击 **Domains** 标签
3. 添加您的自定义域名
4. 按照提示配置 DNS 记录

### 3. 性能优化

- **启用 Gzip 压缩**: Vercel 默认启用
- **CDN 缓存**: 静态资源自动缓存
- **HTTP/2**: 默认支持

## 🚨 常见问题

### 1. 环境变量未生效

**问题**: 部署后 Firebase 连接失败

**解决方案**:
- 检查环境变量名称是否正确（必须以 `VITE_` 开头）
- 确认所有必需的环境变量都已设置
- 重新部署项目

### 2. 路由问题

**问题**: 刷新页面后出现 404 错误

**解决方案**:
- 确认 `vercel.json` 文件存在且配置正确
- 检查路由规则是否正确设置

### 3. Firebase 权限错误

**问题**: 数据读取失败

**解决方案**:
- 检查 Firebase 数据库规则
- 确认 API 密钥有效
- 验证项目 ID 正确

### 4. 构建失败

**问题**: 部署时构建失败

**解决方案**:
- 检查代码语法错误
- 确认所有依赖都已正确安装
- 查看构建日志获取详细错误信息

## 📊 监控和维护

### 1. 部署监控

- 在 Vercel Dashboard 查看部署状态
- 监控网站性能和可用性
- 设置部署通知

### 2. 日志查看

```bash
# 查看实时日志
vercel logs

# 查看特定部署的日志
vercel logs [deployment-url]
```

### 3. 更新部署

- **自动部署**: 推送到 GitHub 主分支自动触发部署
- **手动部署**: 使用 `vercel --prod` 命令

## 🔗 有用链接

- [Vercel 官方文档](https://vercel.com/docs)
- [Firebase 控制台](https://console.firebase.google.com/)
- [Vercel CLI 文档](https://vercel.com/docs/cli)
- [环境变量配置](https://vercel.com/docs/concepts/projects/environment-variables)

## 📞 技术支持

如果在部署过程中遇到问题：

1. 查看本文档的常见问题部分
2. 检查 Vercel 部署日志
3. 参考 Firebase 和 Vercel 官方文档
4. 在项目 GitHub 仓库提交 Issue

---

**祝您部署顺利！** 🎉