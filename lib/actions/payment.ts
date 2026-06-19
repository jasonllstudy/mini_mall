"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { computeMembershipLevel, getDiscountRate } from "@/lib/membership";

/**
 * 模拟支付
 * 直接完成支付流程：创建 Payment SUCCESS + 更新订单 PAID + 更新累计消费 + 检查会员升级
 */
export async function mockPay(orderId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { error: "请先登录" };
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: { include: { product: true } } },
  });

  if (!order) {
    return { error: "订单不存在" };
  }

  if (order.status !== "PENDING") {
    return { error: "订单状态不允许支付" };
  }

  // 验证订单金额正确性（防篡改）- 在事务外预检查
  const originalTotal = order.items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { membershipLevel: true },
  });
  const discountRate = getDiscountRate(user?.membershipLevel ?? "NONE");
  const expectedTotal = originalTotal * discountRate;

  // 允许 0.01 元浮点误差
  if (Math.abs(Number(order.total) - expectedTotal) > 0.01) {
    return { error: "订单金额异常，请重新下单" };
  }

  // 事务：完成支付 + 更新订单 + 更新用户累计消费
  await prisma.$transaction(async (tx) => {
    // 再次校验订单状态（防止并发支付）
    const currentOrder = await tx.order.findUnique({
      where: { id: orderId },
      select: { status: true, total: true },
    });

    if (!currentOrder || currentOrder.status !== "PENDING") {
      throw new Error("订单状态已变更");
    }

    // 再次校验金额（事务内最终校验）
    if (Math.abs(Number(currentOrder.total) - expectedTotal) > 0.01) {
      throw new Error("订单金额校验失败");
    }

    // 创建支付记录
    await tx.payment.create({
      data: {
        orderId,
        amount: order.total,
        status: "SUCCESS",
        method: "mock",
      },
    });

    // 更新订单状态
    await tx.order.update({
      where: { id: orderId },
      data: { status: "PAID" },
    });

    // 累加用户累计消费
    await tx.user.update({
      where: { id: userId },
      data: { totalSpent: { increment: order.total } },
    });
  });

  // 检查会员升级（事务外查询更新后的数据）
  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalSpent: true, membershipLevel: true },
  });

  let upgraded = false;
  let newLevel = "";
  if (updatedUser) {
    const computed = computeMembershipLevel(Number(updatedUser.totalSpent));
    if (computed !== updatedUser.membershipLevel) {
      await prisma.user.update({
        where: { id: userId },
        data: { membershipLevel: computed },
      });
      upgraded = true;
      newLevel = computed;
    }
  }

  revalidatePath("/orders");
  return { success: true, upgraded, newLevel };
}
