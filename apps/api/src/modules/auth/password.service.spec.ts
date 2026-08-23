import { PasswordService } from "./password.service";

describe("PasswordService", () => {
  const service = new PasswordService();

  it("verifies a matching password against its hash", async () => {
    const hash = await service.hash("correct-horse-battery-staple");
    await expect(service.compare("correct-horse-battery-staple", hash)).resolves.toBe(true);
  });

  it("rejects a non-matching password", async () => {
    const hash = await service.hash("correct-horse-battery-staple");
    await expect(service.compare("wrong-password", hash)).resolves.toBe(false);
  });
});
