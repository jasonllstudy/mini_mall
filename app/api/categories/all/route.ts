import { NextResponse } from "next/server";
import { getAllCategoriesWithCount } from "@/lib/actions/category";

/**
 * 获取全部分类，包含每个分类下的商品数量
 */
export async function GET() {
  try {
    const categories = await getAllCategoriesWithCount();
    return NextResponse.json(categories);
  } catch (error) {
    console.error("获取全部分类失败:", error);
    return NextResponse.json(
      { error: "获取全部分类失败" },
      { status: 500 }
    );
  }
}
