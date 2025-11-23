"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function TwofaPanel() {
  const status = useQuery({
    queryKey: ["twofa-status"],
    queryFn: async () => (await api.get("/auth/2fa/status")).data,
  });
  const [code, setCode] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [provisioned, setProvisioned] = useState<{ qrCode: string; secret: string } | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [pending, setPending] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [ackAllowed, setAckAllowed] = useState(false);

  const enable = async () => {
    try {
      setPending(true);
      const { data } = await api.post("/auth/enable-2fa");
      setProvisioned({ qrCode: data.qrCode, secret: data.secret });
      toast.info("Escanea el QR y verifica el código");
    } finally {
      setPending(false);
      status.refetch();
    }
  };
  const verify = async () => {
    if (!code) return;
    try {
      setPending(true);
      const { data } = await api.post("/auth/verify-2fa", { code });
      setCode("");
      setProvisioned(null);
      setBackupCodes(Array.isArray(data?.backupCodes) ? data.backupCodes : []);
      setShowBackupModal(true);
      setAckAllowed(false);
      toast.success("2FA verificado y backup codes generados");
    } finally {
      setPending(false);
      status.refetch();
    }
  };
  const disable = async () => {
    try {
      setPending(true);
      await api.post("/auth/disable-2fa", { totpCode, backupCode });
      setTotpCode("");
      setBackupCode("");
      toast.success("2FA deshabilitado");
    } finally {
      setPending(false);
      status.refetch();
    }
  };
  const cancel = async () => {
    try {
      setPending(true);
      await api.post("/auth/2fa/cancel");
      toast.success("Proceso 2FA cancelado");
    } finally {
      setPending(false);
      status.refetch();
    }
  };

  const copySecret = async () => {
    if (!provisioned?.secret) return;
    await navigator.clipboard.writeText(provisioned.secret);
    toast.success("Secreto copiado");
  };
  const copyBackupCodes = async () => {
    if (!backupCodes || backupCodes.length === 0) return;
    await navigator.clipboard.writeText(backupCodes.join("\n"));
    setAckAllowed(true);
    toast.success("Backup codes copiados");
  };
  const downloadBackupCodes = () => {
    if (!backupCodes || backupCodes.length === 0) return;
    const blob = new Blob([backupCodes.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setAckAllowed(true);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">2FA</div>
        <div className="text-sm">
          {status.isPending ? "Cargando..." : status.isError ? "Error" : status.data?.enabled ? "Activo" : "Inactivo"}
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={enable} variant="outline" disabled={pending || status.isPending}>Enable</Button>
        <Button onClick={cancel} variant="outline" disabled={pending || status.isPending}>Cancel</Button>
      </div>
      {provisioned && (
        <div className="flex flex-col gap-2">
          <div className="text-sm">Escanea el QR en tu app TOTP</div>
          <Image src={provisioned.qrCode} alt="QR 2FA" width={160} height={160} className="border rounded" />
          <div className="flex items-center gap-2">
            <input className="border rounded px-3 py-2 w-full" readOnly value={provisioned.secret} />
            <Button onClick={copySecret} variant="outline">Copiar secreto</Button>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input className="border rounded px-3 py-2" placeholder="Código TOTP" value={code} onChange={(e) => setCode(e.target.value)} />
        <Button onClick={verify} disabled={pending || status.isPending}>Verify</Button>
      </div>
      {showBackupModal && backupCodes && backupCodes.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" />
          <Card className="relative z-10 w-full max-w-md">
            <CardHeader>
              <div className="font-medium">Backup codes generados</div>
              <div className="text-xs text-muted-foreground">Guárdalos de forma segura. Se muestran una sola vez.</div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {backupCodes.map((c) => (
                  <div key={c} className="border rounded px-3 py-2 text-sm">{c}</div>
                ))}
              </div>
              <div className="flex gap-2 mb-3">
                <Button onClick={copyBackupCodes} variant="outline">Copiar</Button>
                <Button onClick={downloadBackupCodes} variant="outline">Descargar</Button>
              </div>
              <Button
                onClick={() => {
                  setShowBackupModal(false);
                  setBackupCodes(null);
                }}
                disabled={!ackAllowed}
              >Entendido</Button>
            </CardContent>
          </Card>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input className="border rounded px-3 py-2" placeholder="TOTP" value={totpCode} onChange={(e) => setTotpCode(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="Backup code" value={backupCode} onChange={(e) => setBackupCode(e.target.value)} />
        <Button onClick={disable} variant="destructive" disabled={pending || status.isPending}>Disable</Button>
      </div>
      <div className="text-xs">Secret: {status.data?.hasSecret ? "Sí" : "No"} | Backups: {status.data?.backupCount ?? 0}</div>
    </div>
  );
}