'use client';

import { useActionState, useState, use } from 'react';
import { resetPasswordAction, type ResetPasswordState } from '@/features/auth/actions/reset-password';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, KeyRound, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const initialState: ResetPasswordState = {};

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [state, formAction, isPending] = useActionState(resetPasswordAction, initialState);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [matchError, setMatchError] = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const newPassword = (form.elements.namedItem('newPassword') as HTMLInputElement).value;
    if (newPassword !== confirmPassword) {
      e.preventDefault();
      setMatchError('Las contraseñas no coinciden');
      return;
    }
    setMatchError('');
  }

  return (
    <Card className="w-full shadow-2xl border-border/60">
      <CardHeader className="space-y-4">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <KeyRound className="h-7 w-7 text-primary" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Nueva contraseña
          </CardTitle>
          <CardDescription>
            Elige una contraseña segura para tu cuenta
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {state.success ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tu contraseña ha sido restablecida correctamente.
            </p>
            <Button asChild className="h-11 px-8">
              <Link href="/login">Iniciar sesión</Link>
            </Button>
          </div>
        ) : (
          <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="token" value={token} />

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva contraseña</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="••••••••"
                required
                disabled={isPending}
                className="h-11"
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
                disabled={isPending}
                className="h-11"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (matchError) setMatchError('');
                }}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Mínimo 8 caracteres, incluyendo mayúsculas, números y símbolos.
            </p>

            {(matchError || state.error) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{matchError || state.error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full h-11" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Restablecer contraseña'
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
