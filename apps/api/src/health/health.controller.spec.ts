import { Test } from "@nestjs/testing";
import { HealthController } from "./health.controller";
import { PrismaService } from "../prisma/prisma.service";

describe("HealthController", () => {
  it("reports ok once the DB responds", async () => {
    const prismaMock = { $queryRaw: jest.fn().mockResolvedValue([{ "?column?": 1 }]) };

    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prismaMock }],
    }).compile();

    const controller = moduleRef.get(HealthController);
    const result = await controller.check();

    expect(result.status).toBe("ok");
    expect(result.db).toBe("up");
    expect(prismaMock.$queryRaw).toHaveBeenCalled();
  });
});
