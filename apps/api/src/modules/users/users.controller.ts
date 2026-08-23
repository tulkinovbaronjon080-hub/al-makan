import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";
import {
  paginationQuerySchema,
  updateMemberRoleSchema,
  updateMemberStatusSchema,
  type UpdateMemberRoleDto,
  type UpdateMemberStatusDto,
} from "@al-makan/types";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import type { AuthenticatedUser } from "../../common/authenticated-user";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // Seeing your teammates isn't sensitive — any authenticated business
  // member can list/view. Only role/status changes require users.manage.
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(paginationQuerySchema)) pagination: { page: number; pageSize: number },
  ) {
    return this.users.list(user.businessId, pagination);
  }

  @Get(":id")
  getOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.users.getOne(user.businessId, id);
  }

  @RequirePermissions("users.manage")
  @Patch(":id/role")
  updateRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateMemberRoleSchema)) body: UpdateMemberRoleDto,
  ) {
    return this.users.updateRole(user.businessId, id, user.userId, body.roleId);
  }

  @RequirePermissions("users.manage")
  @Patch(":id/status")
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateMemberStatusSchema)) body: UpdateMemberStatusDto,
  ) {
    return this.users.updateStatus(user.businessId, id, user.userId, body.status);
  }
}
