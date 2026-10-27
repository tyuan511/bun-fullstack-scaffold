import { useEffect, useState, useMemo } from "react";
import confetti from "canvas-confetti";
import { Toaster, toast } from "sonner";
import type { Todo, CreateTodoInput, UpdateTodoInput, TodoFilterStatus } from "@shared/types";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { ThemeToggle } from "./components/ThemeToggle";
import { UserNav } from "./components/UserNav";
import { AuthModal } from "./components/AuthModal";
import { TodoStats } from "./components/TodoStats";
import { TodoForm } from "./components/TodoForm";
import { TodoItem } from "./components/TodoItem";
import { TodoEditDialog } from "./components/TodoEditDialog";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "./components/ui/tabs";
import {
  BookOpen,
  Box,
  CheckCheck,
  CheckCircle,
  Database,
  FileCode2,
  FolderArchive,
  KeyRound,
  Layers,
  Lock,
  LogIn,
  RotateCcw,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";

export function App() {
  const { data: session } = useSession();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<TodoFilterStatus>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // 加载数据 (自动附带当前会话凭证，实现按用户隔离)
  const fetchTodos = async () => {
    try {
      const data = await api.getTodos();
      setTodos(data);
    } catch (err: any) {
      toast.error("加载待办事项失败", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [session?.user?.id]);

  // 烟花庆祝效果
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // 添加任务 (需关联当前用户)
  const handleAddTodo = async (input: CreateTodoInput) => {
    if (!session?.user) {
      toast.warning("请先登录账号", {
        description: "待办任务需归属于您的个人账户，请先登录（可使用演示账号一键登录）。",
      });
      setAuthModalOpen(true);
      return;
    }

    try {
      const newTodo = await api.createTodo({
        ...input,
        userId: session.user.id,
      });
      setTodos((prev) => [newTodo, ...prev]);
      toast.success("待办事项已添加", {
        description: `“${newTodo.title}” 已保存到 SQLite (已计入您的个人名下)`,
      });
    } catch (err: any) {
      toast.error("添加失败", { description: err.message });
    }
  };

  // 切换完成状态
  const handleToggle = async (id: string, completed: boolean) => {
    // 乐观更新
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed } : t))
    );

    try {
      await api.updateTodo(id, { completed });

      // 如果完成的是最后一个未完成事项，放烟花
      if (completed) {
        const remainingActive = todos.filter((t) => t.id !== id && !t.completed).length;
        if (remainingActive === 0) {
          triggerConfetti();
          toast.success("太棒了！所有待办任务已全部完成！🎉");
        }
      }
    } catch (err: any) {
      toast.error("更新状态失败", { description: err.message });
      fetchTodos(); // 回滚
    }
  };

  // 保存编辑
  const handleSaveEdit = async (id: string, data: UpdateTodoInput) => {
    try {
      const updated = await api.updateTodo(id, data);
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
      toast.success("待办事项已更新");
    } catch (err: any) {
      toast.error("更新失败", { description: err.message });
    }
  };

  // 删除单项
  const handleDelete = async (id: string) => {
    // 乐观更新
    const previous = [...todos];
    setTodos((prev) => prev.filter((t) => t.id !== id));

    try {
      await api.deleteTodo(id);
      toast.info("待办事项已删除");
    } catch (err: any) {
      setTodos(previous);
      toast.error("删除失败", { description: err.message });
    }
  };

  // 批量全选 / 取消全选
  const handleToggleAll = async () => {
    const allCompleted = todos.every((t) => t.completed);
    const targetStatus = !allCompleted;

    setTodos((prev) => prev.map((t) => ({ ...t, completed: targetStatus })));

    try {
      await api.toggleAll(targetStatus);
      if (targetStatus) {
        triggerConfetti();
        toast.success("全部任务已标记为完成！🎉");
      } else {
        toast.info("已重置所有任务为待办状态");
      }
    } catch (err: any) {
      toast.error("批量操作失败", { description: err.message });
      fetchTodos();
    }
  };

  // 清理所有已完成
  const handleClearCompleted = async () => {
    const completedCount = todos.filter((t) => t.completed).length;
    if (completedCount === 0) return;

    setTodos((prev) => prev.filter((t) => !t.completed));

    try {
      await api.clearCompleted();
      toast.success(`已清空 ${completedCount} 项已完成待办`);
    } catch (err: any) {
      toast.error("清理失败", { description: err.message });
      fetchTodos();
    }
  };

  // 过滤展示列表
  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      // 状态过滤
      if (filterStatus === "active" && todo.completed) return false;
      if (filterStatus === "completed" && !todo.completed) return false;

      // 分类过滤
      if (selectedCategory !== "all" && todo.category !== selectedCategory)
        return false;

      // 关键词搜索
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = todo.title.toLowerCase().includes(query);
        const matchesCategory = todo.category.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCategory) return false;
      }

      return true;
    });
  }, [todos, filterStatus, selectedCategory, searchQuery]);

  // 所有已有分类
  const categories = useMemo(() => {
    const set = new Set<string>();
    todos.forEach((t) => set.add(t.category));
    return ["all", ...Array.from(set)];
  }, [todos]);

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/30 text-foreground py-8 sm:py-12 px-4 sm:px-6">
      <Toaster position="top-right" richColors />

      <div className="max-w-3xl mx-auto space-y-6">
        {/* 顶部标题栏与导航区 */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/20">
                <Zap className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Bun Fullstack 脚手架
                </h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <span className="font-semibold text-primary">Elysia 2.0 + React 19 + Shadcn</span>
                  <span>•</span>
                  <span>端到端类型安全 (Eden Treaty)</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Better Auth 用户状态与登录/注册导航 */}
            <UserNav />

            {/* Swagger API 文档链接 */}
            <a
              href="/swagger"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card/60 hover:bg-accent hover:border-primary/40 transition-colors shadow-2xs"
              title="查看后端 Swagger / OpenAPI 文档"
            >
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <span>API 文档</span>
            </a>

            {/* 健康检查链接 */}
            <a
              href="/api/health"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card/60 hover:bg-accent hover:border-primary/40 transition-colors shadow-2xs"
              title="检查服务健康状态"
            >
              <Layers className="h-3.5 w-3.5 text-emerald-500" />
              <span>服务状态</span>
            </a>

            {/* 明暗模式切换 */}
            <ThemeToggle />
          </div>
        </header>

        {/* 用户登录状态提示横幅 (未登录提示与已登录状态) */}
        {!session?.user ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/5 p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm shadow-2xs transition-all animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-xs sm:text-sm flex items-center gap-2">
                  <span>当前处于访客模式 (未登录)</span>
                  <Badge variant="outline" className="text-[10px] py-0 h-4 border-amber-500/40 text-amber-600 dark:text-amber-400">
                    本地临时
                  </Badge>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  登录后创建的待办事项将自动持久化归属于您的个人账户，换设备或刷新均可同步。
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setAuthModalOpen(true)}
              className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs h-8 gap-1.5 shadow-sm"
            >
              <LogIn className="h-3.5 w-3.5" />
              立即登录 / 体验演示账号
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-muted-foreground shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <span>
                已登录账号: <strong className="text-foreground font-semibold">{session.user.name || session.user.email}</strong>，新创建的待办事项将自动归入您名下。
              </span>
            </div>
            <Badge variant="secondary" className="text-[11px] font-normal border border-primary/20 bg-background/80">
              个人账户数据已连接
            </Badge>
          </div>
        )}

        {/* 统计指标卡片 */}
        <TodoStats todos={todos} />

        {/* 添加任务表单 */}
        <TodoForm onAdd={handleAddTodo} />

        {/* 筛选与搜索工具条 */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* 状态切换 Tabs */}
            <Tabs
              value={filterStatus}
              onValueChange={(val) => setFilterStatus(val as TodoFilterStatus)}
              className="w-auto"
            >
              <TabsList className="grid grid-cols-3 w-full sm:w-auto">
                <TabsTrigger value="all">
                  全部 ({todos.length})
                </TabsTrigger>
                <TabsTrigger value="active">
                  待办 ({activeCount})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  已完成 ({completedCount})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* 搜索框 */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索待办任务或分类..."
                className="pl-8 h-9 text-xs bg-background/80"
              />
            </div>
          </div>

          {/* 分类快捷筛选 Pills */}
          {categories.length > 2 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-muted-foreground text-xs shrink-0 mr-1">分类:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat === "all" ? "全部" : cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 待办事项列表区 */}
        <div className="space-y-2.5">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground animate-pulse">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2" />
              <p className="text-sm">正在加载待办事项...</p>
            </div>
          ) : !session?.user ? (
            <div className="p-10 text-center rounded-2xl border border-dashed border-amber-500/30 bg-card/40 backdrop-blur-xs space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mx-auto shadow-inner">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                当前未登录，待办数据已锁定
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                遵循用户数据隔离安全规范，请登录您的个人账户以查看专属待办清单。
              </p>
              <Button
                onClick={() => setAuthModalOpen(true)}
                className="mt-2 h-8 px-4 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs gap-1.5 shadow-sm"
              >
                <LogIn className="h-3.5 w-3.5" />
                立即登录 / 体验演示账号
              </Button>
            </div>
          ) : filteredTodos.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card/40 backdrop-blur-xs">
              <CheckCircle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-foreground mb-1">
                {searchQuery
                  ? "未找到匹配的待办事项"
                  : filterStatus === "completed"
                  ? "暂无已完成的事项"
                  : "清单空空如也"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {searchQuery
                  ? "可以尝试更换关键词或清除搜索条件"
                  : "快在上方输入框中写下你的第一个任务吧！"}
              </p>
            </div>
          ) : (
            filteredTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onEdit={(item) => {
                  setEditingTodo(item);
                  setIsEditDialogOpen(true);
                }}
              />
            ))
          )}
        </div>

        {/* 底部批量操作工具条 */}
        {todos.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 px-1 border-t border-border/60 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleAll}
                className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              >
                {todos.every((t) => t.completed) ? (
                  <>
                    <RotateCcw className="h-3.5 w-3.5" />
                    标记全部未完成
                  </>
                ) : (
                  <>
                    <CheckCheck className="h-3.5 w-3.5" />
                    标记全部已完成
                  </>
                )}
              </Button>

              {completedCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearCompleted}
                  className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  清空已完成 ({completedCount})
                </Button>
              )}
            </div>

            <div className="text-[11px] font-medium">
              剩余 <span className="font-bold text-foreground">{activeCount}</span> 项任务未完成
            </div>
          </div>
        )}

        {/* 项目技术栈特性说明卡片 */}
        <div className="mt-8 rounded-2xl border border-border/70 bg-card/40 backdrop-blur-xs p-5 sm:p-6 text-xs text-muted-foreground space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border/60 gap-1.5">
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
              <FileCode2 className="h-4 w-4 text-primary" />
              <span>项目技术栈与特性概览</span>
            </div>
            <span className="text-[11px] text-muted-foreground/80 font-mono">
              Elysia 2.0 • Bun Fullstack • React 19 • Better Auth • Drizzle ORM
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="rounded-xl border border-border/50 bg-background/50 p-3 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <Box className="h-3.5 w-3.5 text-amber-500" />
                <span>Bun 原生全栈 & 单二进制分发</span>
              </div>
              <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                无需 Vite/Webpack，Bun 原生 TSX 极速打包与 HMR；支持 <code className="text-foreground font-mono bg-muted/70 px-1 py-0.5 rounded text-[10.5px]">bun build --compile</code> 编译为单一自包含独立可执行二进制文件与超轻量 Docker 容器。
              </p>
            </div>

            <div className="rounded-xl border border-border/50 bg-background/50 p-3 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <Zap className="h-3.5 w-3.5 text-orange-500" />
                <span>ElysiaJS 2.0 (RC) + OpenAPI</span>
              </div>
              <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                极致吞吐与性能，TypeBox 强类型输入校验，内置 Swagger UI (<a href="/swagger" target="_blank" rel="noreferrer" className="text-primary hover:underline">/swagger</a>) 与 Eden Treaty 端到端全类型推导。
              </p>
            </div>

            <div className="rounded-xl border border-border/50 bg-background/50 p-3 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <Database className="h-3.5 w-3.5 text-blue-500" />
                <span>Drizzle ORM + SQLite 持久化</span>
              </div>
              <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                基于 <code className="text-foreground font-mono bg-muted/70 px-1 py-0.5 rounded text-[10.5px]">drizzle-orm/bun-sqlite</code> 驱动与 Repository 数据访问层，数据自动持久化至 <code className="text-foreground font-mono bg-muted/70 px-1 py-0.5 rounded text-[10.5px]">data/todos.db</code>，集成 Drizzle Kit 迁移工具。
              </p>
            </div>

            <div className="rounded-xl border border-border/50 bg-background/50 p-3 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <KeyRound className="h-3.5 w-3.5 text-purple-500" />
                <span>Better Auth 现代用户鉴权体系</span>
              </div>
              <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                内置完整的邮箱密码注册登录与会话管理，依托 Drizzle ORM 适配器无缝桥接 Elysia 后端路由与 React 前端会话状态。
              </p>
            </div>

            <div className="rounded-xl border border-border/50 bg-background/50 p-3 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <Layers className="h-3.5 w-3.5 text-indigo-500" />
                <span>React 19 + Shadcn UI (Nova 风格)</span>
              </div>
              <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                基于 <code className="text-foreground font-mono bg-muted/70 px-1 py-0.5 rounded text-[10.5px]">@base-ui/react</code> 核心原语与 Tailwind CSS v4，具备明暗双主题无缝切换、Sonner 提示与 Confetti 礼花动效。
              </p>
            </div>

            <div className="rounded-xl border border-border/50 bg-background/50 p-3 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>工业级通用中间件与异常兜底</span>
              </div>
              <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                链路追踪 (<code className="text-foreground font-mono bg-muted/70 px-1 py-0.5 rounded text-[10.5px]">x-request-id</code>)、OWASP 安全响应头、滑动窗口限流 (429)、统一响应结构与 SIGINT/SIGTERM 优雅停机。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 编辑弹窗 */}
      <TodoEditDialog
        todo={editingTodo}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveEdit}
      />

      {/* 登录/注册认证弹窗 */}
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultTab="signin"
      />
    </div>
  );
}
