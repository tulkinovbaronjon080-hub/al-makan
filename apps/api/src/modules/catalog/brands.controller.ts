import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import {
  catalogListQuerySchema,
  createBrandSchema,
  updateBrandSchema,
  type CatalogListQuery,
  type CreateBrandDto,
  type UpdateBrandDto,
} from "@al-makan/types";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import type { AuthenticatedUser } from "../../common/authenticated-user";
import { BrandsService } from "./brands.service";

@Controller("catalog/brands")
export class BrandsController {
  constructor(private readonly brands: BrandsService) {}

  @RequirePermissions("catalog.manage")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(createBrandSchema)) body: CreateBrandDto) {
    return this.brands.create(user.businessId, body);
  }

  @RequirePermissions("catalog.view")
  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query(new ZodValidationPipe(catalogListQuerySchema)) query: CatalogListQuery) {
    return this.brands.list(user.businessId, query);
  }

  @RequirePermissions("catalog.manage")
  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateBrandSchema)) body: UpdateBrandDto,
  ) {
    return this.brands.update(user.businessId, id, body);
  }
}
