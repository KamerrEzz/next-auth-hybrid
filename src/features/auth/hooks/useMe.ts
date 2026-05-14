import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/lib/api";
import axios from "axios";

export function useMe({ redirectOnUnauthenticated = false } = {}) {
  const router = useRouter();

  const query = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        return (await api.get("/auth/me")).data;
      } catch (err) {
        if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
          return null;
        }
        throw err;
      }
    },
    retry: false,
  });

  useEffect(() => {
    if (redirectOnUnauthenticated && query.isSuccess && query.data === null) {
      router.push("/login");
    }
  }, [redirectOnUnauthenticated, query.isSuccess, query.data, router]);

  return query;
}