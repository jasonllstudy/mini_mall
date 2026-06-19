import Link from "next/link";
import { auth } from "@/lib/auth";
import { getCartItemCount } from "@/lib/actions/cart";
import { UserNav } from "@/components/shop/user-nav";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const cartCount = await getCartItemCount();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Mini Mall
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              首页
            </Link>
            <Link
              href="/cart"
              className="relative text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              购物车
              {cartCount > 0 && (
                <span className="absolute -right-3 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
            <Link
              href="/orders"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              我的订单
            </Link>
            <UserNav user={session?.user} />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* 底部 */}
      <footer className="border-t bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-gray-500 sm:px-6 lg:px-8">
          © 2026 Mini Mall. 保留所有权利。
        </div>
      </footer>
    </div>
  );
}
