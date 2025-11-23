"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import { useNotes } from "@/features/notes/hooks/useNotes";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const CreateSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  secure: z.boolean().optional(),
});


export default function NotesPanel() {
  const [totpCode, setTotpCode] = useState("");
  const notes = useNotes(totpCode);

  const { register, handleSubmit, formState, reset } = useForm<z.infer<typeof CreateSchema>>({ resolver: zodResolver(CreateSchema) });

  useEffect(() => {
    api.get("/auth/csrf");
  }, []);

  const onSubmit = async (values: z.infer<typeof CreateSchema>) => {
    try {
      await notes.create(values);
      toast.success("Nota creada");
      reset();
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
          <Button variant="outline" onClick={() => notes.query.refetch()} disabled={notes.query.isPending}>Refrescar</Button>
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
        {notes.query.isPending && <div className="text-sm">Cargando...</div>}
        {notes.query.isError && <div className="text-sm text-red-600">Error al cargar notas</div>}
        {(notes.query.data ?? []).map((n) => (
          <div key={n.id} className={`border rounded p-2 ${n.secure ? "bg-accent/30" : ""}`}>
            <div className="text-sm font-medium flex items-center justify-between">
              <span>{n.title}</span>
              <span className="text-xs">{n.secure ? "Segura" : ""}</span>
            </div>
            <div className="text-xs whitespace-pre-wrap mt-1">{n.content}</div>
          </div>
        ))}
        {!notes.query.isPending && !(notes.query.data?.length) && <div className="text-sm">Sin notas</div>}
      </div>
    </div>
  );
}
