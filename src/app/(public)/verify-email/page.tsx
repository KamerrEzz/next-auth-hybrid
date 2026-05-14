import Link from 'next/link';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let ok = false;

  if (token) {
    try {
      const backend = process.env.BACKEND_URL ?? 'http://localhost:3000';
      const res = await fetch(
        `${backend}/auth/verify-email?token=${encodeURIComponent(token)}`,
        { cache: 'no-store' },
      );
      ok = res.ok;
    } catch {
      ok = false;
    }
  }

  return (
    <Card className="w-full shadow-2xl border-border/60">
      <CardHeader className="space-y-4">
        <div className="flex justify-center">
          {ok ? (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <ShieldCheck className="h-7 w-7 text-emerald-400" />
            </div>
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20">
              <ShieldAlert className="h-7 w-7 text-destructive" />
            </div>
          )}
        </div>

        <div className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {ok ? 'Email verificado' : 'Enlace inválido'}
          </CardTitle>
          <CardDescription>
            {ok
              ? 'Tu dirección de email ha sido verificada correctamente'
              : 'El enlace ha expirado o es inválido'}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col items-center gap-4 pb-6">
        {ok ? (
          <>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              Ya puedes acceder a todas las funciones de tu cuenta.
            </p>
            <Button asChild className="h-11 px-8">
              <Link href="/dashboard">Ir al dashboard</Link>
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              Puedes solicitar un nuevo enlace de verificación desde tu dashboard.
            </p>
            <Button asChild variant="outline" className="h-11 px-8">
              <Link href="/dashboard">Ir al dashboard</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
