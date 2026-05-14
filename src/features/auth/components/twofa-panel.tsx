"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShieldCheck, ShieldAlert, ShieldOff,
  Download, Copy, RefreshCw, X, KeyRound, Fingerprint, ArrowRight,
} from "lucide-react";

type View = "idle" | "setup" | "regen-confirm" | "disable";

export default function TwofaPanel() {
  const status = useQuery({
    queryKey: ["twofa-status"],
    queryFn: async () => (await api.get("/auth/2fa/status")).data,
  });

  const [view, setView] = useState<View>("idle");
  const [setupCode, setSetupCode] = useState("");
  const [regenCurrentCode, setRegenCurrentCode] = useState("");
  const [disableTotpCode, setDisableTotpCode] = useState("");
  const [disableBackupCode, setDisableBackupCode] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [ackAllowed, setAckAllowed] = useState(false);
  const [pending, setPending] = useState(false);

  const s = status.data;
  const isEnabled = !!s?.enabled;
  const hasPendingSetup = !s?.enabled && !!s?.hasSecret;
  const backupCount: number = s?.backupCount ?? 0;
  const backupLow = isEnabled && backupCount < 3;

  const fetchQr = async (currentTotpCode?: string) => {
    setPending(true);
    try {
      const { data } = await api.post("/auth/enable-2fa", currentTotpCode ? { currentTotpCode } : {});
      setQrCode(data.qrCode);
      setRegenCurrentCode("");
      setView("setup");
      toast.info("Escanea el QR en tu app autenticadora");
    } catch {
      toast.error("No se pudo iniciar el proceso 2FA");
    } finally {
      setPending(false);
      status.refetch();
    }
  };

  const verify = async () => {
    if (setupCode.length !== 6) return;
    setPending(true);
    try {
      const { data } = await api.post("/auth/verify-2fa", { code: setupCode });
      setSetupCode("");
      setQrCode(null);
      setBackupCodes(Array.isArray(data?.backupCodes) ? data.backupCodes : []);
      setShowBackupModal(true);
      setAckAllowed(false);
      setView("idle");
      toast.success("2FA activado correctamente");
    } catch {
      toast.error("Código incorrecto, intenta de nuevo");
    } finally {
      setPending(false);
      status.refetch();
    }
  };

  const disable = async () => {
    setPending(true);
    try {
      await api.post("/auth/disable-2fa", { totpCode: disableTotpCode, backupCode: disableBackupCode });
      setDisableTotpCode("");
      setDisableBackupCode("");
      setView("idle");
      toast.success("2FA deshabilitado");
    } catch {
      toast.error("Código inválido");
    } finally {
      setPending(false);
      status.refetch();
    }
  };

  const cancel = async () => {
    setPending(true);
    try {
      await api.post("/auth/2fa/cancel");
      setQrCode(null);
      setSetupCode("");
      setView("idle");
      toast.success("Proceso cancelado");
    } catch {
      toast.error("Error al cancelar");
    } finally {
      setPending(false);
      status.refetch();
    }
  };

  const copyBackupCodes = async () => {
    if (!backupCodes?.length) return;
    await navigator.clipboard.writeText(backupCodes.join("\n"));
    setAckAllowed(true);
    toast.success("Backup codes copiados");
  };

  const downloadBackupCodes = () => {
    if (!backupCodes?.length) return;
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

  if (status.isPending) {
    return (
      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-muted animate-pulse" />
        Verificando estado...
      </div>
    );
  }

  if (status.isError) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <ShieldAlert className="h-4 w-4" />
        Error al cargar el estado del 2FA
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-5">

        {/* ─── Status indicator ─────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            isEnabled
              ? "bg-emerald-500/15"
              : hasPendingSetup
              ? "bg-amber-500/15"
              : "bg-muted"
          }`}>
            {isEnabled ? (
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            ) : hasPendingSetup ? (
              <ShieldAlert className="h-4 w-4 text-amber-400" />
            ) : (
              <ShieldOff className="h-4 w-4 text-muted-foreground" />
            )}
            {isEnabled && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium leading-tight">
              {isEnabled
                ? "Protección activa"
                : hasPendingSetup
                ? "Configuración pendiente"
                : "Sin protección adicional"}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {isEnabled
                ? `${backupCount} de 10 backup codes disponibles`
                : hasPendingSetup
                ? "Verifica el código para activar 2FA"
                : "Agrega una capa extra de seguridad"}
            </div>
          </div>
          {backupLow && (
            <div className="shrink-0 flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-400">
              <ShieldAlert className="h-3 w-3" />
              Bajos
            </div>
          )}
        </div>

        {/* ─── Stats (when enabled) ─────────────────────────────── */}
        {isEnabled && view === "idle" && (
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-lg border bg-muted/20 px-4 py-3">
              <div className="text-xs text-muted-foreground mb-1">Backup codes</div>
              <div className={`font-mono font-semibold text-xl leading-none ${backupLow ? "text-amber-400" : "text-foreground"}`}>
                {backupCount}
                <span className="text-xs font-sans font-normal text-muted-foreground ml-1">/10</span>
              </div>
            </div>
            <div className="rounded-lg border bg-muted/20 px-4 py-3">
              <div className="text-xs text-muted-foreground mb-1">Estado</div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-medium text-emerald-400">Activo</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── Idle: no 2FA ─────────────────────────────────────── */}
        {!isEnabled && !hasPendingSetup && view === "idle" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Conecta una app autenticadora (Google Authenticator, Authy, etc.) para generar
              códigos de acceso únicos cada 30 segundos.
            </p>
            <Button onClick={() => fetchQr()} disabled={pending} className="w-fit gap-2">
              <Fingerprint className="h-4 w-4" />
              Activar 2FA
            </Button>
          </div>
        )}

        {/* ─── Idle: pending setup ──────────────────────────────── */}
        {hasPendingSetup && view === "idle" && (
          <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-amber-400 mb-0.5">Configuración incompleta</div>
                <p className="text-xs text-muted-foreground mb-3">
                  Tienes un QR pendiente de verificar. Escanéalo y confirma el código para activar la protección.
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => fetchQr()} disabled={pending} size="sm" className="gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Continuar
                  </Button>
                  <Button onClick={cancel} disabled={pending} variant="ghost" size="sm">
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Setup flow ───────────────────────────────────────── */}
        {view === "setup" && (
          <div className="flex flex-col gap-5">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                  1
                </div>
                <div className="mt-1 w-px flex-1 bg-border" />
              </div>
              <div className="flex-1 pb-5 flex flex-col gap-3">
                <div>
                  <div className="text-sm font-medium">Escanea el QR</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Abre tu app autenticadora y escanea el código.
                  </div>
                </div>
                {qrCode && (
                  <div className="rounded-xl border-2 border-border bg-white p-3 w-fit shadow-sm">
                    <Image src={qrCode} alt="QR 2FA" width={148} height={148} />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                2
              </div>
              <div className="flex-1 flex flex-col gap-3">
                <div>
                  <div className="text-sm font-medium">Confirma con tu app</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Ingresa el código de 6 dígitos que muestra tu app.
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="000 000"
                    value={setupCode}
                    onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, ""))}
                    maxLength={6}
                    autoComplete="one-time-code"
                    className="w-32 font-mono text-center tracking-[0.35em] text-base"
                  />
                  <Button onClick={verify} disabled={pending || setupCode.length !== 6} className="gap-1.5">
                    <ArrowRight className="h-4 w-4" />
                    Activar
                  </Button>
                </div>
              </div>
            </div>

            <Button onClick={cancel} disabled={pending} variant="ghost" size="sm" className="w-fit text-muted-foreground gap-1.5">
              <X className="h-3.5 w-3.5" />
              Cancelar
            </Button>
          </div>
        )}

        {/* ─── Enabled: action buttons ──────────────────────────── */}
        {isEnabled && view === "idle" && (
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setView("regen-confirm")} variant="outline" size="sm" className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerar QR
            </Button>
            <Button onClick={() => setView("disable")} variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50">
              <ShieldOff className="h-3.5 w-3.5" />
              Desactivar
            </Button>
          </div>
        )}

        {/* ─── Regen confirm ────────────────────────────────────── */}
        {view === "regen-confirm" && (
          <div className="flex flex-col gap-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div>
              <div className="text-sm font-medium">Verificar identidad</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Ingresa tu código TOTP actual para generar un nuevo QR.
              </div>
            </div>
            <div className="flex gap-2 items-start">
              <Input
                placeholder="000 000"
                value={regenCurrentCode}
                onChange={(e) => setRegenCurrentCode(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                autoComplete="one-time-code"
                className="w-32 font-mono text-center tracking-[0.35em]"
              />
              <Button
                onClick={() => fetchQr(regenCurrentCode)}
                disabled={pending || regenCurrentCode.length !== 6}
                className="gap-1.5"
              >
                <ArrowRight className="h-4 w-4" />
                Continuar
              </Button>
            </div>
            <Button onClick={() => setView("idle")} variant="ghost" size="sm" className="w-fit text-muted-foreground gap-1.5">
              <X className="h-3.5 w-3.5" />
              Volver
            </Button>
          </div>
        )}

        {/* ─── Disable form ─────────────────────────────────────── */}
        {view === "disable" && (
          <div className="flex flex-col gap-4 rounded-lg border border-destructive/25 bg-destructive/5 p-4">
            <div>
              <div className="text-sm font-medium">Desactivar autenticación 2FA</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Esta acción reduce la seguridad de tu cuenta. Usa un código TOTP o un backup code.
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Código TOTP actual</label>
                <Input
                  placeholder="000 000"
                  value={disableTotpCode}
                  onChange={(e) => setDisableTotpCode(e.target.value.replace(/\D/g, ""))}
                  maxLength={6}
                  autoComplete="one-time-code"
                  className="w-32 font-mono text-center tracking-[0.35em]"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">o</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Backup code</label>
                <Input
                  placeholder="xxxxxxxxxx"
                  value={disableBackupCode}
                  onChange={(e) => setDisableBackupCode(e.target.value)}
                  className="w-48 font-mono text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={disable}
                disabled={pending || (!disableTotpCode && !disableBackupCode)}
                variant="destructive"
                size="sm"
              >
                Confirmar
              </Button>
              <Button onClick={() => setView("idle")} variant="ghost" size="sm">
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Backup codes modal ─────────────────────────────────── */}
      {showBackupModal && backupCodes && backupCodes.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
          <Card className="relative z-10 w-full max-w-sm shadow-2xl">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-5">
                <div className="text-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-emerald-500/15 mx-auto mb-3">
                    <KeyRound className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="font-semibold">2FA activado</div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Guarda estos códigos en un lugar seguro.<br />
                    Se muestran <strong className="text-foreground">una sola vez</strong>.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {backupCodes.map((c) => (
                    <div
                      key={c}
                      className="rounded-md border bg-muted/40 px-3 py-2 text-xs font-mono text-center tracking-wider"
                    >
                      {c}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button onClick={copyBackupCodes} variant="outline" size="sm" className="flex-1 gap-1.5">
                    <Copy className="h-3.5 w-3.5" />
                    Copiar
                  </Button>
                  <Button onClick={downloadBackupCodes} variant="outline" size="sm" className="flex-1 gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    Descargar
                  </Button>
                </div>

                {!ackAllowed && (
                  <p className="text-xs text-center text-muted-foreground">
                    Copia o descarga los códigos para continuar
                  </p>
                )}

                <Button
                  onClick={() => { setShowBackupModal(false); setBackupCodes(null); }}
                  disabled={!ackAllowed}
                  className="w-full"
                >
                  Entendido, ya los guardé
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
