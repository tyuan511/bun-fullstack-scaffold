import homepage from "../../public/index.html";
import { app, type App } from "./app";
import { closeDatabase } from "./db";
import { setupProcessFallback } from "./plugins";
import { env } from "./env";

/**
 * 服务端进程入口点 (遵循官方最佳实践 src/index.ts 规范)
 * 职责：读取校验环境配置、绑定 HTTP 监听、挂载 Bun 原生 Fullstack Dev 路由与注册优雅停机信号
 */
export function startServer(port: number = env.PORT) {
  const s = Bun.serve({
    port,
    routes: {
      "/": homepage,
      "/index.html": homepage,
    },
    development: !env.isProduction,
    fetch(req) {
      return app.fetch(req);
    },
  });

  // 注册进程级未捕获异常与优雅停机兜底 (SIGINT/SIGTERM)
  setupProcessFallback({
    server: s,
    onShutdown: () => closeDatabase(),
  });

  console.log(`\n======================================================`);
  console.log(`🚀 Bun Fullstack 脚手架已启动:  http://localhost:${s.port}`);
  console.log(`📱 前端界面:                  http://localhost:${s.port}`);
  console.log(`📚 Swagger/Scalar API 文档:    http://localhost:${s.port}/swagger`);
  console.log(`🔑 Better Auth 参考控制台:     http://localhost:${s.port}/api/auth/reference`);
  console.log(`🔌 API 接口:                  http://localhost:${s.port}/api/todos`);
  console.log(`======================================================\n`);

  return s;
}

export let server: ReturnType<typeof Bun.serve> | null = null;

// 作为入口直接运行时启动服务监听
if (import.meta.main) {
  server = startServer();
}

export { app, type App };
