import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect } from "vitest";
import { api } from "@/lib/api";
import { useMe } from "./useMe";

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useMe", () => {
  it("obtiene el usuario actual", async () => {
    const spy = vi
      .spyOn(api, "get")
      .mockResolvedValueOnce({ data: { id: "u1", email: "test@example.com" } } as unknown as Promise<{ data: { id: string; email: string } }>);
    const { result } = renderHook(() => useMe(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({ email: "test@example.com" });
    expect(spy).toHaveBeenCalledWith("/auth/me");
  });
});