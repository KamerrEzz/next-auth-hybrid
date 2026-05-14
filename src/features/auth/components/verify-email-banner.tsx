'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function VerifyEmailBanner() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    setLoading(true);
    try {
      await api.post('/auth/send-verification');
      setSent(true);
      toast.success('Enviado. Revisa tu bandeja de entrada.');
    } catch {
      toast.error('No se pudo enviar el email. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-400">Tu email no está verificado</p>
        <p className="text-xs text-amber-400/80 mt-0.5">
          Verifica tu dirección de email para acceder a todas las funciones.
        </p>
      </div>
      {sent ? (
        <div className="flex items-center gap-1.5 text-xs text-amber-400 shrink-0">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Enviado
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 h-7 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 bg-transparent"
          onClick={handleResend}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              Enviando...
            </>
          ) : (
            'Reenviar verificación'
          )}
        </Button>
      )}
    </div>
  );
}
