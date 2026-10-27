import { useState } from "react";
import type { CreateTodoInput, Priority } from "@shared/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Calendar, Plus, Sparkles, Tag } from "lucide-react";

interface TodoFormProps {
  onAdd: (todo: CreateTodoInput) => Promise<void>;
}

const CATEGORIES = ["工作", "学习", "生活", "娱乐", "其他"];

export function TodoForm({ onAdd }: TodoFormProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState("工作");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAdd({
        title: trimmed,
        priority,
        category,
        dueDate: dueDate || null,
      });
      setTitle("");
      setDueDate("");
      setIsExpanded(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-2xl border border-border/80 bg-card/80 p-4 shadow-sm backdrop-blur-xs transition-all hover:border-primary/30"
    >
      <div className="flex gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          placeholder="添加一个新的待办事项... (例如：完成 API 接口联调)"
          className="h-10 text-sm bg-background/80"
          disabled={isSubmitting}
        />
        <Button
          type="submit"
          disabled={!title.trim() || isSubmitting}
          className="h-10 px-4 shrink-0 shadow-xs gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">添加待办</span>
        </Button>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in-50 duration-200">
          <div className="flex flex-wrap items-center gap-3">
            {/* 优先级选择 */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                优先级:
              </span>
              <div className="inline-flex rounded-md border border-input p-0.5 bg-background">
                {(["low", "medium", "high"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                      priority === p
                        ? p === "high"
                          ? "bg-red-500/20 text-red-600 dark:text-red-400 font-bold"
                          : p === "medium"
                          ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold"
                          : "bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p === "high" ? "高" : p === "medium" ? "中" : "低"}
                  </button>
                ))}
              </div>
            </div>

            {/* 分类选择 */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <Tag className="h-3 w-3" />
                分类:
              </span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-7 rounded-md border border-input bg-background px-2 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 截止日期 */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                截止日:
              </span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-7 rounded-md border border-input bg-background px-2 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 ml-auto"
          >
            收起选项
          </button>
        </div>
      )}
    </form>
  );
}
