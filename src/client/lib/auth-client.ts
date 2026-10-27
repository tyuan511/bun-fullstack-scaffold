import { createAuthClient } from "better-auth/react";

/**
 * Better Auth 官方 React 客户端实例
 */
export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession } = authClient;
