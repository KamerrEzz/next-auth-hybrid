"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import LogoutButton from "@/components/logout-button";

export default function Navbar() {
  const me = useQuery({
    queryKey: ["me-client"],
    queryFn: async () => (await api.get("/auth/me")).data,
  });

  return (
    <header className="w-full border-b">
      <div className="mx-auto max-w-4xl px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <Link href="/">Inicio</Link>
          <Link href="/dashboard">Dashboard</Link>
          {!me.data && (
            <>
              <Link href="/login">Login</Link>
              <Link href="/register">Registro</Link>
            </>
          )}
        </div>
        <div className="text-sm flex items-center gap-3">
          {me.isPending && <span>Cargando...</span>}
          {me.data && <span>{me.data.email ?? me.data.name ?? "Usuario"}</span>}
          {me.data && <LogoutButton />}
        </div>
      </div>
    </header>
  );
}