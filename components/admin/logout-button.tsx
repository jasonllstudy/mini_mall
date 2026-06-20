"use client";

import { signOut } from "next-auth/react";

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <button
      onClick={handleLogout}
      className={
        className ||
        "w-full text-left block rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
      }
    >
      退出登录
    </button>
  );
}
