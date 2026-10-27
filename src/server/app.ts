import { Elysia, NotFound, ValidationError } from "elysia";
import { openapi } from "@elysia/openapi";
import { todoRoutes } from "./routes/todos";
import { auth } from "./auth";
import { BusinessError, ErrorCode } from "@shared/types";
import {
  requestIdMiddleware,
  securityMiddleware,
  corsMiddleware,
  loggerMiddleware,
  rateLimiterMiddleware,
  authOpenApiSpec,
} from "./plugins";
import { env } from "./env";

/**
 * Elysia 应用实例组合 (遵循官方最佳实践 src/app.ts 规范)
 * 职责：负责应用级插件挂载、全局响应映射、异常捕获与各业务特性 (Feature Controllers) 的组合导出。
 * 不在此处绑定端口监听，方便单元测试 (bun test) 与 Eden Treaty 类型导出直接导入。
 */
export const app = new Elysia({ normalize: "typebox" })
  // 1. 请求追踪中间件：生成/透传 x-request-id 并记录耗时 x-response-time
  .use(requestIdMiddleware())

  // 2. 基础安全响应头中间件 (OWASP 防护规范：nosniff, frame-options, xss 等)
  .use(securityMiddleware())

  // 3. CORS 跨域中间件 (支持外部客户端与预检请求)
  .use(corsMiddleware())

  // 4. API 接口滑动窗口限流中间件 (默认 120 次/分钟/IP，防刷防暴力攻击)
  .use(
    rateLimiterMiddleware({
      max: 120,
      windowMs: 60_000,
      skip: (path) => path === "/api/health" || path.startsWith("/api/auth"),
    })
  )

  // 5. 彩色结构化控制台请求日志中间件
  .use(loggerMiddleware())

  // 6. 解析并注入当前会话用户信息 (全链路注入 user 与 session)
  .derive("global", async ({ request }) => {
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      return {
        user: session?.user || null,
        session: session?.session || null,
      };
    } catch {
      return {
        user: null,
        session: null,
      };
    }
  })

  // 7. 全局异常捕获中间件：统一异常兜底与错误码格式化
  .onError(({ error, set, path, request, ...rest }) => {
    // Better Auth 内部请求由其自身错误机制接管
    if (path.startsWith("/api/auth")) {
      return;
    }

    const err = error as (Error & Record<string, any>) | undefined;
    const errName = err?.name || "";
    const errCode = (err as any)?.code;
    const reqId =
      (rest as any).requestId ||
      request?.headers?.get("x-request-id") ||
      crypto.randomUUID();

    // 非 API 路由且为 NotFound 时放行 (由前端页面路由处理)
    if (!path.startsWith("/api") && (error instanceof NotFound || errName === "NotFound")) {
      return;
    }

    // 1. 业务主动抛出的 BusinessError 异常 (如自定义 400, 404, 429 限流等)
    if (error instanceof BusinessError) {
      set.status = error.status;
      return {
        code: error.code,
        message: error.message,
        data: null,
        timestamp: Date.now(),
        requestId: reqId,
      };
    }

    // 2. TypeBox 请求参数格式/字段校验异常
    if (error instanceof ValidationError || errName === "ValidationError") {
      set.status = 400;
      let message = "请求参数校验失败";
      try {
        const issues = (err as any)?.all;
        if (issues && issues.length > 0) {
          message = issues.map((i: any) => i.summary || i.message).join("; ");
        } else if (err?.message) {
          message = err.message;
        }
      } catch {}
      return {
        code: ErrorCode.VALIDATION_ERROR,
        message,
        data: null,
        timestamp: Date.now(),
        requestId: reqId,
      };
    }

    // 3. 请求体解析异常 (如客户端发送了损坏的 JSON)
    if (errName === "ParseError" || errCode === "PARSE") {
      set.status = 400;
      return {
        code: ErrorCode.PARSE_ERROR,
        message: "请求体数据格式错误 (无法解析为有效 JSON)",
        data: null,
        timestamp: Date.now(),
        requestId: reqId,
      };
    }

    // 4. 404 路由或 API 资源不存在
    if (error instanceof NotFound || errName === "NotFound") {
      set.status = 404;
      return {
        code: ErrorCode.NOT_FOUND,
        message: `请求的 API 接口不存在: ${path}`,
        data: null,
        timestamp: Date.now(),
        requestId: reqId,
      };
    }

    // 5. 其他未捕获的未知系统级异常
    console.error(`\x1b[31m[Unhandled Exception] [${reqId || "unknown"}] ${path}:\x1b[0m`, error);
    const statusNum = typeof set.status === "number" ? set.status : 500;
    set.status = statusNum;
    return {
      code: ErrorCode.INTERNAL_ERROR,
      message: env.isProduction
        ? "服务器内部发生未知异常"
        : err?.message || "服务器内部发生未知异常",
      data: null,
      timestamp: Date.now(),
      requestId: reqId,
    };
  })

  // 7. 全局响应拦截中间件：为 /api (排除 /api/auth) 统一包装外层响应格式 ApiResponse<T>
  .mapResponse(({ responseValue, path, set, request, ...rest }) => {
    // 排除 Better Auth，使其保留原生 Response 及 Set-Cookie
    if (path.startsWith("/api") && !path.startsWith("/api/auth")) {
      const httpStatus = typeof set.status === "number" ? set.status : 200;
      const reqId =
        (rest as any).requestId ||
        request?.headers?.get("x-request-id") ||
        undefined;

      // 若已经是包装好的统一格式，直接透传返回
      if (
        responseValue !== null &&
        typeof responseValue === "object" &&
        "code" in responseValue &&
        "timestamp" in responseValue
      ) {
        if (!("requestId" in responseValue) && reqId) {
          (responseValue as any).requestId = reqId;
        }
        return Response.json(responseValue, { status: httpStatus });
      }

      return Response.json(
        {
          code: ErrorCode.SUCCESS,
          message: "操作成功",
          data: responseValue ?? null,
          timestamp: Date.now(),
          requestId: reqId,
        },
        { status: httpStatus }
      );
    }
  })

  // 8. 挂载 Better Auth 认证 API 端点 (/api/auth/*)
  // 通过 detail.hide: true 隐藏未处理的原始通配符，在下方文档插件中注入由 Better Auth 生成的强类型 OpenAPI 规范
  .all(
    "/api/auth/*",
    {
      detail: { hide: true },
    },
    ({ request }) => auth.handler(request)
  )

  // 9. Swagger / OpenAPI 文档插件 (集成 Scalar 现代化交互式文档)
  .use(
    openapi({
      path: "/swagger",
      documentation: {
        info: {
          title: "Bun Fullstack 脚手架 API",
          version: "2.0.0",
          description:
            "基于 Elysia 2.0 官方最佳实践与 Bun 原生 Fullstack 模式构建的极速全栈脚手架 (Bun Fullstack 脚手架)。\n\n" +
            "包含了完整的待办事项 CRUD 接口、系统基础状态以及由 Better Auth 驱动的端到端安全身份认证与多设备会话管理。\n\n" +
            "💡 认证模块亦可访问专属交互式控制台：[Better Auth Reference](/api/auth/reference)",
        },
        tags: [
          ...authOpenApiSpec.tags,
          { name: "Todos", description: "待办事项管理接口" },
          { name: "System", description: "系统基础接口" },
        ],
        paths: authOpenApiSpec.paths,
        components: authOpenApiSpec.components,
      },
    })
  )

  // 9. API 路由分组 (分发至 feature controllers)
  .group("/api", (api) =>
    api
      .get(
        "/health",
        {
          detail: {
            summary: "服务健康检查",
            tags: ["System"],
          },
        },
        () => ({
          status: "ok",
          runtime: "Bun " + Bun.version,
          elysia: "2.0.0",
        })
      )
      .use(todoRoutes)
  );

export type App = typeof app;
