"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const CreateSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  secure: z.boolean().optional(),
});

type Note = { id: string; userId: string; title: string; content: string; secure: boolean; createdAt: number; updatedAt: number };

export default function NotesPanel() {
  const [totpCode, setTotpCode] = useState("");
  const list = useQuery<Note[]>({
    queryKey: ["notes", totpCode],
    queryFn: async () => (await api.get<Note[]>(`/notes${totpCode ? `?totpCode=${encodeURIComponent(totpCode)}` : ""}`)).data,
  });

  const { register, handleSubmit, formState, reset } = useForm<z.infer<typeof CreateSchema>>({ resolver: zodResolver(CreateSchema) });

  useEffect(() => {
    api.get("/auth/csrf");
  }, []);

  const onSubmit = async (values: z.infer<typeof CreateSchema>) => {
    try {
      await api.post("/notes", values);
      toast.success("Nota creada");
      reset();
      list.refetch();
    } catch {
      toast.error("Error al crear nota");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="font-medium">Notas</div>
        <div className="flex gap-2 items-center">
          <input className="border rounded px-2 py-1 text-sm" placeholder="TOTP opcional" value={totpCode} onChange={(e) => setTotpCode(e.target.value)} />
          <Button variant="outline" onClick={() => list.refetch()} disabled={list.isPending}>Refrescar</Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
        <input className="border rounded px-3 py-2" placeholder="Título" {...register("title")} />
        <textarea className="border rounded px-3 py-2 min-h-24" placeholder="Contenido" {...register("content")} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("secure")} />
          Nota segura
        </label>
        <Button type="submit" disabled={formState.isSubmitting}>Crear</Button>
      </form>

      <div className="flex flex-col gap-2">
        {list.isPending && <div className="text-sm">Cargando...</div>}
        {list.isError && <div className="text-sm text-red-600">Error al cargar notas</div>}
        {(list.data ?? []).map((n) => (
          <div key={n.id} className={`border rounded p-2 ${n.secure ? "bg-accent/30" : ""}`}>
            <div className="text-sm font-medium flex items-center justify-between">
              <span>{n.title}</span>
              <span className="text-xs">{n.secure ? "Segura" : ""}</span>
            </div>
            <div className="text-xs whitespace-pre-wrap mt-1">{n.content}</div>
          </div>
        ))}
        {!list.isPending && !(list.data?.length) && <div className="text-sm">Sin notas</div>}
      </div>
    </div>
  );
}