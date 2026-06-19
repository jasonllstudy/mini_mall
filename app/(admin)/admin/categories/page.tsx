import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getCategories } from "@/lib/actions/category";
import { CategoryManager } from "@/components/admin/category-manager";

interface CategoriesAdminPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
  }>;
}

export default async function CategoriesAdminPage({
  searchParams,
}: CategoriesAdminPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin/categories");
  }

  const permissions = session.user.permissions ?? [];
  if (!hasPermission(permissions, "category:read")) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-gray-500">你没有权限访问此页面</p>
        <Link href="/" className="mt-4 text-sm text-black hover:underline">
          返回首页
        </Link>
      </div>
    );
  }

  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const q = params.q || "";

  const { categories, totalPages } = await getCategories({
    page,
    limit: 10,
    q: q || undefined,
  });

  const canWrite = hasPermission(permissions, "category:write");

  return (
    <CategoryManager
      categories={categories}
      totalPages={totalPages}
      currentPage={page}
      q={q}
      canWrite={canWrite}
    />
  );
}
