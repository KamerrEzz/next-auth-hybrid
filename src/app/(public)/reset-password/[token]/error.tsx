'use client';

import { useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <ShieldAlert className="h-10 w-10 text-destructive" />
      <h2 className="text-lg font-semibold">Algo salió mal</h2>
      <p className="text-sm text-muted-foreground">No se pudo cargar la página.</p>
      <Button variant="outline" size="sm" onClick={reset}>
        Reintentar
      </Button>
    </div>
  );
}
