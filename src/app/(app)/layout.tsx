import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3000"

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Server-side auth guard — validates the session against the backend on every
    // request. This is the real security boundary; proxy.ts is only a coarse
    // pre-filter that avoids unnecessary round-trips for clearly unauthenticated users.
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("sessionId")?.value

    if (!sessionId) redirect("/login")

    try {
        const res = await fetch(`${backendUrl}/auth/me`, {
            headers: { Cookie: `sessionId=${sessionId}` },
            cache: "no-store",
        })
        if (!res.ok) redirect("/login")
    } catch {
        redirect("/login")
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/50 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4 opacity-40" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                                        VaultAuth
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-6 p-6 pt-5">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
