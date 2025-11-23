"use client";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";

export default function LogoutButton() {
  const router = useRouter();
  const onClick = async () => {
    await api.post("/auth/logout");
    router.push("/login");
  };
  return (
    <button className="rounded bg-black text-white px-3 py-2" onClick={onClick}>Logout</button>
  );
}