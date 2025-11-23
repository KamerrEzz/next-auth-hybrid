"use client";
import { useEffect, useState } from "react";
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
import { api } from "@/lib/api";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  totpCode: z.string().optional(),
});

export default function LoginPage() {
  const router = useRouter();
  const [tempToken, setTempToken] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
  });

  useEffect(() => {
    api.get("/auth/csrf");
  }, []);

  const onSubmit = async (values: z.infer<typeof LoginSchema>) => {
    if (!tempToken) {
      try {
        const { data } = await api.post("/auth/login", {
          email: values.email,
          password: values.password,
        });
        if (data?.requiresOtp && data?.tempToken) {
          setTempToken(data.tempToken);
          toast.info("Introduce el TOTP para completar el login");
          return;
        }
        toast.success("Has iniciado sesión");
        router.push("/dashboard");
        return;
      } catch {
        toast.error("Error de autenticación");
        return;
      }
    }
    try {
      const { data } = await api.post("/auth/verify-otp", {
        tempToken,
        totpCode: values.totpCode,
      });
      if (data?.accessToken) setTempToken(null);
      toast.success("Login 2FA completado");
      router.push("/dashboard");
    } catch {
      toast.error("Verificación 2FA inválida");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-xl mx-auto">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="text-lg font-semibold">Login</div>
          <div className="flex gap-2">
            <Link href="/auth/google">
              <Button variant="outline">Google</Button>
            </Link>
            <Link href="/auth/discord">
              <Button variant="outline">Discord</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <div className="grid gap-1">
              <Label>Email</Label>
              <Input type="email" placeholder="email" {...register("email")} />
            </div>
            <div className="grid gap-1">
              <Label>Password</Label>
              <Input type="password" placeholder="password" {...register("password")} />
            </div>
            {tempToken && (
              <div className="grid gap-1">
                <Label>TOTP</Label>
                <Input type="text" placeholder="TOTP" {...register("totpCode")} />
                <div className="text-xs text-muted-foreground">Introduce el código de 6 dígitos de tu app TOTP (Google Auth/Authy).</div>
              </div>
            )}
            <Button type="submit" disabled={formState.isSubmitting}>{tempToken ? "Verificar TOTP" : "Login"}</Button>
          </form>
          <div className="text-sm mt-3">
            ¿No tienes cuenta? <Link className="underline" href="/register">Regístrate</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
