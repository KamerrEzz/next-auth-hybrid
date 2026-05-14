import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Shield, Key, Monitor, FileText, User, Mail, Calendar, Hash } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const backend = process.env.BACKEND_URL ?? "http://localhost:3000";

import ChangePassword from "@/features/auth/components/change-password";
import TwofaPanel from "@/features/auth/components/twofa-panel";
import SessionsPanel from "@/features/auth/components/sessions-panel";
import NotesPanel from "@/features/notes/components/notes-panel";
import { VerifyEmailBanner } from "@/features/auth/components/verify-email-banner";

async function getMe() {
  const store = await cookies();
  const cookieHeader = store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  try {
    const res = await fetch(`${backend}/auth/me`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const me = await getMe();
  if (!me) redirect("/login");

  const has2fa = me.twoFactorEnabled ?? me.has2fa ?? me.mfaEnabled;

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-5">

      {/* Email verification banner */}
      {me.emailVerified === false && <VerifyEmailBanner />}

      {/* Profile */}
      <Card className="border-primary/20 bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 border border-primary/25">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg leading-tight">
                {me.name ?? me.email?.split("@")[0] ?? "Usuario"}
              </CardTitle>
              <CardDescription className="flex items-center gap-1.5 mt-1 text-sm">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{me.email}</span>
              </CardDescription>
            </div>
            {has2fa !== undefined && (
              <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full border font-medium ${
                has2fa
                  ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                  : "text-muted-foreground border-border bg-muted/50"
              }`}>
                {has2fa ? "2FA activo" : "Sin 2FA"}
              </span>
            )}
          </div>
        </CardHeader>
        {(me.id || me.createdAt) && (
          <CardContent className="pb-4 pt-0">
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-t border-border/50 pt-3">
              {me.id && (
                <span className="flex items-center gap-1.5">
                  <Hash className="h-3 w-3" />
                  <span className="font-mono">{me.id}</span>
                </span>
              )}
              {me.createdAt && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  {new Date(me.createdAt).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Change Password */}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <Key className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Cambiar contraseña</CardTitle>
              <CardDescription className="text-xs mt-0.5">Actualiza tus credenciales de acceso</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChangePassword />
        </CardContent>
      </Card>

      {/* 2FA */}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <Shield className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Autenticación de dos factores</CardTitle>
              <CardDescription className="text-xs mt-0.5">Protege tu cuenta con un segundo factor de verificación</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TwofaPanel />
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Sesiones activas</CardTitle>
              <CardDescription className="text-xs mt-0.5">Gestiona tus dispositivos conectados</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SessionsPanel />
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Notas</CardTitle>
              <CardDescription className="text-xs mt-0.5">Tus notas personales y seguras</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <NotesPanel />
        </CardContent>
      </Card>

    </div>
  );
}
