import { NextResponse } from "next/server";
import { getCategoryById } from "@/lib/actions/category";

/**
 * 根据 ID 获取分类详情
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const category = await getCategoryById(id);
    if (!category) {
      return NextResponse.json({ error: "分类不存在" }, { status: 404 });
    }
    return NextResponse.json(category);
  } catch (error) {
    console.error("获取分类详情失败:", error);
    return NextResponse.json(
      { error: "获取分类详情失败" },
      { status: 500 }
    );
  }
}
