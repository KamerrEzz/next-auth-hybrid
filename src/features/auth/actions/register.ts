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

type ParsedCookie = {
    name: string;
    value: string;
    path: string;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'lax' | 'strict' | 'none';
    maxAge?: number;
    expires?: Date;
};

function splitOnce(input: string, sep: string): [string, string] {
    const idx = input.indexOf(sep);
    if (idx < 0) return [input, ''];
    return [input.slice(0, idx), input.slice(idx + 1)];
}

function parseSetCookie(raw: string): ParsedCookie | null {
    const [pair, ...attrs] = raw.split(';');
    const [rawName, rawValue] = splitOnce(pair, '=');
    const name = rawName.trim();
    if (!name) return null;
    const value = rawValue.trim();

    const parsed: ParsedCookie = { name, value, path: '/' };
    for (const attr of attrs) {
        const [k, v] = splitOnce(attr.trim(), '=');
        const key = k.toLowerCase();
        const val = v.trim();
        if (key === 'path') parsed.path = val || '/';
        else if (key === 'httponly') parsed.httpOnly = true;
        else if (key === 'secure') parsed.secure = true;
        else if (key === 'samesite') {
            const s = val.toLowerCase();
            if (s === 'lax' || s === 'strict' || s === 'none') parsed.sameSite = s;
        } else if (key === 'max-age') {
            const n = Number.parseInt(val, 10);
            if (Number.isFinite(n)) parsed.maxAge = n;
        } else if (key === 'expires') {
            const d = new Date(val);
            if (!Number.isNaN(d.getTime())) parsed.expires = d;
        }
    }
    return parsed;
}

async function setAuthCookies(response: Response) {
    const cookieStore = await cookies();
    const setCookieHeader = response.headers.getSetCookie();
    for (const cookieString of setCookieHeader) {
        const parsed = parseSetCookie(cookieString);
        if (parsed) cookieStore.set(parsed);
    }
}

export async function registerAction(prevState: unknown, formData: FormData) {
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

    await setAuthCookies(response);
    redirect('/dashboard');
}
