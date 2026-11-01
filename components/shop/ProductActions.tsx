"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/lib/types";

export default function ProductActions({ product }: { product: Product }) {
  const { addItem } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const outOfStock = product.stock <= 0;

  const handleAdd = () => {
    addItem(product, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-sm border border-line">
        <button
          type="button"
          className="px-3 py-2 text-ink/60 hover:text-ink disabled:opacity-30"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          disabled={outOfStock}
        >
          −
        </button>
        <span className="w-8 text-center text-sm">{quantity}</span>
        <button
          type="button"
          className="px-3 py-2 text-ink/60 hover:text-ink disabled:opacity-30"
          onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
          disabled={outOfStock}
        >
          +
        </button>
      </div>

      <button type="button" onClick={handleAdd} disabled={outOfStock} className="btn-primary">
        {outOfStock ? "Out of stock" : justAdded ? "Added ✓" : "Add to cart"}
      </button>

      <button type="button" onClick={() => router.push("/cart")} className="btn-secondary">
        View cart
      </button>
    </div>
  );
}
