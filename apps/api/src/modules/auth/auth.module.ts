import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuditModule } from "../../audit/audit.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PasswordService } from "./password.service";
import { TokenService } from "./token.service";
import { JwtStrategy } from "./jwt.strategy";

// Secrets are passed per sign()/verify() call in TokenService (access vs
// refresh use different secrets), so JwtModule itself needs no global
// secret — it just provides JwtService for DI.
@Module({
  imports: [PassportModule, JwtModule.register({}), AuditModule],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, TokenService, JwtStrategy],
  exports: [TokenService],
})
export class AuthModule {}
