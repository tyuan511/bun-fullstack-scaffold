import { describe, expect, it } from "bun:test";
import * as todoService from "../src/server/routes/todos/service";
import { BusinessError, ErrorCode } from "../src/shared/types";

describe("Todo Service 业务层单元测试 (Feature Unit Test without HTTP)", () => {
  const testUserId = "test-user-uuid-123456";

  it("getAll: 未登录用户调用严格返回空数组，杜绝数据泄露", () => {
    const unauthTodos = todoService.getAll(undefined, null);
    expect(unauthTodos).toEqual([]);

    const unauthTodos2 = todoService.getAll();
    expect(unauthTodos2).toEqual([]);
  });

  it("create: 未登录状态创建任务应抛出 401 业务异常", () => {
    expect(() => {
      todoService.create({ title: "未登录测试任务" }, null);
    }).toThrowError(BusinessError);

    try {
      todoService.create({ title: "未登录测试任务" }, null);
    } catch (e: any) {
      expect(e.status).toBe(401);
      expect(e.message).toContain("未登录状态无法保存待办事项");
    }
  });

  it("create: 登录用户成功创建待办事项并绑定当前用户 ID", () => {
    const todo = todoService.create(
      {
        title: "单元测试任务 - Service 直接调用",
        priority: "high",
        category: "测试",
      },
      testUserId
    );

    expect(todo.id).toBeTruthy();
    expect(todo.title).toBe("单元测试任务 - Service 直接调用");
    expect(todo.completed).toBe(false);
    expect(todo.priority).toBe("high");
    expect(todo.category).toBe("测试");
    expect(todo.userId).toBe(testUserId);
  });

  it("getAll: 登录用户只能查询到归属自己名下的待办事项", () => {
    const todos = todoService.getAll(undefined, testUserId);
    expect(todos.length).toBeGreaterThan(0);
    expect(todos.every((t) => t.userId === testUserId)).toBe(true);

    // 查询其他用户名下的数据为空
    const otherUserTodos = todoService.getAll(undefined, "other-non-existent-user");
    expect(otherUserTodos).toEqual([]);
  });

  it("create: 空标题或纯空白字符抛出 BusinessError (TODO_TITLE_EMPTY)", () => {
    expect(() => {
      todoService.create({ title: "    " }, testUserId);
    }).toThrowError(BusinessError);

    try {
      todoService.create({ title: "" }, testUserId);
    } catch (e: any) {
      expect(e.code).toBe(ErrorCode.TODO_TITLE_EMPTY);
    }
  });

  it("getById: 查询不存在的 ID 时抛出 TODO_NOT_FOUND (404)", () => {
    try {
      todoService.getById("non-existent-uuid-99999", testUserId);
      expect(true).toBe(false); // 不应执行到此处
    } catch (e: any) {
      expect(e).toBeInstanceOf(BusinessError);
      expect(e.code).toBe(ErrorCode.TODO_NOT_FOUND);
      expect(e.status).toBe(404);
    }
  });

  it("update: 成功更新标题与完成状态", () => {
    const created = todoService.create({ title: "待更新任务" }, testUserId);
    const updated = todoService.update(
      created.id,
      {
        title: "已更新的标题",
        completed: true,
      },
      testUserId
    );

    expect(updated.title).toBe("已更新的标题");
    expect(updated.completed).toBe(true);
  });

  it("remove: 成功删除任务", () => {
    const created = todoService.create({ title: "待删除任务" }, testUserId);
    const res = todoService.remove(created.id, testUserId);
    expect(res.id).toBe(created.id);

    // 删除后再查抛出 404
    expect(() => todoService.getById(created.id, testUserId)).toThrow();
  });
});
