import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect } from "vitest";
import { api } from "@/lib/api";
import NotesPanel from "./notes-panel";

function wrapper(ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

describe("NotesPanel", () => {
  it("crea una nota desde el formulario", async () => {
    vi.spyOn(api, "get").mockImplementation(async (url: string) => {
      if (url.startsWith("/notes")) return { data: [] } as unknown as Promise<{ data: unknown[] }>;
      if (url === "/auth/csrf") return { data: {} } as unknown as Promise<{ data: object }>;
      return { data: {} } as unknown as Promise<{ data: object }>;
    });
    const postSpy = vi.spyOn(api, "post").mockResolvedValue({} as unknown as Promise<unknown>);

    render(wrapper(<NotesPanel />));
    await waitFor(() => expect(screen.getByText("Nueva nota")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Nueva nota"));

    fireEvent.change(screen.getByPlaceholderText("Título"), { target: { value: "Mi título" } });
    fireEvent.change(screen.getByPlaceholderText("Contenido de la nota..."), { target: { value: "Mi contenido" } });
    fireEvent.click(screen.getByText("Crear"));

    await waitFor(() => expect(postSpy).toHaveBeenCalledWith("/notes", { title: "Mi título", content: "Mi contenido", secure: false }));
  });
});