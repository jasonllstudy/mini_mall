"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

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

/**
 * 创建商品（需要 product:write 权限）
 */
export async function createProduct(data: {
  name: string;
  description?: string;
  price: number;
  stock: number;
  image?: string;
  categoryId: string;
}) {
  const session = await auth();
  if (!session?.user?.id || !hasPermission(session.user.permissions ?? [], "product:write")) {
    return { error: "无权限" };
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      description: data.description || null,
      price: data.price,
      stock: data.stock,
      image: data.image || null,
      categoryId: data.categoryId,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
  return { success: true, product };
}

/**
 * 更新商品（需要 product:write 权限）
 */
export async function updateProduct(
  id: string,
  data: {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    image?: string;
    categoryId?: string;
  }
) {
  const session = await auth();
  if (!session?.user?.id || !hasPermission(session.user.permissions ?? [], "product:write")) {
    return { error: "无权限" };
  }

  const product = await prisma.product.update({
    where: { id },
    data,
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath(`/products/${id}`);
  return { success: true, product };
}

/**
 * 删除商品（需要 product:write 权限）
 */
export async function deleteProduct(id: string) {
  const session = await auth();
  if (!session?.user?.id || !hasPermission(session.user.permissions ?? [], "product:write")) {
    return { error: "无权限" };
  }

  await prisma.product.delete({ where: { id } });

  revalidatePath("/admin/products");
  revalidatePath("/");
  return { success: true };
}
