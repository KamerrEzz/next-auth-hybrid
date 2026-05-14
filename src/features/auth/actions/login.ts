'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
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

function safeRedirectUrl(from: unknown): string {
    if (typeof from !== 'string' || !from.startsWith('/')) return '/dashboard';
    return from;
}

export async function loginAction(prevState: unknown, formData: FormData) {
    const from = safeRedirectUrl(formData.get('from'));
    const parsed = loginSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
    });

    if (!parsed.success) {
        return {
            error: parsed.error.issues[0].message,
        };
    }

    try {
        const apiUrl = process.env.BACKEND_URL || 'http://localhost:3000';

        const response = await fetch(`${apiUrl}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(parsed.data),
            credentials: 'include',
        });

        if (!response.ok) {
            if (response.status === 429) {
                return { error: 'Demasiados intentos. Por favor espera unos minutos antes de intentarlo de nuevo.' };
            }
            // Check for account lockout message in response body
            try {
                const body = await response.json();
                const msg: string = (body?.message ?? body?.error ?? '').toLowerCase();
                if (msg.includes('locked')) {
                    return { error: 'Cuenta temporalmente bloqueada. Intenta de nuevo en 15 minutos.' };
                }
            } catch {
                // ignore parse errors
            }
            return {
                error: 'Credenciales inválidas',
            };
        }

        const data = await response.json();

        // Si requiere 2FA
        if (data.requiresOtp && data.tempToken) {
            return {
                requiresOtp: true,
                tempToken: data.tempToken,
            };
        }

        await setAuthCookies(response);
    } catch {
        return { error: 'Error de conexión con el servidor' };
    }

    redirect(from);
}

const verifyOtpSchema = z.object({
    tempToken: z.string(),
    totpCode: z.string().length(6, 'El código debe tener 6 dígitos'),
});

export async function verifyOtpAction(prevState: unknown, formData: FormData) {
    const from = safeRedirectUrl(formData.get('from'));
    const parsed = verifyOtpSchema.safeParse({
        tempToken: formData.get('tempToken'),
        totpCode: formData.get('totpCode'),
    });

    if (!parsed.success) {
        return {
            error: parsed.error.issues[0].message,
        };
    }

    try {
        const apiUrl = process.env.BACKEND_URL || 'http://localhost:3000';

        const response = await fetch(`${apiUrl}/auth/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(parsed.data),
            credentials: 'include',
        });

        if (!response.ok) {
            return {
                error: 'Código 2FA inválido',
            };
        }

        await setAuthCookies(response);
    } catch {
        return { error: 'Error de conexión con el servidor' };
    }

    redirect(from);
}
