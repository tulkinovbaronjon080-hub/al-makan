import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import {
  createProfileSeriesSchema,
  profileSeriesListQuerySchema,
  updateProfileSeriesSchema,
  type CreateProfileSeriesDto,
  type ProfileSeriesListQuery,
  type UpdateProfileSeriesDto,
} from "@al-makan/types";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import type { AuthenticatedUser } from "../../common/authenticated-user";
import { ProfileSeriesService } from "./profile-series.service";

@Controller("catalog/series")
export class ProfileSeriesController {
  constructor(private readonly series: ProfileSeriesService) {}

  @RequirePermissions("catalog.manage")
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createProfileSeriesSchema)) body: CreateProfileSeriesDto,
  ) {
    return this.series.create(user.businessId, body);
  }

  @RequirePermissions("catalog.view")
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(profileSeriesListQuerySchema)) query: ProfileSeriesListQuery,
  ) {
    return this.series.list(user.businessId, query);
  }

  @RequirePermissions("catalog.manage")
  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateProfileSeriesSchema)) body: UpdateProfileSeriesDto,
  ) {
    return this.series.update(user.businessId, id, body);
  }
}
