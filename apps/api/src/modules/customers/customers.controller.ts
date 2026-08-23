import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import {
  createCustomerSchema,
  paginationQuerySchema,
  updateCustomerSchema,
  type CreateCustomerDto,
  type UpdateCustomerDto,
} from "@al-makan/types";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import type { AuthenticatedUser } from "../../common/authenticated-user";
import { CustomersService } from "./customers.service";

// A customer record only ever matters in the context of an order, so this
// rides on the existing orders.* permissions rather than a new customers.*
// key — see the Phase 2 plan.
@Controller("customers")
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @RequirePermissions("orders.create")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(createCustomerSchema)) body: CreateCustomerDto) {
    return this.customers.create(user.businessId, body);
  }

  @RequirePermissions("orders.view")
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(paginationQuerySchema)) pagination: { page: number; pageSize: number },
    @Query("search") search?: string,
  ) {
    return this.customers.list(user.businessId, pagination, search);
  }

  @RequirePermissions("orders.view")
  @Get(":id")
  getOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.customers.getOne(user.businessId, id);
  }

  @RequirePermissions("orders.create")
  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateCustomerSchema)) body: UpdateCustomerDto,
  ) {
    return this.customers.update(user.businessId, id, body);
  }
}
