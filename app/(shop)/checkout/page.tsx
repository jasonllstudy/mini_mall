import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCart } from "@/lib/actions/cart";
import { createOrder } from "@/lib/actions/order";
import { getDiscountRate, getMembershipLabel } from "@/lib/membership";

interface CheckoutPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/checkout");
  }

  const cartItems = await getCart();

  if (cartItems.length === 0) {
    redirect("/cart");
  }

  const params = await searchParams;
  const error = params.error;

  const originalTotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const discountRate = getDiscountRate(session.user.membershipLevel ?? "NONE");
  const total = originalTotal * discountRate;

  const handleCreateOrder = async (formData: FormData) => {
    "use server";
    const address = (formData.get("address") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim();

    // 表单验证
    if (!address || address.length < 5) {
      redirect("/checkout?error=" + encodeURIComponent("收货地址至少需要5个字符"));
    }

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      redirect("/checkout?error=" + encodeURIComponent("请输入有效的11位手机号码"));
    }

    const result = await createOrder({ address, phone });
    if (result.error) {
      redirect("/checkout?error=" + encodeURIComponent(result.error));
    }
    if (result.success) {
      redirect(`/orders/${result.orderId}`);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">确认订单</h1>

      {/* 错误提示 */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      {/* 商品摘要 */}
      <div className="space-y-3">
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm"
          >
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
              {item.product.image ? (
                <Image
                  src={item.product.image}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-gray-400">
                  暂无图片
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {item.product.name}
              </p>
              <p className="text-xs text-gray-500">
                ¥{item.product.price.toFixed(2)} × {item.quantity}
              </p>
            </div>
            <p className="text-sm font-bold text-red-600">
              ¥{(item.product.price * item.quantity).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      {/* 收货信息表单 */}
      <form action={handleCreateOrder} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            收货地址
          </label>
          <input
            type="text"
            name="address"
            required
            placeholder="请输入详细收货地址"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            联系电话
          </label>
          <input
            type="tel"
            name="phone"
            required
            placeholder="请输入手机号码"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>

        {/* 金额汇总 */}
        <div className="space-y-2 border-t pt-4">
          <div className="flex justify-between text-sm text-gray-600">
            <span>商品原价</span>
            <span>¥{originalTotal.toFixed(2)}</span>
          </div>
          {discountRate < 1 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>会员折扣（{getMembershipLabel(session.user.membershipLevel ?? "NONE")}）</span>
              <span>-{((1 - discountRate) * 100).toFixed(0)}%</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold text-red-600">
            <span>实付金额</span>
            <span>¥{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href="/cart"
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            返回购物车
          </Link>
          <button
            type="submit"
            className="flex-1 rounded-xl bg-black py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            提交订单
          </button>
        </div>
      </form>
    </div>
  );
}
