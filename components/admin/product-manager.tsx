"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct, deleteProduct } from "@/lib/actions/product";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image: string | null;
  categoryId: string;
  category: { name: string };
  createdAt: Date;
}

interface Category {
  id: string;
  name: string;
}

interface ProductManagerProps {
  products: Product[];
  categories: Category[];
  totalPages: number;
  currentPage: number;
  q: string;
  canWrite: boolean;
}

export function ProductManager({
  products,
  categories,
  totalPages,
  currentPage,
  q,
  canWrite,
}: ProductManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");

  const buildLink = (overrides: Record<string, string>) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) sp.set(k, v);
      else sp.delete(k);
    });
    return "/admin/products" + (sp.toString() ? `?${sp.toString()}` : "");
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setError("");
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("确定要删除该商品吗？")) return;
    startTransition(async () => {
      await deleteProduct(id);
      router.refresh();
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      price: parseFloat(formData.get("price") as string),
      stock: parseInt(formData.get("stock") as string, 10),
      image: (formData.get("image") as string) || undefined,
      categoryId: formData.get("categoryId") as string,
    };

    const result = editingProduct
      ? await updateProduct(editingProduct.id, data)
      : await createProduct(data);

    if (result.error) {
      setError(result.error);
    } else {
      setModalOpen(false);
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">商品管理</h1>
        {canWrite && (
          <button
            onClick={handleOpenCreate}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            新增商品
          </button>
        )}
      </div>

      {/* 搜索 */}
      <form className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="搜索商品名称..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
        <button
          type="submit"
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          搜索
        </button>
      </form>

      {/* 表格 */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3">商品</th>
              <th className="px-4 py-3">分类</th>
              <th className="px-4 py-3">价格</th>
              <th className="px-4 py-3">库存</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-gray-100">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-gray-400">
                          无图
                        </div>
                      )}
                    </div>
                    <span className="font-medium text-gray-900">{product.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{product.category.name}</td>
                <td className="px-4 py-3 text-gray-500">¥{product.price.toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-500">{product.stock}</td>
                <td className="px-4 py-3">
                  {canWrite && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="text-sm text-gray-600 hover:text-black"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={isPending}
                        className="text-sm text-gray-400 hover:text-red-600"
                      >
                        删除
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Link
            href={currentPage > 1 ? buildLink({ page: String(currentPage - 1) }) : "#"}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              currentPage > 1
                ? "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            上一页
          </Link>
          <span className="text-sm text-gray-600">
            第 {currentPage} / {totalPages} 页
          </span>
          <Link
            href={
              currentPage < totalPages
                ? buildLink({ page: String(currentPage + 1) })
                : "#"
            }
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              currentPage < totalPages
                ? "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            下一页
          </Link>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-gray-900">
              {editingProduct ? "编辑商品" : "新增商品"}
            </h2>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  名称
                </label>
                <input
                  name="name"
                  defaultValue={editingProduct?.name ?? ""}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  描述
                </label>
                <textarea
                  name="description"
                  defaultValue={editingProduct?.description ?? ""}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    价格
                  </label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={editingProduct?.price ?? ""}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    库存
                  </label>
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    defaultValue={editingProduct?.stock ?? ""}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  分类
                </label>
                <select
                  name="categoryId"
                  defaultValue={editingProduct?.categoryId ?? ""}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="">请选择分类</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  图片 URL
                </label>
                <input
                  name="image"
                  type="url"
                  defaultValue={editingProduct?.image ?? ""}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-lg bg-black py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:bg-gray-300"
                >
                  {isPending ? "保存中..." : "保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
