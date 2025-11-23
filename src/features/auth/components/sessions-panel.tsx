"use client";
import { useState } from "react";
import { useSessions } from "@/features/auth/hooks/useSessions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SessionsPanel() {
  const { query: list, revokeAll, revokeOthers, revoke } = useSessions();
  const [busy, setBusy] = useState<string | null>(null);

  const onRevokeAll = async () => {
    try {
      setBusy("all");
      await revokeAll();
      toast.success("Todas las sesiones revocadas");
    } finally {
      setBusy(null);
    }
  };
  const onRevokeOthers = async () => {
    try {
      setBusy("others");
      await revokeOthers();
      toast.success("Sesiones no actuales revocadas");
    } finally {
      setBusy(null);
    }
  };

  const onRevoke = async (id: string) => {
    try {
      setBusy(id);
      await revoke(id);
      toast.success("Sesión revocada");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">Sesiones</div>
        <div className="flex gap-2">
          <Button onClick={onRevokeOthers} variant="outline" disabled={busy === "others" || list.isPending}>Cerrar otras</Button>
          <Button onClick={onRevokeAll} variant="destructive" disabled={busy === "all" || list.isPending}>Revocar todas</Button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {(list.data?.items ?? []).map((s) => (
          <div key={s.id} className={`flex items-center justify-between border rounded p-2 ${s.id === list.data?.currentId ? "bg-accent" : ""}`}>
            <div className="text-xs">
              {s.ipAddress} • {s.userAgent} • {new Date(s.lastActive).toLocaleString()}
              {s.id === list.data?.currentId ? " • Actual" : ""}
            </div>
            <Button onClick={() => onRevoke(s.id)} variant="outline" disabled={busy === s.id || list.isPending || s.id === list.data?.currentId}>Revocar</Button>
          </div>
        ))}
        {list.isPending && <div className="text-sm">Cargando...</div>}
        {list.isError && <div className="text-sm text-red-600">Error al cargar sesiones</div>}
        {!list.isPending && !(list.data?.items?.length) && <div className="text-sm">Sin sesiones</div>}
      </div>
    </div>
  );
}