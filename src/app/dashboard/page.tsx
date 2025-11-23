import { cookies } from "next/headers";
import { redirect } from "next/navigation";
const backend = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

async function getMe() {
  const store = await cookies();
  const cookieHeader = store.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const res = await fetch(`${backend}/auth/me`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
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
    </div>
  );
}

import ChangePassword from "@/components/change-password";
import LogoutButton from "@/components/logout-button";
import TwofaPanel from "@/components/twofa-panel";
import SessionsPanel from "@/components/sessions-panel";