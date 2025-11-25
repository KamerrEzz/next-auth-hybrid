import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Autenticación',
    description: 'Inicia sesión o regístrate',
};

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            <div className="w-full max-w-md px-4">
                {children}
            </div>
        </div>
    );
}
