"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
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

  // 获取购物车商品（只加载必要字段）
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
        },
      },
    },
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
  try {
    const order = await prisma.$transaction(async (tx) => {
      // 先锁定库存（行锁），并再次校验库存
      for (const item of cartItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true, name: true },
        });

        if (!product || product.stock < item.quantity) {
          throw new Error(`INVENTORY_ERROR|商品「${product?.name ?? "未知"}」库存不足，当前库存 ${product?.stock ?? 0} 件`);
        }
      }

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
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("INVENTORY_ERROR|")) {
      return { error: error.message.replace("INVENTORY_ERROR|", "") };
    }
    console.error("创建订单失败:", error);
    return { error: "创建订单失败，请稍后重试" };
  }
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

// ==================== 管理员接口 ====================

export interface AdminGetOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
}

export interface AdminOrdersResult {
  orders: {
    id: string;
    user: { name: string | null; email: string };
    originalTotal: number;
    discountRate: number;
    total: number;
    status: string;
    address: string;
    phone: string;
    createdAt: Date;
    itemCount: number;
  }[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 管理员获取所有订单（需要 order:read 权限）
 */
export async function adminGetOrders(params: AdminGetOrdersParams = {}): Promise<AdminOrdersResult> {
  const session = await auth();
  if (!session?.user?.id || !hasPermission(session.user.permissions ?? [], "order:read")) {
    return { orders: [], total: 0, page: 1, limit: 10, totalPages: 0 };
  }

  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, params.limit ?? 10);
  const skip = (page - 1) * limit;

  const where: {
    status?: string;
    user?: { email?: { contains: string } };
  } = {};

  if (params.status && params.status !== "ALL") {
    where.status = params.status;
  }

  if (params.q && params.q.trim()) {
    where.user = { email: { contains: params.q.trim() } };
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: orders.map((o) => ({
      id: o.id,
      user: o.user,
      originalTotal: Number(o.originalTotal),
      discountRate: Number(o.discountRate),
      total: Number(o.total),
      status: o.status,
      address: o.address,
      phone: o.phone,
      createdAt: o.createdAt,
      itemCount: o._count.items,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * 管理员获取订单详情（需要 order:read 权限）
 */
export async function adminGetOrderById(id: string) {
  const session = await auth();
  if (!session?.user?.id || !hasPermission(session.user.permissions ?? [], "order:read")) {
    return null;
  }

  return prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      items: { include: { product: true } },
      payments: true,
    },
  });
}

/**
 * 更新订单状态（需要 order:write 权限）
 */
export async function updateOrderStatus(id: string, status: string) {
  const session = await auth();
  if (!session?.user?.id || !hasPermission(session.user.permissions ?? [], "order:write")) {
    return { error: "无权限" };
  }

  const validStatuses = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];
  if (!validStatuses.includes(status)) {
    return { error: "无效的订单状态" };
  }

  const order = await prisma.order.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!order) {
    return { error: "订单不存在" };
  }

  // 状态流转规则检查
  const statusFlow: Record<string, string[]> = {
    PENDING: ["PAID", "CANCELLED"],
    PAID: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["DELIVERED"],
    DELIVERED: [],
    CANCELLED: [],
  };

  const allowedNext = statusFlow[order.status] ?? [];
  if (!allowedNext.includes(status) && order.status !== status) {
    return { error: `不能从 ${order.status} 变更为 ${status}` };
  }

  await prisma.order.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/orders/${id}`);
  return { success: true };
}
