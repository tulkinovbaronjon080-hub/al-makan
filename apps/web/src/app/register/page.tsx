"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { registerSchema, type RegisterDto } from "@al-makan/types";
import { Button, Input } from "@al-makan/ui";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/client";
import { BrandMark } from "@/components/brand-mark";

export default function RegisterPage() {
  const router = useRouter();
  const { register: doRegister } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterDto>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterDto) {
    setFormError(null);
    try {
      await doRegister(data);
      router.push("/");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background py-6 sm:p-6">
      <div className="w-full overflow-hidden bg-surface sm:max-w-[400px] sm:rounded-2xl sm:border sm:border-border/60 sm:shadow-xl">
        <div className="relative flex flex-col items-center justify-center gap-3 overflow-hidden bg-[#14181F] px-6 py-10 text-center">
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <BrandMark className="relative z-10 h-11 w-11 shadow-[0_10px_24px_rgba(9,80,195,0.45)]" iconClassName="h-[22px] w-[22px]" />
          <div className="relative z-10 text-lg font-bold tracking-tight text-white">Al&#8209;Makan</div>
        </div>

        <div className="relative -mt-[18px] rounded-t-[22px] bg-surface px-6 pb-7 pt-6 shadow-[0_-8px_24px_rgba(15,23,42,0.06)]">
          <h1 className="mb-1 text-[20px] font-bold tracking-tight">Create your workspace</h1>
          <p className="mb-5 text-[13px] text-muted-foreground">Set up your business in a minute</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold" htmlFor="businessName">
                Business name
              </label>
              <Input id="businessName" autoComplete="organization" {...register("businessName")} />
              {errors.businessName && <p className="text-sm text-danger">{errors.businessName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold" htmlFor="fullName">
                Your full name
              </label>
              <Input id="fullName" autoComplete="name" {...register("fullName")} />
              {errors.fullName && <p className="text-sm text-danger">{errors.fullName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold" htmlFor="email">
                Email
              </label>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
              {errors.email && <p className="text-sm text-danger">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold" htmlFor="phone">
                Phone (optional)
              </label>
              <Input id="phone" type="tel" autoComplete="tel" {...register("phone")} />
              {errors.phone && <p className="text-sm text-danger">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold" htmlFor="password">
                Password
              </label>
              <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
              {errors.password && <p className="text-sm text-danger">{errors.password.message}</p>}
            </div>
            {formError && <p className="text-sm text-danger">{formError}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create workspace"}
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </Button>
            <p className="pt-1 text-center text-[12.5px] text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
