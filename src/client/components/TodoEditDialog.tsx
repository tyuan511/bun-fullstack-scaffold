import { useState, useEffect } from "react";
import type { Todo, UpdateTodoInput, Priority } from "@shared/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface TodoEditDialogProps {
  todo: Todo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: UpdateTodoInput) => Promise<void>;
}

const CATEGORIES = ["工作", "学习", "生活", "娱乐", "其他"];

export function TodoEditDialog({
  todo,
  open,
  onOpenChange,
  onSave,
}: TodoEditDialogProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState("工作");
  const [dueDate, setDueDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setPriority(todo.priority);
      setCategory(todo.category);
      setDueDate(todo.dueDate || "");
    }
  }, [todo]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!todo || !title.trim() || isSaving) return;

    try {
      setIsSaving(true);
      await onSave(todo.id, {
        title: title.trim(),
        priority,
        category,
        dueDate: dueDate || null,
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>编辑待办事项</DialogTitle>
            <DialogDescription>
              更新该事项的标题、优先级、所属分类及截止日期。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-1.5">
              <label htmlFor="edit-title" className="text-xs font-medium text-muted-foreground">
                事项内容
              </label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="事项名称..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  优先级
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="low">低 (Low)</option>
                  <option value="medium">中 (Medium)</option>
                  <option value="high">高 (High)</option>
                </select>
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  分类
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="edit-date" className="text-xs font-medium text-muted-foreground">
                截止日期 (可选)
              </label>
              <Input
                id="edit-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={!title.trim() || isSaving}>
              {isSaving ? "保存中..." : "保存更改"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
