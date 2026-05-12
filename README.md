<p align="center">
  <h1 align="center">🧭 Nav-App</h1>
  <p align="center">
    <strong>一个轻量级、自托管的服务导航中心</strong>
  </p>
  <p align="center">
    帮助你集中管理和快速访问各类在线服务，打造专属的个人导航门户
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen?logo=node.js" alt="Node.js Version">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/version-1.0.0-orange" alt="Version">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
</p>

## 📖 目录

- [项目概述](#项目概述)
- [核心功能](#核心功能)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [使用指南](#使用指南)
- [API 文档](#api-文档)
- [项目结构](#项目结构)
- [配置说明](#配置说明)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

***

## 项目概述

Nav-App 是一个基于 Node.js 构建的**自托管服务导航中心**。它将分散的在线服务以卡片网格的形式集中展示，支持分类筛选、自定义主题、图标管理、字体上传和本地服务托管等功能。项目无需数据库，所有配置通过 JSON 文件持久化，部署简单，开箱即用。

### 设计理念

- **轻量化**：无前端框架、无数据库依赖，纯原生 HTML/CSS/JS + Node.js
- **自托管**：数据完全掌握在自己手中，可部署在任意服务器或 NAS 上
- **高可定制**：主题、图标、字体、背景均可自由定制

***

## 核心功能

### 🏠 导航主页

| 功能       | 说明                                              |
| -------- | ----------------------------------------------- |
| 🔗 服务卡片  | 网格布局展示所有服务，支持 Font Awesome 图标或自定义图标             |
| 🏷️ 分类筛选 | 按自定义分类快速筛选服务                                    |
| 🎨 动态主题  | 支持自定义主色、悬停色、背景色、字号、字重等                          |
| 🖼️ 背景定制 | 支持图片/视频背景，可调节透明度和优先级                            |
| ✨ 毛玻璃效果  | 卡片支持毛玻璃效果，可调节透明度和模糊度                            |
| 🔤 自定义字体 | 支持上传 TTF/OTF/WOFF/WOFF2 字体，通过 FontFace API 动态加载 |
| 🔄 自动刷新  | 每 5 秒自动拉取最新配置，无需手动刷新                            |

### 🛠️ 管理后台

| 功能       | 说明                                |
| -------- | --------------------------------- |
| 🔐 密码认证  | 管理员密码登录保护                         |
| 📊 控制面板  | 服务数量、图标数量、运行状态一目了然                |
| 🔧 服务管理  | 服务的增删改查、排序、导入/导出 JSON             |
| 📁 本地服务  | 上传 HTML/CSS/JS 静态网页或在线编辑，自动生成访问入口 |
| 🎯 按钮管理  | 每个服务支持多个操作按钮                      |
| 💾 自动备份  | 定时自动备份配置文件，可配置间隔和保留数量             |
| 🔄 备份管理  | 导出/导入/删除备份，一键恢复配置                 |
| 🎨 主题设置  | 可视化调整所有主题参数                       |
| 🖼️ 图标管理 | 浏览 Font Awesome 图标库，上传自定义图标       |
| 🔤 字体管理  | 上传、预览、删除自定义字体                     |
| 🔑 密码修改  | 管理员密码修改（需验证原密码）                   |

***

## 技术栈

| 类别        | 技术                         | 版本        |
| --------- | -------------------------- | --------- |
| **运行时**   | Node.js                    | >= 14.0.0 |
| **服务端框架** | Express.js                 | ^4.18.2   |
| **跨域支持**  | CORS                       | ^2.8.5    |
| **文件上传**  | Multer                     | ^2.0.0    |
| **文件系统**  | fs-extra                   | ^11.1.1   |
| **图标库**   | Font Awesome Free          | 7.1.0     |
| **开发工具**  | Nodemon                    | ^3.0.1    |
| **前端**    | 原生 HTML + CSS + JavaScript | —         |

***

## 快速开始

### 环境要求

- **Node.js** >= 14.0.0
- **npm** >= 6.0.0

### 安装

```bash
# 1. 克隆仓库
git clone https://github.com/WTStarMark/nav-app.git
cd nav-app

# 2. 安装依赖
npm install
```

### 运行

```bash
# 生产模式启动（默认监听 80 端口）
npm start

# 开发模式（与生产模式相同，按需可自行配置 nodemon）
npm run dev
```

启动后访问：

- **导航主页**：`http://你的服务器IP/`
- **管理后台**：`http://你的服务器IP/admin.html`

> **💡 提示**：80 端口为默认 HTTP 端口。如需修改端口，请编辑 `server.js` 中的 `PORT` 常量。

### Windows 一键启动（仅启动）

项目提供了 `start.bat` 脚本，双击即可在后台静默启动服务。

***

## 使用指南

### 主界面

启动服务后，访问 `http://你的服务器IP/` 即可看到导航主页：

1. **筛选服务**：点击顶部分类标签筛选对应服务
2. **访问服务**：点击服务卡片上的按钮跳转到目标链接
3. **自定义背景**：支持视频背景（优先级高于图片），可通过管理后台配置

### 管理后台

访问 `http://你的服务器IP/admin.html` 进入管理后台：

1. **登录**：使用默认密码 `admin123` 登录（首次登录后建议立即修改）
2. **添加服务**：进入「服务管理」页面，填写服务名称、选择图标、设置分类和按钮链接
3. **自定义主题**：进入「主题设置」调整颜色、字体、毛玻璃等参数
4. **上传图标**：进入「图标管理」上传自定义 PNG/SVG 图标或浏览 Font Awesome 图标库
5. **上传字体**：进入「字体管理」上传自定义字体文件（支持 TTF/OTF/WOFF/WOFF2，最大 30MB）
6. **本地服务**：进入「本地服务」上传或编辑静态网页，自动生成访问入口
7. **备份管理**：进入「备份管理」导出/导入配置备份，或配置自动备份策略

### 服务类型说明

| 类型       | 说明                                    |
| -------- | ------------------------------------- |
| **远程服务** | 配置外部 URL 链接，点击按钮直接跳转                  |
| **本地服务** | 上传 HTML/CSS/JS 等静态文件到服务器，通过导航直接访问托管页面 |

***

## API 文档

所有 API 均返回统一格式的 JSON 响应：

```json
{
  "code": 200,    // 状态码
  "msg": "success", // 消息
  "data": {}      // 数据载荷
}
```

### 公开接口

| 方法    | 端点                          | 说明                   |
| ----- | --------------------------- | -------------------- |
| `GET` | `/api/config`               | 获取公开配置（密码字段已隐去）      |
| `GET` | `/api/fontawesome-icons`    | 获取 Font Awesome 图标列表 |
| `GET` | `/api/download-fontawesome` | 返回本地 FA 图标库信息        |

### 认证接口

| 方法     | 端点           | 说明                                |
| ------ | ------------ | --------------------------------- |
| `POST` | `/api/login` | 管理员登录，请求体：`{ "password": "xxx" }` |

### 配置管理接口（需登录）

| 方法     | 端点                     | 说明      |
| ------ | ---------------------- | ------- |
| `POST` | `/api/change-password` | 修改管理员密码 |
| `POST` | `/api/save-theme`      | 保存主题配置  |
| `POST` | `/api/save-services`   | 保存服务列表  |
| `POST` | `/api/save-titles`     | 保存页面标题  |

### 文件上传接口

| 方法     | 端点                 | 说明                                |
| ------ | ------------------ | --------------------------------- |
| `POST` | `/api/upload-icon` | 上传自定义图标（PNG/JPG/SVG，≤2MB）         |
| `POST` | `/api/upload-font` | 上传自定义字体（TTF/OTF/WOFF/WOFF2，≤30MB） |
| `POST` | `/api/upload`      | 上传背景图片/视频（≤200MB）                 |
| `GET`  | `/api/fonts`       | 获取已上传字体列表                         |
| `POST` | `/api/delete-font` | 删除指定字体                            |

### 本地服务接口

| 方法     | 端点                                    | 说明                         |
| ------ | ------------------------------------- | -------------------------- |
| `POST` | `/api/upload-local-service`           | 上传本地服务静态文件（≤10MB/文件，最多10个） |
| `POST` | `/api/save-local-service-content`     | 保存在线编辑的本地服务内容              |
| `GET`  | `/api/local-service-files/:serviceId` | 获取本地服务文件列表                 |
| `POST` | `/api/delete-local-service-file`      | 删除本地服务文件                   |

### 备份接口

| 方法     | 端点                   | 说明         |
| ------ | -------------------- | ---------- |
| `GET`  | `/api/backup/export` | 导出配置文件备份   |
| `POST` | `/api/backup/import` | 导入备份文件恢复配置 |
| `GET`  | `/api/backup/list`   | 获取备份文件列表   |
| `POST` | `/api/backup/delete` | 删除指定备份     |
| `GET`  | `/api/backup/config` | 获取备份配置     |
| `POST` | `/api/backup/config` | 更新备份配置     |

***

## 项目结构

```
nav-app/
├── server.js                 # 服务端入口（Express 路由 + 23 API 端点）
├── package.json              # 项目元信息与依赖
├── package-lock.json         # 依赖锁定文件
├── config.json               # 核心配置文件（主题/服务/密码/备份）
├── .npmrc                    # npm 镜像源配置
├── start.bat                  # Windows 启动脚本（隐藏窗口）
│
├── backups/                  # 自动备份目录
│   └── backup-YYYY-MM-DD-HH-MM-SS.json
│
└── public/                   # 静态资源根目录
    ├── main.html             # 导航主页（纯原生 HTML+CSS+JS）
    ├── admin.html            # 管理后台（纯原生 HTML+CSS+JS）
    ├── icons/                # 用户上传的自定义图标
    ├── backgrounds/          # 用户上传的背景图片
    ├── videos/               # 用户上传的背景视频
    ├── local-services/       # 本地服务静态文件
    │   └── {serviceId}/      # 按服务 ID 分目录存储
    └── fonts/
        ├── {timestamp}-{name}.ttf     # 用户上传的自定义字体
        └── fontawesome-free-7.1.0-web/ # Font Awesome 本地托管
            ├── css/
            ├── js/
            ├── webfonts/
            └── metadata/
                └── icons.json         # 图标元数据
```

***

## 配置说明

所有配置存储在根目录的 `config.json` 文件中，主要配置项如下：

| 配置项             | 类型     | 说明                                    |
| --------------- | ------ | ------------------------------------- |
| `adminPassword` | string | 管理员密码（默认admin123）                     |
| `titles`        | object | 页面标题配置（导航/主内容/管理导航/管理内容）              |
| `theme`         | object | 主题配置（颜色/字体/毛玻璃/背景等）                   |
| `services`      | array  | 服务列表，每个服务包含名称、图标、分类、按钮等               |
| `icons`         | array  | 预设图标列表                                |
| `backup`        | object | 备份配置（`maxBackups` / `backupInterval`） |

### Theme 配置详解

```json
{
  "primaryColor": "#7adeff",          // 主题主色
  "primaryHoverColor": "#7ad7ff",     // 悬停色
  "backgroundColor": "#f5f7fa",       // 页面背景色
  "fontFamily": "'cangjing', sans-serif", // 字体
  "fontSize": "20px",                 // 字号
  "fontWeight": "600",                // 字重
  "glassOpacity": "4",               // 毛玻璃透明度（0-10）
  "glassBlur": "9",                   // 毛玻璃模糊度（px）
  "glassColor1": "#bedffe",           // 毛玻璃渐变起始色
  "glassColor2": "#c7f1ff",           // 毛玻璃渐变结束色
  "backgroundOpacity": "100",         // 背景透明度
  "backgroundPriority": "video"       // 背景优先级：image | video
}
```

### Service 配置详解

```json
{
  "id": 13,
  "name": "服务名称",
  "icon": "fab fa-github",              // Font Awesome 图标类名
  "customIcon": "",                      // 自定义图标路径（留空则使用 FA 图标）
  "buttons": [
    {
      "text": "访问",
      "url": "https://example.com/",
      "ariaLabel": "按钮描述"
    }
  ]
}
```

***

## 贡献指南

我们欢迎任何形式的贡献！无论是报告 Bug、提出新功能建议，还是提交代码改进。

### 贡献流程

1. **Fork** 本仓库
2. 创建你的特性分支：`git checkout -b feature/amazing-feature`
3. 提交你的更改：`git commit -m 'feat: 添加了某个很棒的功能'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 提交 **Pull Request**

### 提交规范

本项目推荐使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat:` 新功能
- `fix:` 修复 Bug
- `docs:` 文档更新
- `style:` 代码格式调整（不影响功能）
- `refactor:` 代码重构
- `perf:` 性能优化
- `test:` 测试相关
- `chore:` 构建/工具链相关

***

## 许可证

本项目基于 [MIT License](https://opensource.org/license/MIT) 开源。

***

<p align="center">
  Made with ❤️ by <a href="https://www.moc-chen.cn/">墨尘</a>
</p>
