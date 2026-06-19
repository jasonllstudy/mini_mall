"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/actions/cart";

interface AddToCartButtonProps {
  userId?: string;
  productId: string;
  stock: number;
}

export function AddToCartButton({
  userId,
  productId,
  stock,
}: AddToCartButtonProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const handleAdd = () => {
    if (!userId) {
      router.push("/login?callbackUrl=/products/" + productId);
      return;
    }

    setMessage("");
    startTransition(async () => {
      const result = await addToCart(userId, productId, quantity);
      if (result.error) {
        setMessage(result.error);
      } else {
        setMessage("已加入购物车");
        setQuantity(1);
      }
    });
  };

  if (stock <= 0) {
    return (
      <button
        disabled
        className="w-full rounded-xl bg-gray-300 py-3.5 text-base font-medium text-white cursor-not-allowed"
      >
        暂时缺货
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700">数量：</span>
        <div className="flex items-center rounded-lg border border-gray-200">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            -
          </button>
          <span className="min-w-[3rem] px-2 py-2 text-center text-sm">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            +
          </button>
        </div>
        <span className="text-xs text-gray-400">库存 {stock} 件</span>
      </div>

      <button
        onClick={handleAdd}
        disabled={isPending}
        className="w-full rounded-xl bg-black py-3.5 text-base font-medium text-white transition-colors hover:bg-gray-800 disabled:bg-gray-400"
      >
        {isPending ? "处理中..." : userId ? "加入购物车" : "登录后购买"}
      </button>

      {message && (
        <p
          className={`text-center text-sm ${
            message.includes("已加入") ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
