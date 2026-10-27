import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { signIn, signUp } from "../lib/auth-client";
import { toast } from "sonner";
import { Lock, Mail, User as UserIcon, Loader2, Sparkles, KeyRound } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "signin" | "signup";
}

export function AuthModal({
  open,
  onOpenChange,
  defaultTab = "signin",
}: AuthModalProps) {
  const [tab, setTab] = useState<"signin" | "signup">(defaultTab);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 登录表单状态
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // 注册表单状态
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  // 一键填充演示默认账户
  const fillDemoAccount = () => {
    setTab("signin");
    setSignInEmail("demo@example.com");
    setSignInPassword("demo123456");
    setErrorMsg(null);
    toast.info("已自动填入演示体验账号");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      setErrorMsg("请填写完整的邮箱与密码");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await signIn.email({
        email: signInEmail.trim(),
        password: signInPassword,
      });

      if (res.error) {
        setErrorMsg(res.error.message || "登录失败，请检查邮箱与密码");
      } else {
        toast.success("登录成功，欢迎回来！");
        onOpenChange(false);
        setSignInPassword("");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "登录请求异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpEmail || !signUpPassword) {
      setErrorMsg("邮箱与密码不能为空");
      return;
    }

    if (signUpPassword.length < 6) {
      setErrorMsg("密码长度至少需要 6 个字符");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const name = signUpName.trim() || signUpEmail.split("@")[0];
      const res = await signUp.email({
        email: signUpEmail.trim(),
        password: signUpPassword,
        name,
      });

      if (res.error) {
        setErrorMsg(res.error.message || "注册失败，该邮箱可能已被占用");
      } else {
        toast.success("注册成功！已自动完成登录");
        onOpenChange(false);
        setSignUpPassword("");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "注册异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-full">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-bold tracking-tight text-center">
            {tab === "signin" ? "用户登录" : "新用户注册"}
          </DialogTitle>
          <DialogDescription className="text-center text-xs sm:text-sm text-muted-foreground">
            {tab === "signin"
              ? "输入您的邮箱与密码快速进入全栈待办应用"
              : "输入常用邮箱与密码即可极速注册，无需额外验证"}
          </DialogDescription>
        </DialogHeader>

        {/* 顶部一键填入演示账号卡片 */}
        <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs space-y-1.5 transition-colors">
          <div className="flex items-center justify-between font-semibold text-primary">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span>官方演示体验账号</span>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={fillDemoAccount}
              className="h-6 px-2 text-[11px] font-medium text-primary hover:bg-primary/10 gap-1"
            >
              <KeyRound className="h-3 w-3" />
              一键填入
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-[11px]">
            <span>
              账号: <code className="bg-background px-1.5 py-0.5 rounded border text-foreground font-mono">demo@example.com</code>
            </span>
            <span>
              密码: <code className="bg-background px-1.5 py-0.5 rounded border text-foreground font-mono">demo123456</code>
            </span>
          </div>
        </div>

        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v as "signin" | "signup");
            setErrorMsg(null);
          }}
          className="w-full mt-3 flex flex-col"
        >
          <TabsList className="grid grid-cols-2 w-full h-10 p-1 bg-muted rounded-lg">
            <TabsTrigger value="signin" className="w-full text-xs font-semibold py-1.5">
              账号登录
            </TabsTrigger>
            <TabsTrigger value="signup" className="w-full text-xs font-semibold py-1.5">
              快速注册
            </TabsTrigger>
          </TabsList>

          {errorMsg && (
            <div className="mt-3 rounded-md bg-destructive/15 p-2.5 text-xs text-destructive border border-destructive/20 animate-in fade-in">
              {errorMsg}
            </div>
          )}

          {/* 登录选项卡 */}
          <TabsContent value="signin" className="w-full mt-3">
            <form onSubmit={handleSignIn} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">邮箱地址</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="demo@example.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    className="pl-9 h-9 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">账户密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    className="pl-9 h-9 text-sm"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-9 mt-1 text-xs font-medium" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    正在登录...
                  </>
                ) : (
                  "立即登录"
                )}
              </Button>
            </form>
          </TabsContent>

          {/* 注册选项卡 */}
          <TabsContent value="signup" className="w-full mt-3">
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">用户昵称 (选填)</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="例如: 探索者"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">邮箱地址</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    className="pl-9 h-9 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">设置密码 (至少 6 位)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="至少 6 位字符"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    className="pl-9 h-9 text-sm"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-9 mt-1 text-xs font-medium" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    正在注册...
                  </>
                ) : (
                  "直接注册账号"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
