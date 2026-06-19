import { NextResponse } from "next/server";
import { getCategories } from "@/lib/actions/category";
import { paginationSchema, searchSchema } from "@/lib/validations/common";
import { errorResponse } from "@/lib/api-response";

/**
 * 获取分类分页列表
 * 支持查询参数：page、limit、q
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const raw = {
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    q: searchParams.get("q") ?? undefined,
  };

  const parseResult = paginationSchema.merge(searchSchema).safeParse(raw);
  if (!parseResult.success) {
    return errorResponse("参数格式错误", 400);
  }

  const { page, limit, q } = parseResult.data;

  try {
    const result = await getCategories({ page, limit, q });
    return NextResponse.json(result);
  } catch (error) {
    console.error("获取分类列表失败:", error);
    return errorResponse("获取分类列表失败，请稍后重试", 500);
  }
}
