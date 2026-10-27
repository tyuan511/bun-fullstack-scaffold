import { auth } from "../auth";

/**
 * 内部保留或非公开端点列表（过滤掉避免污染 API 接口文档）
 */
const EXCLUDED_PATHS = new Set([
  "/ok",
  "/error",
  "/callback/{id}",
  "/delete-user/callback",
  "/reset-password/{token}",
  // 未配置第三方 OAuth 提供商时，过滤对应的第三方回调与令牌刷新路由
  "/sign-in/social",
  "/link-social",
  "/unlink-account",
  "/list-accounts",
  "/refresh-token",
  "/get-access-token",
  "/account-info",
]);

/**
 * Better Auth 端点的人性化中文文档元数据 (摘要与详尽说明)
 */
const AUTH_METADATA: Record<string, { summary: string; description?: string }> = {
  "/sign-up/email": {
    summary: "邮箱密码注册",
    description: "使用邮箱与密码注册新账户，注册成功后自动签发安全会话凭证并下发 HttpOnly 会话 Cookie。",
  },
  "/sign-in/email": {
    summary: "邮箱密码登录",
    description: "使用邮箱与密码完成身份认证，认证成功后将自动下发 HttpOnly 会话 Cookie 及 Token。",
  },
  "/sign-out": {
    summary: "退出当前会话",
    description: "注销当前客户端登录凭据，服务端销毁该会话并下发清除 Cookie 标头。",
  },
  "/get-session": {
    summary: "获取当前会话及用户信息",
    description: "读取客户端请求 Cookie 或 Bearer Token 中的会话凭据，返回当前登录用户详情与有效会话数据。",
  },
  "/change-password": {
    summary: "修改登录密码",
    description: "在已认证状态下，验证用户当前原密码并更新为新设定的密码。",
  },
  "/change-email": {
    summary: "修改绑定邮箱",
    description: "更新当前登录账户绑定的电子邮箱地址。",
  },
  "/update-user": {
    summary: "更新当前用户资料",
    description: "更新当前登录用户的昵称 (name)、头像 (image) 等公开资料。",
  },
  "/delete-user": {
    summary: "注销当前用户账号",
    description: "永久注销当前用户账号并级联清理名下所有关联数据。",
  },
  "/list-sessions": {
    summary: "查询所有活跃会话",
    description: "获取当前登录用户在所有设备与浏览器上保持登录的活跃会话清单。",
  },
  "/revoke-session": {
    summary: "下线指定设备会话",
    description: "根据提供的会话 token 强制吊销特定设备上的登录凭据。",
  },
  "/revoke-other-sessions": {
    summary: "下线除当前外的所有设备",
    description: "保留当前设备登录状态，强制注销其他所有活跃设备上的会话，保障账号安全。",
  },
  "/revoke-sessions": {
    summary: "下线所有设备会话",
    description: "强制注销当前账户在全部设备上的活跃会话。",
  },
  "/verify-password": {
    summary: "验证当前账户密码",
    description: "校验输入的密码是否与当前账户密码相符，常用于执行敏感操作前的二次身份确认。",
  },
  "/request-password-reset": {
    summary: "申请重置密码",
    description: "发起密码重置流程并向用户注册邮箱发送重置密码凭证。",
  },
  "/reset-password": {
    summary: "确认重置密码",
    description: "提交重置凭据与新密码完成账户密码重置。",
  },
  "/send-verification-email": {
    summary: "发送邮箱验证邮件",
    description: "向当前用户注册邮箱重新发送验证确认邮件。",
  },
  "/verify-email": {
    summary: "确认邮箱验证",
    description: "验证用户的邮箱确认凭据以完成邮箱激活。",
  },
  "/update-session": {
    summary: "刷新当前会话数据",
    description: "更新并重新同步当前会话数据状态。",
  },
};

export interface AuthOpenApiSpec {
  paths: Record<string, any>;
  components: {
    schemas: Record<string, any>;
    securitySchemes: Record<string, any>;
  };
  tags: Array<{ name: string; description: string }>;
}

/**
 * 提取并优雅格式化 Better Auth 的 OpenAPI 规范
 * - 去除内部杂乱 wildcard
 * - 为每个真实可用的认证接口绑定 Auth 标签、中文摘要与参数模型说明
 * - 补全 Cookie / Bearer 鉴权方案
 */
export async function getAuthOpenApiSpec(): Promise<AuthOpenApiSpec> {
  const raw = await auth.api.generateOpenAPISchema();

  const paths: Record<string, any> = {};

  for (const [subPath, methods] of Object.entries(raw.paths || {})) {
    if (EXCLUDED_PATHS.has(subPath)) {
      continue;
    }

    const fullPath = `/api/auth${subPath}`;
    paths[fullPath] = {};

    const meta = AUTH_METADATA[subPath];

    for (const [method, op] of Object.entries(methods as Record<string, any>)) {
      paths[fullPath][method] = {
        ...op,
        tags: ["Auth"],
        summary: meta?.summary || op.description || op.operationId || fullPath,
        description: meta?.description || op.description || "",
      };
    }
  }

  const securitySchemes = {
    ...(raw.components?.securitySchemes || {}),
    apiKeyCookie: {
      type: "apiKey",
      in: "cookie",
      name: "better-auth.session_token",
      description: "Better Auth 会话 Cookie (HttpOnly)",
    },
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT / Token",
      description: "Better Auth Bearer Token 认证",
    },
  };

  return {
    paths,
    components: {
      schemas: raw.components?.schemas || {},
      securitySchemes,
    },
    tags: [
      {
        name: "Auth",
        description: "用户认证与会话管理接口 (基于 Better Auth)",
      },
    ],
  };
}

/**
 * 预生成的 Better Auth OpenAPI 规范单例
 */
export const authOpenApiSpec = await getAuthOpenApiSpec();
