"use client";

import Link from "next/link";
import { CheckCircle2, ClipboardList, Home, MapPin, PackageCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createCustomerOrderingService } from "@/lib/customer-ordering-service";
import type { CustomerOrder } from "@/lib/contracts";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);
}

export function OrderSuccess({ orderId }: Readonly<{ orderId: string }>) {
  const service = useMemo(() => createCustomerOrderingService(), []);
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void service.getOrderById(orderId).then((item) => {
      if (!cancelled) { setOrder(item); setLoaded(true); }
    });
    return () => { cancelled = true; };
  }, [orderId, service]);

  if (!loaded) return <section aria-label="Đang tải kết quả đặt hàng" className="order-success-screen is-loading"><div className="success-icon-shell" /><div className="checkout-card is-skeleton" /></section>;

  if (!order) return <section className="cart-empty-screen"><span className="cart-empty-icon"><PackageCheck aria-hidden="true" size={34} /></span><h1>Không tìm thấy đơn vừa gửi</h1><p>Thông tin đơn hiện không còn khả dụng. Bạn có thể quay lại trang chủ hoặc xem danh sách đơn hàng.</p><Link className="primary-link-button" href="/">Về trang chủ</Link></section>;

  return <section className="order-success-screen">
    <span className="success-icon-shell"><CheckCircle2 aria-hidden="true" size={44} /></span>
    <p className="eyebrow">Đã gửi thành công</p>
    <h1>Hưng Phát đã nhận yêu cầu</h1>
    <p className="success-lead">Yêu cầu đặt hàng của bạn đã được ghi nhận. Hưng Phát sẽ cập nhật trạng thái tiếp nhận và xác nhận các mặt hàng cần kiểm tra thêm.</p>

    <section className="success-order-card"><div className="success-order-code"><span>Mã đơn</span><strong>{order.code}</strong><small>{formatDate(order.submittedAt)}</small></div><dl><div><dt>Số dòng</dt><dd>{order.lines.length}</dd></div><div><dt>Tổng số lượng</dt><dd>{order.totalQuantity}</dd></div><div><dt>Tạm tính có giá</dt><dd>{formatMoney(order.pricedSubtotal)}</dd></div></dl>{order.hasPendingPrice ? <p>Có sản phẩm chờ Hưng Phát xác nhận giá.</p> : null}</section>

    <section className="success-address-card"><MapPin aria-hidden="true" size={20} /><div><strong>{order.address.label}</strong><span>{order.address.recipientName} · {order.address.phone}</span><p>{order.address.addressLine}</p></div></section>

    <div className="success-actions"><Link className="primary-link-button" href="/"><Home aria-hidden="true" size={18} />Về trang chủ</Link><Link className="secondary-link-button" href="/orders"><ClipboardList aria-hidden="true" size={18} />Xem đơn hàng</Link></div>
  </section>;
}
