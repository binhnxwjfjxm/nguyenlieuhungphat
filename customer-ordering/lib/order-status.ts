import type { OrderStatus } from "@/lib/contracts";

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; tone: "neutral" | "info" | "progress" | "success" | "danger" }
> = {
  DRAFT: { label: "Bản nháp", tone: "neutral" },
  SUBMITTED: { label: "Đã gửi", tone: "info" },
  RECEIVED: { label: "Đã tiếp nhận", tone: "info" },
  CONFIRMED: { label: "Đã xác nhận", tone: "progress" },
  PROCESSING: { label: "Đang xử lý", tone: "progress" },
  DELIVERING: { label: "Đang giao", tone: "progress" },
  COMPLETED: { label: "Hoàn tất", tone: "success" },
  REJECTED: { label: "Từ chối", tone: "danger" },
  CANCELLED: { label: "Đã hủy", tone: "danger" },
};

export const ORDER_STATUS_FILTERS: Array<{ value: "ALL" | OrderStatus; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "DRAFT", label: "Bản nháp" },
  { value: "SUBMITTED", label: "Đã gửi" },
  { value: "RECEIVED", label: "Tiếp nhận" },
  { value: "CONFIRMED", label: "Xác nhận" },
  { value: "PROCESSING", label: "Xử lý" },
  { value: "DELIVERING", label: "Đang giao" },
  { value: "COMPLETED", label: "Hoàn tất" },
  { value: "REJECTED", label: "Từ chối" },
  { value: "CANCELLED", label: "Đã hủy" },
];

export function isOrderCancellableStatus(status: OrderStatus): boolean {
  return status === "SUBMITTED" || status === "RECEIVED";
}
