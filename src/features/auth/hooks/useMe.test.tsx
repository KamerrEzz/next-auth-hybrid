import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { api } from "@/lib/api";
import { useMe } from "./useMe";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useMe", () => {
  beforeEach(() => vi.clearAllMocks());

  it("obtiene el usuario actual", async () => {
    const spy = vi
      .spyOn(api, "get")
      .mockResolvedValueOnce({ data: { id: "u1", email: "test@example.com" } } as unknown as Promise<{ data: { id: string; email: string } }>);

    const { result } = renderHook(() => useMe(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({ email: "test@example.com" });
    expect(spy).toHaveBeenCalledWith("/auth/me");
  });

  it("retorna null cuando el servidor devuelve 401 (sin redirigir por defecto)", async () => {
    vi.spyOn(api, "get").mockRejectedValueOnce(
      Object.assign(new Error("401"), { isAxiosError: true, response: { status: 401 } })
    );

    const { result } = renderHook(() => useMe(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("redirige a /login cuando redirectOnUnauthenticated=true y devuelve 401", async () => {
    vi.spyOn(api, "get").mockRejectedValueOnce(
      Object.assign(new Error("401"), { isAxiosError: true, response: { status: 401 } })
    );

    const { result } = renderHook(() => useMe({ redirectOnUnauthenticated: true }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
    expect(mockPush).toHaveBeenCalledWith("/login");
  });
});
