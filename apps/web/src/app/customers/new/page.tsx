"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCustomerSchema, type CreateCustomerDto, type CustomerDto } from "@al-makan/types";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@al-makan/ui";
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
    <div className="mx-auto max-w-sm space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>New customer</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="fullName">
                Full name
              </label>
              <Input id="fullName" autoComplete="name" {...register("fullName")} />
              {errors.fullName && <p className="text-sm text-danger">{errors.fullName.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="phone">
                Phone
              </label>
              <Input id="phone" type="tel" autoComplete="tel" inputMode="tel" {...register("phone")} />
              {errors.phone && <p className="text-sm text-danger">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="address">
                Address (optional)
              </label>
              <Input id="address" {...register("address")} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="notes">
                Notes (optional)
              </label>
              <Input id="notes" {...register("notes")} />
            </div>
            {formError && <p className="text-sm text-danger">{formError}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save customer"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
