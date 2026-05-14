'use client';

import { useActionState } from 'react';
import { forgotPasswordAction, type ForgotPasswordState } from '@/features/auth/actions/forgot-password';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Mail, Shield, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const initialState: ForgotPasswordState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, initialState);

  return (
    <Card className="w-full shadow-2xl border-border/60">
      <CardHeader className="space-y-4">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <Shield className="h-7 w-7 text-primary" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Recuperar contraseña
          </CardTitle>
          <CardDescription>
            Te enviaremos un enlace para restablecer tu contraseña
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
              Revisa tu bandeja de entrada — si el email está registrado, recibirás un enlace.
            </p>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                required
                disabled={isPending}
                className="h-11"
                autoComplete="email"
              />
            </div>

            {state.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full h-11" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar enlace'
              )}
            </Button>
          </form>
        )}

        <div className="text-center text-sm text-muted-foreground pt-2">
          <Link
            href="/login"
            className="underline underline-offset-4 hover:text-primary transition-colors"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
