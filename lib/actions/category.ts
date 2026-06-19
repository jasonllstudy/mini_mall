"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export interface GetCategoriesParams {
  page?: number;
  limit?: number;
  q?: string;
}

export interface CategoriesResult {
  categories: {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
  }[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 获取分类分页列表，支持模糊搜索
 */
export async function getCategories(params: GetCategoriesParams = {}): Promise<CategoriesResult> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, params.limit ?? 6);
  const skip = (page - 1) * limit;

  const where: {
    name?: { contains: string };
  } = {};

  if (params.q && params.q.trim()) {
    where.name = { contains: params.q.trim() };
  }

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.count({ where }),
  ]);

  return {
    categories,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * 根据 ID 获取分类详情
 */
export async function getCategoryById(id: string) {
  return prisma.category.findUnique({
    where: { id },
    include: { products: true },
  });
}

/**
 * 获取全部分类，包含每个分类下的商品数量
 */
export async function getAllCategoriesWithCount() {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    productCount: c._count.products,
  }));
}

/**
 * 创建分类（需要 category:write 权限）
 */
export async function createCategory(data: {
  name: string;
  description?: string;
}) {
  const session = await auth();
  if (!session?.user?.id || !hasPermission(session.user.permissions ?? [], "category:write")) {
    return { error: "无权限" };
  }

  // 检查名称是否已存在
  const existing = await prisma.category.findUnique({
    where: { name: data.name },
  });
  if (existing) {
    return { error: "分类名称已存在" };
  }

  const category = await prisma.category.create({
    data: {
      name: data.name,
      description: data.description || null,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { success: true, category };
}

/**
 * 更新分类（需要 category:write 权限）
 */
export async function updateCategory(
  id: string,
  data: {
    name?: string;
    description?: string;
  }
) {
  const session = await auth();
  if (!session?.user?.id || !hasPermission(session.user.permissions ?? [], "category:write")) {
    return { error: "无权限" };
  }

  // 如果修改名称，检查是否已存在
  if (data.name) {
    const existing = await prisma.category.findFirst({
      where: { name: data.name, NOT: { id } },
    });
    if (existing) {
      return { error: "分类名称已存在" };
    }
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      description: data.description !== undefined ? data.description || null : undefined,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { success: true, category };
}

/**
 * 删除分类（需要 category:write 权限）
 */
export async function deleteCategory(id: string) {
  const session = await auth();
  if (!session?.user?.id || !hasPermission(session.user.permissions ?? [], "category:write")) {
    return { error: "无权限" };
  }

  // 检查分类下是否有商品
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });

  if (!category) {
    return { error: "分类不存在" };
  }

  if (category._count.products > 0) {
    return { error: "该分类下还有商品，无法删除" };
  }

  await prisma.category.delete({ where: { id } });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { success: true };
}
