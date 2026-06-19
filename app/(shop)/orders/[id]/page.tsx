import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrderById } from "@/lib/actions/order";
import { mockPay } from "@/lib/actions/payment";

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/orders/" + id);
  }

  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  const statusMap: Record<string, { label: string; color: string }> = {
    PENDING: { label: "待支付", color: "text-orange-600 bg-orange-50" },
    PAID: { label: "已支付", color: "text-green-600 bg-green-50" },
    SHIPPED: { label: "已发货", color: "text-blue-600 bg-blue-50" },
    DELIVERED: { label: "已送达", color: "text-gray-600 bg-gray-100" },
    CANCELLED: { label: "已取消", color: "text-red-600 bg-red-50" },
  };

  const status = statusMap[order.status] ?? {
    label: order.status,
    color: "text-gray-600 bg-gray-100",
  };

  const handlePay = async () => {
    "use server";
    const result = await mockPay(id);
    if (result.success && result.upgraded) {
      redirect(`/orders/${id}?upgraded=${result.newLevel}`);
    }
    redirect(`/orders/${id}`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">订单详情</h1>
        <Link
          href="/orders"
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          返回订单列表
        </Link>
      </div>

      {/* 订单信息 */}
      <div className="rounded-xl bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            订单号：{order.id}
          </span>
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${status.color}`}
          >
            {status.label}
          </span>
        </div>
        <div className="text-sm text-gray-500 space-y-1">
          <p>下单时间：{new Date(order.createdAt).toLocaleString("zh-CN")}</p>
          <p>收货地址：{order.address}</p>
          <p>联系电话：{order.phone}</p>
        </div>
      </div>

      {/* 商品列表 */}
      <div className="space-y-3">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm"
          >
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
              {item.product.image ? (
                <Image
                  src={item.product.image}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-gray-400">
                  暂无图片
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {item.product.name}
              </p>
              <p className="text-xs text-gray-500">
                ¥{item.price.toFixed(2)} × {item.quantity}
              </p>
            </div>
            <p className="text-sm font-bold text-red-600">
              ¥{(item.price * item.quantity).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      {/* 金额汇总 */}
      <div className="rounded-xl bg-white p-5 shadow-sm space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>商品原价</span>
          <span>¥{order.originalTotal.toFixed(2)}</span>
        </div>
        {order.discountRate < 1 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>会员折扣</span>
            <span>-{((1 - order.discountRate) * 100).toFixed(0)}%</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold text-red-600 border-t pt-2">
          <span>实付金额</span>
          <span>¥{order.total.toFixed(2)}</span>
        </div>
      </div>

      {/* 支付按钮 */}
      {order.status === "PENDING" && (
        <form action={handlePay}>
          <button
            type="submit"
            className="w-full rounded-xl bg-black py-3 text-base font-medium text-white hover:bg-gray-800"
          >
            模拟支付
          </button>
        </form>
      )}
    </div>
  );
}
