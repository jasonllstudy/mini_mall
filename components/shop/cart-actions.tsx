"use client";

import { useState, useTransition } from "react";
import { updateCartItem, removeCartItem } from "@/lib/actions/cart";

interface CartActionsProps {
  cartItemId: string;
  quantity: number;
  stock: number;
}

export function CartActions({
  cartItemId,
  quantity,
  stock,
}: CartActionsProps) {
  const [currentQty, setCurrentQty] = useState(quantity);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleUpdate = (newQty: number) => {
    if (newQty < 1 || newQty > stock) return;
    setError("");
    const prevQty = currentQty; // 保存前一个状态用于回滚
    setCurrentQty(newQty);
    startTransition(async () => {
      const result = await updateCartItem(cartItemId, newQty);
      if (result.error) {
        setError(result.error);
        setCurrentQty(prevQty); // 回滚到前一个状态
      }
    });
  };

  const handleRemove = () => {
    if (!confirm("确定要删除该商品吗？")) return;
    startTransition(async () => {
      const result = await removeCartItem(cartItemId);
      if (result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center rounded-lg border border-gray-200">
        <button
          onClick={() => handleUpdate(currentQty - 1)}
          disabled={currentQty <= 1 || isPending}
          className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 disabled:text-gray-300"
        >
          -
        </button>
        <span className="min-w-[2rem] px-2 py-1 text-center text-sm">
          {currentQty}
        </span>
        <button
          onClick={() => handleUpdate(currentQty + 1)}
          disabled={currentQty >= stock || isPending}
          className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 disabled:text-gray-300"
        >
          +
        </button>
      </div>
      <button
        onClick={handleRemove}
        disabled={isPending}
        className="text-sm text-gray-400 hover:text-red-600"
      >
        删除
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
