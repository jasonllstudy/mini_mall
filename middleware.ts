import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { NextResponse } from "next/server";

/**
 * 路由守卫：保护 /admin/* 路由
 * 未登录用户重定向到登录页
 * 非管理员用户返回 403
 */
export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");

  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }

    // 检查是否有任何后台权限（深度防御）
    const permissions = req.auth?.user?.permissions ?? [];
    const hasAdminPermission = permissions.some((p: string) =>
      p.startsWith("user:") || p.startsWith("product:") ||
      p.startsWith("order:") || p.startsWith("category:")
    );

    if (!hasAdminPermission) {
      return new NextResponse("无权限访问管理后台", { status: 403 });
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
