# HANDOFF — CUSTOMER ORDERING PWA UI-FIRST

Dùng tài liệu này để mở chat mới và bắt đầu triển khai sau khi master plan được duyệt.

## Thứ tự đọc bắt buộc

1. `docs/customer-ordering-pwa-master-plan.md`
2. `docs/customer-ordering-vercel-deploy-boundary.md`
3. Issue triển khai Customer Ordering UI trong repo này.
4. Audit exact `main`, PR/branch đang mở và CI mới nhất.
5. Audit Website production và Vercel project thực tế trước mọi thay đổi provider.

## Mục tiêu

Tạo PWA riêng cho khách hàng Hưng Phát đặt hàng, đơn giản hơn repo tham khảo `gustavjung01/F-B-Order`.

Giai đoạn đầu làm đầy đủ UI và luồng thao tác bằng mock adapter. Chưa nối NPP Core, chưa tạo database, chưa dùng Supabase, chưa deploy production.

## Phạm vi UI

- Đăng nhập mock, giữ phiên khi reload.
- Trang chủ và thông báo nổi bật.
- Sản phẩm theo danh mục, tìm kiếm và chi tiết.
- Giỏ hàng.
- Đặt hàng nhanh dạng danh sách không ảnh.
- Checkout và gửi đơn mock chống bấm lặp.
- Danh sách, chi tiết, timeline và đặt lại đơn.
- Tin tức, sự kiện và chương trình công ty.
- Tài khoản, địa chỉ nhận hàng và tùy chọn thông báo.
- PWA, safe area iPhone, offline state và bottom navigation.

Không có công thức F&B hoặc admin riêng.

## Ranh giới repo

- Website hiện tại giữ nguyên ở repo root.
- Customer Ordering nằm tại `customer-ordering/` với package và lockfile riêng.
- Không chuyển root repo thành workspace trong Phase UI.
- Không sửa NPP Core hoặc repo `NPP-Platform` trong task UI.

## Deploy boundary phải làm từ nền móng

Tạo riêng:

```text
scripts/vercel/verify-project-boundary.mjs
scripts/vercel/deploy-website-production.mjs
scripts/vercel/deploy-customer-ordering-production.mjs
.github/workflows/customer-ordering-ci.yml
.github/workflows/vercel-website-production-manual.yml
.github/workflows/vercel-customer-ordering-production-manual.yml
```

Hai lệnh production dự kiến:

```text
/deploy-website-production
/deploy-customer-ordering-production
```

Hai frontend phải có project ID, root directory, CI, deploy, smoke và rollback riêng. Auto Deploy luôn OFF. Trong Phase UI chỉ viết và test guard/workflow; không production deploy nếu chưa có lệnh rõ.

## Adapter boundary

```text
UI → CustomerOrderingService → MockCustomerOrderingAdapter
                                   ↓ thay sau
                              NppCustomerApiAdapter
```

Không import mock JSON trực tiếp khắp các page/component. UI không tự tính giá chính thức hoặc tự chuyển trạng thái đơn.

## Thứ tự vertical slice

1. UI-0: app foundation, shell, PWA, mock service, CI và deploy guards.
2. UI-1: login, home, account.
3. UI-2: catalog và product detail.
4. UI-3: quick order, cart, checkout.
5. UI-4: orders và timeline.
6. UI-5: news/events/push UX.
7. UI-6: accessibility, offline, Chromium/WebKit và demo gate.

Không mở API/DB phase trước khi toàn bộ UI mock được duyệt.

## Test bắt buộc

- `390×844` và `430×932`.
- Bottom navigation sát đáy canvas, safe area tính đúng một lần.
- Một vùng cuộn chính.
- Reload giữ phiên và giỏ mock.
- Login → sản phẩm/đặt nhanh → giỏ → checkout → đơn mock.
- Reorder và order timeline.
- Loading, empty, error và offline.
- Không cache private data.
- Website root vẫn build và hoạt động độc lập.
- Website deploy guard không nhận Customer App project ID và ngược lại.

## Git workflow

- Audit main trước mỗi phase.
- Tạo branch `agent/customer-ordering-<slice>` từ exact main.
- Mỗi slice có PR riêng, CI xanh mới xem xét merge.
- Không tự merge hoặc production deploy khi chưa có lệnh rõ.
- Sau merge phải xác nhận main và xóa branch.

## Không làm

- Không Supabase backend.
- Không migration/database.
- Không backend tạm trong repo Website.
- Không admin Customer Ordering.
- Không công thức F&B.
- Không thanh toán online.
- Không đăng ký khách công khai.
- Không sửa provider, DNS hoặc domain khi chưa audit và được yêu cầu.
- Không deploy Website khi chỉ sửa Customer Ordering.
- Không deploy Customer Ordering khi chỉ sửa Website.