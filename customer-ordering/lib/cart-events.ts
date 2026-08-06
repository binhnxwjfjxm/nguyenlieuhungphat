export const CART_UPDATED_EVENT = "hp-customer-ordering:cart-updated";

export function announceCartUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
  }
}
