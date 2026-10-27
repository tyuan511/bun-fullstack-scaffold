import { t, type UnwrapModels } from "elysia";

export const PrioritySchema = t.Union([
  t.Literal("low"),
  t.Literal("medium"),
  t.Literal("high"),
]);

export const StatusFilterSchema = t.Union([
  t.Literal("all"),
  t.Literal("active"),
  t.Literal("completed"),
]);

/**
 * GET /api/todos
 */
export const Get = {
  Query: t.Optional(
    t.Object({
      status: t.Optional(StatusFilterSchema),
      search: t.Optional(t.String()),
      category: t.Optional(t.String()),
      userId: t.Optional(t.Nullable(t.String())),
    })
  ),
};
export type Get = UnwrapModels<typeof Get>;

/**
 * POST /api/todos
 */
export const Post = {
  Body: t.Object({
    title: t.String({
      minLength: 1,
      maxLength: 200,
      error: "待办标题长度须在 1~200 个字符之间",
    }),
    priority: t.Optional(PrioritySchema),
    category: t.Optional(t.String()),
    dueDate: t.Optional(t.Nullable(t.String())),
    userId: t.Optional(t.Nullable(t.String())),
  }),
};
export type Post = UnwrapModels<typeof Post>;

/**
 * GET /api/todos/:id
 */
export const ByIdGet = {
  Params: t.Object({
    id: t.String({ description: "待办事项 ID" }),
  }),
};
export type ByIdGet = UnwrapModels<typeof ByIdGet>;

/**
 * PATCH /api/todos/:id
 */
export const ByIdPatch = {
  Params: t.Object({
    id: t.String({ description: "待办事项 ID" }),
  }),
  Body: t.Object({
    title: t.Optional(
      t.String({
        minLength: 1,
        maxLength: 200,
        error: "待办标题长度须在 1~200 个字符之间",
      })
    ),
    completed: t.Optional(t.Boolean()),
    priority: t.Optional(PrioritySchema),
    category: t.Optional(t.String()),
    dueDate: t.Optional(t.Nullable(t.String())),
  }),
};
export type ByIdPatch = UnwrapModels<typeof ByIdPatch>;

/**
 * DELETE /api/todos/:id
 */
export const ByIdDelete = {
  Params: t.Object({
    id: t.String({ description: "待办事项 ID" }),
  }),
};
export type ByIdDelete = UnwrapModels<typeof ByIdDelete>;

/**
 * POST /api/todos/toggle-all
 */
export const ToggleAllPost = {
  Body: t.Object({
    completed: t.Boolean({ description: "是否全部完成" }),
  }),
};
export type ToggleAllPost = UnwrapModels<typeof ToggleAllPost>;

/**
 * POST /api/todos/clear-completed
 */
export const ClearCompletedPost = {};
export type ClearCompletedPost = UnwrapModels<typeof ClearCompletedPost>;
