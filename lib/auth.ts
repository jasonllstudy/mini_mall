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
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    permissions?: string[];
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

        // 查找用户并包含角色信息
        const user = await prisma.user.findUnique({
          where: { email },
          include: { role: true },
        });

        if (!user) {
          return null;
        }

        // 验证密码
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return null;
        }

        // 加载权限
        const permissions = await getPermissionsByRole(user.role.name);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role.name,
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
      }
      return token;
    },
    async session({ session, token }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const u = session.user as any;
      if (token.sub) u.id = token.sub;
      if (token.role) u.role = token.role;
      if (token.permissions) u.permissions = token.permissions;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
