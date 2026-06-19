import { z } from "zod";

/**
 * 注册表单验证
 */
export const registerSchema = z
  .object({
    email: z.string().email("请输入有效的邮箱地址"),
    name: z.string().trim().max(50).optional(),
    password: z
      .string()
      .min(8, "密码长度至少为 8 位")
      .max(100)
      .regex(/[A-Z]/, "密码需包含至少一个大写字母")
      .regex(/[a-z]/, "密码需包含至少一个小写字母")
      .regex(/[0-9]/, "密码需包含至少一个数字"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * 登录表单验证
 */
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
