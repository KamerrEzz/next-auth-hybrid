import type { Metadata } from 'next';
import { RegisterForm } from '@/features/auth/components/register-form';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Crear Cuenta',
  description: 'Regístrate para comenzar',
};

export default async function RegisterPage() {
  // Obtener CSRF token del backend si no existe
  const cookieStore = await cookies();
  const csrfToken = cookieStore.get('csrfToken');

  if (!csrfToken) {
    // Hacer request al backend para obtener CSRF token
    const apiUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    await fetch(`${apiUrl}/auth/csrf`, {
      credentials: 'include',
    });
  }

  return <RegisterForm />;
}
