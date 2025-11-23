"use client";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import { toast } from "sonner";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
  totpCode: z.string().optional(),
});

export default function ChangePassword() {
  const { register, handleSubmit, formState, reset } = useForm<z.infer<typeof ChangePasswordSchema>>({
    resolver: zodResolver(ChangePasswordSchema),
  });
  const status = useQuery({
    queryKey: ["twofa-status"],
    queryFn: async () => (await api.get("/auth/2fa/status")).data,
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      const hasCsrf = /csrfToken=([^;]+)/.test(document.cookie);
      if (!hasCsrf) api.get("/auth/csrf");
    }
  }, []);

  const onSubmit = async (values: z.infer<typeof ChangePasswordSchema>) => {
    try {
      toast.info("Procesando cambio de contraseña...");
      await api.post("/auth/change-password", values);
      reset();
      toast.success("Contraseña actualizada");
    } catch {
      toast.error("Error al actualizar contraseña");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 max-w-sm">
      <input type="password" placeholder="Contraseña actual" className="border rounded px-3 py-2" {...register("currentPassword")} />
      <input type="password" placeholder="Nueva contraseña" className="border rounded px-3 py-2" {...register("newPassword")} />
      {status.data?.enabled && (
        <input type="text" placeholder="TOTP" className="border rounded px-3 py-2" {...register("totpCode")} />
      )}
      <button className="rounded bg-black text-white px-3 py-2 disabled:opacity-50" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? "Guardando..." : "Guardar"}
      </button>
    </form>
  );
}