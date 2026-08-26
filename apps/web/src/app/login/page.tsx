"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { loginSchema, type LoginDto } from "@al-makan/types";
import { Button, Input } from "@al-makan/ui";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/client";
import { BrandMark } from "@/components/brand-mark";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginDto>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginDto) {
    setFormError(null);
    try {
      await login(data);
      router.push("/");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background sm:p-6">
      <div className="w-full overflow-hidden bg-surface sm:max-w-[400px] sm:rounded-2xl sm:border sm:border-border/60 sm:shadow-xl">
        <div className="relative flex flex-col items-center justify-center gap-3.5 overflow-hidden bg-[#14181F] px-6 py-14 text-center">
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <BrandMark className="relative z-10 h-[52px] w-[52px] shadow-[0_10px_24px_rgba(9,80,195,0.45)]" iconClassName="h-[26px] w-[26px]" />
          <div className="relative z-10 text-xl font-bold tracking-tight text-white">Al&#8209;Makan</div>
          <p className="relative z-10 max-w-[240px] text-[13px] leading-relaxed text-white/60">
            Business operating system for window &amp; door manufacturers
          </p>
        </div>

        <div className="relative -mt-[22px] rounded-t-[22px] bg-surface px-6 pb-7 pt-[30px] shadow-[0_-8px_24px_rgba(15,23,42,0.06)]">
          <h1 className="mb-1 text-[22px] font-bold tracking-tight">Welcome back</h1>
          <p className="mb-6 text-[13.5px] text-muted-foreground">Sign in to your workspace</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold" htmlFor="email">
                Email
              </label>
              <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" {...register("email")} />
              {errors.email && <p className="text-sm text-danger">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold" htmlFor="password">
                Password
              </label>
              <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
              {errors.password && <p className="text-sm text-danger">{errors.password.message}</p>}
            </div>
            {formError && <p className="text-sm text-danger">{formError}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </Button>
            <p className="pt-1 text-center text-[12.5px] text-muted-foreground">
              No account?{" "}
              <Link href="/register" className="font-semibold text-primary">
                Create one
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
