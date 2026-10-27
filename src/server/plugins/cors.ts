import { Elysia } from "elysia";
import type { CorsOptions } from "./types";

/**
 * 跨域资源共享 (CORS) 中间件
 * 默认支持所有来源调用 API，并自动响应 OPTIONS 预检请求
 */
export const corsMiddleware = (options: CorsOptions = {}) => {
  const origin = Array.isArray(options.origin) ? options.origin.join(", ") : options.origin || "*";
  const methods = (
    options.methods || ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]
  ).join(", ");
  const allowedHeaders = (
    options.allowedHeaders || [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-Request-Id",
    ]
  ).join(", ");
  const maxAge = String(options.maxAge || 86400);

  return new Elysia({ name: "middleware:cors" })
    .onRequest(({ request, set }) => {
      set.headers["access-control-allow-origin"] = origin;
      set.headers["access-control-allow-methods"] = methods;
      set.headers["access-control-allow-headers"] = allowedHeaders;

      if (request.method === "OPTIONS") {
        set.status = 204;
        set.headers["access-control-max-age"] = maxAge;
        return new Response(null, {
          status: 204,
          headers: set.headers as HeadersInit,
        });
      }
    });
};
