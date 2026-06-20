import { setUserAsAdmin, changeUserPassword } from "@/lib/actions/admin";

export default async function SetupAdminPage() {
  // 设置 15656119650@qq.com 为管理员
  const result1 = await setUserAsAdmin("15656119650@qq.com");

  // 修改 admin@example.com 的密码
  const result2 = await changeUserPassword("admin@example.com", "Aa123456");

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-xl bg-white p-8 shadow-sm max-w-md">
        <h1 className="text-xl font-bold text-gray-900 mb-4">管理员设置</h1>

        <div className="space-y-3">
          {result1.error ? (
            <div className="text-red-600">❌ {result1.error}</div>
          ) : (
            <div className="text-green-600">✅ {result1.message}</div>
          )}

          {result2.error ? (
            <div className="text-red-600">❌ {result2.error}</div>
          ) : (
            <div className="text-green-600">✅ {result2.message}</div>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-500 space-y-1">
          <p>admin@example.com 密码: Aa123456</p>
          <p>15656119650@qq.com 密码: admin123456</p>
        </div>

        <a
          href="/admin/dashboard"
          className="mt-4 inline-block rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          进入后台
        </a>
      </div>
    </div>
  );
}
