'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function LoginError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Login error:', error);
    }, [error]);

    return (
        <Card className="w-full shadow-2xl border-0">
            <CardHeader>
                <CardTitle className="text-2xl">Error de Autenticación</CardTitle>
                <CardDescription>
                    Ocurrió un problema al intentar iniciar sesión
                </CardDescription>
            </CardHeader>

            <CardContent>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {error.message || 'Ha ocurrido un error inesperado. Por favor, intenta de nuevo.'}
                    </AlertDescription>
                </Alert>
            </CardContent>

            <CardFooter className="flex gap-2">
                <Button onClick={reset} className="flex-1">
                    Intentar de nuevo
                </Button>
                <Button variant="outline" asChild className="flex-1">
                    <a href="/">Volver al inicio</a>
                </Button>
            </CardFooter>
        </Card>
    );
}
