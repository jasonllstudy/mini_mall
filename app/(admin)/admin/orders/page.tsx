import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { adminGetOrders } from "@/lib/actions/order";
import { OrderManager } from "@/components/admin/order-manager";

interface OrdersAdminPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    q?: string;
  }>;
}

export default async function OrdersAdminPage({
  searchParams,
}: OrdersAdminPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin/orders");
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

  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const status = params.status || "ALL";
  const q = params.q || "";

  const { orders, totalPages } = await adminGetOrders({
    page,
    limit: 10,
    status: status !== "ALL" ? status : undefined,
    q: q || undefined,
  });

  const canWrite = hasPermission(permissions, "order:write");

  return (
    <OrderManager
      orders={orders}
      totalPages={totalPages}
      currentPage={page}
      status={status}
      q={q}
      canWrite={canWrite}
    />
  );
}
