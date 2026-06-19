import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

const navItems = [
  { href: "/admin/dashboard", label: "数据概览", permission: "user:read" },
  { href: "/admin/products", label: "商品管理", permission: "product:read" },
  { href: "/admin/categories", label: "分类管理", permission: "category:read" },
  { href: "/admin/orders", label: "订单管理", permission: "order:read" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin/dashboard");
  }

  const permissions = session.user.permissions ?? [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm">
        <div className="flex h-16 items-center px-6">
          <Link href="/admin/dashboard" className="text-lg font-bold text-gray-900">
            后台管理
          </Link>
        </div>
        <nav className="space-y-1 px-4 py-4">
          {navItems.map((item) => {
            if (!hasPermission(permissions, item.permission)) return null;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                {item.label}
              </Link>
            );
          })}
          <div className="my-4 border-t"></div>
          <Link
            href="/"
            className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            返回前台
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-end bg-white px-8 shadow-sm">
          <span className="text-sm text-gray-700">
            {session.user.name || session.user.email}
          </span>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
