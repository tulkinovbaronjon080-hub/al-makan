import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import {
  createLocationSchema,
  locationListQuerySchema,
  updateLocationSchema,
  type CreateLocationDto,
  type LocationListQuery,
  type UpdateLocationDto,
} from "@al-makan/types";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import type { AuthenticatedUser } from "../../common/authenticated-user";
import { LocationsService } from "./locations.service";

@Controller("locations")
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @RequirePermissions("locations.manage")
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createLocationSchema)) body: CreateLocationDto,
  ) {
    return this.locations.create(user.businessId, body);
  }

  @RequirePermissions("locations.view")
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(locationListQuerySchema)) query: LocationListQuery,
  ) {
    return this.locations.list(user.businessId, query);
  }

  @RequirePermissions("locations.manage")
  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateLocationSchema)) body: UpdateLocationDto,
  ) {
    return this.locations.update(user.businessId, id, body);
  }
}
