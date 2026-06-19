import NextAuth, { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getPermissionsByRole } from "@/lib/permissions";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      permissions: string[];
      membershipLevel?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    permissions?: string[];
    membershipLevel?: string;
  }
}

// 内存中的登录速率限制器（进程级，适合单实例部署）
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 分钟

function isRateLimited(email: string): boolean {
  const record = loginAttempts.get(email);
  if (!record) return false;
  const now = Date.now();
  if (now - record.lastAttempt > WINDOW_MS) {
    loginAttempts.delete(email);
    return false;
  }
  return record.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(email: string) {
  const now = Date.now();
  const record = loginAttempts.get(email);
  if (!record) {
    loginAttempts.set(email, { count: 1, lastAttempt: now });
  } else {
    record.count++;
    record.lastAttempt = now;
  }
}

/**
 * Auth.js v5 配置
 * 使用 Credentials Provider + JWT Strategy
 */
export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // 速率限制检查
        if (isRateLimited(email)) {
          throw new Error("登录尝试过多，请 15 分钟后再试");
        }

        // 查找用户并包含角色信息
        const user = await prisma.user.findUnique({
          where: { email },
          include: { role: true },
        });

        if (!user) {
          recordFailedAttempt(email);
          return null;
        }

        // 验证密码
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          recordFailedAttempt(email);
          return null;
        }

        // 登录成功，清除失败记录
        loginAttempts.delete(email);

        // 加载权限
        const permissions = await getPermissionsByRole(user.role.name);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role.name,
          membershipLevel: user.membershipLevel,
          permissions,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 天
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.permissions = user.permissions;
        token.membershipLevel = user.membershipLevel;
      }
      return token;
    },
    async session({ session, token }) {
      // TODO: NextAuth v5 beta 类型扩展未生效，升级稳定版后移除 as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const u = session.user as any;
      if (token.sub) u.id = token.sub;
      if (token.role) u.role = token.role;
      if (token.permissions) u.permissions = token.permissions;
      if (token.membershipLevel) u.membershipLevel = token.membershipLevel;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
