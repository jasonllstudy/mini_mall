"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Product } from "@prisma/client";

export interface CartItemWithProduct {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  product: Product;
}

/**
 * 获取当前登录用户购物车列表
 */
export async function getCart(): Promise<CartItemWithProduct[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  return prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  }) as Promise<CartItemWithProduct[]>;
}

/**
 * 获取当前登录用户购物车商品总数
 */
export async function getCartItemCount(): Promise<number> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return 0;

  const result = await prisma.cartItem.aggregate({
    where: { userId },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}

/**
 * 添加商品到购物车
 * 如果商品已在购物车中，累加数量
 */
export async function addToCart(productId: string, quantity: number = 1) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { error: "请先登录" };
  }

  if (quantity < 1) {
    return { error: "数量不能小于 1" };
  }

  // 检查商品库存
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { stock: true, name: true },
  });

  if (!product) {
    return { error: "商品不存在" };
  }

  // 查询当前购物车数量以校验库存
  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  const targetQuantity = existing ? existing.quantity + quantity : quantity;

  if (targetQuantity > product.stock) {
    return { error: `库存不足，当前库存 ${product.stock} 件` };
  }

  // 使用 upsert 避免竞态条件
  await prisma.cartItem.upsert({
    where: { userId_productId: { userId, productId } },
    update: { quantity: targetQuantity },
    create: { userId, productId, quantity },
  });

  revalidatePath("/cart");
  return { success: true };
}

/**
 * 更新购物车商品数量
 */
export async function updateCartItem(cartItemId: string, quantity: number) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { error: "请先登录" };
  }

  if (quantity < 1) {
    return { error: "数量不能小于 1" };
  }

  const cartItem = await prisma.cartItem.findFirst({
    where: { id: cartItemId, userId },
    include: { product: true },
  });

  if (!cartItem) {
    return { error: "购物车商品不存在" };
  }

  if (quantity > cartItem.product.stock) {
    return { error: `库存不足，当前库存 ${cartItem.product.stock} 件` };
  }

  await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
  });

  revalidatePath("/cart");
  return { success: true };
}

/**
 * 删除购物车商品
 */
export async function removeCartItem(cartItemId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { error: "请先登录" };
  }

  const { count } = await prisma.cartItem.deleteMany({
    where: { id: cartItemId, userId },
  });

  if (count === 0) {
    return { error: "购物车商品不存在" };
  }

  revalidatePath("/cart");
  return { success: true };
}

/**
 * 清空购物车
 */
export async function clearCart() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { error: "请先登录" };
  }

  await prisma.cartItem.deleteMany({
    where: { userId },
  });

  revalidatePath("/cart");
  return { success: true };
}
