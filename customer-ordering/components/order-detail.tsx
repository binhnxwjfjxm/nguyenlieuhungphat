"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  MapPin,
  PackageCheck,
  RotateCcw,
  ShoppingCart,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { announceCartUpdated } from "@/lib/cart-events";
import type { CustomerOrder } from "@/lib/contracts";
import { createCustomerOrderingService } from "@/lib/customer-ordering-service";
import { isOrderCancellableStatus, ORDER_STATUS_META } from "@/lib/order-status";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function OrderDetail({ orderId }: Readonly<{ orderId: string }>) {
  const router = useRouter();
  const service = useMemo(() => createCustomerOrderingService(), []);
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"reorder" | "cancel" | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void service
      .getOrderById(orderId)
      .then((item) => {
        if (!cancelled) setOrder(item);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Không thể tải đơn hàng.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId, service]);

  async function reorder() {
    if (!order || busyAction) return;
    setBusyAction("reorder");
    setActionError(null);
    setActionNotice(null);
    try {
      const result = await service.reorderOrder(order.id);
      announceCartUpdated();
      if (result.skippedLineCount > 0) {
        setActionNotice(
          `Đã thêm ${result.addedLineCount} mặt hàng vào giỏ. ${result.skippedLineCount} mặt hàng hiện không khả dụng và được bỏ qua.`,
        );
        setBusyAction(null);
        return;
      }
      router.push("/cart");
    } catch (reorderError) {
      setActionError(
        reorderError instanceof Error ? reorderError.message : "Không thể đặt lại đơn lúc này.",
      );
      setBusyAction(null);
    }
  }

  async function cancelOrder() {
    if (!order || busyAction) return;
    setBusyAction("cancel");
    setActionError(null);
    setActionNotice(null);
    try {
      const updated = await service.cancelOrder(order.id);
      setOrder(updated);
      setConfirmCancel(false);
    } catch (cancelError) {
      setActionError(cancelError instanceof Error ? cancelError.message : "Không thể hủy đơn lúc này.");
    } finally {
      setBusyAction(null);
    }
  }

  if (!loaded) {
    return (
      <section aria-label="Đang tải chi tiết đơn" className="order-detail-screen is-loading">
        <div className="order-detail-hero-skeleton" />
        <div className="order-detail-card is-skeleton" />
        <div className="order-detail-card is-skeleton" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="orders-state-card is-error">
        <TriangleAlert aria-hidden="true" size={34} />
        <strong>Chưa tải được chi tiết đơn</strong>
        <span>{error}</span>
        <Link className="secondary-link-button" href="/orders">
          Quay lại danh sách
        </Link>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="orders-state-card">
        <PackageCheck aria-hidden="true" size={38} />
        <strong>Không tìm thấy đơn hàng</strong>
        <span>Dữ liệu đơn có thể đã được xóa trên trình duyệt này.</span>
        <Link className="primary-link-button" href="/orders">
          Về danh sách đơn
        </Link>
      </section>
    );
  }

  const status = ORDER_STATUS_META[order.status];
  const cancellable = isOrderCancellableStatus(order.status);

  return (
    <section className="order-detail-screen">
      <Link className="product-back-link" href="/orders">
        <ArrowLeft aria-hidden="true" size={18} />
        Đơn hàng
      </Link>

      <section className="order-detail-hero">
        <div>
          <p className="eyebrow">Mã đơn</p>
          <h1>{order.code}</h1>
          <p>{formatDate(order.submittedAt)}</p>
        </div>
        <span className={`order-status-badge status-${status.tone}`}>{status.label}</span>
      </section>

      <section className="order-detail-card">
        <div className="order-detail-section-title">
          <ShoppingCart aria-hidden="true" size={19} />
          <div>
            <strong>Sản phẩm đã đặt</strong>
            <span>{order.lines.length} mặt hàng · {order.totalQuantity} đơn vị</span>
          </div>
        </div>
        <div className="order-detail-lines">
          {order.lines.map((line) => (
            <article className="order-detail-line" key={line.productId}>
              <div>
                <span>{line.productCode}</span>
                <strong>{line.productName}</strong>
                <small>{line.packaging} · {line.quantity} {line.unit}</small>
                {line.note ? <em>Ghi chú: {line.note}</em> : null}
              </div>
              <b>{line.unitPrice === null ? "Chờ giá" : formatMoney(line.unitPrice * line.quantity)}</b>
            </article>
          ))}
        </div>
        <div className="order-detail-total">
          <span>Tạm tính các dòng có giá</span>
          <strong>{formatMoney(order.pricedSubtotal)}</strong>
        </div>
        {order.hasPendingPrice ? <p className="order-price-note">Tổng chưa gồm các mặt hàng chờ xác nhận giá.</p> : null}
      </section>

      <section className="order-detail-card">
        <div className="order-detail-section-title">
          <MapPin aria-hidden="true" size={19} />
          <div>
            <strong>Nhận hàng</strong>
            <span>{order.address.label}</span>
          </div>
        </div>
        <div className="order-address-copy">
          <strong>{order.address.recipientName} · {order.address.phone}</strong>
          <p>{order.address.addressLine}</p>
          {order.orderNote ? <small>Ghi chú đơn: {order.orderNote}</small> : null}
        </div>
      </section>

      <section className="order-detail-card">
        <div className="order-detail-section-title">
          <CheckCircle2 aria-hidden="true" size={19} />
          <div>
            <strong>Tiến trình đơn hàng</strong>
            <span>Trạng thái chỉ hiển thị theo dữ liệu nguồn.</span>
          </div>
        </div>
        <ol className="order-timeline">
          {order.statusTimeline.map((event, index) => {
            const eventMeta = ORDER_STATUS_META[event.status];
            return (
              <li key={`${event.status}-${event.at}-${index}`}>
                <span className={`timeline-dot status-${eventMeta.tone}`} />
                <div>
                  <strong>{eventMeta.label}</strong>
                  <small>{formatDate(event.at)}</small>
                  {event.note ? <p>{event.note}</p> : null}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {actionError ? <p className="order-action-error">{actionError}</p> : null}
      {actionNotice ? (
        <div className="order-action-notice" role="status">
          <span>{actionNotice}</span>
          <Link href="/cart">Mở giỏ hàng</Link>
        </div>
      ) : null}

      <section className="order-actions-card">
        <button disabled={busyAction !== null} onClick={() => void reorder()} type="button">
          <RotateCcw aria-hidden="true" size={18} />
          {busyAction === "reorder" ? "Đang thêm..." : "Đặt lại đơn này"}
        </button>

        {cancellable ? (
          confirmCancel ? (
            <div className="order-cancel-confirm">
              <p>Hủy đơn này? Trạng thái sẽ chuyển sang “Đã hủy” trên thiết bị này.</p>
              <div>
                <button
                  className="danger-button"
                  disabled={busyAction !== null}
                  onClick={() => void cancelOrder()}
                  type="button"
                >
                  <Ban aria-hidden="true" size={17} />
                  {busyAction === "cancel" ? "Đang hủy..." : "Xác nhận hủy"}
                </button>
                <button
                  className="secondary-action-button"
                  disabled={busyAction !== null}
                  onClick={() => setConfirmCancel(false)}
                  type="button"
                >
                  Giữ đơn
                </button>
              </div>
            </div>
          ) : (
            <button className="cancel-order-button" onClick={() => setConfirmCancel(true)} type="button">
              <Ban aria-hidden="true" size={18} />
              Hủy đơn
            </button>
          )
        ) : null}
      </section>
    </section>
  );
}
