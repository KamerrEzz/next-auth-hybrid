'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await fetch('/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
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
