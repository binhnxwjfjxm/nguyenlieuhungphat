"use client";

import { ShoppingBag } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CART_UPDATED_EVENT } from "@/lib/cart-events";
import { createCustomerOrderingService } from "@/lib/customer-ordering-service";

export function CartBadge() {
  const service = useMemo(() => createCustomerOrderingService(), []);
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    void service.getCart().then((cart) => {
      setCount(cart.lines.reduce((total, line) => total + line.quantity, 0));
    });
  }, [service]);

  useEffect(() => {
    refresh();
    window.addEventListener(CART_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  return (
    <span
      aria-label={`Giỏ hàng hiện có ${count} sản phẩm`}
      className="header-cart-status"
      role="status"
      title="Số lượng sản phẩm đã chọn"
    >
      <ShoppingBag aria-hidden="true" size={20} strokeWidth={1.8} />
      {count > 0 ? <span className="header-cart-badge">{count > 99 ? "99+" : count}</span> : null}
    </span>
  );
}
