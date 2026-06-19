import { getAllCategoriesWithCount } from "@/lib/actions/category";
import { errorResponse } from "@/lib/api-response";

/**
 * 获取全部分类，包含每个分类下的商品数量
 */
export async function GET() {
  try {
    const categories = await getAllCategoriesWithCount();
    return Response.json(categories);
  } catch (error) {
    console.error("获取全部分类失败:", error);
    return errorResponse("获取全部分类失败，请稍后重试", 500);
  }
}
