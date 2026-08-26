import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import {
  catalogListQuerySchema,
  createGlassSchema,
  updateGlassSchema,
  type CatalogListQuery,
  type CreateGlassDto,
  type UpdateGlassDto,
} from "@al-makan/types";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import type { AuthenticatedUser } from "../../common/authenticated-user";
import { GlassService } from "./glass.service";

@Controller("catalog/glass")
export class GlassController {
  constructor(private readonly glass: GlassService) {}

  @RequirePermissions("catalog.manage")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(createGlassSchema)) body: CreateGlassDto) {
    return this.glass.create(user.businessId, body);
  }

  @RequirePermissions("catalog.view")
  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query(new ZodValidationPipe(catalogListQuerySchema)) query: CatalogListQuery) {
    return this.glass.list(user.businessId, query);
  }

  @RequirePermissions("catalog.manage")
  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateGlassSchema)) body: UpdateGlassDto,
  ) {
    return this.glass.update(user.businessId, id, body);
  }
}
