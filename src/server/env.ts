/**
 * 环境变量解析与校验模块 (遵循 Elysia 官方最佳实践 src/env.ts 规范)
 */
export const env = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
} as const;
