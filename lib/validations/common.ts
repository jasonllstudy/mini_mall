import { z } from "zod";

/**
 * 分页查询参数验证
 */
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(6),
});

/**
 * 模糊搜索参数验证
 */
export const searchSchema = z.object({
  q: z.string().trim().max(100).optional(),
});

/**
 * UUID 参数验证
 */
export const idParamSchema = z.string().cuid();
