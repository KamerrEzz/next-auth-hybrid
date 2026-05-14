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
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
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

    try {
        const apiUrl = process.env.BACKEND_URL || 'http://localhost:3000';

        const response = await fetch(`${apiUrl}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(parsed.data),
            credentials: 'include',
        });

        if (!response.ok) {
            const status = response.status;
            if (status === 409) return { error: 'Ya existe una cuenta con ese email' };
            return { error: 'Error al crear la cuenta. Inténtalo de nuevo.' };
        }

        // Registro exitoso - redirigir
        redirect('/dashboard');
    } catch (error) {
        // No atrapar errores de redirección de Next.js
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error;
        }

        return {
            error: 'Error de conexión con el servidor',
        };
    }
}
