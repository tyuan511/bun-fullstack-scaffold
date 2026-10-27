import { Elysia } from "elysia";
import * as TodoModel from "./model";
import * as todoService from "./service";

/**
 * 待办事项控制器 (Controller)
 * 职责：负责 HTTP 路由匹配、参数绑定校验与状态码控制，映射到底层业务 Service (并注入当前用户 ID)
 */
export const todoController = new Elysia({ prefix: "/todos", normalize: "typebox" })
  .get(
    "/",
    {
      query: TodoModel.Get.Query,
      detail: {
        summary: "获取 Todo 待办事项列表",
        tags: ["Todos"],
      },
    },
    ({ query, ...rest }) => {
      const user = (rest as any).user;
      return todoService.getAll(query, user?.id);
    }
  )
  .post(
    "/",
    {
      body: TodoModel.Post.Body,
      detail: {
        summary: "新建 Todo 任务",
        tags: ["Todos"],
      },
    },
    ({ body, set, ...rest }) => {
      const user = (rest as any).user;
      set.status = 201;
      return todoService.create(body, user?.id);
    }
  )
  .get(
    "/:id",
    {
      params: TodoModel.ByIdGet.Params,
      detail: {
        summary: "获取单个 Todo 详情",
        tags: ["Todos"],
      },
    },
    ({ params: { id }, ...rest }) => {
      const user = (rest as any).user;
      return todoService.getById(id, user?.id);
    }
  )
  .patch(
    "/:id",
    {
      params: TodoModel.ByIdPatch.Params,
      body: TodoModel.ByIdPatch.Body,
      detail: {
        summary: "更新 Todo 状态或内容",
        tags: ["Todos"],
      },
    },
    ({ params: { id }, body, ...rest }) => {
      const user = (rest as any).user;
      return todoService.update(id, body, user?.id);
    }
  )
  .delete(
    "/:id",
    {
      params: TodoModel.ByIdDelete.Params,
      detail: {
        summary: "删除单个 Todo",
        tags: ["Todos"],
      },
    },
    ({ params: { id }, ...rest }) => {
      const user = (rest as any).user;
      return todoService.remove(id, user?.id);
    }
  )
  .post(
    "/toggle-all",
    {
      body: TodoModel.ToggleAllPost.Body,
      detail: {
        summary: "批量切换所有 Todo 完成状态",
        tags: ["Todos"],
      },
    },
    ({ body: { completed }, ...rest }) => {
      const user = (rest as any).user;
      return todoService.toggleAll(completed, user?.id);
    }
  )
  .post(
    "/clear-completed",
    {
      detail: {
        summary: "清空所有已完成的 Todo",
        tags: ["Todos"],
      },
    },
    ({ ...rest }) => {
      const user = (rest as any).user;
      return todoService.clearCompleted(user?.id);
    }
  );

export { todoController as todoRoutes };
