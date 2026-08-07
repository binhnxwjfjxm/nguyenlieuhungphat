import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("UI-4 extends order contracts without bypassing the adapter boundary", async () => {
  const [contracts, service, adapter] = await Promise.all([
    read("lib/contracts.ts"),
    read("lib/customer-ordering-service.ts"),
    read("lib/adapters/mock/mock-customer-ordering-adapter.ts"),
  ]);

  for (const token of [
    "OrderStatus",
    "statusTimeline",
    "listOrders",
    "cancelOrder",
    "reorderOrder",
    "ReorderOrderResult",
  ]) {
    assert.match(contracts, new RegExp(token));
    assert.match(`${service}\n${adapter}`, new RegExp(token));
  }

  for (const status of [
    "DRAFT",
    "SUBMITTED",
    "RECEIVED",
    "CONFIRMED",
    "PROCESSING",
    "DELIVERING",
    "COMPLETED",
    "REJECTED",
    "CANCELLED",
  ]) {
    assert.match(contracts, new RegExp(status));
  }

  assert.match(adapter, /normalizeOrder/);
  assert.match(adapter, /normalizedTimeline\.length > 0/);
  assert.match(adapter, /status: "SUBMITTED"/);
  assert.match(adapter, /current\.status !== "SUBMITTED" && current\.status !== "RECEIVED"/);
  assert.match(adapter, /await this\.saveCart\(cart\)/);
  assert.doesNotMatch(adapter, /fetch\(|axios|DATABASE_URL|SUPABASE/i);
});

test("orders list supports search, status filters and real detail navigation", async () => {
  const [page, screen] = await Promise.all([
    read("app/orders/page.tsx"),
    read("components/orders-screen.tsx"),
  ]);

  assert.match(page, /<OrdersScreen/);
  assert.doesNotMatch(page, /hoàn thiện ở UI-4/i);
  assert.match(screen, /statusFilter/);
  assert.match(screen, /ORDER_STATUS_FILTERS/);
  assert.match(screen, /service\.listOrders/);
  assert.match(screen, /Tìm mã đơn hoặc sản phẩm/);
  assert.match(screen, /href=\{`\/orders\/\$\{order\.id\}`\}/);
  assert.match(screen, /Không có đơn phù hợp/);
});

test("order detail renders timeline, reorder and guarded cancellation", async () => {
  const [page, detail, statusMeta] = await Promise.all([
    read("app/orders/[orderId]/page.tsx"),
    read("components/order-detail.tsx"),
    read("lib/order-status.ts"),
  ]);

  assert.match(page, /<OrderDetail orderId=\{orderId\}/);
  assert.match(detail, /order\.statusTimeline\.map/);
  assert.match(detail, /service\.reorderOrder/);
  assert.match(detail, /skippedLineCount/);
  assert.match(detail, /order-action-notice/);
  assert.match(detail, /announceCartUpdated/);
  assert.match(detail, /service\.cancelOrder/);
  assert.match(detail, /isOrderCancellableStatus/);
  assert.match(detail, /Xác nhận hủy/);
  assert.match(statusMeta, /status === "SUBMITTED" \|\| status === "RECEIVED"/);
});

test("UI-4 keeps its styles isolated and mobile-safe", async () => {
  const [layout, css] = await Promise.all([read("app/layout.tsx"), read("app/ui4.css")]);

  assert.match(layout, /import "\.\/ui4\.css"/);
  assert.match(css, /\.orders-status-filters/);
  assert.match(css, /\.order-timeline/);
  assert.match(css, /\.order-actions-card/);
  assert.match(css, /@media \(max-width:\s*410px\)/);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(css, /position:\s*fixed/);
});
