"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { api } from "@/lib/api";

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

export default function RegisterPage() {
  const router = useRouter();
  const { register, handleSubmit, formState } = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
  });

  useEffect(() => {
    api.get("/auth/csrf");
  }, []);

  const onSubmit = async (values: z.infer<typeof RegisterSchema>) => {
    try {
      await api.post("/auth/register", values);
      toast.success("Cuenta creada");
      router.push("/dashboard");
    } catch (err) {
      const e = err as AxiosError<{ message?: string; statusCode?: number }>;
      const status = e.response?.status;
      if (status === 409) toast.error(e.response?.data?.message ?? "Email ya registrado");
      else if (status === 401) toast.error("Credenciales inválidas o no permitido");
      else if (status === 403) {
        toast.error("CSRF inválido: refresca e inténtalo de nuevo");
        api.get("/auth/csrf");
      } else toast.error(e.response?.data?.message ?? "Error al registrar");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-xl mx-auto">
      <Card>
        <CardHeader className="text-lg font-semibold">Registro</CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <div className="grid gap-1">
              <Label>Nombre</Label>
              <Input type="text" placeholder="nombre" {...register("name")} />
            </div>
            <div className="grid gap-1">
              <Label>Email</Label>
              <Input type="email" placeholder="email" {...register("email")} />
            </div>
            <div className="grid gap-1">
              <Label>Password</Label>
              <Input type="password" placeholder="password" {...register("password")} />
            </div>
            <Button type="submit" disabled={formState.isSubmitting}>Crear cuenta</Button>
          </form>
          <div className="text-sm mt-3">
            ¿Ya tienes cuenta? <Link className="underline" href="/login">Inicia sesión</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
