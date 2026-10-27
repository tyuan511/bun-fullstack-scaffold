export type Priority = "low" | "medium" | "high";

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  category: string;
  dueDate: string | null;
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoInput {
  title: string;
  priority?: Priority;
  category?: string;
  dueDate?: string | null;
  userId?: string | null;
}

export interface UpdateTodoInput {
  title?: string;
  completed?: boolean;
  priority?: Priority;
  category?: string;
  dueDate?: string | null;
  userId?: string | null;
}

export type TodoFilterStatus = "all" | "active" | "completed";

// ==========================================
// 统一响应格式与错误码系统
// ==========================================

export enum ErrorCode {
  SUCCESS = 0,                    // 操作成功
  BAD_REQUEST = 40000,            // 请求参数不合法
  VALIDATION_ERROR = 40001,       // 输入参数校验失败
  TODO_TITLE_EMPTY = 40002,       // 待办事项标题不能为空
  PARSE_ERROR = 40003,            // 请求体 JSON 解析失败
  NOT_FOUND = 40400,              // 请求资源不存在
  TODO_NOT_FOUND = 40401,         // 指定的待办事项未找到
  CONFLICT = 40900,               // 资源冲突
  RATE_LIMIT_EXCEEDED = 42900,    // 请求频次超限 (限流)
  INTERNAL_ERROR = 50000,         // 服务器内部错误
  DATABASE_ERROR = 50001,         // 数据库操作异常
}

export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.SUCCESS]: "操作成功",
  [ErrorCode.BAD_REQUEST]: "请求参数不合法",
  [ErrorCode.VALIDATION_ERROR]: "字段校验未通过",
  [ErrorCode.TODO_TITLE_EMPTY]: "待办事项标题不能为空",
  [ErrorCode.PARSE_ERROR]: "请求体数据格式错误 (无法解析为有效 JSON)",
  [ErrorCode.NOT_FOUND]: "请求的资源或路由不存在",
  [ErrorCode.TODO_NOT_FOUND]: "未找到指定的待办事项",
  [ErrorCode.CONFLICT]: "数据已存在或发生冲突",
  [ErrorCode.RATE_LIMIT_EXCEEDED]: "请求过于频繁，请稍后重试",
  [ErrorCode.INTERNAL_ERROR]: "服务器内部发生未知异常",
  [ErrorCode.DATABASE_ERROR]: "数据库操作失败",
};

/**
 * 统一 API 响应包装外层
 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
  timestamp: number;
  requestId?: string;
}

/**
 * 业务自定义异常类
 */
export class BusinessError extends Error {
  constructor(
    public code: ErrorCode,
    message?: string,
    public status: number = 400
  ) {
    super(message || ErrorMessages[code] || "业务处理异常");
    this.name = "BusinessError";
  }
}
