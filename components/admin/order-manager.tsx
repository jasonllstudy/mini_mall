"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/lib/actions/order";

interface Order {
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
}

interface OrderManagerProps {
  orders: Order[];
  totalPages: number;
  currentPage: number;
  status: string;
  q: string;
  canWrite: boolean;
}

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: "待支付", color: "text-orange-600 bg-orange-50" },
  PAID: { label: "已支付", color: "text-green-600 bg-green-50" },
  SHIPPED: { label: "已发货", color: "text-blue-600 bg-blue-50" },
  DELIVERED: { label: "已送达", color: "text-gray-600 bg-gray-100" },
  CANCELLED: { label: "已取消", color: "text-red-600 bg-red-50" },
};

const statusOptions = [
  { value: "ALL", label: "全部状态" },
  { value: "PENDING", label: "待支付" },
  { value: "PAID", label: "已支付" },
  { value: "SHIPPED", label: "已发货" },
  { value: "DELIVERED", label: "已送达" },
  { value: "CANCELLED", label: "已取消" },
];

const nextStatusMap: Record<string, { value: string; label: string } | null> = {
  PENDING: { value: "PAID", label: "标记为已支付" },
  PAID: { value: "SHIPPED", label: "标记为已发货" },
  SHIPPED: { value: "DELIVERED", label: "标记为已送达" },
  DELIVERED: null,
  CANCELLED: null,
};

export function OrderManager({
  orders,
  totalPages,
  currentPage,
  status,
  q,
  canWrite,
}: OrderManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const buildLink = (overrides: Record<string, string>) => {
    const sp = new URLSearchParams();
    if (status && status !== "ALL") sp.set("status", status);
    if (q) sp.set("q", q);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) sp.set(k, v);
      else sp.delete(k);
    });
    return "/admin/orders" + (sp.toString() ? `?${sp.toString()}` : "");
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (!confirm(`确定要更新订单状态吗？`)) return;
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, newStatus);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">订单管理</h1>
      </div>

      {/* 筛选 */}
      <form className="flex flex-wrap gap-2">
        <select
          name="status"
          defaultValue={status}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="搜索用户邮箱..."
          className="flex-1 min-w-[200px] rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
        <button
          type="submit"
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          筛选
        </button>
      </form>

      {/* 表格 */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3">订单号</th>
              <th className="px-4 py-3">用户</th>
              <th className="px-4 py-3">商品数</th>
              <th className="px-4 py-3">金额</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">下单时间</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => {
              const statusInfo = statusMap[order.status] ?? {
                label: order.status,
                color: "text-gray-600 bg-gray-100",
              };
              const nextAction = nextStatusMap[order.status];
              return (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">{order.user.name || "-"}</div>
                    <div className="text-xs text-gray-500">{order.user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{order.itemCount} 件</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      ¥{order.total.toFixed(2)}
                    </div>
                    {order.discountRate < 1 && (
                      <div className="text-xs text-green-600">
                        {(order.discountRate * 10).toFixed(1)}折
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(order.createdAt).toLocaleString("zh-CN")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-sm text-gray-600 hover:text-black"
                      >
                        详情
                      </Link>
                      {canWrite && nextAction && (
                        <button
                          onClick={() => handleStatusChange(order.id, nextAction.value)}
                          disabled={isPending}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {nextAction.label}
                        </button>
                      )}
                      {canWrite && order.status === "PENDING" && (
                        <button
                          onClick={() => handleStatusChange(order.id, "CANCELLED")}
                          disabled={isPending}
                          className="text-sm text-red-400 hover:text-red-600"
                        >
                          取消
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Link
            href={currentPage > 1 ? buildLink({ page: String(currentPage - 1) }) : "#"}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              currentPage > 1
                ? "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            上一页
          </Link>
          <span className="text-sm text-gray-600">
            第 {currentPage} / {totalPages} 页
          </span>
          <Link
            href={
              currentPage < totalPages
                ? buildLink({ page: String(currentPage + 1) })
                : "#"
            }
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              currentPage < totalPages
                ? "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            下一页
          </Link>
        </div>
      )}
    </div>
  );
}
