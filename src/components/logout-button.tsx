'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

            await fetch(`${apiUrl}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });

            // Redirigir a login
            router.push('/login');
            router.refresh();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    return (
        <Button onClick={handleLogout} variant="outline">
            Cerrar Sesión
        </Button>
    );
}
