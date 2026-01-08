"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Home, Calendar, PlusCircle, User, Sun, Moon } from "lucide-react";
import type { NavItem } from "@/lib/types";

const navItems: NavItem[] = [
  { label: "홈", href: "/", icon: Home },
  { label: "이벤트", href: "/events", icon: Calendar },
  { label: "새 이벤트", href: "/events/new", icon: PlusCircle },
  { label: "프로필", href: "/profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 하이드레이션 이슈 방지
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="bg-background fixed inset-x-0 bottom-0 z-50 mx-auto h-16 max-w-md border-t">
      <div className="flex h-full items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex h-full flex-1 flex-col items-center justify-center gap-1"
            >
              <Icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
              <span
                className={`text-xs ${
                  active ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* 다크모드 토글 버튼 */}
        <button
          onClick={toggleTheme}
          className="flex h-full flex-1 flex-col items-center justify-center gap-1"
          aria-label="테마 전환"
        >
          {mounted ? (
            <>
              {theme === "dark" ? (
                <Sun className="text-muted-foreground h-5 w-5" />
              ) : (
                <Moon className="text-muted-foreground h-5 w-5" />
              )}
              <span className="text-muted-foreground text-xs">
                {theme === "dark" ? "라이트" : "다크"}
              </span>
            </>
          ) : (
            <>
              <Moon className="text-muted-foreground h-5 w-5" />
              <span className="text-muted-foreground text-xs">다크</span>
            </>
          )}
        </button>
      </div>
    </nav>
  );
}
