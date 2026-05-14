import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/components/login-form';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Iniciar Sesión',
  description: 'Inicia sesión en tu cuenta',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const cookieStore = await cookies();
  const csrfToken = cookieStore.get('csrfToken');

  if (!csrfToken) {
    const apiUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    await fetch(`${apiUrl}/auth/csrf`, { credentials: 'include' });
  }

  const { from } = await searchParams;
  return <LoginForm from={from} />;
}
