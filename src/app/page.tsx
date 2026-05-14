import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Monitor,
  FileText,
  ArrowRight,
  Lock,
  Globe,
  KeyRound,
  ChevronRight,
} from "lucide-react";
import Navbar from "@/components/navbar";

export const metadata: Metadata = {
  title: "VaultAuth — Autenticación Segura con 2FA",
  description:
    "Protege tu cuenta con autenticación de dos factores, gestión de sesiones activas y notas cifradas.",
};

const features = [
  {
    icon: ShieldCheck,
    title: "2FA con TOTP",
    description:
      "Códigos temporales de 6 dígitos con Google Authenticator o Authy. Expiran cada 30 segundos.",
  },
  {
    icon: Monitor,
    title: "Gestión de sesiones",
    description:
      "Visualiza todos tus dispositivos activos y revoca accesos con un solo clic.",
  },
  {
    icon: Globe,
    title: "OAuth integrado",
    description:
      "Inicia sesión con Google o Discord. Sin contraseñas adicionales que recordar.",
  },
  {
    icon: FileText,
    title: "Notas seguras",
    description:
      "Almacena información sensible protegida por tu segundo factor de autenticación.",
  },
];

const steps = [
  {
    n: "01",
    title: "Crea tu cuenta",
    description:
      "Regístrate con email y contraseña, o accede instantáneamente con Google o Discord.",
  },
  {
    n: "02",
    title: "Activa el 2FA",
    description:
      "Escanea el QR con tu app autenticadora y guarda los códigos de respaldo en un lugar seguro.",
  },
  {
    n: "03",
    title: "Accede con confianza",
    description:
      "Cada inicio de sesión requiere tu contraseña más el código temporal. Doble barrera, cero preocupaciones.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-4 py-32 auth-bg text-center">
        {/* Background glow */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden
        >
          <div
            className="h-[500px] w-[500px] rounded-full opacity-[0.07]"
            style={{
              background:
                "radial-gradient(circle, oklch(0.73 0.175 196), transparent 70%)",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6 max-w-2xl mx-auto">
          {/* Label */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Lock className="h-3 w-3" />
            Seguridad de nivel enterprise
          </span>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            Tu cuenta,{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, oklch(0.73 0.175 196) 0%, oklch(0.65 0.175 250) 100%)",
              }}
            >
              blindada.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed">
            Autenticación híbrida con doble factor, sesiones activas controladas
            y notas cifradas. Todo en un solo panel.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-1">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:scale-95"
            >
              Crear cuenta gratis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-border/70 px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:border-border"
            >
              Iniciar sesión
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section className="border-t border-border/40 px-4 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Todo lo que necesitas
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Construido sobre estándares de seguridad modernos
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 transition-colors hover:border-primary/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 transition-colors group-hover:bg-primary/15">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-semibold">{f.title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {f.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section className="auth-bg border-t border-border/40 px-4 py-24">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Cómo funciona
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tres pasos para máxima protección
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {steps.map((s) => (
              <div
                key={s.n}
                className="flex items-start gap-5 rounded-xl border border-border/50 bg-card/60 p-6 backdrop-blur-sm"
              >
                <span className="shrink-0 pt-0.5 font-mono text-2xl font-bold leading-none text-primary/40">
                  {s.n}
                </span>
                <div>
                  <h3 className="mb-1 font-semibold">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {s.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────────── */}
      <section className="border-t border-border/40 px-4 py-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-primary/5 p-10">
            {/* Glow interno */}
            <div
              className="pointer-events-none absolute inset-0 opacity-10"
              aria-hidden
              style={{
                background:
                  "radial-gradient(ellipse at 50% 0%, oklch(0.73 0.175 196), transparent 65%)",
              }}
            />
            <div className="relative z-10 flex flex-col items-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/15">
                <KeyRound className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Empieza ahora, gratis
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  Crea tu cuenta en segundos y activa el doble factor de
                  autenticación de inmediato.
                </p>
              </div>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:scale-95"
              >
                Crear cuenta gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 px-4 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">VaultAuth</span>
          </div>
          <span>Autenticación segura con doble factor</span>
        </div>
      </footer>
    </div>
  );
}
