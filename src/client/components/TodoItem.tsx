import { useState } from "react";
import type { Todo } from "@shared/types";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { formatDate } from "@/lib/utils";
import { Calendar, Clock, Pencil, Trash2, UserCheck } from "lucide-react";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (todo: Todo) => void;
}

export function TodoItem({ todo, onToggle, onDelete, onEdit }: TodoItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const isOverdue =
    Boolean(todo.dueDate) &&
    !todo.completed &&
    new Date(todo.dueDate!).setHours(23, 59, 59, 999) < Date.now();

  const getPriorityBadge = (priority: Todo["priority"]) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">高优</Badge>;
      case "medium":
        return <Badge variant="warning">中优</Badge>;
      case "low":
        return <Badge variant="info">低优</Badge>;
      default:
        return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "工作":
        return "purple";
      case "学习":
        return "info";
      case "生活":
        return "success";
      case "娱乐":
        return "warning";
      default:
        return "secondary";
    }
  };

  return (
    <div
      className={`group relative flex items-start sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border transition-all duration-200 ${
        todo.completed
          ? "border-border/40 bg-muted/30 opacity-70 hover:opacity-100"
          : "border-border/80 bg-card/70 hover:border-primary/40 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
        <div className="pt-0.5 sm:pt-0">
          <Checkbox
            checked={todo.completed}
            onCheckedChange={(checked) => onToggle(todo.id, Boolean(checked))}
            aria-label={`Mark "${todo.title}" as ${todo.completed ? "incomplete" : "complete"}`}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-sm font-medium leading-relaxed break-words transition-all ${
                todo.completed
                  ? "line-through text-muted-foreground decoration-muted-foreground/60"
                  : "text-foreground"
              }`}
            >
              {todo.title}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {/* 分类标签 */}
            <Badge variant={getCategoryColor(todo.category) as any}>
              {todo.category}
            </Badge>

            {/* 优先级标签 */}
            {getPriorityBadge(todo.priority)}

            {/* 截止时间 */}
            {todo.dueDate && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded ${
                  isOverdue
                    ? "bg-red-500/10 text-red-600 dark:text-red-400 font-semibold"
                    : "text-muted-foreground"
                }`}
                title={isOverdue ? "已逾期" : `截止日期: ${todo.dueDate}`}
              >
                {isOverdue ? (
                  <Clock className="h-3 w-3 text-red-500" />
                ) : (
                  <Calendar className="h-3 w-3" />
                )}
                {formatDate(todo.dueDate)}
                {isOverdue && " (逾期)"}
              </span>
            )}

            {/* 个人归属标记 */}
            {todo.userId && (
              <span className="inline-flex items-center gap-1 text-[10.5px] text-primary/90 bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded font-medium">
                <UserCheck className="h-3 w-3" />
                个人
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 操作按钮区 */}
      <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(todo)}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="编辑待办"
        >
          <Pencil className="h-3.5 w-3.5" />
          <span className="sr-only">Edit</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          disabled={isDeleting}
          onClick={async () => {
            setIsDeleting(true);
            try {
              await onDelete(todo.id);
            } finally {
              setIsDeleting(false);
            }
          }}
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          title="删除待办"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </div>
  );
}
