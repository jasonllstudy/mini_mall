import { NextResponse } from "next/server";
import { getProductById } from "@/lib/actions/product";
import { idParamSchema } from "@/lib/validations/common";
import { errorResponse } from "@/lib/api-response";

/**
 * 根据 ID 获取商品详情
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const parseResult = idParamSchema.safeParse(id);
  if (!parseResult.success) {
    return errorResponse("商品 ID 格式错误", 400);
  }

  try {
    const product = await getProductById(parseResult.data);
    if (!product) {
      return errorResponse("商品不存在", 404);
    }
    return NextResponse.json(product);
  } catch (error) {
    console.error("获取商品详情失败:", error);
    return errorResponse("获取商品详情失败，请稍后重试", 500);
  }
}
