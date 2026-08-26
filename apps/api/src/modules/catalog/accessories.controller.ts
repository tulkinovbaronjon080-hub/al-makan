import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import {
  catalogListQuerySchema,
  createAccessorySchema,
  updateAccessorySchema,
  type CatalogListQuery,
  type CreateAccessoryDto,
  type UpdateAccessoryDto,
} from "@al-makan/types";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import type { AuthenticatedUser } from "../../common/authenticated-user";
import { AccessoriesService } from "./accessories.service";

@Controller("catalog/accessories")
export class AccessoriesController {
  constructor(private readonly accessories: AccessoriesService) {}

  @RequirePermissions("catalog.manage")
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createAccessorySchema)) body: CreateAccessoryDto,
  ) {
    return this.accessories.create(user.businessId, body);
  }

  @RequirePermissions("catalog.view")
  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query(new ZodValidationPipe(catalogListQuerySchema)) query: CatalogListQuery) {
    return this.accessories.list(user.businessId, query);
  }

  @RequirePermissions("catalog.manage")
  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateAccessorySchema)) body: UpdateAccessoryDto,
  ) {
    return this.accessories.update(user.businessId, id, body);
  }
}
