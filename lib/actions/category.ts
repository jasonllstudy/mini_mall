"use server";

import { prisma } from "@/lib/prisma";

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
