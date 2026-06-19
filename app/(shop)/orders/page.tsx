import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrders } from "@/lib/actions/order";

export default async function OrdersPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/orders");
  }

  const orders = await getOrders();

  const statusMap: Record<string, { label: string; color: string }> = {
    PENDING: { label: "待支付", color: "text-orange-600 bg-orange-50" },
    PAID: { label: "已支付", color: "text-green-600 bg-green-50" },
    SHIPPED: { label: "已发货", color: "text-blue-600 bg-blue-50" },
    DELIVERED: { label: "已送达", color: "text-gray-600 bg-gray-100" },
    CANCELLED: { label: "已取消", color: "text-red-600 bg-red-50" },
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">我的订单</h1>

      {orders.length === 0 ? (
        <div className="rounded-xl bg-white py-20 text-center shadow-sm">
          <p className="text-gray-500">暂无订单</p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-medium text-black hover:underline"
          >
            去逛逛
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusMap[order.status] ?? {
              label: order.status,
              color: "text-gray-600 bg-gray-100",
            };
            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">
                      订单号：{order.id.slice(0, 8)}...
                    </p>
                    <p className="text-sm text-gray-500">
                      下单时间：
                      {new Date(order.createdAt).toLocaleString("zh-CN")}
                    </p>
                    <p className="text-sm text-gray-500">
                      共 {order.items.reduce((s, i) => s + i.quantity, 0)} 件商品
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${status.color}`}
                    >
                      {status.label}
                    </span>
                    <p className="text-lg font-bold text-red-600">
                      ¥{order.total.toFixed(2)}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
