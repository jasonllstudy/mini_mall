import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getProducts } from "@/lib/actions/product";
import { getCategories } from "@/lib/actions/category";
import { ProductManager } from "@/components/admin/product-manager";

interface ProductsAdminPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
  }>;
}

export default async function ProductsAdminPage({
  searchParams,
}: ProductsAdminPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin/products");
  }

  const permissions = session.user.permissions ?? [];
  if (!hasPermission(permissions, "product:read")) {
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

  const [{ products, totalPages }, { categories }] = await Promise.all([
    getProducts({ page, limit: 10, q: q || undefined }),
    getCategories(),
  ]);

  const canWrite = hasPermission(permissions, "product:write");

  return (
    <ProductManager
      products={products}
      categories={categories}
      totalPages={totalPages}
      currentPage={page}
      q={q}
      canWrite={canWrite}
    />
  );
}
