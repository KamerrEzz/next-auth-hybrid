import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/components/login-form';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Iniciar Sesión',
  description: 'Inicia sesión en tu cuenta',
};

export default async function LoginPage() {
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

  return <LoginForm />;
}
