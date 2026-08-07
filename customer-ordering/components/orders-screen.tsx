"use client";

import Link from "next/link";
import { ChevronRight, ClipboardList, Search, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CustomerOrder, OrderStatus } from "@/lib/contracts";
import { createCustomerOrderingService } from "@/lib/customer-ordering-service";
import { ORDER_STATUS_FILTERS, ORDER_STATUS_META } from "@/lib/order-status";

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

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("vi")
    .trim();
}

export function OrdersScreen() {
  const service = useMemo(() => createCustomerOrderingService(), []);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatus>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrders(await service.listOrders());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);
    return orders.filter((order) => {
      if (statusFilter !== "ALL" && order.status !== statusFilter) return false;
      if (!normalizedQuery) return true;
      return normalizeSearch(
        [
          order.code,
          order.address.label,
          order.address.recipientName,
          ...order.lines.flatMap((line) => [line.productCode, line.productName]),
        ].join(" "),
      ).includes(normalizedQuery);
    });
  }, [orders, query, statusFilter]);

  if (loading) {
    return (
      <section aria-label="Đang tải danh sách đơn" className="orders-screen">
        <div className="orders-heading-skeleton" />
        <div className="orders-filter-skeleton" />
        <div className="order-card is-skeleton" />
        <div className="order-card is-skeleton" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="orders-state-card is-error">
        <TriangleAlert aria-hidden="true" size={34} />
        <strong>Chưa tải được đơn hàng</strong>
        <span>{error}</span>
        <button className="primary-button orders-retry-button" onClick={() => void loadOrders()} type="button">
          Thử lại
        </button>
      </section>
    );
  }

  if (orders.length === 0) {
    return (
      <section className="orders-state-card">
        <ClipboardList aria-hidden="true" size={38} />
        <strong>Chưa có đơn hàng</strong>
        <span>Đơn sau khi checkout sẽ xuất hiện tại đây để theo dõi.</span>
        <Link className="primary-link-button" href="/quick-order">
          Tạo đơn đầu tiên
        </Link>
      </section>
    );
  }

  return (
    <section className="orders-screen">
      <div className="orders-intro">
        <div>
          <p className="eyebrow">Lịch sử đặt hàng</p>
          <h1>Đơn hàng của tôi</h1>
          <p>Theo dõi trạng thái, xem lại chi tiết và đặt lại đơn cũ.</p>
        </div>
        <span className="orders-count">{orders.length} đơn</span>
      </div>

      <label className="orders-search">
        <Search aria-hidden="true" size={19} />
        <span className="sr-only">Tìm đơn hàng</span>
        <input
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm mã đơn hoặc sản phẩm"
          type="search"
          value={query}
        />
      </label>

      <div aria-label="Lọc theo trạng thái" className="orders-status-filters" role="group">
        {ORDER_STATUS_FILTERS.map((filter) => (
          <button
            className={statusFilter === filter.value ? "is-active" : ""}
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            type="button"
          >
            {filter.label}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <section className="orders-state-card is-compact">
          <Search aria-hidden="true" size={30} />
          <strong>Không có đơn phù hợp</strong>
          <span>Đổi từ khóa hoặc trạng thái để xem các đơn khác.</span>
        </section>
      ) : (
        <div className="orders-list">
          {filteredOrders.map((order) => {
            const status = ORDER_STATUS_META[order.status];
            return (
              <article className="order-card" key={order.id}>
                <div className="order-card-top">
                  <div className="order-code-block">
                    <span>Mã đơn</span>
                    <strong>{order.code}</strong>
                    <small>{formatDate(order.submittedAt)}</small>
                  </div>
                  <span className={`order-status-badge status-${status.tone}`}>{status.label}</span>
                </div>

                <div className="order-card-summary">
                  <span>{order.lines.length} mặt hàng</span>
                  <span>{order.totalQuantity} đơn vị</span>
                  <strong>{formatMoney(order.pricedSubtotal)}</strong>
                </div>
                {order.hasPendingPrice ? (
                  <p className="order-price-note">Có mặt hàng đang chờ Hưng Phát xác nhận giá.</p>
                ) : null}

                <Link className="order-detail-link" href={`/orders/${order.id}`}>
                  Xem chi tiết
                  <ChevronRight aria-hidden="true" size={18} />
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
