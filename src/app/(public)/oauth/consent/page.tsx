'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Shield, ShieldCheck, ShieldAlert, User, Mail, FileText, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const SCOPE_LABELS: Record<string, { label: string; description: string; icon: React.ReactNode }> = {
  openid: { label: 'Identidad', description: 'Tu identificador único de usuario', icon: <Lock className="h-4 w-4" /> },
  profile: { label: 'Perfil', description: 'Tu nombre y datos de perfil', icon: <User className="h-4 w-4" /> },
  email: { label: 'Email', description: 'Tu dirección de correo electrónico', icon: <Mail className="h-4 w-4" /> },
  notes: { label: 'Notas', description: 'Acceso a tus notas', icon: <FileText className="h-4 w-4" /> },
};

function ConsentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const requestId = searchParams.get('request_id');
  const appName = searchParams.get('app_name') ?? 'Aplicación';
  const scopeStr = searchParams.get('scope') ?? 'openid';
  const scopes = scopeStr.split(' ').filter(Boolean);

  async function handleConsent(approved: boolean) {
    if (!requestId) return;
    setLoading(true);
    try {
      const res = await api.post<{ redirectTo: string }>('/oauth/authorize', {
        request_id: requestId,
        approved,
      });
      window.location.href = res.data.redirectTo;
    } catch {
      toast.error(approved ? 'Error al autorizar. Inténtalo de nuevo.' : 'Error al denegar el acceso.');
      setLoading(false);
    }
  }

  if (!requestId) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <ShieldAlert className="h-10 w-10 text-destructive" />
        <p className="text-sm text-muted-foreground">Solicitud OAuth inválida o expirada.</p>
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
          Ir al dashboard
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-xl border-border/60">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <Shield className="h-7 w-7 text-primary" />
          </div>
        </div>
        <CardTitle className="text-xl">Autorizar acceso</CardTitle>
        <CardDescription className="text-sm mt-1">
          <span className="font-semibold text-foreground">{appName}</span> quiere acceder a tu cuenta de VaultAuth
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 pb-4">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Permisos solicitados</p>
        <div className="rounded-lg border border-border/60 divide-y divide-border/40">
          {scopes.map((scope) => {
            const meta = SCOPE_LABELS[scope];
            if (!meta) return null;
            return (
              <div key={scope} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  {meta.icon}
                </div>
                <div>
                  <p className="text-sm font-medium">{meta.label}</p>
                  <p className="text-xs text-muted-foreground">{meta.description}</p>
                </div>
                <ShieldCheck className="ml-auto h-4 w-4 text-emerald-400 shrink-0" />
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Al autorizar, compartes esta información con <span className="font-medium">{appName}</span>. Puedes revocar el acceso en cualquier momento.
        </p>
      </CardContent>

      <CardFooter className="flex gap-2 pt-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => handleConsent(false)}
          disabled={loading}
        >
          Denegar
        </Button>
        <Button
          className="flex-1"
          onClick={() => handleConsent(true)}
          disabled={loading}
        >
          {loading ? 'Autorizando...' : 'Autorizar'}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function ConsentPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Suspense fallback={
        <div className="flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }>
        <ConsentContent />
      </Suspense>
    </div>
  );
}
