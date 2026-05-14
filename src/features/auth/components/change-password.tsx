"use client";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
  totpCode: z.string().optional(),
});

export default function ChangePassword() {
  const { register, handleSubmit, formState, reset } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });
  const status = useQuery({
    queryKey: ["twofa-status"],
    queryFn: async () => (await api.get("/auth/2fa/status")).data,
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 max-w-sm">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="currentPassword">Contraseña actual</Label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          {...register("currentPassword")}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="newPassword">Nueva contraseña</Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          {...register("newPassword")}
        />
      </div>

      {status.data?.enabled && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="totpCode">Código TOTP</Label>
          <Input
            id="totpCode"
            type="text"
            autoComplete="one-time-code"
            maxLength={6}
            {...register("totpCode")}
          />
        </div>
      )}

      <Button type="submit" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? "Guardando..." : "Guardar"}
      </Button>
    </form>
  );
}
