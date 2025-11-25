"use client";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

export default function LogoutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const onClick = async () => {
    await api.post("/auth/logout");
    queryClient.setQueryData(["me"], null); // Optimistically clear user data
    await queryClient.invalidateQueries({ queryKey: ["me"] });
    router.push("/login");
  };
  return (
    <button className="rounded bg-black text-white px-3 py-2" onClick={onClick}>Logout</button>
  );
}