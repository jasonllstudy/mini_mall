"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

interface UserNavProps {
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

export function UserNav({ user }: UserNavProps) {
  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/login"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          登录
        </Link>
        <Link
          href="/register"
          className="rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          注册
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-700">
        {user.name || user.email}
      </span>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        退出
      </button>
    </div>
  );
}
