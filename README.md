# ⚡️ Bun Fullstack 脚手架

<div align="center">

**基于 Bun 原生全栈、ElysiaJS 2.0、React 19、Shadcn UI (Base-Nova) 与 Better Auth 的现代化工业级极速全栈脚手架**

[![Bun](https://img.shields.io/badge/Bun-%3E%3D%201.4.0-black?style=flat-square&logo=bun)](https://bun.sh)
[![ElysiaJS](https://img.shields.io/badge/ElysiaJS-2.0.0--rc-f9a8d4?style=flat-square&logo=elysia)](https://elysiajs.com)
[![React](https://img.shields.io/badge/React-19.3-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4.3-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-0.45-c5f467?style=flat-square&logo=drizzle)](https://orm.drizzle.team)
[![Better Auth](https://img.shields.io/badge/Better%20Auth-1.7-8b5cf6?style=flat-square)](https://www.better-auth.com)
[![Shadcn UI](https://img.shields.io/badge/Shadcn%20UI-Base--Nova-black?style=flat-square)](https://ui.shadcn.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](./LICENSE)

</div>

---

## 📖 项目简介

**Bun Fullstack 脚手架** 是专为追寻极致性能、卓越类型安全与极速开发体验而打造的现代化全栈工程模板。

本项目深度融合了 **Bun 原生 Fullstack 打包能力** 与 **ElysiaJS 2.0 服务端生态**，彻底告别 Vite / Webpack 等传统多层工具链的配置负担。前端通过 HTML 静态引入直接享受 Bun 提供的毫秒级 HMR；后端采用 TypeBox 进行端到端类型约束；业务数据通过 Drizzle ORM 持久化至本地 SQLite；身份认证由现代化的 Better Auth 保驾护航。

更重要的是，项目原生支持一键编译为**单一独立自包含二进制文件 (`bun-fullstack-app`)**，无论分发至 Linux 服务器还是本地直接执行，均无需目标环境安装 Node.js、Bun 或任何外部依赖！

---

## 🌟 核心亮点与工程特性

| 特性分类 | 核心亮点 | 技术细节 |
| :--- | :--- | :--- |
| 🚀 **全栈一体化** | **Bun 原生 Fullstack 规范** | 单端口 (`:3000`) 统一托管 React 前端页面、静态资源与 REST API 路由，无需反向代理与繁杂 dev server 配置。 |
| 📦 **极致分发** | **自包含单一二进制编译** | 支持 `bun build --compile` 将前端资源、后端代码与 Bun 运行时打包为单文件，亦提供轻量级多阶段 Docker 构建。 |
| 🔌 **端到端类型安全** | **Elysia Eden Treaty** | 前后端完全共享 DTO 与响应模型类型，API 入参校验、返回值变更在编译期即可享受类型提示与错误检测。 |
| 🔐 **开箱即用鉴权** | **Better Auth 极速认证** | 支持邮箱密码直接注册与免验证登录、HttpOnly 会话 Cookie、跨端 Session 实时校验与多设备会话强制注销。 |
| 📚 **优雅 API 文档** | **双引擎交互式控制台** | 集成现代 Scalar 驱动的 `/swagger` 文档中心，深度规整 Better Auth OpenAPI 规范（去除通配符污点，补全中文摘要与参数定义）。 |
| 🎨 **前沿设计系统** | **Shadcn UI (Base-Nova)** | 基于 `@base-ui/react` 核心原语（杜绝 Radix UI 碎片化依赖）与 Tailwind CSS v4 CSS-First 架构，高信息密度与明暗双主题自适应。 |
| 🛡️ **工业级防御** | **通用中间件与异常兜底** | 全链路 Request ID (`x-request-id`)、高精度耗时、OWASP 安全响应头、滑动窗口接口限流 (429)、统一业务响应与优雅停机。 |
| 💾 **现代数据持久化** | **Drizzle ORM + bun:sqlite** | 基于 SQLite 本地持久化 (`data/todos.db`) 与 Repository 仓储模式，提供完整的 Drizzle Kit 迁移、推送与可视化 Studio 界面。 |

---

## 🏛️ 系统架构全景

```
                                      ┌────────────────────────────────────────────────────────┐
                                      │               Bun HTTP Server (Port 3000)              │
                                      └───────────────────────────┬────────────────────────────┘
                                                                  │
              ┌───────────────────────────────────────────────────┼───────────────────────────────────────────────────┐
              ▼                                                   ▼                                                   ▼
  ┌─────────────────────────┐                         ┌─────────────────────────┐                         ┌─────────────────────────┐
  │     Elysia REST API     │                         │   OpenAPI / Docs 规范   │                         │  React 19 Frontend Web  │
  ├─────────────────────────┤                         ├─────────────────────────┤                         ├─────────────────────────┤
  │ • /api/health (系统健康) │                         │ • /swagger (Scalar 交互)│                         │ • public/index.html     │
  │ • /api/todos (待办业务) │                         │ • /api/auth/reference   │                         │ • Bun 原生 TSX 编译打包  │
  │ • /api/auth/* (BetterAuth)                        │   (BetterAuth 控制台)   │                         │ • Tailwind CSS v4 样式  │
  └───────────┬─────────────┘                         └─────────────────────────┘                         └───────────┬─────────────┘
              │                                                                                                       │
              ▼                                                                                                       ▼
  ┌─────────────────────────┐                                                                             ┌─────────────────────────┐
  │    统一中间件与异常拦截   │                                                                             │    客户端交互与视图组件   │
  ├─────────────────────────┤                                                                             ├─────────────────────────┤
  │ • Request ID / 响应计时 │                                                                             │ • Eden Treaty API Client│
  │ • OWASP 防护 / CORS 预检 │                                                                             │ • Better Auth React SDK │
  │ • 滑动窗口限流 (429)     │                                                                             │ • Shadcn UI (Base-Nova) │
  │ • 全局 ApiResponse 包装 │                                                                             │ • Sonner 提示 / Confetti│
  └───────────┬─────────────┘                                                                             └─────────────────────────┘
              │
              ▼
  ┌─────────────────────────┐
  │  Drizzle ORM + SQLite   │
  ├─────────────────────────┤
  │ • Repository 数据仓储层 │
  │ • 数据文件: data/todos.db│
  │ • Drizzle Kit 数据库迁移 │
  └─────────────────────────┘
```

---

## ⚡️ 快速上手

### 1. 环境准备
确保本机已安装 **[Bun](https://bun.sh)** (`>= 1.4.0`)：
```bash
# macOS / Linux 安装 Bun
curl -fsSL https://bun.sh/install | bash
```

### 2. 克隆项目与安装依赖
```bash
git clone https://github.com/tyuan511/bun-fullstack-scaffold.git
cd bun-fullstack-scaffold

# 安装依赖 (禁止使用 npm/yarn/pnpm)
bun install
```

### 3. 初始化数据库
```bash
# 将 Drizzle 数据表结构同步至本地 SQLite 数据库 (自动创建 data/todos.db)
bun run db:push
```

### 4. 启动单端口全栈开发服务器
```bash
bun run dev
```

终端就绪后，即可访问以下服务入口：
- 📱 **前端应用界面**: [http://localhost:3000](http://localhost:3000)
- 📚 **全栈 API 接口文档 (Swagger / Scalar)**: [http://localhost:3000/swagger](http://localhost:3000/swagger)
- 🔑 **Better Auth 原生参考控制台**: [http://localhost:3000/api/auth/reference](http://localhost:3000/api/auth/reference)
- 🔌 **健康检查接口**: [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## 🛠️ 常用开发与构建指令

| 命令 | 说明 | 应用场景 |
| :--- | :--- | :--- |
| **`bun run dev`** | 启动全栈单端口开发服务器 | 客户端极速热更新 + 后端 API + Swagger 同步运行 |
| **`bun run build:css`** | 编译 Tailwind CSS v4 样式 | 手动生成 `public/styles.css` 压缩包 |
| **`bun run watch:css`** | 监听 CSS 样式变动 | 开发样式时的独立监听进程 |
| **`bun test`** | 执行全量自动化测试套件 | 涵盖认证流程、业务服务单元测试与中间件集成测试 |
| **`bun run typecheck`** | 执行 TypeScript 严格类型检查 | CI/CD 质量门禁验证 (`tsc --noEmit`) |
| **`bun run build:binary`** | 编译本机独立可执行文件 | 生成 `./bun-fullstack-app` 单文件二进制 |
| **`bun run build:linux`** | 交叉编译 Linux x64 二进制文件 | 一键分发部署至 Linux 云服务器 |
| **`bun run db:generate`** | 生成数据库迁移 SQL | 表结构变更后生成 `./drizzle` 迁移脚本 |
| **`bun run db:push`** | 同步 Schema 到 SQLite 数据库 | 快速将最新模型应用到本地 SQLite |
| **`bun run db:studio`** | 启动 Drizzle Studio 数据后台 | 可视化浏览与修改 SQLite 数据表内容 |
| **`bun run docker:build`** | 构建轻量 Docker 镜像 | 多阶段编译生产容器镜像 |
| **`docker compose up -d`** | 启动 Docker 编排服务 | 容器化部署并挂载本地数据卷持久化 |

---

## 📁 项目目录结构与职责说明

```text
├── components.json              # Shadcn UI 配置 (锁定 base-nova 风格与 @base-ui/react)
├── bunfig.toml                  # Bun 运行时全局配置
├── Dockerfile                   # 多阶段极轻量生产环境 Dockerfile
├── docker-compose.yml           # 容器编排配置 (包含持久化数据卷挂载)
├── drizzle.config.ts            # Drizzle Kit 迁移与数据库连接配置
├── package.json                 # 依赖配置与构建脚本
├── tsconfig.json                # 路径映射配置 (@/* -> src/client/*, @server/*, @shared/*)
├── drizzle/                     # Drizzle ORM 生成的 SQL 迁移文件
├── data/                        # SQLite 数据库持久化目录 (todos.db)
├── public/                      # 静态资源与全栈入口
│   ├── index.html               # 页面入口 (静态引入客户端组件与 styles.css)
│   └── styles.css               # Tailwind CSS v4 编译产物
├── tests/                       # 自动化测试套件
│   ├── auth.test.ts             # Better Auth 登录注册与会话状态集成测试
│   ├── todos.service.test.ts    # Todo Service 业务逻辑纯单元测试
│   ├── swagger.test.ts          # OpenAPI 规范、路由隐藏与 Scalar 渲染测试
│   └── server.test.ts           # 中间件防御、异常兜底与统一响应体系测试
└── src/
    ├── shared/                  # 前后端同构共享层
    │   └── types.ts             # DTOs, BusinessError, ErrorCode, ApiResponse 结构定义
    ├── server/                  # Elysia 后端应用层
    │   ├── index.ts             # 服务端启动入口与 HTTP 监听绑定
    │   ├── app.ts               # Elysia 主应用实例组合根 (供 Eden 与自动化测试复用)
    │   ├── auth.ts              # Better Auth 认证配置与 Drizzle 适配器装配
    │   ├── env.ts               # 环境变量解析与安全性校验
    │   ├── db/                  # 数据库持久化层
    │   │   ├── schema.ts        # Drizzle ORM 表结构模型定义
    │   │   ├── client.ts        # bun:sqlite 驱动与 Drizzle 客户端单例
    │   │   ├── repo.ts          # Repository 仓储数据访问层
    │   │   └── index.ts         # 数据库模块统一导出
    │   ├── plugins/             # 工业级通用中间件与增强插件
    │   │   ├── request-id.ts    # 请求链路追踪 (x-request-id) 与高精度耗时
    │   │   ├── security.ts      # OWASP 安全响应头防护
    │   │   ├── cors.ts          # CORS 与 OPTIONS 预检请求优化
    │   │   ├── rate-limiter.ts  # 内存滑动窗口限流器 (429 防刷)
    │   │   ├── logger.ts        # 彩色结构化控制台请求日志
    │   │   ├── process-fallback.ts # 未捕获异常兜底与优雅停机 (Graceful Shutdown)
    │   │   ├── swagger-auth.ts  # Better Auth OpenAPI 规整与汉化注入插件
    │   │   └── index.ts         # 中间件聚合导出
    │   └── routes/              # 业务路由领域模块
    │       └── todos/           # 待办事项领域特性
    │           ├── model.ts     # TypeBox 验证模型与输入输出模式
    │           ├── service.ts   # 核心业务逻辑实现
    │           └── index.ts     # Controller 控制器路由绑定
    └── client/                  # React 19 客户端前端源码
        ├── main.tsx             # React DOM 挂载入口
        ├── App.tsx              # 客户端根视图与业务聚合组件
        ├── index.css            # Tailwind CSS 样式入口与明暗主题 CSS 变量
        ├── components/          # 业务前端组件
        │   ├── AuthModal.tsx    # 邮箱密码登录/注册极速弹窗
        │   ├── UserNav.tsx      # 顶部用户头像与会话状态操作菜单
        │   ├── TodoForm.tsx     # 待办事项新建表单
        │   ├── TodoItem.tsx     # 待办事项列表卡片
        │   ├── TodoStats.tsx    # 待办任务数据汇总展示面板
        │   ├── TodoEditDialog.tsx # 待办事项编辑模态框
        │   ├── ThemeToggle.tsx  # 明暗主题切换组件
        │   └── ui/              # Shadcn UI (base-nova) 基础原子组件
        └── lib/                 # 客户端工具库
            ├── utils.ts         # cn() 样式合并与工具函数
            ├── api.ts           # Eden Treaty 强类型客户端封装与异常解包
            └── auth-client.ts   # Better Auth 官方 React SDK 客户端单例
```

---

## 🛡️ 统一响应格式与业务错误码体系

### 1. 标准响应模型 (`ApiResponse<T>`)
所有业务 API 请求经由全局拦截器统一格式化输出：

```typescript
export interface ApiResponse<T = unknown> {
  code: number;          // 业务状态码：0 代表成功，非 0 为各类业务/系统错误
  message: string;       // 提示信息（如 "操作成功" 或具体错误原因）
  data: T | null;        // 业务响应载荷数据
  timestamp: number;     // 响应毫秒级时间戳
  requestId?: string;    // 全链路请求追踪 ID (对应 x-request-id)
}
```

### 2. 标准错误码速查表

| 错误码 (`code`) | 常量名 | HTTP 状态码 | 业务场景说明 |
| :--- | :--- | :--- | :--- |
| **`0`** | `SUCCESS` | `200 / 201` | 请求执行成功 |
| **`40000`** | `BAD_REQUEST` | `400` | 通用请求参数不合法 |
| **`40001`** | `VALIDATION_ERROR`| `400` | TypeBox 请求体验证未通过 |
| **`40002`** | `TODO_TITLE_EMPTY`| `400` | 待办事项标题为空或纯空白字符 |
| **`40003`** | `PARSE_ERROR` | `400` | 请求体 JSON 格式无法正确解析 |
| **`40100`** | `UNAUTHORIZED` | `401` | 未提供身份凭据或登录态已失效 |
| **`40400`** | `NOT_FOUND` | `404` | 目标 API 路径或资源不存在 |
| **`40401`** | `TODO_NOT_FOUND` | `404` | 未检索到指定的待办事项记录 |
| **`40900`** | `CONFLICT` | `409` | 数据冲突或唯一约束异常 |
| **`42900`** | `RATE_LIMIT_EXCEEDED`| `429` | 客户端触发滑动窗口频率限制 |
| **`50000`** | `INTERNAL_ERROR` | `500` | 服务端未预料的系统级异常 |
| **`50001`** | `DATABASE_ERROR` | `500` | 数据库执行或连接异常 |

### 3. 主动异常抛出范式
在领域 Service 或路由中主动抛出带有明确错误码与 HTTP 状态的 `BusinessError`：
```typescript
if (!todo) {
  throw new BusinessError(ErrorCode.TODO_NOT_FOUND, "未找到指定的待办事项", 404);
}
```

---

## 🔐 Better Auth 用户认证体系

脚手架预装配置了极速、无痛的认证体验：
- **免繁体验**: 采用直登模式（`requireEmailVerification: false`），用户输入邮箱和密码即可秒级完成注册并自动建立会话，无需配置外部邮件服务器。
- **安全保障**: 认证成功后自动下发安全 `HttpOnly` 会话 Cookie，有效防御 XSS 攻击。
- **多设备会话管理**: 原生提供设备会话列表查询、指定设备会话吊销、除当前设备外批量下线功能。
- **双端同步**:
  - 服务端通过 `app.derive("global", ...)` 在全链路请求中自动注入当前 `user` 与 `session`；
  - 客户端通过 `useSession()` 响应式钩子实现登录状态驱动视图刷新。

---

## 📚 交互式 API 文档中心

本项目彻底解决了微框架通配路由导致 Swagger 产生凌乱 `*ApiAuth*` 空占位符的历史痛点：
1. **全景控制台 (`/swagger`)**：基于现代化 Scalar 界面引擎，整合了系统健康检查、待办业务 CRUD，以及由 Better Auth 生成的 18 个核心认证接口，全量汉化并补全参数模型与 Cookie / Bearer 鉴权说明。
2. **认证专属控制台 (`/api/auth/reference`)**：Better Auth 原生交互式参考文档，支持实时调试所有会话操作。

---

## 📦 生产分发与部署方案

### 方式 1：打包为单一独立二进制文件（推荐，极简交付）
```bash
# 1. 编译当前系统的独立可执行二进制程序 (仅几十 MB，自包含运行时与资源)
bun run build:binary

# 2. 本地直接执行 (目标环境无需安装 Bun、Node 或 npm 依赖)
./bun-fullstack-app
```

#### 交叉编译（如在 macOS 上一键产出 Linux 部署产物）：
```bash
# 生成针对 Linux x64 平台的自包含可执行文件
bun run build:linux

# 上传至 Linux 服务器赋予执行权限即可跑起
chmod +x ./bun-fullstack-app-linux
./bun-fullstack-app-linux
```

### 方式 2：Docker 容器编排部署
本项目提供了完备的多阶段轻量化 `Dockerfile` 与 `docker-compose.yml`，最终镜像仅保留单一二进制文件，轻薄且安全：

```bash
# 启动容器并挂载宿主机 ./data 目录持久化 SQLite 数据
docker compose up -d

# 查看容器运行日志
docker compose logs -f

# 停止容器服务
docker compose down
```

---

## 🎨 Shadcn UI (Base-Nova) 组件添加

项目完全锁定使用 `@base-ui/react` 交互原语与 Nova 高信息密度设计预设。如需扩展基础组件，直接使用官方 CLI：

```bash
# 添加下拉菜单组件
bunx --bun shadcn@latest add dropdown-menu -y

# 添加分隔线组件
bunx --bun shadcn@latest add separator -y
```

CLI 会自动读取根目录下的 `components.json`，确保新引入的组件严格保持 Base-Nova 规范。

---

## ⚙️ 环境变量说明 (`.env`)

| 环境变量 | 默认值 | 说明 |
| :--- | :--- | :--- |
| `PORT` | `3000` | 服务端监听的 HTTP 端口 |
| `NODE_ENV` | `development` | 运行环境模式 (`development` 或 `production`) |
| `BETTER_AUTH_SECRET` | 内部默认高强度密钥 | 用于签名与验证会话 Cookie 的安全密钥（生产环境建议自定义） |
| `BETTER_AUTH_URL` | `http://localhost:3000` | 认证模块基础访问根路径 |

---

## 🤝 贡献与反馈

欢迎提交 Issue 与 Pull Request 共同改进本项目！

## 📄 开源许可证

本项目基于 [MIT License](./LICENSE) 协议开源。
