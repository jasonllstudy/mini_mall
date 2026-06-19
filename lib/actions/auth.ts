"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";

/**
 * 用户注册
 * 默认分配 operator 角色
 */
export async function register(data: {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
}) {
  // Zod 验证
  const parseResult = registerSchema.safeParse(data);
  if (!parseResult.success) {
    const messages = parseResult.error.issues.map((e) => e.message).join("；");
    return { error: messages };
  }

  const { email, password, name } = parseResult.data;

  // 检查邮箱是否已存在
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    return { error: "该邮箱已被注册" };
  }

  // 查找默认 operator 角色
  const operatorRole = await prisma.role.findUnique({
    where: { name: "operator" },
  });

  if (!operatorRole) {
    return { error: "系统角色未初始化，请联系管理员" };
  }

  // 加密密码
  const hashedPassword = await bcrypt.hash(password, 10);

  // 创建用户
  await prisma.user.create({
    data: {
      email,
      name: name || email.split("@")[0],
      password: hashedPassword,
      roleId: operatorRole.id,
    },
  });

  return { success: true };
}
