import { describe, expect, it } from "bun:test";
import { app } from "../src/server/app";

describe("Swagger & Better Auth OpenAPI 文档集成测试", () => {
  it("GET /swagger/json: 能够成功获取合并后的 OpenAPI 规范", async () => {
    const res = await app.handle(new Request("http://localhost:3000/swagger/json"));
    expect(res.status).toBe(200);

    const schema = await res.json();
    expect(schema.openapi).toBeTruthy();
    expect(schema.info).toBeTruthy();
    expect(schema.info.title).toContain("Bun Fullstack 脚手架");

    // 1. 验证原始丑陋的通配符 /api/auth/* 已被彻底隐藏
    expect(schema.paths["/api/auth/*"]).toBeUndefined();

    // 2. 验证核心认证接口已注入并优雅展示
    const signInPath = schema.paths["/api/auth/sign-in/email"];
    expect(signInPath).toBeDefined();
    expect(signInPath.post).toBeDefined();
    expect(signInPath.post.tags).toContain("Auth");
    expect(signInPath.post.summary).toBe("邮箱密码登录");
    expect(signInPath.post.requestBody).toBeDefined();

    const signUpPath = schema.paths["/api/auth/sign-up/email"];
    expect(signUpPath).toBeDefined();
    expect(signUpPath.post.tags).toContain("Auth");
    expect(signUpPath.post.summary).toBe("邮箱密码注册");

    const getSessionPath = schema.paths["/api/auth/get-session"];
    expect(getSessionPath).toBeDefined();
    expect(getSessionPath.get.tags).toContain("Auth");
    expect(getSessionPath.get.summary).toBe("获取当前会话及用户信息");

    const signOutPath = schema.paths["/api/auth/sign-out"];
    expect(signOutPath).toBeDefined();
    expect(signOutPath.post.tags).toContain("Auth");
    expect(signOutPath.post.summary).toBe("退出当前会话");

    // 3. 验证业务 Todos 接口与 System 接口依然完好无损
    expect(schema.paths["/api/todos/"]).toBeDefined();
    expect(schema.paths["/api/health"]).toBeDefined();

    // 4. 验证标签分类
    const tagNames = schema.tags.map((t: any) => t.name);
    expect(tagNames).toContain("Auth");
    expect(tagNames).toContain("Todos");
    expect(tagNames).toContain("System");

    // 5. 验证组件模型与安全凭据
    expect(schema.components.schemas.User).toBeDefined();
    expect(schema.components.schemas.Session).toBeDefined();
    expect(schema.components.securitySchemes.apiKeyCookie).toBeDefined();
    expect(schema.components.securitySchemes.bearerAuth).toBeDefined();
  });

  it("GET /swagger: 交互式文档主界面正常渲染 (Scalar UI)", async () => {
    const res = await app.handle(new Request("http://localhost:3000/swagger"));
    expect(res.status).toBe(200);
    const contentType = res.headers.get("content-type");
    expect(contentType).toContain("text/html");

    const html = await res.text();
    expect(html).toContain("<title>");
    expect(html).toContain("Bun Fullstack 脚手架");
  });

  it("GET /api/auth/reference: Better Auth 原生 Scalar 参考页正常响应", async () => {
    const res = await app.handle(new Request("http://localhost:3000/api/auth/reference"));
    expect(res.status).toBe(200);
    const contentType = res.headers.get("content-type");
    expect(contentType).toContain("text/html");

    const html = await res.text();
    expect(html).toContain("Scalar API Reference");
  });
});
