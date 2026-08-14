import type { OrderStatus } from "@/lib/contracts";

export type OrderStatusTone =
  | "neutral"
  | "submitted"
  | "received"
  | "confirmed"
  | "processing"
  | "delivering"
  | "success"
  | "rejected"
  | "cancelled";

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; tone: OrderStatusTone }
> = {
  DRAFT: { label: "Bản nháp", tone: "neutral" },
  SUBMITTED: { label: "Đã gửi", tone: "submitted" },
  RECEIVED: { label: "Đã tiếp nhận", tone: "received" },
  CONFIRMED: { label: "Đã xác nhận", tone: "confirmed" },
  PROCESSING: { label: "Đang xử lý", tone: "processing" },
  DELIVERING: { label: "Đang giao", tone: "delivering" },
  COMPLETED: { label: "Hoàn tất", tone: "success" },
  REJECTED: { label: "Từ chối", tone: "rejected" },
  CANCELLED: { label: "Đã hủy", tone: "cancelled" },
};

export const ORDER_STATUS_FILTERS: Array<{ value: "ALL" | OrderStatus; label: string; tone: "all" | OrderStatusTone }> = [
  { value: "ALL", label: "Tất cả", tone: "all" },
  { value: "DRAFT", label: "Bản nháp", tone: "neutral" },
  { value: "SUBMITTED", label: "Đã gửi", tone: "submitted" },
  { value: "RECEIVED", label: "Tiếp nhận", tone: "received" },
  { value: "CONFIRMED", label: "Xác nhận", tone: "confirmed" },
  { value: "PROCESSING", label: "Xử lý", tone: "processing" },
  { value: "DELIVERING", label: "Đang giao", tone: "delivering" },
  { value: "COMPLETED", label: "Hoàn tất", tone: "success" },
  { value: "REJECTED", label: "Từ chối", tone: "rejected" },
  { value: "CANCELLED", label: "Đã hủy", tone: "cancelled" },
];

export function isOrderCancellableStatus(status: OrderStatus): boolean {
  return status === "SUBMITTED" || status === "RECEIVED";
}
