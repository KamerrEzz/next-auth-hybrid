'use server';

import { z } from 'zod';

const schema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

export type ResetPasswordState = {
  error?: string;
  success?: boolean;
};

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = schema.safeParse({
    token: formData.get('token'),
    newPassword: formData.get('newPassword'),
  });
  if (!parsed.success) return { error: 'Datos inválidos' };

  try {
    const backend = process.env.BACKEND_URL ?? 'http://localhost:3000';
    const res = await fetch(`${backend}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
    if (res.status === 401) return { error: 'El enlace ha expirado o es inválido' };
    if (!res.ok) return { error: 'Error al restablecer la contraseña' };
    return { success: true };
  } catch {
    return { error: 'Error de conexión' };
  }
}
