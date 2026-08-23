import { BadRequestException, type PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";

/**
 * Validates a request body/query against a Zod schema from @al-makan/types
 * — the same schema apps/web uses client-side via zodResolver, so
 * validation rules never drift between the two. Replaces the
 * class-validator ValidationPipe deliberately left out in Phase 0.
 *
 * Usage: @Body(new ZodValidationPipe(registerSchema)) body: RegisterDto
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: "Validation failed",
        issues: result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
    }
    return result.data;
  }
}
