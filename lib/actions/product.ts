"use server";

import { prisma } from "@/lib/prisma";

export interface GetProductsParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  q?: string;
}

export interface ProductsResult {
  products: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    image: string | null;
    categoryId: string;
    category: { name: string };
    createdAt: Date;
  }[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 获取商品分页列表，支持分类筛选和模糊搜索
 */
export async function getProducts(params: GetProductsParams = {}): Promise<ProductsResult> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, params.limit ?? 6);
  const skip = (page - 1) * limit;

  const where: {
    categoryId?: string;
    name?: { contains: string };
  } = {};

  if (params.categoryId) {
    where.categoryId = params.categoryId;
  }

  if (params.q && params.q.trim()) {
    where.name = { contains: params.q.trim() };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { category: { select: { name: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * 根据 ID 获取商品详情
 */
export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
}
