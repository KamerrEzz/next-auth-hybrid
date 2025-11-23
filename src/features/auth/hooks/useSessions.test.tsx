import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect } from "vitest";
import { api } from "@/lib/api";
import { useSessions } from "./useSessions";

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useSessions", () => {
  it("lista y revoca sesiones", async () => {
    const getSpy = vi
      .spyOn(api, "get")
      .mockResolvedValue({
        data: { currentId: "c1", items: [{ id: "c1", ipAddress: "1.2.3.4", userAgent: "UA", lastActive: Date.now() }] },
      } as unknown as Promise<{ data: { currentId: string; items: { id: string; ipAddress: string; userAgent: string; lastActive: number }[] } }>);
    const delSpy = vi.spyOn(api, "delete").mockResolvedValue({} as unknown as Promise<unknown>);

    const { result } = renderHook(() => useSessions(), { wrapper });
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    expect(result.current.query.data?.items?.length).toBe(1);

    await result.current.revokeOthers();
    await waitFor(() => expect(getSpy).toHaveBeenCalled());
    expect(delSpy).toHaveBeenCalledWith("/auth/sessions/others");

    await result.current.revokeAll();
    expect(delSpy).toHaveBeenCalledWith("/auth/sessions");

    await result.current.revoke("c1");
    expect(delSpy).toHaveBeenCalledWith("/auth/sessions/c1");
  });
});