import { Elysia } from "elysia";
import type { RequestIdOptions } from "./types";

/**
 * 请求追踪与耗时追踪中间件
 * 为每个请求分配唯一的 Request ID，并在响应头返回 x-request-id 与 x-response-time
 */
export const requestIdMiddleware = (options: RequestIdOptions = {}) => {
  const headerName = (options.headerName || "x-request-id").toLowerCase();
  const generateId = options.generateId || (() => crypto.randomUUID());

  return new Elysia({ name: "middleware:request-id" })
    .derive("global", ({ request, set }) => {
      const id = request.headers.get(headerName) || generateId();
      const startTime = performance.now();
      set.headers[headerName] = id;
      return {
        requestId: id,
        startTime,
      };
    })
    .onAfterHandle("global", ({ startTime, set }) => {
      if (startTime) {
        const duration = (performance.now() - startTime).toFixed(2);
        set.headers["x-response-time"] = `${duration}ms`;
      }
    });
};
