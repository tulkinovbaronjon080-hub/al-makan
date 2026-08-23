import { ForbiddenException, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PermissionsGuard } from "./permissions.guard";

function contextWithUser(permissions: string[]): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user: { permissions } }),
    }),
  } as unknown as ExecutionContext;
}

describe("PermissionsGuard", () => {
  it("allows the request when no permissions are required", () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(undefined) } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);

    expect(guard.canActivate(contextWithUser([]))).toBe(true);
  });

  it("allows the request when the user holds every required permission", () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(["inventory.view", "inventory.adjust"]),
    } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);

    expect(guard.canActivate(contextWithUser(["inventory.view", "inventory.adjust", "orders.view"]))).toBe(true);
  });

  it("rejects the request when a required permission is missing", () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(["business.manage"]),
    } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);

    expect(() => guard.canActivate(contextWithUser(["orders.view"]))).toThrow(ForbiddenException);
  });
});
