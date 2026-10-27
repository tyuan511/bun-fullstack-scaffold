import { Elysia } from "elysia";
import type { LoggerOptions } from "./types";

function formatStatus(status: number): string {
  if (status >= 500) return `\x1b[31m🔴 ${status}\x1b[0m`;
  if (status >= 400) return `\x1b[33m🟡 ${status}\x1b[0m`;
  if (status >= 300) return `\x1b[36m🔵 ${status}\x1b[0m`;
  return `\x1b[32m🟢 ${status}\x1b[0m`;
}

function formatMethod(method: string): string {
  const m = method.padEnd(6, " ");
  switch (method.toUpperCase()) {
    case "GET":
      return `\x1b[34m${m}\x1b[0m`;
    case "POST":
      return `\x1b[32m${m}\x1b[0m`;
    case "PUT":
      return `\x1b[35m${m}\x1b[0m`;
    case "PATCH":
      return `\x1b[33m${m}\x1b[0m`;
    case "DELETE":
      return `\x1b[31m${m}\x1b[0m`;
    default:
      return `\x1b[37m${m}\x1b[0m`;
  }
}

const STATIC_EXTENSIONS = [".css", ".js", ".map", ".ico", ".png", ".jpg", ".jpeg", ".svg", ".woff", ".woff2"];

function isStaticAsset(path: string): boolean {
  return STATIC_EXTENSIONS.some((ext) => path.endsWith(ext));
}

/**
 * 结构化彩色控制台访问日志中间件
 */
export const loggerMiddleware = (options: LoggerOptions = {}) => {
  const skipAssets = options.skipAssets !== false;

  return new Elysia({ name: "middleware:logger" })
    .onAfterResponse("global", ({ request, path, set, ...rest }: any) => {
      const { startTime, requestId } = rest;
      // 过滤静态静态资源请求，减少日志干扰
      if (skipAssets && isStaticAsset(path)) {
        return;
      }
      if (options.skip && options.skip(path, request)) {
        return;
      }

      const duration = startTime ? (performance.now() - (startTime as number)).toFixed(2) : "0.00";
      const statusNum = typeof set.status === "number" ? set.status : 200;
      const formattedStatus = formatStatus(statusNum);
      const formattedMethod = formatMethod(request.method);
      const paddedDuration = `${duration}ms`.padStart(8, " ");
      const idTag = requestId ? `\x1b[90m[${(requestId as string).slice(0, 8)}]\x1b[0m` : "";

      console.log(`[HTTP] ${formattedStatus} | ${paddedDuration} | ${formattedMethod} ${path} ${idTag}`);
    });
};
