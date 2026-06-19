"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { getMembershipLabel, getNextLevelInfo, MEMBERSHIP_RULES } from "@/lib/membership";

interface UserNavProps {
  user?: {
    name?: string | null;
    email?: string | null;
    membershipLevel?: string | null;
    totalSpent?: number;
  } | null;
}

const levelBadgeColors: Record<string, string> = {
  NONE: "bg-gray-100 text-gray-600",
  LEVEL_1: "bg-amber-100 text-amber-700",
  LEVEL_2: "bg-slate-200 text-slate-700",
  LEVEL_3: "bg-yellow-100 text-yellow-700",
};

export function UserNav({ user }: UserNavProps) {
  const [showDropdown, setShowDropdown] = useState(false);

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

  const level = user.membershipLevel ?? "NONE";
  const totalSpent = user.totalSpent ?? 0;
  const levelLabel = getMembershipLabel(level);
  const nextLevel = getNextLevelInfo(totalSpent);
  const currentRule = MEMBERSHIP_RULES.find((r) => r.level === level);

  return (
    <div className="relative flex items-center gap-4">
      {/* 会员徽章 */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80 ${levelBadgeColors[level]}`}
      >
        <span>{levelLabel}</span>
        <svg
          className={`h-3 w-3 transition-transform ${showDropdown ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <span className="text-sm text-gray-700">{user.name || user.email}</span>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        退出
      </button>

      {/* 会员详情下拉面板 */}
      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl bg-white p-4 shadow-lg ring-1 ring-black/5"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-bold text-gray-900">会员中心</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${levelBadgeColors[level]}`}>
                {levelLabel}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">累计消费</span>
                <span className="font-medium text-gray-900">
                  ¥{totalSpent.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">当前折扣</span>
                <span className="font-medium text-green-600">
                  {currentRule && currentRule.rate < 1
                    ? `${(currentRule.rate * 10).toFixed(1)}折`
                    : "无折扣"}
                </span>
              </div>

              {nextLevel.hasNext ? (
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="mb-1 text-xs text-gray-500">
                    距离 <span className="font-medium text-gray-900">{nextLevel.nextLabel}</span> 还差
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    ¥{nextLevel.gap.toFixed(2)}
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    升级后可享 {(nextLevel.nextRate * 10).toFixed(1)}折
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-yellow-50 p-3 text-center">
                  <div className="text-sm font-medium text-yellow-800">
                    🎉 您已是最高等级会员
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 border-t pt-3">
              <Link
                href="/orders"
                className="block text-center text-sm text-gray-600 hover:text-gray-900"
                onClick={() => setShowDropdown(false)}
              >
                查看我的订单 →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
