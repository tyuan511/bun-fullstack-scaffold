import type { Todo } from "@shared/types";
import { CheckCircle2, CircleDashed, ListTodo, TrendingUp } from "lucide-react";

interface TodoStatsProps {
  todos: Todo[];
}

export function TodoStats({ todos }: TodoStatsProps) {
  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;
  const active = total - completed;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border/80 bg-card/60 backdrop-blur-xs shadow-xs">
        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <ListTodo className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">总事项</p>
          <p className="text-xl font-bold tracking-tight">{total}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border/80 bg-card/60 backdrop-blur-xs shadow-xs">
        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <CircleDashed className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">待完成</p>
          <p className="text-xl font-bold tracking-tight text-amber-600 dark:text-amber-400">{active}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border/80 bg-card/60 backdrop-blur-xs shadow-xs">
        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">已完成</p>
          <p className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{completed}</p>
        </div>
      </div>

      <div className="flex flex-col justify-center p-3.5 rounded-xl border border-border/80 bg-card/60 backdrop-blur-xs shadow-xs col-span-2 md:col-span-1">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span>达成率</span>
          </div>
          <span className="text-xs font-bold text-primary">{percentage}%</span>
        </div>
        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
