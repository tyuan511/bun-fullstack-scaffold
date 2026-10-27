export interface ProcessFallbackOptions {
  /**
   * 服务实例，停机时调用其 stop()
   */
  server?: { stop: () => void | Promise<void> } | null;
  /**
   * 数据库或持久化连接清理函数
   */
  onShutdown?: () => void | Promise<void>;
  /**
   * 超时强制退出毫秒数，默认 5000ms
   */
  timeoutMs?: number;
}

let isInitialized = false;
let isShuttingDown = false;

/**
 * 注册 Node/Bun 进程级未捕获异常与优雅停机 (Graceful Shutdown) 处理
 */
export function setupProcessFallback(options: ProcessFallbackOptions = {}): void {
  if (isInitialized) return;
  isInitialized = true;

  // 1. 未捕获的同步异常兜底 (防止进程无日志静默崩溃)
  process.on("uncaughtException", (error: Error, origin: string) => {
    console.error(`\n\x1b[31m================ [CRITICAL ERROR] 未捕获的系统异常 ================\x1b[0m`);
    console.error(`时间:   ${new Date().toISOString()}`);
    console.error(`来源:   ${origin}`);
    console.error(`信息:   ${error?.message || error}`);
    if (error?.stack) {
      console.error(`堆栈:\n${error.stack}`);
    }
    console.error(`\x1b[31m====================================================================\x1b[0m\n`);
  });

  // 2. 未处理的 Promise Rejection 兜底
  process.on("unhandledRejection", (reason: unknown) => {
    console.warn(`\n\x1b[33m================ [WARNING] 未处理的异步 Promise Rejection ================\x1b[0m`);
    console.warn(`时间:   ${new Date().toISOString()}`);
    console.warn(`原因:   ${reason instanceof Error ? reason.stack || reason.message : JSON.stringify(reason)}`);
    console.warn(`\x1b[33m==========================================================================\x1b[0m\n`);
  });

  // 3. 优雅停机信号处理 (SIGINT / SIGTERM)
  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\n\x1b[36m[System] 🛑 收到终止信号 (${signal})，正在执行优雅停机 (Graceful Shutdown)...\x1b[0m`);

    // 设置安全超时强制退出定时器
    const timeout = options.timeoutMs ?? 5000;
    const forceTimer = setTimeout(() => {
      console.error(`\x1b[31m[System] ⚠️ 停机超时 (${timeout}ms)，正在强制退出进程...\x1b[0m`);
      process.exit(1);
    }, timeout);
    forceTimer.unref();

    try {
      // 停止接收新的 HTTP 连接
      if (options.server?.stop) {
        console.log(`[System] 🔌 正在停止 HTTP 服务并释放端口...`);
        await options.server.stop();
      }

      // 执行资源清理逻辑 (如数据库关闭)
      if (options.onShutdown) {
        console.log(`[System] 💾 正在释放数据库连接与文件句柄...`);
        await options.onShutdown();
      }

      console.log(`\x1b[32m[System] ✅ 所有服务与资源已安全释放，进程安全退出。\x1b[0m\n`);
      process.exit(0);
    } catch (err) {
      console.error(`\x1b[31m[System] ❌ 停机清理过程中发生异常:\x1b[0m`, err);
      process.exit(1);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}
