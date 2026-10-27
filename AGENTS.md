# AGENTS.md — Bun Fullstack 脚手架 AI Agent 协作与开发指南

欢迎来到 **Bun Fullstack 脚手架 (ElysiaJS 2.0 + React 19 + Shadcn UI + Bun 原生全栈)** 项目！  
本文档专为在当前仓库中工作的 AI Coding Agent 与开发者提供统一的开发规范、架构标准、常用命令及行为指引。

---

## 🧭 1. 核心技术栈与架构全景

- **运行时与打包器 (Runtime & Bundler)**: **Bun** (`>= 1.4.0`)。禁止使用 npm/yarn/pnpm，所有依赖安装与脚本执行均统一使用 `bun`。
- **服务端框架 (Backend)**: **ElysiaJS 2.0 (RC)**，采用原生 TypeBox (`@sinclair/typebox`) 模式校验输入输出。
- **客户端架构 (Frontend)**: **React 19** + **Bun 原生 Fullstack**（无需 Vite/Webpack，通过 HTML 静态资源导入直接享受极速 HMR）。
- **样式与设计系统 (Design System)**:
  - **Tailwind CSS v4**（CSS-first 配置，使用 `@theme` 指令，无 `tailwind.config.js`）。
  - **Shadcn UI (Base-Nova)**：
    - 底层原语：**Base UI** (`@base-ui/react`)，不使用 Radix UI。
    - 视觉预设：**Nova 风格**（高信息密度、紧凑内边距、圆角与精密微交互）。
    - 工具库：官方高性能 `cn` 包（由 `@shadcn-ui/cn` 维护）。
- **数据库与 ORM (Database & ORM)**: **Drizzle ORM** (`drizzle-orm/bun-sqlite`) + 内置 **bun:sqlite**（存储在 `data/todos.db`）。
- **用户认证 (Authentication)**: **Better Auth** (`better-auth`)，开箱即用的邮箱密码免验证直接登录、安全 HttpOnly 会话 Cookie。
- **端到端类型安全 (RPC)**: **Elysia Eden Treaty** (`@elysiajs/eden`)，前端与后端完全共享强类型。
- **工业级分发能力 (Distribution)**: 支持通过 `bun build --compile` 打包为无外部依赖的单一独立自包含二进制文件（`./bun-fullstack-app`），并提供轻量级多阶段 Docker 构建。

---

## 🛠️ 2. 常用开发与构建命令

所有命令均需在项目根目录下通过 `bun` 执行：

### 开发与测试
```bash
# 启动全栈单端口开发服务器 (前端热重载 + 后端 API + Swagger: http://localhost:3000)
bun run dev

# 编译 Tailwind CSS v4 样式
bun run build:css

# 监听 Tailwind CSS v4 样式改动
bun run watch:css

# 执行所有自动化测试 (包括 Auth、Todo 业务单元测试、中间件集成测试)
bun test

# 执行 TypeScript 严格类型检查 (必须 0 错误)
bun run typecheck
```

### 数据库操作 (Drizzle ORM)
```bash
# 基于 src/server/db/schema.ts 生成数据库迁移 SQL 文件
bun run db:generate

# 将最新数据表结构直接推送到本地 SQLite 数据库
bun run db:push

# 启动 Drizzle Studio 可视化数据管理后台
bun run db:studio
```

### Shadcn UI 组件管理 (Base-Nova)
```bash
# 添加官方 Shadcn 组件 (会自动读取 components.json 锁定 base-nova 风格并使用 @base-ui/react)
bunx --bun shadcn@latest add <component-name>

# 示例：添加下拉菜单或分隔线
bunx --bun shadcn@latest add dropdown-menu -y
bunx --bun shadcn@latest add separator -y
```

### 单二进制与容器打包
```bash
# 编译当前操作系统的独立可执行二进制文件
bun run build:binary

# 交叉编译 Linux x64 平台独立二进制文件 (用于部署至 Linux 服务器)
bun run build:linux

# 本地生产模式运行编译产物
./bun-fullstack-app

# Docker 容器构建与编排运行
bun run docker:build
docker compose up -d
```

---

## 📁 3. 目录结构与关键职责

