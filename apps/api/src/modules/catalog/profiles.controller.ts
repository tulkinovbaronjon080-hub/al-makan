import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import {
  createProfileSchema,
  profileListQuerySchema,
  updateProfileSchema,
  type CreateProfileDto,
  type ProfileListQuery,
  type UpdateProfileDto,
} from "@al-makan/types";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import type { AuthenticatedUser } from "../../common/authenticated-user";
import { ProfilesService } from "./profiles.service";

@Controller("catalog/profiles")
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @RequirePermissions("catalog.manage")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(createProfileSchema)) body: CreateProfileDto) {
    return this.profiles.create(user.businessId, body);
  }

  @RequirePermissions("catalog.view")
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(profileListQuerySchema)) query: ProfileListQuery,
  ) {
    return this.profiles.list(user.businessId, query);
  }

  @RequirePermissions("catalog.manage")
  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileDto,
  ) {
    return this.profiles.update(user.businessId, id, body);
  }
}
