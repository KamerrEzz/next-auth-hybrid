import Navbar from "@/components/navbar";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Navbar />
            <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
        </>
    );
}
