"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, LoaderCircle, MapPin, PackageCheck, ShoppingBasket } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { announceCartUpdated } from "@/lib/cart-events";
import { createCustomerOrderingService } from "@/lib/customer-ordering-service";
import type { Cart, CheckoutDraft, DeliveryAddress, Product } from "@/lib/contracts";

function formatMoney(amount: number): string { return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount); }
function newSubmissionKey(): string { return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `customer-submit-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function isRetryable(reason: unknown): boolean { return typeof reason === "object" && reason !== null && "retryable" in reason && (reason as { retryable?: boolean }).retryable === true; }

export function CheckoutScreen() {
  const service = useMemo(() => createCustomerOrderingService(), []);
  const router = useRouter();
  const submissionKeyRef = useRef<string | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [orderNote, setOrderNote] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void Promise.all([service.getCart(), service.listProducts(), service.listDeliveryAddresses(), service.getCheckoutDraft()])
      .then(([nextCart, nextProducts, nextAddresses, draft]) => {
        if (!cancelled) {
          setCart(nextCart); setProducts(nextProducts); setAddresses(nextAddresses);
          setAddressId(draft.addressId ?? nextAddresses.find((address) => address.isDefault)?.id ?? nextAddresses[0]?.id ?? null);
          setOrderNote(draft.orderNote); setLoaded(true);
        }
      }).catch(() => { if (!cancelled) { setError("Không tải được thông tin xác nhận đơn."); setLoaded(true); } });
    return () => { cancelled = true; };
  }, [service]);

  const productMap = useMemo(() => new Map(products.map((product) => [product.sku, product])), [products]);
  const lines = cart?.lines.map((line) => ({ line, product: productMap.get(line.sku) })) ?? [];
  const totalQuantity = lines.reduce((total, item) => total + item.line.quantity, 0);
  const pricedSubtotal = lines.reduce((total, item) => { const amount = item.product?.price.status === "available" ? item.product.price.amount : null; return total + (amount == null ? 0 : amount * item.line.quantity); }, 0);
  const hasPendingPrice = lines.some((item) => item.product?.price.status !== "available" || item.product.price.amount === null);
  const hasDeliveryAddress = addresses.length > 0;

  async function saveDraft(nextAddressId: string | null, nextNote: string) { const draft: CheckoutDraft = { addressId: nextAddressId, orderNote: nextNote, updatedAt: new Date().toISOString() }; await service.saveCheckoutDraft(draft); }
  async function submit() {
    if (submitting || !cart || cart.lines.length === 0 || !addressId) return;
    setSubmitting(true); setError(""); submissionKeyRef.current ??= newSubmissionKey();
    try { const order = await service.submitOrder({ addressId, orderNote, submissionKey: submissionKeyRef.current }); announceCartUpdated(); router.push(`/order-success/${order.id}`); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Không gửi được đơn hàng."); if (!isRetryable(reason)) submissionKeyRef.current = null; setSubmitting(false); }
  }

  if (!loaded) return <section aria-label="Đang tải xác nhận đơn" className="checkout-screen"><div className="checkout-card is-skeleton" /><div className="checkout-card is-skeleton" /></section>;
  if (error && !cart) return <section className="catalog-state-card cart-state-card is-error" role="alert"><PackageCheck aria-hidden="true" size={30} /><strong>Chưa tải được thông tin xác nhận đơn</strong><span>{error}</span></section>;
  if (!cart || cart.lines.length === 0) return <section className="cart-empty-screen"><span className="cart-empty-icon"><ShoppingBasket aria-hidden="true" size={34} /></span><p className="eyebrow">Xác nhận đơn</p><h1>Giỏ hàng đang trống</h1><p>Hãy thêm ít nhất một sản phẩm trước khi gửi đơn.</p><Link className="primary-link-button" href="/quick-order">Đặt hàng nhanh</Link></section>;

  return <section className="checkout-screen">
    <Link className="product-back-link" href="/cart"><ArrowLeft aria-hidden="true" size={17} />Quay lại giỏ hàng</Link>
    <div className="checkout-heading"><p className="eyebrow">Bước cuối</p><h1>Xác nhận đơn hàng</h1><p>Kiểm tra địa chỉ, sản phẩm và số lượng trước khi gửi.</p></div>
    <section className="checkout-card"><div className="checkout-card-title"><MapPin aria-hidden="true" size={20} /><div><strong>Địa chỉ nhận hàng</strong><span>{hasDeliveryAddress ? "Chọn một địa chỉ đã lưu" : "Cần có địa chỉ trước khi gửi đơn"}</span></div></div>{hasDeliveryAddress ? <div className="checkout-address-list">{addresses.map((address) => <label className={`checkout-address ${addressId === address.id ? "is-selected" : ""}`} key={address.id}><input checked={addressId === address.id} name="delivery-address" onChange={() => { setAddressId(address.id); void saveDraft(address.id, orderNote); }} type="radio" value={address.id} /><span className="checkout-address-check"><CheckCircle2 aria-hidden="true" size={19} /></span><span><strong>{address.label}{address.isDefault ? <small>Mặc định</small> : null}</strong><b>{address.recipientName} · {address.phone}</b><em>{address.addressLine}</em></span></label>)}</div> : <div className="checkout-no-address" role="status"><strong>Chưa có địa chỉ nhận hàng</strong><p>Vui lòng cập nhật thông tin điểm bán và địa chỉ nhận hàng trước khi gửi đơn.</p><Link className="secondary-link-button" href="/account">Cập nhật thông tin</Link></div>}</section>
    <section className="checkout-card"><div className="checkout-card-title"><PackageCheck aria-hidden="true" size={20} /><div><strong>Tóm tắt sản phẩm</strong><span>{lines.length} dòng · {totalQuantity} sản phẩm</span></div></div><div className="checkout-line-list">{lines.map(({ line, product }) => <div className="checkout-line" key={line.sku}><span><strong>{product?.name ?? line.sku}</strong><small>{line.sku} · {line.quantity} {product?.unit ?? "đơn vị"}{line.note ? ` · ${line.note}` : ""}</small></span><b>{product?.price.status === "available" && product.price.amount !== null ? formatMoney(product.price.amount * line.quantity) : "Chờ giá"}</b></div>)}</div></section>
    <label className="checkout-card checkout-note-card"><span>Ghi chú toàn đơn</span><textarea maxLength={500} onBlur={() => void saveDraft(addressId, orderNote)} onChange={(event) => setOrderNote(event.target.value)} placeholder="Ví dụ: giao buổi sáng, gọi trước 30 phút..." rows={4} value={orderNote} /><small>{orderNote.length}/500</small></label>
    <section className="checkout-total-card"><div><span>Tạm tính các dòng có giá</span><strong>{formatMoney(pricedSubtotal)}</strong></div><p>{hasPendingPrice ? "Đơn có sản phẩm chưa có giá. Hưng Phát sẽ xác nhận giá chính thức khi tiếp nhận." : "Giá được áp dụng theo đúng sản phẩm và quy cách đã chọn."}</p>{!addressId ? <p className="checkout-address-warning" role="status">Chưa thể gửi đơn vì chưa có địa chỉ nhận hàng.</p> : null}{error ? <div className="checkout-error" role="alert">{error}</div> : null}<button disabled={submitting || !addressId} onClick={() => void submit()} type="button">{submitting ? <LoaderCircle aria-hidden="true" className="is-spinning" size={20} /> : <PackageCheck aria-hidden="true" size={20} />}{submitting ? "Đang gửi đơn..." : "Gửi đơn hàng"}</button></section>
  </section>;
}
