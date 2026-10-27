import { treaty } from "@elysiajs/eden";
import type { App } from "@server/app";
import { type CreateTodoInput, type UpdateTodoInput, type Todo, type ApiResponse, ErrorCode } from "@shared/types";

// 真正单端口全栈架构：前后端均运行在同一端口 (默认 3000)，直接使用当前 origin
const targetHost =
  typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:3000";

// Elysia 2.0 适配 Eden Treaty 类型推导
export const client = (treaty as <T>(url: string) => any)<App>(targetHost);

/**
 * 统一解析后端外层包装响应：自动解包 data，当 code !== 0 或接口异常时抛出规范业务错误
 */
function handleResponse<T>(res: { data: any; error: any }): T {
  // 1. HTTP 错误或服务端拦截异常
  if (res.error) {
    const errVal = res.error.value;
    if (errVal && typeof errVal === "object" && "message" in errVal) {
      const err = new Error(errVal.message);
      (err as any).code = errVal.code;
      throw err;
    }
    throw new Error(String(res.error.value ?? "网络请求失败"));
  }

  // 2. 解析统一外层 ApiResponse { code, message, data, timestamp }
  const payload = res.data as ApiResponse<T>;
  if (payload && typeof payload === "object" && "code" in payload) {
    if (payload.code !== ErrorCode.SUCCESS) {
      const err = new Error(payload.message || "业务处理异常");
      (err as any).code = payload.code;
      throw err;
    }
    return payload.data as T;
  }

  return payload as T;
}

// 封装业务 API 方法，提供强类型与统一错误处理
export const api = {
  getTodos: async (params?: { status?: "all" | "active" | "completed"; search?: string; category?: string }) => {
    const res = await client.api.todos.get({
      query: params,
    });
    return handleResponse<Todo[]>(res) ?? [];
  },

  createTodo: async (input: CreateTodoInput) => {
    const res = await client.api.todos.post(input);
    return handleResponse<Todo>(res);
  },

  updateTodo: async (id: string, input: UpdateTodoInput) => {
    const res = await client.api.todos({ id }).patch(input);
    return handleResponse<Todo>(res);
  },

  deleteTodo: async (id: string) => {
    const res = await client.api.todos({ id }).delete();
    return handleResponse<{ id: string }>(res);
  },

  toggleAll: async (completed: boolean) => {
    const res = await client.api.todos["toggle-all"].post({ completed });
    return handleResponse<{ completed: boolean }>(res);
  },

  clearCompleted: async () => {
    const res = await client.api.todos["clear-completed"].post();
    return handleResponse<{ count: number }>(res);
  },

  getHealth: async () => {
    const res = await client.api.health.get();
    return handleResponse<{ status: string; runtime: string; elysia: string }>(res);
  },
};
