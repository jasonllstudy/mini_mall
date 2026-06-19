import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * 路由守卫：保护 /admin/* 路由
 * 未登录用户重定向到登录页
 */
export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");

  if (isAdminRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
