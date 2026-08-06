import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("UI-3 extends the existing service and mock adapter boundary", async () => {
  const [contracts, service, adapter] = await Promise.all([
    read("lib/contracts.ts"),
    read("lib/customer-ordering-service.ts"),
    read("lib/adapters/mock/mock-customer-ordering-adapter.ts"),
  ]);

  for (const token of [
    "DeliveryAddress",
    "CheckoutDraft",
    "SubmitOrderInput",
    "CustomerOrder",
    "listDeliveryAddresses",
    "saveCheckoutDraft",
    "submitOrder",
    "getOrderById",
  ]) {
    assert.match(contracts, new RegExp(token));
    assert.match(`${service}\n${adapter}`, new RegExp(token));
  }

  assert.match(adapter, /hp-customer-ordering:checkout-draft:v1/);
  assert.match(adapter, /hp-customer-ordering:orders:v1/);
  assert.match(adapter, /submissionKey/);
  assert.match(adapter, /this\.storage\.set\(CART_KEY, \{ lines: \[\]/);
  assert.doesNotMatch(adapter, /fetch\(|axios|DATABASE_URL|SUPABASE/i);
});

test("quick order keeps selection local and bulk merges into the persisted cart", async () => {
  const quickOrder = await read("components/quick-order.tsx");

  assert.match(quickOrder, /selectedOnly/);
  assert.match(quickOrder, /quantities/);
  assert.match(quickOrder, /selectedEntries/);
  assert.match(quickOrder, /addSelectedToCart/);
  assert.match(quickOrder, /service\.saveCart/);
  assert.match(quickOrder, /announceCartUpdated/);
  assert.match(quickOrder, /availability !== "available"/);
  assert.match(quickOrder, /Thêm tất cả vào giỏ/);
});

test("cart, checkout and success routes are real protected app screens", async () => {
  const [cartPage, checkoutPage, successPage, cartScreen, checkoutScreen, successScreen] =
    await Promise.all([
      read("app/cart/page.tsx"),
      read("app/checkout/page.tsx"),
      read("app/order-success/[orderId]/page.tsx"),
      read("components/cart-screen.tsx"),
      read("components/checkout-screen.tsx"),
      read("components/order-success.tsx"),
    ]);

  assert.match(cartPage, /<CartScreen/);
  assert.match(checkoutPage, /<CheckoutScreen/);
  assert.match(successPage, /<OrderSuccess/);
  assert.match(cartScreen, /Ghi chú mặt hàng/);
  assert.match(cartScreen, /Tạm tính các dòng có giá/);
  assert.match(checkoutScreen, /submitting/);
  assert.match(checkoutScreen, /submissionKeyRef/);
  assert.match(checkoutScreen, /service\.submitOrder/);
  assert.match(checkoutScreen, /router\.push\(`\/order-success\//);
  assert.match(successScreen, /service\.getOrderById/);
  assert.match(successScreen, /Đã gửi thành công/);
});

test("UI-3 preserves glass navigation and adds mobile-safe order flow styles", async () => {
  const [layout, badge, css] = await Promise.all([
    read("app/layout.tsx"),
    read("components/cart-badge.tsx"),
    read("app/ui3.css"),
  ]);

  assert.match(layout, /import "\.\/ui2\.css"/);
  assert.match(layout, /import "\.\/ui3\.css"/);
  assert.match(badge, /href="\/cart"/);
  assert.match(css, /backdrop-filter: blur\(20px\)/);
  assert.match(css, /\.quick-order-summary/);
  assert.match(css, /position: sticky/);
  assert.match(css, /@media \(max-width: 410px\)/);
});
