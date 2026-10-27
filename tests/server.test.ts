import { describe, expect, it } from "bun:test";
import { app } from "../src/server/app";
import { ErrorCode } from "../src/shared/types";
import { rateLimiterMiddleware } from "../src/server/plugins";
import { Elysia } from "elysia";

describe("1. 中间件功能验证 (Common Middlewares)", () => {
  it("Request ID: 自动为请求分配 x-request-id 并计算 x-response-time", async () => {
    const res = await app.handle(new Request("http://localhost/api/health"));
    expect(res.status).toBe(200);

    const reqId = res.headers.get("x-request-id");
    expect(reqId).toBeTruthy();
    expect(typeof reqId).toBe("string");
    expect(reqId!.length).toBeGreaterThan(10);

    const responseTime = res.headers.get("x-response-time");
    expect(responseTime).toBeTruthy();
    expect(responseTime).toMatch(/^\d+(\.\d+)?ms$/);
  });

  it("Request ID: 支持透传客户端已有的 x-request-id", async () => {
    const customId = "client-trace-123456";
    const res = await app.handle(
      new Request("http://localhost/api/health", {
        headers: { "x-request-id": customId },
      })
    );
    expect(res.headers.get("x-request-id")).toBe(customId);

    const body = await res.json();
    expect(body.requestId).toBe(customId);
  });

  it("Security Headers: 验证关键安全响应头设置", async () => {
    const res = await app.handle(new Request("http://localhost/api/health"));
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("x-frame-options")).toBe("SAMEORIGIN");
    expect(res.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(res.headers.get("x-xss-protection")).toBe("1; mode=block");
    expect(res.headers.get("x-download-options")).toBe("noopen");
    expect(res.headers.get("x-permitted-cross-domain-policies")).toBe("none");
  });

  it("CORS: 验证预检请求 OPTIONS 响应 204 及 CORS 响应头", async () => {
    const preflight = await app.handle(
      new Request("http://localhost/api/todos", {
        method: "OPTIONS",
      })
    );
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get("access-control-allow-origin")).toBe("*");
    expect(preflight.headers.get("access-control-allow-methods")).toContain("POST");
    expect(preflight.headers.get("access-control-max-age")).toBe("86400");
  });

  it("Rate Limiting: 达到阈值时触发 429 与 Retry-After 响应头", async () => {
    // 构建独立的 3 次限流测试实例
    const testApp = new Elysia()
      .use(
        rateLimiterMiddleware({
          max: 3,
          windowMs: 5000,
          keyGenerator: () => "test-client-ip",
        })
      )
      .onError(({ error, set }) => {
        if ((error as any).status === 429) {
          set.status = 429;
          return {
            code: (error as any).code,
            message: error.message,
          };
        }
      })
      .get("/api/test-limit", () => ({ ok: true }));

    // 前 3 次请求正常通过
    for (let i = 1; i <= 3; i++) {
      const res = await testApp.handle(new Request("http://localhost/api/test-limit"));
      expect(res.status).toBe(200);
      expect(res.headers.get("x-ratelimit-limit")).toBe("3");
      expect(res.headers.get("x-ratelimit-remaining")).toBe(String(3 - i));
    }

    // 第 4 次请求被限流拦截
    const blockedRes = await testApp.handle(new Request("http://localhost/api/test-limit"));
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.headers.get("retry-after")).toBeTruthy();

    const body = await blockedRes.json();
    expect(body.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
  });
});

describe("2. 异常兜底与统一响应体系 (Exception Fallback & Unified Response)", () => {
  it("统一响应格式: 正常 API 请求自动包装 ApiResponse 格式", async () => {
    const res = await app.handle(new Request("http://localhost/api/health"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.code).toBe(ErrorCode.SUCCESS);
    expect(body.message).toBe("操作成功");
    expect(body.data).toEqual({
      status: "ok",
      runtime: "Bun " + Bun.version,
      elysia: "2.0.0",
    });
    expect(body.timestamp).toBeGreaterThan(0);
    expect(body.requestId).toBeTruthy();
  });

  it("业务校验异常: 标题为空时返回 400 与 TODO_TITLE_EMPTY 业务错误码", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/todos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "   " }),
      })
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.code).toBe(ErrorCode.TODO_TITLE_EMPTY);
    expect(body.message).toBe("待办事项标题不能为空");
    expect(body.data).toBeNull();
    expect(body.requestId).toBeTruthy();
  });

  it("参数校验异常: 传入非法字段类型时返回 VALIDATION_ERROR", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/todos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: 12345 }), // title 应该为 string
      })
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(body.data).toBeNull();
    expect(body.requestId).toBeTruthy();
  });

  it("JSON 解析异常: 客户端发送畸形 JSON 时返回 PARSE_ERROR", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/todos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "malformed-json{{",
      })
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.code).toBe(ErrorCode.PARSE_ERROR);
    expect(body.message).toContain("请求体数据格式错误");
    expect(body.requestId).toBeTruthy();
  });

  it("资源未找到: 请求不存在的 API 路由时返回 404 与 NOT_FOUND", async () => {
    const res = await app.handle(new Request("http://localhost/api/non-existent-route"));
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.code).toBe(ErrorCode.NOT_FOUND);
    expect(body.message).toContain("不存在");
    expect(body.requestId).toBeTruthy();
  });

  it("待办事项未找到: 更新或删除不存在的 ID 时返回 TODO_NOT_FOUND", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/todos/non-existent-id-9999", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ completed: true }),
      })
    );
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.code).toBe(ErrorCode.TODO_NOT_FOUND);
    expect(body.requestId).toBeTruthy();
  });
});
