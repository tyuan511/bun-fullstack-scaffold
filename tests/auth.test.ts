import { describe, expect, it } from "bun:test";
import { app } from "../src/server/app";

describe("Better Auth 邮箱密码注册登录测试 (No Verification Needed)", () => {
  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = "testPassword123";
  let sessionCookie = "";

  it("POST /api/auth/sign-up/email: 极速直接注册账号 (无需验证直接通过)", async () => {
    const res = await app.handle(
      new Request("http://localhost:3000/api/auth/sign-up/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "测试用户",
          email: testEmail,
          password: testPassword,
        }),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toBeTruthy();
    expect(body.user.email).toBe(testEmail);
    expect(body.user.name).toBe("测试用户");
    expect(body.token).toBeTruthy();

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();
    sessionCookie = setCookie!;
  });

  it("POST /api/auth/sign-in/email: 成功使用邮箱与密码登录", async () => {
    const res = await app.handle(
      new Request("http://localhost:3000/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.email).toBe(testEmail);
    expect(res.headers.get("set-cookie")).toContain("better-auth.session_token");
  });

  it("POST /api/auth/sign-in/email: 密码错误时返回 401 或失败提示", async () => {
    const res = await app.handle(
      new Request("http://localhost:3000/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: "wrongPassword!",
        }),
      })
    );

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("GET /api/auth/get-session: 携带会话 Cookie 成功获取当前用户信息", async () => {
    const res = await app.handle(
      new Request("http://localhost:3000/api/auth/get-session", {
        headers: {
          cookie: sessionCookie,
        },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body?.user?.email).toBe(testEmail);
  });

  it("POST /api/todos: 登录状态下创建 Todo 任务自动计入当前登录用户账户名下", async () => {
    const res = await app.handle(
      new Request("http://localhost:3000/api/todos", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: sessionCookie,
        },
        body: JSON.stringify({
          title: "专属用户任务 - 自动归属测试",
          priority: "high",
          category: "测试",
        }),
      })
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.title).toBe("专属用户任务 - 自动归属测试");
    expect(body.data.userId).toBeTruthy();
  });

  it("POST /api/auth/sign-out: 成功退出登录", async () => {
    const res = await app.handle(
      new Request("http://localhost:3000/api/auth/sign-out", {
        method: "POST",
        headers: {
          cookie: sessionCookie,
        },
      })
    );

    expect(res.status).toBe(200);
  });
});
