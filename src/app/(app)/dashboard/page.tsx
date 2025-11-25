import { cookies } from "next/headers";
import { redirect } from "next/navigation";
const backend = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

import ChangePassword from "@/features/auth/components/change-password";
import LogoutButton from "@/features/auth/components/logout-button";
import TwofaPanel from "@/features/auth/components/twofa-panel";
import SessionsPanel from "@/features/auth/components/sessions-panel";
import NotesPanel from "@/features/notes/components/notes-panel";

async function getMe() {
  const store = await cookies();
  const cookieHeader = store.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  console.log("Dashboard: Fetching me with cookies:", cookieHeader);
  try {
    const res = await fetch(`${backend}/auth/me`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("Dashboard: Fetch failed", res.status, await res.text());
      return null;
    }
    return res.json();
  } catch (e) {
    console.error("Dashboard: Fetch error", e);
    return null;
  }
}

export default async function DashboardPage() {
  const me = await getMe();
  if (!me) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <LogoutButton />
      </div>

      <section className="border rounded p-4">
        <div className="font-medium mb-2">Perfil</div>
        <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(me, null, 2)}</pre>
      </section>

      <section className="border rounded p-4">
        <div className="font-medium mb-2">Cambiar contraseña</div>
        <ChangePassword />
      </section>

      <section className="border rounded p-4">
        <TwofaPanel />
      </section>

      <section className="border rounded p-4">
        <SessionsPanel />
      </section>
      <section className="border rounded p-4">
        <NotesPanel />
      </section>
    </div>
  );
}