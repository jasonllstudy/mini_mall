import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const [userCount, productCount, orderCount, totalSales] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.aggregate({
      where: { status: "PAID" },
      _sum: { total: true },
    }),
  ]);

  const cards = [
    { label: "用户总数", value: userCount, color: "text-blue-600" },
    { label: "商品总数", value: productCount, color: "text-green-600" },
    { label: "订单总数", value: orderCount, color: "text-orange-600" },
    {
      label: "销售额",
      value: `¥${(totalSales._sum.total ?? 0).toFixed(2)}`,
      color: "text-red-600",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">数据概览</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl bg-white p-6 shadow-sm"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className={`mt-2 text-3xl font-bold ${card.color}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
