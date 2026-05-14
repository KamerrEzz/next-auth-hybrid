import Navbar from "@/components/navbar";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col auth-bg">
            <Navbar />
            <main className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-sm">
                    {children}
                </div>
            </main>
        </div>
    );
}
