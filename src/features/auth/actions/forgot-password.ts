'use server';

import { z } from 'zod';

const schema = z.object({ email: z.string().email() });

export type ForgotPasswordState = {
  error?: string;
  success?: boolean;
};

export async function forgotPasswordAction(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = schema.safeParse({ email: formData.get('email') });
  if (!parsed.success) return { error: 'Email inválido' };

  try {
    const backend = process.env.BACKEND_URL ?? 'http://localhost:3000';
    const res = await fetch(`${backend}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
    if (!res.ok && res.status !== 200) {
      return { error: 'Error al procesar la solicitud' };
    }
    return { success: true };
  } catch {
    return { error: 'Error de conexión' };
  }
}
