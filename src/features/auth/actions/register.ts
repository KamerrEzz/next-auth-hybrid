'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const registerSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            'Debe contener mayúsculas, minúsculas, números y caracteres especiales (@$!%*?&)',
        ),
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
});

export async function registerAction(prevState: any, formData: FormData) {
    const parsed = registerSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
        name: formData.get('name') || undefined,
    });

    if (!parsed.success) {
        return {
            error: parsed.error.issues[0].message,
        };
    }

    const apiUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    let response: Response;
    try {
        response = await fetch(`${apiUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed.data),
            credentials: 'include',
        });
    } catch {
        return { error: 'Error de conexión con el servidor' };
    }

    if (!response.ok) {
        if (response.status === 409) return { error: 'Ya existe una cuenta con ese email' };
        return { error: 'Error al crear la cuenta. Inténtalo de nuevo.' };
    }

    redirect('/dashboard');
}
