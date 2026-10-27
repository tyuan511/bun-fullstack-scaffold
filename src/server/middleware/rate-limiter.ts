import { Elysia } from "elysia";
import { BusinessError, ErrorCode } from "@shared/types";
import type { RateLimiterOptions } from "./types";

interface RateRecord {
  count: number;
  resetTime: number;
}

class InMemoryStore {
  private store = new Map<string, RateRecord>();
  private cleanupTimer: ReturnType<typeof setInterval>;

  constructor(cleanupIntervalMs: number = 60_000) {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);
    // 避免定时器阻止进程优雅退出
    this.cleanupTimer.unref();
  }

  get(key: string): RateRecord | undefined {
    return this.store.get(key);
  }

  set(key: string, record: RateRecord): void {
    this.store.set(key, record);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now >= record.resetTime) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

/**
 * 内存滑动窗口接口限流中间件 (防刷 / 防 DoS)
 * 仅对指定前缀 (默认 /api) 生效，超限时返回统一 429 错误体与标准 RateLimit 响应头
 */
export const rateLimiterMiddleware = (options: RateLimiterOptions = {}) => {
  const max = options.max ?? 120;
  const windowMs = options.windowMs ?? 60_000;
  const pathPrefix = options.pathPrefix ?? "/api";
  const keyGenerator = options.keyGenerator ?? getClientIp;
  const store = new InMemoryStore(windowMs);

  return new Elysia({ name: "middleware:rate-limiter" })
    .onBeforeHandle("global", ({ path, request, set }) => {
      // 仅限制 API 请求
      if (!path.startsWith(pathPrefix)) {
        return;
      }

      // 允许健康检查等豁免接口
      if (options.skip && options.skip(path, request)) {
        return;
      }

      const key = keyGenerator(request);
      const now = Date.now();
      let record = store.get(key);

      if (!record || now >= record.resetTime) {
        record = {
          count: 1,
          resetTime: now + windowMs,
        };
        store.set(key, record);
      } else {
        record.count++;
      }

      const remaining = Math.max(0, max - record.count);
      const resetSeconds = Math.ceil(record.resetTime / 1000);

      set.headers["x-ratelimit-limit"] = String(max);
      set.headers["x-ratelimit-remaining"] = String(remaining);
      set.headers["x-ratelimit-reset"] = String(resetSeconds);

      if (record.count > max) {
        const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
        set.headers["retry-after"] = String(retryAfterSeconds);

        throw new BusinessError(
          ErrorCode.RATE_LIMIT_EXCEEDED,
          `请求过于频繁，请在 ${retryAfterSeconds} 秒后重试`,
          429
        );
      }
    });
};
