import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

type Session = { id: string; ipAddress: string; userAgent: string; lastActive: number };
type SessionsResponse = { currentId: string; items: Session[] };

export function useSessions() {
  const queryClient = useQueryClient();
  const query = useQuery<SessionsResponse>({
    queryKey: ["sessions"],
    queryFn: async () => (await api.get<SessionsResponse>("/auth/sessions")).data,
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["sessions"] });
  };

  const revokeAll = async () => {
    await api.delete("/auth/sessions");
    await refresh();
  };

  const revokeOthers = async () => {
    await api.delete("/auth/sessions/others");
    await refresh();
  };

  const revoke = async (id: string) => {
    await api.delete(`/auth/sessions/${id}`);
    await refresh();
  };

  return { query, revokeAll, revokeOthers, revoke };
}