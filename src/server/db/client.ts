import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import * as schema from "./schema";

const dbPath = resolve(process.cwd(), "data/todos.db");
const dbDir = dirname(dbPath);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

// 底层 bun:sqlite 驱动实例
export const sqlite = new Database(dbPath, { create: true });

// 初始化 Drizzle ORM 实例并注入完整 Schema
export const db = drizzle(sqlite, { schema });

// 确保初始基础表结构就绪 (Todos + Better Auth 规范结构)
sqlite.run(`
  CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    priority TEXT NOT NULL DEFAULT 'medium',
    category TEXT NOT NULL DEFAULT '工作',
    dueDate TEXT,
    userId TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    emailVerified INTEGER NOT NULL DEFAULT 0,
    image TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    expiresAt INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    ipAddress TEXT,
    userAgent TEXT,
    userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    accountId TEXT NOT NULL,
    providerId TEXT NOT NULL,
    userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    accessToken TEXT,
    refreshToken TEXT,
    idToken TEXT,
    accessTokenExpiresAt INTEGER,
    refreshTokenExpiresAt INTEGER,
    scope TEXT,
    password TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expiresAt INTEGER NOT NULL,
    createdAt INTEGER,
    updatedAt INTEGER
  );
`);

// 容错迁移：如果已存在老的 todos 表，补充 userId 列
try {
  const tableInfo = sqlite.prepare("PRAGMA table_info(todos)").all() as Array<{ name: string }>;
  if (!tableInfo.some((col) => col.name === "userId")) {
    sqlite.run("ALTER TABLE todos ADD COLUMN userId TEXT");
  }
} catch {
  // 忽略已存在或非必要异常
}

// 检查并插入初始种子数据
const countStmt = sqlite.prepare("SELECT count(*) as count FROM todos");
const result = countStmt.get() as { count: number };

if (result.count === 0) {
  const seedTodos: Array<schema.TodoInsert> = [
    {
      id: crypto.randomUUID(),
      title: "🚀 探索 Bun 极速 JavaScript/TypeScript 全栈运行时",
      completed: true,
      priority: "high",
      category: "学习",
      dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      title: "⚡️ 体验 ElysiaJS 极致性能与 Eden Treaty 端到端类型安全",
      completed: false,
      priority: "high",
      category: "工作",
      dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      title: "🎨 使用 Shadcn UI + Tailwind CSS 构建现代化精致界面",
      completed: false,
      priority: "medium",
      category: "生活",
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      title: "📦 使用 Drizzle ORM 进行强类型数据模型与持久化开发",
      completed: false,
      priority: "high",
      category: "学习",
      dueDate: new Date(Date.now() + 4 * 86400000).toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      title: "🔐 体验 Better Auth 用户认证与会话管理",
      completed: false,
      priority: "high",
      category: "工作",
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const item of seedTodos) {
    db.insert(schema.todos).values(item).run();
  }
}

/**
 * 安全关闭 SQLite 数据库连接
 */
export function closeDatabase(): void {
  try {
    sqlite.close();
  } catch {
    // 忽略已关闭或重复关闭的异常
  }
}
