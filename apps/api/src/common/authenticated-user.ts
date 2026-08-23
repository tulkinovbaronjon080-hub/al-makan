import type { PermissionKey } from "@al-makan/types";

/**
 * Shape of `request.user`, set by JwtStrategy.validate() from the access
 * token payload. businessId/roleId/permissions are read explicitly by
 * every controller/service that needs tenant scoping — see the Phase 1
 * plan's "Tenant isolation" decision (explicit, not a global Prisma
 * middleware).
 */
export interface AuthenticatedUser {
  userId: string;
  businessId: string;
  roleId: string;
  roleName: string;
  permissions: PermissionKey[];
}
