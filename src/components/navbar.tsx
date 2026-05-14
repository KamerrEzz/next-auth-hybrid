"use client";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useMe } from "@/features/auth/hooks/useMe";
import LogoutButton from "@/features/auth/components/logout-button";

export default function Navbar() {
  const me = useMe();

  return (
    <header className="w-full border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors"
          >
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span>VaultAuth</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {me.data && (
              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                Dashboard
              </Link>
            )}
            {!me.data && !me.isPending && (
              <>
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  Registro
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {me.isPending && (
            <span className="text-xs text-muted-foreground animate-pulse">Cargando...</span>
          )}
          {me.data && (
            <span className="text-sm text-muted-foreground hidden sm:inline truncate max-w-40">
              {me.data.email ?? me.data.name}
            </span>
          )}
          {me.data && <LogoutButton />}
        </div>
      </div>
    </header>
  );
}