```text
├── components.json              # Shadcn UI 核心配置 (style: base-nova, tailwind v4, path aliases)
├── bunfig.toml                  # Bun 运行时全局配置
├── Dockerfile                   # 多阶段编译轻量化 Dockerfile
├── docker-compose.yml           # 容器编排配置 (包含数据卷持久化)
├── drizzle.config.ts            # Drizzle Kit 迁移与数据库连接配置
├── package.json                 # 项目依赖与 Scripts
├── tsconfig.json                # TypeScript 路径映射 (@/* -> src/client/*, @server/*, @shared/*)
├── drizzle/                     # Drizzle ORM 生成的 SQL 迁移文件与元数据
├── data/                        # SQLite 数据库持久化目录 (todos.db)
├── public/                      # 静态资源与全栈入口
│   ├── index.html               # 页面入口 (静态引入客户端组件与 styles.css)
│   └── styles.css               # Tailwind CSS v4 编译生成的纯 CSS 产物
├── tests/                       # 自动化测试套件
│   ├── auth.test.ts             # Better Auth 登录注册与会话状态测试
│   ├── todos.service.test.ts    # Todo Service 业务逻辑纯单元测试
│   └── server.test.ts           # 中间件与统一响应体系集成测试
└── src/
    ├── shared/                  # 前后端共享层
    │   └── types.ts             # DTOs, BusinessError, ErrorCode, ApiResponse 结构定义
    ├── server/                  # Elysia 后端逻辑
    │   ├── app.ts               # Elysia 主应用实例装配
    │   ├── index.ts             # 后端启动入口与静态资源服务绑定
    │   ├── auth.ts              # Better Auth 认证配置
    │   ├── env.ts               # 环境变量安全校验
    │   ├── db/                  # 数据库层
    │   │   ├── schema.ts        # Drizzle ORM 数据表模型定义
    │   │   ├── client.ts        # bun:sqlite 与 Drizzle 客户端单例
    │   │   └── repo.ts          # Repository 数据访问仓储层
    │   ├── middleware/          # 通用工业级中间件 (RequestID, Logger, Security, CORS, RateLimiter, ProcessFallback)
    │   └── routes/              # REST 业务路由模块 (按 domain 组织，如 routes/todos/)
    └── client/                  # React 19 客户端前端
        ├── main.tsx             # React DOM 挂载入口
        ├── App.tsx              # 客户端根视图组件
        ├── index.css            # Tailwind CSS v4 样式入口与 CSS 主题变量
        ├── components/          # 业务前端组件 (TodoForm, TodoItem, AuthModal, UserNav, ThemeToggle)
        │   └── ui/              # Shadcn UI (base-nova) 基础组件库
        └── lib/
            ├── utils.ts         # cn() 样式合并与通用客户端工具函数
            ├── api.ts           # Eden Treaty 客户端封装与统一请求解包
            └── auth-client.ts   # Better Auth 客户端 SDK 单例
```

---

## 📐 4. 核心规范与开发约定

### 4.1 后端开发规范 (Backend Conventions)
1. **端到端类型校验**:
   - 所有的请求体 (`body`)、查询参数 (`query`)、路径参数 (`params`) 必须使用 TypeBox (`t.Object(...)`) 进行显式模式声明。
   - 路由应放在模块化的领域目录内（如 `src/server/routes/todos/`），分为 `model.ts`（模式定义）、`service.ts`（业务逻辑）、`index.ts`（路由绑定）。
2. **统一响应结构与错误拦截**:
   - 所有成功 API 请求均通过外层统一响应拦截器格式化为 `ApiResponse<T>`:
     ```typescript
     {
       code: 0,
       message: "操作成功",
       data: result,
       timestamp: Date.now(),
       requestId: "..."
     }
     ```
   - 业务异常必须主动抛出 `BusinessError`：
     ```typescript
     throw new BusinessError(ErrorCode.TODO_NOT_FOUND, "未找到指定的待办事项", 404);
     ```
   - 禁止在业务代码中直接返回未结构化的原始字符串错误或硬编码的纯数字状态。
3. **数据库操作规范**:
   - 数据表定义必须统一存放在 `src/server/db/schema.ts`。
   - 所有数据库改动需遵循 Drizzle 最佳实践，通过仓储层（`repo.ts`）解耦业务逻辑。
   - 修改表结构后，务必执行 `bun run db:generate` 并通过 `bun run db:push` 应用。

### 4.2 前端开发规范 (Frontend Conventions)
1. **Shadcn UI (Base-Nova) 体系**:
   - 所有无样式交互原语均基于 `@base-ui/react`。**绝对不要**引入 `@radix-ui/*`。
   - 组件样式必须维持 Nova 紧凑风格：默认内边距紧凑、尺寸精简、避免过多无意义留白。
   - 类名组合必须统一使用 `import { cn } from "cn"` 或 `import { cn } from "@/lib/utils"`。
2. **Tailwind CSS v4 规范**:
   - 不得新建 `tailwind.config.js`。
   - 全局主题变量统一在 `src/client/index.css` 的 `:root` 与 `.dark` 中定义。
   - 在 `@theme` 块内映射 CSS 变量，并在 `@layer base` 保持 `* { @apply border-border; }`，杜绝边框回退为 `currentColor` 黑色。
3. **接口调用**:
   - 优先通过 `src/client/lib/api.ts`（基于 Eden Treaty）进行带类型的后端交互，自动解包 `ApiResponse.data` 并将异常转换为友好的用户提示。

---

## 🤖 5. AI Agent 行为准则 (Rules for Agents)

AI 智能体在修改或扩展本代码库时，**必须**严格遵守以下准则：

1. **质量门禁 (Quality Gate)**:
   - 任何代码改动完成后，**必须主动执行**：
     ```bash
     bun run typecheck
     bun test
     ```
   - 确保 TypeScript 检查 0 错误、所有测试用例全部通过，方可结束任务或向用户交付。
2. **组件安装规范**:
   - 若需安装新的 UI 组件，必须优先通过官方命令添加：`bunx --bun shadcn@latest add <component> -y`，严禁手动手写违背 `base-nova` 规范的组件。
3. **单二进制兼容性保护**:
   - 本项目核心卖点之一是支持编译为单一二进制（`bun build --compile`）。
   - **绝对禁止**引入依赖 Node.js 本地 C++ 编译插件（如 `node-gyp`、原生 binding）或对文件系统动态硬编码路径的第三方库，确保 `bun run build:binary` 随时可顺利构建。
4. **测试驱动保障**:
   - 为新增的业务服务（Service）、关键 API 路由或实用工具新增逻辑时，必须在 `tests/` 目录下配套编写测试用例。
