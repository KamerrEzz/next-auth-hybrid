"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Session = { id: string; ipAddress: string; userAgent: string; lastActive: number };
type SessionsResponse = { currentId: string; items: Session[] };
export default function SessionsPanel() {
  const list = useQuery<SessionsResponse>({
    queryKey: ["sessions"],
    queryFn: async () => (await api.get<SessionsResponse>("/auth/sessions")).data,
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
  const revokeOthers = async () => {
    try {
      setBusy("others");
      await api.delete("/auth/sessions/others");
      toast.success("Sesiones no actuales revocadas");
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
        <div className="flex gap-2">
          <Button onClick={revokeOthers} variant="outline" disabled={busy === "others" || list.isPending}>Cerrar otras</Button>
          <Button onClick={revokeAll} variant="destructive" disabled={busy === "all" || list.isPending}>Revocar todas</Button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {(list.data?.items ?? []).map((s) => (
          <div key={s.id} className={`flex items-center justify-between border rounded p-2 ${s.id === list.data?.currentId ? "bg-accent" : ""}`}>
            <div className="text-xs">
              {s.ipAddress} • {s.userAgent} • {new Date(s.lastActive).toLocaleString()}
              {s.id === list.data?.currentId ? " • Actual" : ""}
            </div>
            <Button onClick={() => revoke(s.id)} variant="outline" disabled={busy === s.id || list.isPending || s.id === list.data?.currentId}>Revocar</Button>
          </div>
        ))}
        {list.isPending && <div className="text-sm">Cargando...</div>}
        {list.isError && <div className="text-sm text-red-600">Error al cargar sesiones</div>}
        {!list.isPending && !(list.data?.items?.length) && <div className="text-sm">Sin sesiones</div>}
      </div>
    </div>
  );
}