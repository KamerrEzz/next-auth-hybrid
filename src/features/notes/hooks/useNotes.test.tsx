import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect } from "vitest";
import { api } from "@/lib/api";
import { useNotes } from "./useNotes";

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useNotes", () => {
  it("lista y crea notas", async () => {
    const getSpy = vi.spyOn(api, "get").mockResolvedValue({
      data: [],
    } as any);
    const postSpy = vi.spyOn(api, "post").mockResolvedValue({} as any);

    const { result } = renderHook(() => useNotes(""), { wrapper });
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    expect(result.current.query.data).toEqual([]);

    await result.current.create({ title: "t", content: "c" });
    expect(postSpy).toHaveBeenCalledWith("/notes", { title: "t", content: "c" });
  });
});