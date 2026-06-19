import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCart, clearCart } from "@/lib/actions/cart";
import { CartActions } from "@/components/shop/cart-actions";

export default async function CartPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/cart");
  }

  const cartItems = await getCart();

  const total = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">购物车</h1>

      {cartItems.length === 0 ? (
        <div className="rounded-xl bg-white py-20 text-center shadow-sm">
          <p className="text-gray-500">购物车是空的</p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-medium text-black hover:underline"
          >
            去逛逛
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 rounded-xl bg-white p-4 shadow-sm"
              >
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
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

                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link
                      href={`/products/${item.product.id}`}
                      className="text-base font-semibold text-gray-900 hover:underline"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-gray-500">
                      ¥{item.product.price.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <CartActions
                      cartItemId={item.id}
                      quantity={item.quantity}
                      stock={item.product.stock}
                    />
                    <p className="text-lg font-bold text-red-600">
                      ¥{(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <form
                action={async () => {
                  "use server";
                  await clearCart();
                }}
              >
                <button
                  type="submit"
                  className="text-sm text-gray-500 hover:text-red-600"
                >
                  清空购物车
                </button>
              </form>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  共 {cartItems.reduce((s, i) => s + i.quantity, 0)} 件商品
                </p>
                <p className="text-2xl font-bold text-red-600">
                  合计：¥{total.toFixed(2)}
                </p>
              </div>
            </div>
            <Link
              href="/checkout"
              className="mt-4 block w-full rounded-xl bg-black py-3 text-center text-base font-medium text-white hover:bg-gray-800"
            >
              去结算
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
