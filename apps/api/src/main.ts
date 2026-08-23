import "dotenv/config";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

// DTOs are Zod schemas from @al-makan/types (shared with apps/web), not
// class-validator classes — validation is applied per-route via a Zod
// pipe (see common/zod-validation.pipe.ts), not registered globally here.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  // credentials: true + a specific origin (not '*') is required for the
  // httpOnly refresh-token cookie to cross the :3000/:4000 dev ports.
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000", credentials: true });

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port);
}

bootstrap();
