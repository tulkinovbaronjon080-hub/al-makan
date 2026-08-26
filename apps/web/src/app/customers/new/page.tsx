"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { createCustomerSchema, type CreateCustomerDto, type CustomerDto } from "@al-makan/types";
import { Button, Input } from "@al-makan/ui";
import { api, ApiError } from "@/lib/api/client";

export default function NewCustomerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateCustomerDto>({ resolver: zodResolver(createCustomerSchema) });

  const createCustomer = useMutation({
    mutationFn: (dto: CreateCustomerDto) => api.post<CustomerDto>("/customers", dto),
  });

  async function onSubmit(data: CreateCustomerDto) {
    setFormError(null);
    try {
      const customer = await createCustomer.mutateAsync(data);
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      router.push(`/customers/${customer.id}`);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-5 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-surface"
        >
          <ArrowLeft className="h-[17px] w-[17px]" strokeWidth={2} />
        </button>
        <h1 className="text-[17px] font-bold tracking-tight">New customer</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
        <div className="space-y-1.5">
          <label className="text-[12.5px] font-semibold" htmlFor="fullName">
            Full name
          </label>
          <Input id="fullName" autoComplete="name" {...register("fullName")} />
          {errors.fullName && <p className="text-sm text-danger">{errors.fullName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-[12.5px] font-semibold" htmlFor="phone">
            Phone
          </label>
          <Input id="phone" type="tel" autoComplete="tel" inputMode="tel" {...register("phone")} />
          {errors.phone && <p className="text-sm text-danger">{errors.phone.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-[12.5px] font-semibold" htmlFor="address">
            Address (optional)
          </label>
          <Input id="address" {...register("address")} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[12.5px] font-semibold" htmlFor="notes">
            Notes (optional)
          </label>
          <Input id="notes" {...register("notes")} />
        </div>
        {formError && <p className="text-sm text-danger">{formError}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save customer"}
        </Button>
      </form>
    </div>
  );
}
