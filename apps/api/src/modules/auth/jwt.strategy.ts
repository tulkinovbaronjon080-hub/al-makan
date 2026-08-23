import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { PermissionKey } from "@al-makan/types";
import type { AuthenticatedUser } from "../../common/authenticated-user";
import type { Env } from "../../config/env.schema";

interface AccessTokenClaims {
  sub: string;
  businessId: string;
  roleId: string;
  roleName: string;
  permissions: PermissionKey[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService<Env, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get("JWT_ACCESS_SECRET", { infer: true }),
    });
  }

  validate(payload: AccessTokenClaims): AuthenticatedUser {
    return {
      userId: payload.sub,
      businessId: payload.businessId,
      roleId: payload.roleId,
      roleName: payload.roleName,
      permissions: payload.permissions,
    };
  }
}
