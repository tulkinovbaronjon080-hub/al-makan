import { SetMetadata } from "@nestjs/common";
import type { PermissionKey } from "@al-makan/types";

export const PERMISSIONS_KEY = "requiredPermissions";

/** A typo'd permission key is a compile error, not a silent always-403. */
export const RequirePermissions = (...permissions: PermissionKey[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
