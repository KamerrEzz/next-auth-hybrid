"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Session = { id: string; ipAddress: string; userAgent: string; lastActive: string };
export default function SessionsPanel() {
  const list = useQuery<Session[]>({
    queryKey: ["sessions"],
    queryFn: async () => (await api.get<Session[]>("/auth/sessions")).data,
  });
  const [busy, setBusy] = useState<string | null>(null);

  const revokeAll = async () => {
    try {
      setBusy("all");
      await api.delete("/auth/sessions");
      toast.success("Todas las sesiones revocadas");
    } finally {
      setBusy(null);
      list.refetch();
    }
  };

  const revoke = async (id: string) => {
    try {
      setBusy(id);
      await api.delete(`/auth/sessions/${id}`);
      toast.success("Sesión revocada");
    } finally {
      setBusy(null);
      list.refetch();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">Sesiones</div>
        <Button onClick={revokeAll} variant="destructive" disabled={busy === "all" || list.isPending}>Revocar todas</Button>
      </div>
      <div className="flex flex-col gap-2">
        {(list.data ?? []).map((s) => (
          <div key={s.id} className="flex items-center justify-between border rounded p-2">
            <div className="text-xs">{s.ipAddress} • {s.userAgent} • {s.lastActive}</div>
            <Button onClick={() => revoke(s.id)} variant="outline" disabled={busy === s.id || list.isPending}>Revocar</Button>
          </div>
        ))}
        {list.isPending && <div className="text-sm">Cargando...</div>}
        {list.isError && <div className="text-sm text-red-600">Error al cargar sesiones</div>}
        {!list.isPending && !list.data?.length && <div className="text-sm">Sin sesiones</div>}
      </div>
    </div>
  );
}