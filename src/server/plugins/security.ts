import { Elysia } from "elysia";
import type { SecurityHeadersOptions } from "./types";

/**
 * 安全响应头中间件 (OWASP 最佳实践防范 Clickjacking, MIME 嗅探, XSS 等)
 */
export const securityMiddleware = (options: SecurityHeadersOptions = {}) => {
  const frameOptions = options.frameOptions !== undefined ? options.frameOptions : "SAMEORIGIN";
  const contentTypeOptions = options.contentTypeOptions !== false;
  const referrerPolicy = options.referrerPolicy !== undefined ? options.referrerPolicy : "strict-origin-when-cross-origin";
  const xssProtection = options.xssProtection !== undefined ? options.xssProtection : "1; mode=block";
  const permissionsPolicy =
    options.permissionsPolicy !== undefined ? options.permissionsPolicy : "camera=(), microphone=(), geolocation=()";

  return new Elysia({ name: "middleware:security" })
    .onRequest(({ set }) => {
      if (contentTypeOptions) {
        set.headers["x-content-type-options"] = "nosniff";
      }
      if (frameOptions) {
        set.headers["x-frame-options"] = frameOptions;
      }
      if (referrerPolicy) {
        set.headers["referrer-policy"] = referrerPolicy;
      }
      if (xssProtection) {
        set.headers["x-xss-protection"] = xssProtection;
      }
      if (permissionsPolicy) {
        set.headers["permissions-policy"] = permissionsPolicy;
      }
      set.headers["x-download-options"] = "noopen";
      set.headers["x-permitted-cross-domain-policies"] = "none";
    });
};
