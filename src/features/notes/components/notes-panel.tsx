"use client";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import { useNotes } from "@/features/notes/hooks/useNotes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  FileText, Lock, Plus, RefreshCw, ShieldCheck, X, ChevronDown, ChevronUp,
} from "lucide-react";

const CreateSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  content: z.string().min(1, "El contenido es requerido"),
  secure: z.boolean().optional(),
});

type CreateForm = z.infer<typeof CreateSchema>;

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function NotesPanel() {
  const [totpCode, setTotpCode] = useState("");
  const [totpInput, setTotpInput] = useState("");
  const [showUnlock, setShowUnlock] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const notes = useNotes(totpCode);

  const { register, handleSubmit, formState, reset, control } = useForm<CreateForm>({
    resolver: zodResolver(CreateSchema),
    defaultValues: { secure: false },
  });
  const isSecure = useWatch({ control, name: "secure" });

  useEffect(() => {
    api.get("/auth/csrf");
  }, []);

  const onSubmit = async (values: CreateForm) => {
    try {
      await notes.create(values);
      toast.success("Nota creada");
      reset();
      setShowForm(false);
    } catch {
      toast.error("Error al crear nota");
    }
  };

  const unlock = () => {
    if (!totpInput.trim()) return;
    setTotpCode(totpInput.trim());
    setTotpInput("");
    setShowUnlock(false);
    toast.success("Notas seguras desbloqueadas");
  };

  const lockSecure = () => {
    setTotpCode("");
    toast.info("Notas seguras bloqueadas");
  };

  const notesList = notes.query.data ?? [];
  const secureUnlocked = !!totpCode;

  return (
    <div className="flex flex-col gap-5">

      {/* ─── Header row ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {notes.query.isPending ? (
            <>
              <div className="h-1.5 w-1.5 rounded-full bg-muted animate-pulse" />
              Cargando...
            </>
          ) : notes.query.isError ? (
            <span className="text-destructive">Error al cargar</span>
          ) : (
            <span>
              {notesList.length} {notesList.length === 1 ? "nota" : "notas"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => notes.query.refetch()}
            disabled={notes.query.isPending}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${notes.query.isPending ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm((v) => !v)}
            className="gap-1.5 h-8"
          >
            {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showForm ? "Cancelar" : "Nueva nota"}
          </Button>
        </div>
      </div>

      {/* ─── Create form ────────────────────────────────────────── */}
      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/20 p-4"
        >
          <Input
            placeholder="Título"
            {...register("title")}
            className={formState.errors.title ? "border-destructive" : ""}
          />
          <textarea
            placeholder="Contenido de la nota..."
            {...register("content")}
            rows={4}
            className={`w-full resize-none rounded-md border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 ${
              formState.errors.content ? "border-destructive" : "border-input"
            }`}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <div className={`relative flex h-4 w-4 items-center justify-center rounded border ${isSecure ? "border-primary bg-primary" : "border-input"}`}>
                <input type="checkbox" {...register("secure")} className="sr-only" />
                {isSecure && <X className="h-2.5 w-2.5 text-primary-foreground stroke-[3]" />}
              </div>
              <Lock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Nota segura</span>
            </label>
            <Button type="submit" disabled={formState.isSubmitting} size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Crear
            </Button>
          </div>
          {isSecure && (
            <p className="text-xs text-muted-foreground border-t border-border/50 pt-2">
              Las notas seguras requieren verificación TOTP para visualizarse.
            </p>
          )}
        </form>
      )}

      {/* ─── Secure unlock banner ───────────────────────────────── */}
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <button
          type="button"
          onClick={() => {
            if (secureUnlocked) {
              lockSecure();
            } else {
              setShowUnlock((v) => !v);
            }
          }}
          className="flex w-full items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
        >
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
            secureUnlocked ? "bg-emerald-500/15" : "bg-muted"
          }`}>
            {secureUnlocked
              ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              : <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            }
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium leading-tight">
              {secureUnlocked ? "Notas seguras desbloqueadas" : "Notas seguras"}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {secureUnlocked
                ? "Toca para bloquear de nuevo"
                : "Introduce tu código TOTP para verlas"}
            </div>
          </div>
          {!secureUnlocked && (
            showUnlock
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {showUnlock && !secureUnlocked && (
          <div className="border-t border-border/50 px-4 py-3 bg-muted/10">
            <div className="flex gap-2">
              <Input
                placeholder="000 000"
                value={totpInput}
                onChange={(e) => setTotpInput(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                autoComplete="one-time-code"
                className="w-32 font-mono text-center tracking-[0.35em]"
              />
              <Button
                size="sm"
                onClick={unlock}
                disabled={totpInput.length !== 6}
                className="gap-1.5"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Desbloquear
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Notes list ─────────────────────────────────────────── */}
      {notes.query.isPending && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg border bg-muted/20 animate-pulse" />
          ))}
        </div>
      )}

      {!notes.query.isPending && notesList.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="text-sm font-medium">Sin notas</div>
          <div className="text-xs text-muted-foreground">
            Crea tu primera nota con el botón &quot;Nueva nota&quot;
          </div>
        </div>
      )}

      {notesList.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {notesList.map((n) => (
            <div
              key={n.id}
              className={`group flex flex-col gap-2 rounded-lg border p-4 transition-colors ${
                n.secure
                  ? "border-primary/20 bg-primary/5"
                  : "border-border/60 bg-muted/10 hover:bg-muted/20"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-medium leading-tight line-clamp-1 flex-1">
                  {n.title}
                </div>
                {n.secure && (
                  <Lock className="h-3 w-3 text-primary shrink-0 mt-0.5 opacity-60" />
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 whitespace-pre-wrap flex-1">
                {n.content}
              </p>
              <div className="text-[10px] text-muted-foreground/60 mt-auto pt-1 border-t border-border/30">
                {formatDate(n.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
