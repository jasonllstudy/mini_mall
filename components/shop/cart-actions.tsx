"use client";

import { useState, useTransition } from "react";
import { updateCartItem, removeCartItem } from "@/lib/actions/cart";

interface CartActionsProps {
  cartItemId: string;
  userId: string;
  quantity: number;
  stock: number;
}

export function CartActions({
  cartItemId,
  userId,
  quantity,
  stock,
}: CartActionsProps) {
  const [currentQty, setCurrentQty] = useState(quantity);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleUpdate = (newQty: number) => {
    if (newQty < 1 || newQty > stock) return;
    setError("");
    setCurrentQty(newQty);
    startTransition(async () => {
      const result = await updateCartItem(userId, cartItemId, newQty);
      if (result.error) {
        setError(result.error);
        setCurrentQty(quantity);
      }
    });
  };

  const handleRemove = () => {
    if (!confirm("确定要删除该商品吗？")) return;
    startTransition(async () => {
      await removeCartItem(userId, cartItemId);
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
