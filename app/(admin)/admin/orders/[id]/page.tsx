import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { adminGetOrderById, updateOrderStatus } from "@/lib/actions/order";

interface AdminOrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderPage({ params }: AdminOrderPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin/orders/" + id);
  }

  const permissions = session.user.permissions ?? [];
  if (!hasPermission(permissions, "order:read")) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-gray-500">你没有权限访问此页面</p>
        <Link href="/" className="mt-4 text-sm text-black hover:underline">
          返回首页
        </Link>
      </div>
    );
  }

  const order = await adminGetOrderById(id);

  if (!order) {
    notFound();
  }

  const canWrite = hasPermission(permissions, "order:write");

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

  const handleUpdateStatus = async (formData: FormData) => {
    "use server";
    const newStatus = formData.get("status") as string;
    await updateOrderStatus(id, newStatus);
    redirect(`/admin/orders/${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            ← 返回订单列表
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">订单详情</h1>
        </div>
        <span
          className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${status.color}`}
        >
          {status.label}
        </span>
      </div>

      {/* 订单信息 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-gray-900">基本信息</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">订单号</span>
              <span className="font-mono text-gray-900">{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">下单时间</span>
              <span className="text-gray-900">
                {new Date(order.createdAt).toLocaleString("zh-CN")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">用户</span>
              <span className="text-gray-900">
                {order.user.name || "-"} ({order.user.email})
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-gray-900">收货信息</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">收货地址</span>
              <span className="text-gray-900 text-right max-w-[60%]">{order.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">联系电话</span>
              <span className="text-gray-900">{order.phone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 商品列表 */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-4">商品清单</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 py-3 border-b last:border-0"
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
                  ¥{Number(item.price).toFixed(2)} × {item.quantity}
                </p>
              </div>
              <p className="text-sm font-bold text-red-600">
                ¥{(Number(item.price) * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 金额汇总 */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-4">金额明细</h2>
        <div className="space-y-2 text-sm max-w-md ml-auto">
          <div className="flex justify-between">
            <span className="text-gray-500">商品原价</span>
            <span className="text-gray-900">
              ¥{Number(order.originalTotal).toFixed(2)}
            </span>
          </div>
          {order.discountRate < 1 && (
            <div className="flex justify-between">
              <span className="text-gray-500">会员折扣</span>
              <span className="text-green-600">
                {(Number(order.discountRate) * 10).toFixed(1)}折
              </span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span className="text-gray-900">实付金额</span>
            <span className="text-red-600">
              ¥{Number(order.total).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* 状态更新 */}
      {canWrite && order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">更新状态</h2>
          <form action={handleUpdateStatus} className="flex gap-3">
            <select
              name="status"
              defaultValue={order.status}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            >
              <option value="PENDING">待支付</option>
              <option value="PAID">已支付</option>
              <option value="SHIPPED">已发货</option>
              <option value="DELIVERED">已送达</option>
              <option value="CANCELLED">已取消</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              更新状态
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
