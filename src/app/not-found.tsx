import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center text-center max-w-md space-y-6">
        {/* Icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
          <ShieldAlert className="h-10 w-10 text-primary" />
        </div>

        {/* 404 */}
        <p className="font-mono text-7xl font-bold tracking-tight text-primary">
          404
        </p>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Página no encontrada
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            La página que buscas no existe o ha sido movida.
            Verifica la URL o regresa al inicio.
          </p>
        </div>

        {/* CTA */}
        <Button asChild className="h-11 px-8">
          <Link href="/dashboard">Ir al dashboard</Link>
        </Button>

        <Link
          href="/login"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-primary transition-colors"
        >
          O inicia sesión
        </Link>
      </div>
    </div>
  );
}
