"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getDiscountRate } from "@/lib/membership";

/**
 * 从购物车创建订单
 * 事务内：扣库存 + 创建订单和订单项 + 清空购物车
 */
export async function createOrder(data: {
  address: string;
  phone: string;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { error: "请先登录" };
  }

  // 获取购物车商品
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });

  if (cartItems.length === 0) {
    return { error: "购物车是空的，无法结算" };
  }

  // 校验库存
  for (const item of cartItems) {
    if (item.quantity > item.product.stock) {
      return {
        error: `商品「${item.product.name}」库存不足，当前库存 ${item.product.stock} 件`,
      };
    }
  }

  // 计算金额
  const originalTotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // 获取用户折扣率
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { membershipLevel: true },
  });

  const discountRate = getDiscountRate(user?.membershipLevel ?? "NONE");
  const total = originalTotal * discountRate;

  // 事务：创建订单 + 扣库存 + 清空购物车
  const order = await prisma.$transaction(async (tx) => {
    // 创建订单
    const newOrder = await tx.order.create({
      data: {
        userId,
        originalTotal,
        discountRate,
        total,
        status: "PENDING",
        address: data.address,
        phone: data.phone,
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
      },
    });

    // 扣减库存
    for (const item of cartItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // 清空购物车
    await tx.cartItem.deleteMany({
      where: { userId },
    });

    return newOrder;
  });

  revalidatePath("/orders");
  revalidatePath("/cart");
  return { success: true, orderId: order.id };
}

/**
 * 获取当前用户订单列表
 */
export async function getOrders() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { product: true },
      },
      payments: true,
    },
  });
}

/**
 * 根据 ID 获取订单详情
 */
export async function getOrderById(id: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  return prisma.order.findFirst({
    where: { id, userId },
    include: {
      items: {
        include: { product: true },
      },
      payments: true,
    },
  });
}
