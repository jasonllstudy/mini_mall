import Link from "next/link";
import Image from "next/image";
import { getProducts } from "@/lib/actions/product";
import { getAllCategoriesWithCount } from "@/lib/actions/category";

interface HomePageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    categoryId?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const q = params.q || "";
  const categoryId = params.categoryId || "";

  // 并行获取商品列表和全部分类
  const [{ products, totalPages }, categories] = await Promise.all([
    getProducts({ page, limit: 6, categoryId: categoryId || undefined, q: q || undefined }),
    getAllCategoriesWithCount(),
  ]);

  // 构建带参数的链接
  const buildLink = (overrides: Record<string, string>) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (categoryId) sp.set("categoryId", categoryId);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) sp.set(k, v);
      else sp.delete(k);
    });
    const qs = sp.toString();
    return qs ? `/?${qs}` : "/";
  };

  return (
    <div className="space-y-8">
      {/* 搜索框 */}
      <div className="mx-auto max-w-2xl">
        <form action="/" method="GET" className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="搜索商品..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
          {categoryId && <input type="hidden" name="categoryId" value={categoryId} />}
          <button
            type="submit"
            className="rounded-lg bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            搜索
          </button>
        </form>
      </div>

      {/* 分类标签 */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={buildLink({ categoryId: "" })}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            !categoryId
              ? "bg-black text-white"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          全部
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={buildLink({ categoryId: cat.id })}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              categoryId === cat.id
                ? "bg-black text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {cat.name} ({cat.productCount})
          </Link>
        ))}
      </div>

      {/* 商品网格 */}
      {products.length === 0 ? (
        <div className="py-20 text-center text-gray-500">
          暂无商品
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    暂无图片
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-500">{product.category.name}</p>
                <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
                <p className="text-lg font-bold text-red-600">
                  ¥{product.price.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">
                  库存: {product.stock}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Link
            href={page > 1 ? buildLink({ page: String(page - 1) }) : "#"}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              page > 1
                ? "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
            aria-disabled={page <= 1}
          >
            上一页
          </Link>

          <span className="text-sm text-gray-600">
            第 {page} / {totalPages} 页
          </span>

          <Link
            href={page < totalPages ? buildLink({ page: String(page + 1) }) : "#"}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              page < totalPages
                ? "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
            aria-disabled={page >= totalPages}
          >
            下一页
          </Link>
        </div>
      )}
    </div>
  );
}
