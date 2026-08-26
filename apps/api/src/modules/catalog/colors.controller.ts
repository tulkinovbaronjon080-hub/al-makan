import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import {
  catalogListQuerySchema,
  createColorSchema,
  updateColorSchema,
  type CatalogListQuery,
  type CreateColorDto,
  type UpdateColorDto,
} from "@al-makan/types";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import type { AuthenticatedUser } from "../../common/authenticated-user";
import { ColorsService } from "./colors.service";

@Controller("catalog/colors")
export class ColorsController {
  constructor(private readonly colors: ColorsService) {}

  @RequirePermissions("catalog.manage")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(createColorSchema)) body: CreateColorDto) {
    return this.colors.create(user.businessId, body);
  }

  @RequirePermissions("catalog.view")
  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query(new ZodValidationPipe(catalogListQuerySchema)) query: CatalogListQuery) {
    return this.colors.list(user.businessId, query);
  }

  @RequirePermissions("catalog.manage")
  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateColorSchema)) body: UpdateColorDto,
  ) {
    return this.colors.update(user.businessId, id, body);
  }
}
