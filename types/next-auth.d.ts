import type { DefaultSession } from "@auth/core/types";

/**
 * 扩展 NextAuth 类型，注入 role 和 permissions
 */
declare module "@auth/core/types" {
  interface Session {
    user: {
      id: string;
      role: string;
      permissions: string[];
      membershipLevel?: string;
      totalSpent?: number;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    permissions?: string[];
    membershipLevel?: string;
    totalSpent?: number;
  }
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      permissions: string[];
      membershipLevel?: string;
      totalSpent?: number;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    permissions?: string[];
    membershipLevel?: string;
    totalSpent?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    permissions?: string[];
  }
}
