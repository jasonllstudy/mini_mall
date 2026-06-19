import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getProductById } from "@/lib/actions/product";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* 面包屑 */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-900">
          首页
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        {/* 商品图片 */}
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              暂无图片
            </div>
          )}
        </div>

        {/* 商品信息 */}
        <div className="flex flex-col justify-center space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              分类：
              <span className="font-medium text-gray-700">
                {product.category.name}
              </span>
            </p>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {product.name}
            </h1>
          </div>

          <p className="text-3xl font-bold text-red-600">
            ¥{product.price.toFixed(2)}
          </p>

          <p className="text-gray-600 leading-relaxed">
            {product.description || "暂无描述"}
          </p>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>库存：{product.stock} 件</span>
            <span>•</span>
            <span>
              上架时间：{new Date(product.createdAt).toLocaleDateString("zh-CN")}
            </span>
          </div>

          {/* 加入购物车按钮（后续对接 Server Action） */}
          <button
            disabled={product.stock <= 0}
            className="w-full rounded-xl bg-black py-3.5 text-base font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {product.stock > 0 ? "加入购物车" : "暂时缺货"}
          </button>
        </div>
      </div>
    </div>
  );
}
