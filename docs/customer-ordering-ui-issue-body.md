# Customer Ordering PWA — UI-first implementation

Plan nằm tại PR #3. Chat mới phải đọc `docs/customer-ordering-pwa-master-plan.md`, `docs/customer-ordering-vercel-deploy-boundary.md`, `docs/customer-ordering-ui-handoff.md`, audit exact main/PR/CI rồi mới sửa.

Mục tiêu: làm toàn bộ UI PWA khách hàng bằng mock adapter trước; chưa nối NPP Core, database hoặc Supabase.

Phạm vi UI: đăng nhập, trang chủ, sản phẩm, giỏ hàng, đặt nhanh không ảnh, checkout mock, đơn hàng/timeline, tin tức/sự kiện và tài khoản. Không có công thức F&B hoặc admin riêng.

Phase đầu tiên UI-0:

- Tạo `customer-ordering/` độc lập với package/lockfile riêng.
- App shell, PWA, bottom navigation, mock service/adapter/storage.
- CI riêng cho Customer Ordering.
- Tạo `scripts/vercel/verify-project-boundary.mjs`.
- Tạo `scripts/vercel/deploy-website-production.mjs`.
- Tạo `scripts/vercel/deploy-customer-ordering-production.mjs`.
- Tạo hai workflow production thủ công riêng cho Website và Customer Ordering.
- Chưa chạy deploy production.

Deploy boundary:

- Website root `.` và Customer Ordering root `customer-ordering`.
- Hai Vercel project ID, CI, deploy, smoke và rollback riêng.
- Auto Deploy luôn OFF.
- `/deploy-website-production` và `/deploy-customer-ordering-production` là hai lệnh tách biệt.
- Script của bên này phải từ chối project ID/root của bên kia.

Acceptance UI-0:

- Website root không đổi hành vi.
- Customer Ordering build độc lập.
- Geometry đạt tại `390×844` và `430×932`.
- Bottom navigation sát đáy, safe area đúng một lần.
- CI xanh.
- Sai root/SHA/issue command/project ID phải fail trước deploy.
- Không lộ secret.

Không làm: NPP Core, DB/migration, Supabase backend, admin, công thức, payment, đăng ký công khai, provider/DNS hoặc production deploy khi chưa có lệnh rõ.

Git: `main` → `agent/customer-ordering-ui-0`; audit exact main trước sửa; CI xanh mới PR; không merge/deploy khi chưa được yêu cầu.