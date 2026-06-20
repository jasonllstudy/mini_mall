import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UserNav } from "../shop/user-nav";

// 模拟 next-auth/react
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({
    data: {
      user: {
        name: "测试用户",
        email: "test@example.com",
        membershipLevel: "LEVEL_1",
        totalSpent: 10000,
      },
    },
    status: "authenticated",
  })),
  signOut: vi.fn(),
}));

describe("UserNav 组件", () => {
  it("未登录时应显示登录和注册按钮", () => {
    render(<UserNav user={null} />);
    expect(screen.getByText("登录")).toBeInTheDocument();
    expect(screen.getByText("注册")).toBeInTheDocument();
  });

  it("已登录时应显示用户名和退出按钮", () => {
    render(
      <UserNav
        user={{
          name: "测试用户",
          email: "test@example.com",
          membershipLevel: "LEVEL_1",
          totalSpent: 10000,
        }}
      />
    );
    expect(screen.getByText("测试用户")).toBeInTheDocument();
    expect(screen.getByText("退出")).toBeInTheDocument();
  });

  it("应显示会员等级徽章", () => {
    render(
      <UserNav
        user={{
          name: "测试用户",
          email: "test@example.com",
          membershipLevel: "LEVEL_1",
          totalSpent: 10000,
        }}
      />
    );
    expect(screen.getByText("心悦1级")).toBeInTheDocument();
  });

  it("点击徽章应展开会员详情面板", () => {
    render(
      <UserNav
        user={{
          name: "测试用户",
          email: "test@example.com",
          membershipLevel: "LEVEL_1",
          totalSpent: 10000,
        }}
      />
    );

    const badge = screen.getByText("心悦1级");
    fireEvent.click(badge);

    expect(screen.getByText("会员中心")).toBeInTheDocument();
    expect(screen.getByText("累计消费")).toBeInTheDocument();
  });
});
