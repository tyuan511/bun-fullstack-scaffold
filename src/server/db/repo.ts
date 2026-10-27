import { and, asc, desc, eq, like, type SQL } from "drizzle-orm";
import { db } from "./client";
import { todos, type TodoInsert } from "./schema";
import type { CreateTodoInput, Todo, UpdateTodoInput } from "@shared/types";

/**
 * 待办事项数据访问层 (Repository) - 基于 Drizzle ORM 构建
 */
export const todoRepo = {
  /**
   * 按过滤条件查询待办事项列表
   */
  getAll: (filter?: { status?: string; search?: string; category?: string }): Todo[] => {
    const conditions: SQL[] = [];

    if (filter?.status === "active") {
      conditions.push(eq(todos.completed, false));
    } else if (filter?.status === "completed") {
      conditions.push(eq(todos.completed, true));
    }

    if (filter?.category && filter.category !== "all") {
      conditions.push(eq(todos.category, filter.category));
    }

    if (filter?.search) {
      conditions.push(like(todos.title, `%${filter.search}%`));
    }

    let query = db.select().from(todos);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const rows = query.orderBy(asc(todos.completed), desc(todos.createdAt)).all();

    return rows as Todo[];
  },

  /**
   * 根据 ID 查询单个待办事项
   */
  getById: (id: string): Todo | null => {
    const [row] = db.select().from(todos).where(eq(todos.id, id)).limit(1).all();
    return (row as Todo) || null;
  },

  /**
   * 新建待办事项
   */
  create: (input: CreateTodoInput): Todo => {
    const now = new Date().toISOString();
    const newRecord: TodoInsert = {
      id: crypto.randomUUID(),
      title: input.title,
      completed: false,
      priority: input.priority || "medium",
      category: input.category || "工作",
      dueDate: input.dueDate || null,
      createdAt: now,
      updatedAt: now,
    };

    db.insert(todos).values(newRecord).run();

    return newRecord as Todo;
  },

  /**
   * 更新指定 ID 的待办事项
   */
  update: (id: string, input: UpdateTodoInput): Todo | null => {
    const existing = todoRepo.getById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updateData: Partial<TodoInsert> = {
      updatedAt: now,
    };

    if (input.title !== undefined) updateData.title = input.title;
    if (input.completed !== undefined) updateData.completed = input.completed;
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.dueDate !== undefined) updateData.dueDate = input.dueDate;

    db.update(todos).set(updateData).where(eq(todos.id, id)).run();

    return todoRepo.getById(id);
  },

  /**
   * 根据 ID 删除待办事项
   */
  delete: (id: string): boolean => {
    const res = db.delete(todos).where(eq(todos.id, id)).run();
    return (res as any).changes > 0;
  },

  /**
   * 批量切换所有待办事项的完成状态
   */
  toggleAll: (completed: boolean): void => {
    const now = new Date().toISOString();
    db.update(todos).set({ completed, updatedAt: now }).run();
  },

  /**
   * 批量清空已完成的待办事项
   */
  clearCompleted: (): number => {
    const res = db.delete(todos).where(eq(todos.completed, true)).run();
    return (res as any).changes;
  },
};
