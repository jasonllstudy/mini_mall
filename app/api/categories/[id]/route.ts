import { NextResponse } from "next/server";
import { getCategoryById } from "@/lib/actions/category";
import { idParamSchema } from "@/lib/validations/common";
import { errorResponse } from "@/lib/api-response";

/**
 * 根据 ID 获取分类详情
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const parseResult = idParamSchema.safeParse(id);
  if (!parseResult.success) {
    return errorResponse("分类 ID 格式错误", 400);
  }

  try {
    const category = await getCategoryById(parseResult.data);
    if (!category) {
      return errorResponse("分类不存在", 404);
    }
    return NextResponse.json(category);
  } catch (error) {
    console.error("获取分类详情失败:", error);
    return errorResponse("获取分类详情失败，请稍后重试", 500);
  }
}
