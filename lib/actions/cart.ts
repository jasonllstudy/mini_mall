"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Product } from "@prisma/client";

export interface CartItemWithProduct {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  product: Product;
}

/**
 * 获取当前用户购物车列表
 */
export async function getCart(userId: string): Promise<CartItemWithProduct[]> {
  return prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  }) as Promise<CartItemWithProduct[]>;
}

/**
 * 获取购物车商品总数
 */
export async function getCartItemCount(userId: string): Promise<number> {
  const result = await prisma.cartItem.aggregate({
    where: { userId },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}

/**
 * 添加商品到购物车
 * 如果商品已在购物车中，更新数量
 */
export async function addToCart(
  userId: string,
  productId: string,
  quantity: number = 1
) {
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

  // 检查购物车中是否已有该商品
  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  const targetQuantity = existing ? existing.quantity + quantity : quantity;

  if (targetQuantity > product.stock) {
    return { error: `库存不足，当前库存 ${product.stock} 件` };
  }

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: targetQuantity },
    });
  } else {
    await prisma.cartItem.create({
      data: { userId, productId, quantity },
    });
  }

  revalidatePath("/cart");
  return { success: true };
}

/**
 * 更新购物车商品数量
 */
export async function updateCartItem(
  userId: string,
  cartItemId: string,
  quantity: number
) {
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
export async function removeCartItem(userId: string, cartItemId: string) {
  const cartItem = await prisma.cartItem.findFirst({
    where: { id: cartItemId, userId },
  });

  if (!cartItem) {
    return { error: "购物车商品不存在" };
  }

  await prisma.cartItem.delete({
    where: { id: cartItemId },
  });

  revalidatePath("/cart");
  return { success: true };
}

/**
 * 清空购物车
 */
export async function clearCart(userId: string) {
  await prisma.cartItem.deleteMany({
    where: { userId },
  });

  revalidatePath("/cart");
  return { success: true };
}
