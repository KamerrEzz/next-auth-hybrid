import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect } from "vitest";
import { api } from "@/lib/api";
import SessionsPanel from "./sessions-panel";

function wrapper(ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

describe("SessionsPanel", () => {
  it("revoca sesiones mediante acciones de UI", async () => {
    vi.spyOn(api, "get").mockResolvedValue({
      data: {
        currentId: "c1",
        items: [
          { id: "c1", ipAddress: "1.2.3.4", userAgent: "UA", lastActive: Date.now() },
          { id: "o1", ipAddress: "5.6.7.8", userAgent: "UA2", lastActive: Date.now() },
        ],
      },
    } as unknown as Promise<{ data: { currentId: string; items: { id: string; ipAddress: string; userAgent: string; lastActive: number }[] } }>);
    const delSpy = vi.spyOn(api, "delete").mockResolvedValue({} as unknown as Promise<unknown>);

    render(wrapper(<SessionsPanel />));
    await waitFor(() => expect(screen.getByText(/Sesiones/)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("Cerrar otras")).not.toHaveAttribute("disabled"));

    fireEvent.click(screen.getByText("Cerrar otras"));
    await waitFor(() => expect(delSpy).toHaveBeenCalledWith("/auth/sessions/others"));

    fireEvent.click(screen.getByText("Revocar todas"));
    await waitFor(() => expect(delSpy).toHaveBeenCalledWith("/auth/sessions"));

    const revokeButtons = screen.getAllByText("Revocar");
    // El segundo corresponde a la sesión no actual
    fireEvent.click(revokeButtons[1]);
    await waitFor(() => expect(delSpy).toHaveBeenCalledWith("/auth/sessions/o1"));
  });
});