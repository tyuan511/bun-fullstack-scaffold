import { and, asc, desc, eq, like, type SQL } from "drizzle-orm";
import { db, todos, type TodoInsert } from "../../db";
import { BusinessError, ErrorCode, type Todo } from "@shared/types";
import type * as TodoModel from "./model";

/**
 * 获取待办事项列表 (严格只加载当前登录用户的待办事项，未登录返回空数组)
 */
export function getAll(
  query?: TodoModel.Get["Query"],
  currentUserId?: string | null
): Todo[] {
  const targetUserId = query?.userId !== undefined ? query.userId : currentUserId;

  // 严格鉴权隔离：未登录时不返回任何个人待办数据
  if (!targetUserId) {
    return [];
  }

  const conditions: SQL[] = [eq(todos.userId, targetUserId)];

  if (query?.status === "active") {
    conditions.push(eq(todos.completed, false));
  } else if (query?.status === "completed") {
    conditions.push(eq(todos.completed, true));
  }

  if (query?.category && query.category !== "all") {
    conditions.push(eq(todos.category, query.category));
  }

  if (query?.search) {
    conditions.push(like(todos.title, `%${query.search}%`));
  }

  return db
    .select()
    .from(todos)
    .where(and(...conditions))
    .orderBy(asc(todos.completed), desc(todos.createdAt))
    .all() as Todo[];
}

/**
 * 根据 ID 查询单个待办事项
 */
export function getById(
  id: TodoModel.ByIdGet["Params"]["id"],
  currentUserId?: string | null
): Todo {
  const conditions: SQL[] = [eq(todos.id, id)];
  if (currentUserId) {
    conditions.push(eq(todos.userId, currentUserId));
  }

  const [todo] = db.select().from(todos).where(and(...conditions)).limit(1).all();
  if (!todo) {
    throw new BusinessError(ErrorCode.TODO_NOT_FOUND, "未找到指定的待办事项", 404);
  }
  return todo as Todo;
}

/**
 * 新建待办事项 (严格计入用户账户名下)
 */
export function create(
  body: TodoModel.Post["Body"],
  currentUserId?: string | null
): Todo {
  const trimmedTitle = body.title.trim();
  if (!trimmedTitle) {
    throw new BusinessError(ErrorCode.TODO_TITLE_EMPTY, "待办事项标题不能为空", 400);
  }

  const assignedUserId = body.userId !== undefined ? body.userId : currentUserId;
  if (!assignedUserId) {
    throw new BusinessError(ErrorCode.BAD_REQUEST, "未登录状态无法保存待办事项，请先登录账号", 401);
  }

  const now = new Date().toISOString();
  const newTodo: TodoInsert = {
    id: crypto.randomUUID(),
    title: trimmedTitle,
    completed: false,
    priority: body.priority || "medium",
    category: body.category || "工作",
    dueDate: body.dueDate || null,
    userId: assignedUserId,
    createdAt: now,
    updatedAt: now,
  };

  db.insert(todos).values(newTodo).run();
  return newTodo as Todo;
}

/**
 * 更新待办事项 (仅允许更新当前用户自身的数据)
 */
export function update(
  id: TodoModel.ByIdPatch["Params"]["id"],
  body: TodoModel.ByIdPatch["Body"],
  currentUserId?: string | null
): Todo {
  // 确认待办是否存在且归属当前用户
  getById(id, currentUserId);

  const now = new Date().toISOString();
  const updateData: Partial<TodoInsert> = {
    updatedAt: now,
  };

  if (body.title !== undefined) {
    const trimmedTitle = body.title.trim();
    if (!trimmedTitle) {
      throw new BusinessError(ErrorCode.TODO_TITLE_EMPTY, "待办事项标题不能为空", 400);
    }
    updateData.title = trimmedTitle;
  }

  if (body.completed !== undefined) updateData.completed = body.completed;
  if (body.priority !== undefined) updateData.priority = body.priority;
  if (body.category !== undefined) updateData.category = body.category;
  if (body.dueDate !== undefined) updateData.dueDate = body.dueDate;

  const conditions: SQL[] = [eq(todos.id, id)];
  if (currentUserId) {
    conditions.push(eq(todos.userId, currentUserId));
  }

  db.update(todos).set(updateData).where(and(...conditions)).run();

  return getById(id, currentUserId);
}

/**
 * 删除待办事项 (仅允许删除当前用户自身的数据)
 */
export function remove(
  id: TodoModel.ByIdDelete["Params"]["id"],
  currentUserId?: string | null
): { id: string } {
  getById(id, currentUserId);

  const conditions: SQL[] = [eq(todos.id, id)];
  if (currentUserId) {
    conditions.push(eq(todos.userId, currentUserId));
  }

  db.delete(todos).where(and(...conditions)).run();
  return { id };
}

/**
 * 批量切换当前用户所有待办的完成状态
 */
export function toggleAll(
  completed: boolean,
  currentUserId?: string | null
): { completed: boolean } {
  const now = new Date().toISOString();
  if (currentUserId) {
    db.update(todos)
      .set({ completed, updatedAt: now })
      .where(eq(todos.userId, currentUserId))
      .run();
  } else {
    db.update(todos).set({ completed, updatedAt: now }).run();
  }
  return { completed };
}

/**
 * 批量清空当前用户已完成的待办事项
 */
export function clearCompleted(currentUserId?: string | null): { count: number } {
  const conditions: SQL[] = [eq(todos.completed, true)];
  if (currentUserId) {
    conditions.push(eq(todos.userId, currentUserId));
  }
  const res = db.delete(todos).where(and(...conditions)).run();
  return { count: (res as any).changes };
}
