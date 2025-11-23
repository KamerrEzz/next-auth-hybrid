"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  otpCode: z.string().optional(),
});

export default function Home() {
  const [tempToken, setTempToken] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
  });

  useEffect(() => {
    api.get("/auth/csrf");
  }, []);

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await api.get("/auth/me");
      return data;
    },
  });

  const onSubmit = async (values: z.infer<typeof LoginSchema>) => {
    if (!tempToken) {
      const { data } = await api.post("/auth/login", {
        email: values.email,
        password: values.password,
      });
      if (data?.requiresOtp && data?.tempToken) {
        setTempToken(data.tempToken);
        return;
      }
      meQuery.refetch();
      return;
    }
    const { data } = await api.post("/auth/verify-otp", {
      tempToken,
      otpCode: values.otpCode,
    });
    if (data?.accessToken) setTempToken(null);
    meQuery.refetch();
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Demo Auth</h1>
        <div className="flex gap-2">
          <Link href="http://localhost:3000/auth/google">
            <Button variant="outline">Google</Button>
          </Link>
          <Link href="http://localhost:3000/auth/discord">
            <Button variant="outline">Discord</Button>
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="email"
          className="border rounded px-3 py-2"
          {...register("email")}
        />
        <input
          type="password"
          placeholder="password"
          className="border rounded px-3 py-2"
          {...register("password")}
        />
        {tempToken && (
          <input
            type="text"
            placeholder="OTP"
            className="border rounded px-3 py-2"
            {...register("otpCode")}
          />
        )}
        <Button type="submit" disabled={formState.isSubmitting}>
          {tempToken ? "Verificar OTP" : "Login"}
        </Button>
      </form>

      <div className="border rounded p-3">
        <div className="font-medium mb-2">/auth/me</div>
        <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(meQuery.data, null, 2)}</pre>
      </div>
    </div>
  );
}
