import { prisma } from "@/lib/prisma";

/**
 * 根据角色名加载该角色的所有权限名称
 */
export async function getPermissionsByRole(roleName: string): Promise<string[]> {
  const role = await prisma.role.findUnique({
    where: { name: roleName },
    include: {
      permissions: {
        include: { permission: { select: { name: true } } },
      },
    },
  });

  if (!role) return [];
  return role.permissions.map((rp) => rp.permission.name);
}

/**
 * 检查权限列表是否包含指定权限（支持通配符 *）
 */
export function hasPermission(
  permissions: string[],
  required: string
): boolean {
  return permissions.some((p) => {
    if (p === required) return true;
    // 支持通配符，如 product:* 匹配 product:read 和 product:write
    if (p.endsWith(":*")) {
      const prefix = p.slice(0, -1);
      return required.startsWith(prefix);
    }
    return false;
  });
}

/**
 * 预置角色及其权限映射
 */
export const DEFAULT_ROLES: Record<
  string,
  { permissions: string[] }
> = {
  super_admin: {
    permissions: [
      "user:read",
      "user:write",
      "product:read",
      "product:write",
      "order:read",
      "order:write",
      "category:read",
      "category:write",
    ],
  },
  admin: {
    permissions: [
      "user:read",
      "product:*",
      "order:*",
      "category:*",
    ],
  },
  operator: {
    permissions: [
      "product:read",
      "order:read",
      "order:write",
      "category:read",
    ],
  },
};
