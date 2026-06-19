import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 清理旧数据（保留商品和分类）
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();

  // 创建权限
  const permNames = [
    "user:read",
    "user:write",
    "product:read",
    "product:write",
    "order:read",
    "order:write",
    "category:read",
    "category:write",
  ];

  const permissions = await Promise.all(
    permNames.map((name) =>
      prisma.permission.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  const permMap = Object.fromEntries(
    permissions.map((p) => [p.name, p.id])
  );

  // 创建角色
  const superAdminRole = await prisma.role.create({
    data: {
      name: "super_admin",
      permissions: {
        create: permNames.map((name) => ({
          permission: { connect: { id: permMap[name] } },
        })),
      },
    },
  });

  const adminRole = await prisma.role.create({
    data: {
      name: "admin",
      permissions: {
        create: [
          "user:read",
          "product:read",
          "product:write",
          "order:read",
          "order:write",
          "category:read",
          "category:write",
        ].map((name) => ({
          permission: { connect: { id: permMap[name] } },
        })),
      },
    },
  });

  const operatorRole = await prisma.role.create({
    data: {
      name: "operator",
      permissions: {
        create: [
          "product:read",
          "order:read",
          "order:write",
          "category:read",
        ].map((name) => ({
          permission: { connect: { id: permMap[name] } },
        })),
      },
    },
  });

  // 创建管理员账号
  // 优先从环境变量读取密码，不存在则生成随机密码
  const adminPassword = process.env.ADMIN_PASSWORD || crypto.randomUUID().slice(0, 12);
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "管理员",
      password: hashedPassword,
      roleId: superAdminRole.id,
    },
  });

  if (!process.env.ADMIN_PASSWORD) {
    console.log("⚠️ 未设置 ADMIN_PASSWORD 环境变量，已生成随机密码：" + adminPassword);
  }
  console.log("角色、权限和管理员账号初始化完成");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
