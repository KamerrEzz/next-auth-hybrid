import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

type Note = { id: string; userId: string; title: string; content: string; secure: boolean; createdAt: number; updatedAt: number };
type CreatePayload = { title: string; content: string; secure?: boolean };

export function useNotes(totpCode?: string) {
  const queryClient = useQueryClient();
  const key = ["notes", totpCode ?? ""] as const;
  const query = useQuery<Note[]>({
    queryKey: key,
    queryFn: async () => (await api.get<Note[]>(`/notes${totpCode ? `?totpCode=${encodeURIComponent(totpCode)}` : ""}`)).data,
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: key });
  };

  const create = async (payload: CreatePayload) => {
    await api.post("/notes", payload);
    await refresh();
  };

  return { query, create };
}