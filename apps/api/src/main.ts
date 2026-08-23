import "dotenv/config";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

// DTOs are Zod schemas from @al-makan/types (shared with apps/web), not
// class-validator classes — validation is applied per-route via a Zod
// pipe starting Phase 1, not registered globally here.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port);
}

bootstrap();
