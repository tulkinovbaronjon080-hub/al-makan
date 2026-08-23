import { PrismaClient } from "../generated/client/index.js";
import {
  PERMISSION_DESCRIPTIONS,
  PERMISSION_KEYS,
  SYSTEM_ROLES,
  SYSTEM_ROLE_PERMISSIONS,
} from "@al-makan/types";

const prisma = new PrismaClient();

async function main() {
  for (const key of PERMISSION_KEYS) {
    await prisma.permission.upsert({
      where: { key },
      update: { description: PERMISSION_DESCRIPTIONS[key] },
      create: { key, description: PERMISSION_DESCRIPTIONS[key] },
    });
  }

  for (const roleName of SYSTEM_ROLES) {
    // Prisma's compound-unique `where` doesn't accept null for businessId
    // (composite unique lookups require findFirst, not findUnique/upsert,
    // when a field in the key is nullable) — find-then-create instead.
    const role =
      (await prisma.role.findFirst({ where: { businessId: null, name: roleName } })) ??
      (await prisma.role.create({ data: { businessId: null, name: roleName, isSystem: true } }));

    const permissionKeys = SYSTEM_ROLE_PERMISSIONS[roleName];
    const permissions = await prisma.permission.findMany({
      where: { key: { in: permissionKeys } },
      select: { id: true },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: role.id, permissionId: p.id })),
      skipDuplicates: true,
    });

    console.log(`Seeded role ${roleName} with ${permissions.length} permissions`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
