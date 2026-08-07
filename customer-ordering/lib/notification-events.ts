export const CUSTOMER_NOTIFICATIONS_CHANGED_EVENT = "hp-customer-notifications-changed";

export function dispatchCustomerNotificationsChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CUSTOMER_NOTIFICATIONS_CHANGED_EVENT));
}
