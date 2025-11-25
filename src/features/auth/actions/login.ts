'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

// Helper to set cookies from backend response
async function setAuthCookies(response: Response) {
    const cookieStore = await cookies();
    const setCookieHeader = response.headers.getSetCookie();

    if (setCookieHeader) {
        setCookieHeader.forEach((cookieString) => {
            const [cookieNameValue, ...options] = cookieString.split(';');
            const [name, value] = cookieNameValue.split('=');

            if (name && value) {
                const cookieOptions: any = {
                    path: '/', // Default to root path
                };
                options.forEach((option) => {
                    const [key, val] = option.trim().split('=');
                    if (key.toLowerCase() === 'path') cookieOptions.path = val || '/';
                    if (key.toLowerCase() === 'httponly') cookieOptions.httpOnly = true;
                    if (key.toLowerCase() === 'secure') cookieOptions.secure = true;
                    if (key.toLowerCase() === 'samesite') cookieOptions.sameSite = val.toLowerCase() as 'lax' | 'strict' | 'none';
                    if (key.toLowerCase() === 'max-age') cookieOptions.maxAge = parseInt(val);
                    if (key.toLowerCase() === 'expires') cookieOptions.expires = new Date(val);
                });

                cookieStore.set({
                    name,
                    value,
                    ...cookieOptions,
                });
            }
        });
    }
}

export async function loginAction(prevState: any, formData: FormData) {
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
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

        const response = await fetch(`${apiUrl}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(parsed.data),
            credentials: 'include',
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            return {
                error: data.message || 'Credenciales inválidas',
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

        // Set cookies from backend response
        await setAuthCookies(response);

        // Login exitoso - retornar éxito
        return {
            success: true,
        };
    } catch (error) {
        console.error('Login error:', error);
        return {
            error: 'Error de conexión con el servidor',
        };
    }
}

const verifyOtpSchema = z.object({
    tempToken: z.string(),
    totpCode: z.string().length(6, 'El código debe tener 6 dígitos'),
});

export async function verifyOtpAction(prevState: any, formData: FormData) {
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
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

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

        // Set cookies from backend response
        await setAuthCookies(response);

        return {
            success: true,
        };
    } catch (error) {
        console.error('OTP error:', error);
        return {
            error: 'Error de conexión con el servidor',
        };
    }
}
