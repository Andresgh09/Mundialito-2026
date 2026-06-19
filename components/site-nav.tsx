"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Trophy,
  ListChecks,
  CalendarDays,
  ShieldCheck,
  LogOut,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { logoutAction } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/auth";

const tabs = [
  { href: "/", label: "Ranking", icon: Trophy },
  { href: "/predicciones", label: "Predecir", icon: ListChecks },
  { href: "/partidos", label: "Partidos", icon: CalendarDays },
];

export function SiteNav({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const items = [...tabs];
  if (user?.isAdmin) {
    items.push({ href: "/admin", label: "Admin", icon: ShieldCheck });
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold">
            <Trophy className="h-5 w-5 text-primary" aria-hidden />
            <span>
              Mundial<span className="text-primary">ito</span>
            </span>
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href={`/perfil/${user.id}`}
                className="flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-elevated text-xs font-bold text-primary">
                  {user.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="hidden sm:inline">{user.name}</span>
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  aria-label="Cerrar sesión"
                  className="grid h-9 w-9 place-items-center rounded-[var(--radius)] text-muted hover:bg-elevated hover:text-foreground transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-gold-soft transition-colors"
            >
              <LogIn className="h-4 w-4" aria-hidden /> Entrar
            </Link>
          )}
        </div>
      </header>

      {/* Bottom tab bar (mobile-first) */}
      <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-border bg-surface/95 backdrop-blur-md">
        <div
          className="max-w-3xl mx-auto grid"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        >
          {items.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors cursor-pointer",
                  active ? "text-primary" : "text-muted hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
