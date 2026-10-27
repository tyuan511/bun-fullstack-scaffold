import React, { useState } from "react";
import { useSession, signOut } from "../lib/auth-client";
import { AuthModal } from "./AuthModal";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { LogIn, LogOut, User, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function UserNav() {
  const { data: session, isPending } = useSession();
  const [modalOpen, setModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("已安全退出登录");
    } catch (err: any) {
      toast.error(err?.message || "退出登录异常");
    }
  };

  if (isPending) {
    return (
      <div className="h-9 w-24 animate-pulse rounded-md bg-muted/60" />
    );
  }

  if (!session?.user) {
    return (
      <>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAuthTab("signin");
              setModalOpen(true);
            }}
            className="h-8 gap-1.5 text-xs font-medium"
          >
            <LogIn className="h-3.5 w-3.5" />
            登录 / 注册
          </Button>
        </div>

        <AuthModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          defaultTab={authTab}
        />
      </>
    );
  }

  const user = session.user;
  const initial = (user.name || user.email || "U")[0].toUpperCase();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 pl-2 pr-2.5 text-xs font-medium border-primary/20 hover:border-primary/50 transition-colors"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
              {initial}
            </div>
            <span className="max-w-[100px] truncate">{user.name || user.email}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-semibold leading-none flex items-center gap-1.5">
                {user.name}
                <Sparkles className="h-3 w-3 text-amber-500 inline" />
              </p>
              <p className="text-xs leading-none text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>退出登录</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AuthModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        defaultTab={authTab}
      />
    </>
  );
}
