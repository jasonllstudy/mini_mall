import { NextResponse } from "next/server";
import { getCategories } from "@/lib/actions/category";

/**
 * 获取分类分页列表
 * 支持查询参数：page、limit、q
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const page = searchParams.get("page")
    ? parseInt(searchParams.get("page")!, 10)
    : 1;
  const limit = searchParams.get("limit")
    ? parseInt(searchParams.get("limit")!, 10)
    : 6;
  const q = searchParams.get("q") || undefined;

  try {
    const result = await getCategories({ page, limit, q });
    return NextResponse.json(result);
  } catch (error) {
    console.error("获取分类列表失败:", error);
    return NextResponse.json(
      { error: "获取分类列表失败" },
      { status: 500 }
    );
  }
}
