# Customer Ordering — Phase 9.2 Core order intake

Canonical task: `binhnxwjfjxm/NPP-Platform#389`.

## Locked boundary

- Clerk authenticates external customers only.
- The browser sends only the Clerk session token to the same-origin Customer Ordering BFF.
- The BFF forwards the Clerk token to Core `/api/customer-portal/**`; it never holds or forwards the Core bootstrap/server token.
- Core resolves `Clerk subject -> portal identity -> active customer membership` and derives customer, warehouse, sales channel and collection policy server-side.
- Cart, checkout draft, announcements and notification preferences may remain browser-local UX state; orders and customer/account authority are Core-owned.
- The production adapter is the default in production. Mock mode is opt-in for local/test use.

## Canonical order behavior

- Catalog/orderability and customer price come from Core.
- Submit uses the browser-generated submission key as `Idempotency-Key`.
- Retryable failures preserve that key so a timeout retry cannot create a duplicate order.
- Order history/read/cancel all come back through the same Core portal boundary and are fail-closed to the active membership.
- Reorder only repopulates the local cart after checking current Core catalog/orderability; it does not clone an order record.

## Provider gate

Before production rollout, configure only the documented environment names with real provider values and verify the Clerk issuer/JWKS plus Core portal membership data. No production deploy is part of this source PR.
