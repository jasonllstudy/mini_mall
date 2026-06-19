import { NextResponse } from "next/server";
import { getProducts } from "@/lib/actions/product";

/**
 * 获取商品分页列表
 * 支持查询参数：page、limit、categoryId、q
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const page = searchParams.get("page")
    ? parseInt(searchParams.get("page")!, 10)
    : 1;
  const limit = searchParams.get("limit")
    ? parseInt(searchParams.get("limit")!, 10)
    : 6;
  const categoryId = searchParams.get("categoryId") || undefined;
  const q = searchParams.get("q") || undefined;

  try {
    const result = await getProducts({ page, limit, categoryId, q });
    return NextResponse.json(result);
  } catch (error) {
    console.error("获取商品列表失败:", error);
    return NextResponse.json(
      { error: "获取商品列表失败" },
      { status: 500 }
    );
  }
}
