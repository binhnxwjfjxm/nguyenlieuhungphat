# Customer Ordering PWA — UI-first implementation

## Trạng thái bàn giao

Repo: `binhnxwjfjxm/nguyenlieuhungphat`

Plan đang nằm tại PR #3 trên branch `agent/customer-ordering-pwa-plan`.

Baseline khi lập plan: `main@1e7de4f6fd02f447475c9c5abe209b05241444b7`.

Chat mới phải audit lại exact `main`, PR/branch đang mở và CI mới nhất; không được mặc định baseline này còn hiện hành.

## Đọc theo thứ tự

1. `docs/customer-ordering-pwa-master-plan.md`
2. `docs/customer-ordering-vercel-deploy-boundary.md`
3. `docs/customer-ordering-ui-handoff.md`
4. PR #3 và issue này
5. Audit Website hiện tại, Vercel project thực tế và repo tham khảo `gustavjung01/F-B-Order`

## Mục tiêu

Dựng một PWA khách hàng đặt hàng đơn giản hơn Bếp Sỉ F&B. Làm đầy đủ UI trước bằng mock adapter; backend/database sẽ nối NPP Core sau.

Các luồng chính:

- Đăng nhập
- Trang chủ
- Sản phẩm theo danh mục
- Giỏ hàng
- Đặt hàng nhanh không ảnh
- Checkout mock
- Theo dõi trạng thái đơn
- Tin tức/sự kiện/chương trình công ty
- Tài khoản và địa chỉ nhận hàng

Không có công thức F&B và không có admin riêng.

## Kiến trúc đã khóa

```text
Repo root                     Website công ty
customer-ordering/            Customer Ordering PWA
NPP-Platform/npp-core         Backend tương lai
Heroku PostgreSQL dùng chung  Database tương lai
```

Customer Ordering dùng package/lockfile riêng và Vercel project riêng. Không chuyển root repo thành workspace trong Phase UI.

## Phạm vi làm trước

Thực hiện UI-0 đến UI-6 theo master plan. Toàn bộ luồng demo phải chạy bằng mock adapter trước khi mở phần API/DB.

Adapter boundary:

```text
UI → CustomerOrderingService → MockCustomerOrderingAdapter
                                   ↓ sau này
                              NppCustomerApiAdapter
```

## Deploy Vercel phải tách tuyệt đối

Phải tạo và test:

```text
scripts/vercel/verify-project-boundary.mjs
scripts/vercel/deploy-website-production.mjs
scripts/vercel/deploy-customer-ordering-production.mjs
.github/workflows/customer-ordering-ci.yml
.github/workflows/vercel-website-production-manual.yml
.github/workflows/vercel-customer-ordering-production-manual.yml
```

Lệnh production dự kiến:

```text
/deploy-website-production
/deploy-customer-ordering-production
```

Yêu cầu:

- Auto Deploy của cả hai project luôn OFF.
- Website root bắt buộc `.`.
- Customer Ordering root bắt buộc `customer-ordering`.
- Hai project ID không được dùng thay thế/fallback cho nhau.
- Hai CI, deploy, smoke và rollback độc lập.
- Chỉ viết/test script và workflow trong Phase UI; không tạo project hoặc deploy production nếu chưa có lệnh rõ.

## Phase đầu tiên cho chat mới: UI-0

- Tạo `customer-ordering/` độc lập.
- Next.js + TypeScript + lockfile riêng.
- Design tokens Hưng Phát.
- App shell, header, bottom navigation 5 mục.
- PWA manifest/icon/service-worker policy.
- Mock service/adapter/storage.
- Customer Ordering CI riêng.
- Guard và script deploy riêng Website/Customer Ordering.
- Hai workflow deploy production thủ công, chưa chạy production.

## Acceptance UI-0

- Website root không đổi hành vi và vẫn build độc lập.
- Customer Ordering build độc lập.
- App shell đúng tại `390×844` và `430×932`.
- Bottom navigation sát đáy canvas, safe area tính đúng một lần.
- Một vùng cuộn chính.
- Reload giữ session/cart mock foundation.
- Customer Ordering CI xanh.
- Website script từ chối Customer App project ID và ngược lại.
- Sai root, sai SHA, sai issue command hoặc thiếu CI xanh phải fail trước deploy.
- Log không lộ secret.

## Ranh giới cấm

- Không sửa NPP Core hoặc repo `NPP-Platform` trong Phase UI.
- Không Supabase backend.
- Không database/migration.
- Không công thức F&B.
- Không admin riêng.
- Không payment online.
- Không đăng ký khách công khai.
- Không tự deploy production, sửa DNS/provider hoặc tạo Vercel project khi chưa có lệnh rõ.

## Git workflow

- `main` → `agent/customer-ordering-ui-0`
- Audit exact main trước khi sửa.
- CI xanh mới mở/hoàn thiện PR.
- Không merge/deploy nếu chưa được yêu cầu rõ.
- Sau merge phải sync main sạch và xóa branch.

## Ghi chú

Repo Bếp Sỉ chỉ dùng để tham khảo bố cục và hành vi. Repo đó không khai báo license, vì vậy không copy nguyên file/component khi chưa xác nhận quyền tái sử dụng.