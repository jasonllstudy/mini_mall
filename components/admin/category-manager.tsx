"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createCategory, updateCategory, deleteCategory } from "@/lib/actions/category";

interface Category {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
}

interface CategoryManagerProps {
  categories: Category[];
  totalPages: number;
  currentPage: number;
  q: string;
  canWrite: boolean;
}

export function CategoryManager({
  categories,
  totalPages,
  currentPage,
  q,
  canWrite,
}: CategoryManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [error, setError] = useState("");

  const buildLink = (overrides: Record<string, string>) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) sp.set(k, v);
      else sp.delete(k);
    });
    return "/admin/categories" + (sp.toString() ? `?${sp.toString()}` : "");
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setError("");
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("确定要删除该分类吗？")) return;
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: (formData.get("name") as string).trim(),
      description: (formData.get("description") as string)?.trim() || undefined,
    };

    if (!data.name || data.name.length < 2) {
      setError("分类名称至少需要2个字符");
      return;
    }

    const result = editingCategory
      ? await updateCategory(editingCategory.id, data)
      : await createCategory(data);

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
        <h1 className="text-2xl font-bold text-gray-900">分类管理</h1>
        {canWrite && (
          <button
            onClick={handleOpenCreate}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            新增分类
          </button>
        )}
      </div>

      {/* 搜索 */}
      <form className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="搜索分类名称..."
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
              <th className="px-4 py-3">分类名称</th>
              <th className="px-4 py-3">描述</th>
              <th className="px-4 py-3">创建时间</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {category.name}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {category.description || "-"}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(category.createdAt).toLocaleDateString("zh-CN")}
                </td>
                <td className="px-4 py-3">
                  {canWrite && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(category)}
                        className="text-sm text-gray-600 hover:text-black"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
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
              {editingCategory ? "编辑分类" : "新增分类"}
            </h2>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  分类名称
                </label>
                <input
                  name="name"
                  defaultValue={editingCategory?.name ?? ""}
                  required
                  minLength={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  描述
                </label>
                <textarea
                  name="description"
                  defaultValue={editingCategory?.description ?? ""}
                  rows={3}
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
