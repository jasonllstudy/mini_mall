"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * 将指定用户设置为管理员
 * 如果不存在则创建
 */
export async function setUserAsAdmin(email: string) {
  try {
    // 查找管理员角色
    const adminRole = await prisma.role.findFirst({
      where: { name: "super_admin" },
    });

    if (!adminRole) {
      return { error: "管理员角色不存在，请先运行 seed" };
    }

    // 查找用户
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // 更新用户角色为管理员
      await prisma.user.update({
        where: { email },
        data: { roleId: adminRole.id },
      });
      return { success: true, message: `用户 ${email} 已升级为管理员` };
    } else {
      // 创建新管理员账号
      const password = process.env.ADMIN_PASSWORD || "admin123456";
      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.user.create({
        data: {
          email,
          name: "管理员",
          password: hashedPassword,
          roleId: adminRole.id,
        },
      });
      return { success: true, message: `已创建管理员账号 ${email}` };
    }
  } catch (error) {
    console.error("设置管理员失败:", error);
    return { error: "操作失败" };
  }
}

/**
 * 修改用户密码
 */
export async function changeUserPassword(email: string, newPassword: string) {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    return { success: true, message: `密码修改成功` };
  } catch (error) {
    console.error("修改密码失败:", error);
    return { error: "修改密码失败" };
  }
}
