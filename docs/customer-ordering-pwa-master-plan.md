# CUSTOMER ORDERING PWA — MASTER PLAN

## 0. Trạng thái và baseline

- Repo: `binhnxwjfjxm/nguyenlieuhungphat`
- Baseline khi lập plan: `main@1e7de4f6fd02f447475c9c5abe209b05241444b7`
- Trạng thái PR khi audit: không có PR đang mở.
- Website hiện tại là một ứng dụng Next.js đặt tại root repo.
- CI hiện tại chỉ kiểm website root qua `.github/workflows/frontend-ci.yml`.
- Tài liệu này chỉ khóa kế hoạch. Chưa tạo Customer Ordering app, chưa nối NPP Core, chưa tạo database, chưa deploy provider.

## 1. Mục tiêu sản phẩm

Tạo một PWA riêng cho khách hàng Hưng Phát đặt hàng, cài được lên màn hình chính và dùng như ứng dụng mobile.

Ứng dụng phải đơn giản hơn repo tham khảo Bếp Sỉ F&B. Chỉ giữ các luồng khách hàng thật sự cần:

1. Đăng nhập.
2. Xem sản phẩm theo danh mục.
3. Thêm sản phẩm vào giỏ hàng.
4. Đặt hàng nhanh bằng danh sách gọn, không cần ảnh.
5. Gửi đơn hàng.
6. Theo dõi trạng thái đơn.
7. Xem tin tức, sự kiện và chương trình từ công ty.
8. Quản lý thông tin tài khoản, địa chỉ nhận hàng và tùy chọn thông báo.

Ứng dụng này không có admin riêng. Toàn bộ quản trị sản phẩm, khách hàng, giá, thông báo và xử lý đơn sẽ nằm trong NPP Core khi tích hợp backend.

## 2. Quyết định kiến trúc

### 2.1 Tách thành frontend riêng trong cùng repo

Website và Customer Ordering dùng chung repo nhưng là hai ứng dụng độc lập:

```text
nguyenlieuhungphat/
├── app/                         # Website công ty hiện tại
├── components/                  # Website hiện tại
├── package.json                 # Website hiện tại
├── package-lock.json            # Website hiện tại
└── customer-ordering/           # Customer Ordering PWA mới
    ├── app/
    ├── components/
    ├── features/
    ├── lib/
    ├── public/
    ├── test/
    ├── package.json
    └── package-lock.json
```

Không chuyển repo root thành npm workspace trong giai đoạn đầu. Lý do:

- Website hiện tại đang chạy ổn ở root.
- Customer Ordering cần release và dependency độc lập.
- Tránh thay đổi lớn package manager hoặc build của website chỉ để thêm app mới.
- Vercel có thể build trực tiếp từ root directory `customer-ordering`.

### 2.2 Hai Vercel project độc lập

Mục tiêu runtime:

| Ứng dụng | Repo root | Vercel root directory | Domain dự kiến |
|---|---|---|---|
| Website công ty | `/` | `.` | `nguyenlieuhungphat.com` |
| Customer Ordering PWA | `/customer-ordering` | `customer-ordering` | `order.nguyenlieuhungphat.com` |

Hai project phải có build, CI, deploy, smoke và rollback riêng. Thay đổi Customer Ordering không được tự deploy website và ngược lại.

### 2.3 Backend và database không nằm trong repo này

Kiến trúc đích:

```text
Customer Ordering PWA
        ↓ cùng domain qua Next Route Handlers / BFF
order.nguyenlieuhungphat.com/api/*
        ↓ server-to-server
NPP Core Customer API
        ↓
Heroku PostgreSQL dùng chung của NPP Platform
```

Repo này chỉ giữ frontend và lớp BFF mỏng. Không chứa nghiệp vụ giá, trạng thái đơn, quyền khách hàng hoặc kết nối trực tiếp PostgreSQL production.

## 3. Repo tham khảo Bếp Sỉ F&B

Repo tham khảo: `gustavjung01/F-B-Order`.

Những phần được dùng làm mẫu:

- App shell mobile và PWA.
- Luồng duyệt sản phẩm.
- Giỏ hàng.
- Danh sách và chi tiết đơn hàng.
- Thông báo/chương trình.
- Trạng thái loading, empty và error.

Những phần không đưa sang Customer Ordering:

- Công thức F&B.
- Admin nội bộ.
- Quản trị catalog trong app khách.
- Kitchen capacity, production planning hoặc nghiệp vụ bếp.
- Backend riêng của Bếp Sỉ.
- Clerk hoặc các quyết định auth riêng của repo tham khảo.

Repo tham khảo hiện không khai báo license. Vì vậy mặc định chỉ tham khảo bố cục và hành vi; không copy nguyên file/component cho tới khi quyền tái sử dụng được xác nhận rõ.

## 4. Phạm vi UI làm trước

Giai đoạn được ưu tiên trước là hoàn thiện toàn bộ trải nghiệm UI bằng mock data và mock adapter. UI phải có thể thao tác xuyên suốt như một sản phẩm thật, nhưng chưa gửi dữ liệu sang NPP Core.

### 4.1 Đăng nhập

Route dự kiến: `/login`

Chức năng UI:

- Tên đăng nhập hoặc số điện thoại.
- Mật khẩu.
- Hiện/ẩn mật khẩu.
- Trạng thái đang đăng nhập, sai thông tin và lỗi mạng.
- Ghi nhớ phiên mock khi reload hoặc đóng/mở PWA.
- Nút quên mật khẩu ở trạng thái hướng dẫn/liên hệ công ty.
- Không có tự đăng ký khách hàng công khai.

Khách hàng production sau này phải là khách đã được NPP Core cấp quyền đặt hàng.

### 4.2 Trang chủ

Route dự kiến: `/`

Nội dung:

- Lời chào và tên điểm bán.
- Thông báo hoặc chương trình nổi bật.
- Lối tắt tới Sản phẩm, Đặt nhanh, Đơn hàng.
- Đơn gần nhất và trạng thái hiện tại.
- Danh mục mua thường xuyên hoặc sản phẩm gợi ý ở mức mock.
- Icon chuông mở Tin tức/Thông báo.
- Icon giỏ hàng kèm số lượng mặt hàng.

### 4.3 Sản phẩm

Routes dự kiến:

```text
/products
/products/[productId]
```

Chức năng:

- Danh mục sản phẩm.
- Tìm theo tên, mã hoặc tên gọi quen thuộc.
- Card sản phẩm có ảnh, tên, mã, quy cách và giá mẫu.
- Hiển thị trạng thái hết hàng/tạm ngưng ở mức UI.
- Chọn số lượng và thêm giỏ.
- Chi tiết sản phẩm đơn giản.
- Không đưa công thức, nguyên liệu liên quan hoặc nội dung bếp vào app.

UI phải hỗ trợ trường hợp giá theo khách hàng chưa sẵn sàng bằng một trạng thái rõ ràng, không tự suy đoán giá.

### 4.4 Đặt hàng nhanh

Route dự kiến: `/quick-order`

Đây là màn quan trọng cho khách đã biết sản phẩm và không cần xem ảnh.

Chức năng:

- Chọn danh mục.
- Tìm theo tên hoặc mã.
- Danh sách dạng dòng gọn: mã, tên, quy cách, đơn vị, số lượng.
- Tăng/giảm số lượng hoặc nhập trực tiếp.
- Giữ vị trí cuộn khi nhập nhiều sản phẩm.
- Bộ lọc “đã chọn”.
- Tổng số dòng và tổng số lượng đang chọn.
- Thêm toàn bộ mặt hàng đã chọn vào giỏ một lần.
- Hỗ trợ trạng thái sản phẩm không được phép mua hoặc tạm ngưng ở mức UI.

Không dùng card ảnh lớn trong màn này.

### 4.5 Giỏ hàng và xác nhận đơn

Routes dự kiến:

```text
/cart
/checkout
/order-success/[orderId]
```

Chức năng:

- Sửa số lượng.
- Xóa mặt hàng.
- Ghi chú từng dòng và ghi chú toàn đơn.
- Chọn địa chỉ nhận hàng mock.
- Hiển thị tạm tính.
- Hiển thị cảnh báo giá chỉ là giá dự kiến nếu backend chưa quote chính thức.
- Xác nhận gửi đơn mock.
- Chống bấm gửi lặp ở UI.
- Tạo mã đơn mock và chuyển tới màn thành công.

Không làm thanh toán trực tuyến trong phạm vi đầu.

### 4.6 Đơn hàng

Routes dự kiến:

```text
/orders
/orders/[orderId]
```

Chức năng:

- Danh sách đơn theo thời gian.
- Lọc theo trạng thái.
- Tìm theo mã đơn.
- Chi tiết sản phẩm, số lượng, địa chỉ và ghi chú.
- Timeline trạng thái.
- Đặt lại đơn cũ vào giỏ.
- Nút hủy chỉ xuất hiện ở trạng thái UI được phép.
- Empty state và lỗi tải dữ liệu.

Bộ trạng thái hiển thị tạm thời:

```text
DRAFT
SUBMITTED
RECEIVED
CONFIRMED
PROCESSING
DELIVERING
COMPLETED
REJECTED
CANCELLED
```

Frontend không được tự chuyển trạng thái. Khi tích hợp, NPP Core là nguồn sự thật và cung cấp mapping chính thức.

### 4.7 Tin tức, sự kiện và thông báo

Routes dự kiến:

```text
/news
/news/[articleId]
```

Chức năng:

- Danh sách tin từ công ty.
- Tin nổi bật.
- Chương trình khuyến mại/sự kiện.
- Chi tiết bài viết.
- Đánh dấu đã đọc ở mức mock.
- Deep link tới sản phẩm, danh mục hoặc đơn hàng trong tương lai.
- UI xin quyền push notification, nhưng chưa gọi OneSignal production trong giai đoạn mock.

### 4.8 Tài khoản

Route dự kiến: `/account`

Chức năng:

- Tên công ty/điểm bán.
- Mã khách hàng mock.
- Địa chỉ nhận hàng.
- Nhân viên phụ trách.
- Số điện thoại liên hệ.
- Tùy chọn nhận thông báo.
- Đăng xuất.

Không cho khách tự sửa thông tin pháp lý hoặc nhóm giá trong giai đoạn đầu.

## 5. Điều hướng mobile

Bottom navigation cố định gồm năm mục:

```text
Trang chủ | Sản phẩm | Đặt nhanh | Đơn hàng | Tài khoản
```

Quy tắc:

- Giỏ hàng nằm trên header và hiển thị badge số lượng.
- Tin tức mở từ Trang chủ hoặc icon chuông, không chiếm tab bottom.
- Mỗi mục có icon và nhãn tiếng Việt.
- Vùng bấm tối thiểu 48px.
- Bottom navigation sát đáy canvas PWA và tính safe area đúng một lần.
- Chỉ có một vùng cuộn nội dung chính.

## 6. Thiết kế dữ liệu mock và lớp adapter

UI không được import mock JSON trực tiếp ở từng màn. Tất cả dữ liệu đi qua interface chung:

```text
UI components
    ↓
CustomerOrderingService
    ↓
MockCustomerOrderingAdapter   # giai đoạn UI
    ↓ thay thế sau
NppCustomerApiAdapter         # giai đoạn tích hợp
```

Cấu trúc dự kiến:

```text
customer-ordering/
├── features/
│   ├── auth/
│   ├── catalog/
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   ├── news/
│   └── account/
├── lib/
│   ├── contracts/
│   ├── customer-ordering-service.ts
│   ├── adapters/mock/
│   ├── adapters/npp-core/
│   └── storage/
└── test/
```

Các model frontend tối thiểu:

- `CustomerSession`
- `CustomerProfile`
- `DeliveryAddress`
- `Category`
- `Product`
- `ProductPriceView`
- `Cart`
- `CartLine`
- `OrderDraft`
- `OrderQuote`
- `CustomerOrder`
- `OrderStatusEvent`
- `Announcement`
- `NotificationPreference`

Mock data phải bao phủ cả trường hợp bình thường và ngoại lệ: không có giá, hết hàng, đơn bị từ chối, danh sách rỗng và lỗi mạng.

## 7. PWA và mobile quality gate

PWA phải được làm ngay từ nền móng, không để cuối mới vá.

Yêu cầu:

- Manifest đầy đủ tên, icon và theme color Hưng Phát.
- Có thể Add to Home Screen.
- Standalone mode trên iPhone và Android.
- `viewport-fit=cover`.
- Safe area đầu và cuối màn hình.
- App frame phủ toàn bộ canvas PWA.
- Không lộ nền body dưới bottom navigation.
- Không cache trang hoặc response chứa dữ liệu riêng tư.
- Chỉ cache app shell/tài nguyên tĩnh an toàn.
- Có màn offline hoặc thông báo mất mạng rõ ràng.
- Reload không làm mất phiên mock và giỏ hàng mock.
- Không gửi đơn trùng khi người dùng bấm nhiều lần.

Viewport bắt buộc:

- `390 × 844`
- `430 × 932`
- Desktop kiểm tra tối thiểu `1440 × 900`

## 8. CI và test khi bắt đầu code

Tạo workflow riêng, không nhét Customer Ordering vào workflow website hiện tại:

```text
.github/workflows/customer-ordering-ci.yml
```

Path filter dự kiến:

```text
customer-ordering/**
.github/workflows/customer-ordering-ci.yml
```

CI tối thiểu:

1. `npm ci` trong `customer-ordering`.
2. Unit test và contract test.
3. Lint.
4. Typecheck.
5. Production build.
6. Playwright Chromium mobile.
7. Playwright WebKit cho hình học iPhone PWA.

Test bắt buộc:

- Điều hướng 5 tab.
- Giỏ hàng badge và lưu giỏ sau reload.
- Sản phẩm → giỏ → checkout → đơn mock.
- Đặt nhanh nhiều dòng.
- Đặt lại đơn cũ.
- Trạng thái đơn và timeline.
- Đọc tin tức.
- Login/logout mock.
- Bottom navigation sát viewport bottom.
- Nội dung nằm trên safe area.
- Không cache API/private page.
- Keyboard navigation, focus visible và accessible name.

## 9. Hợp đồng API tương lai với NPP Core

Giai đoạn UI chỉ khai báo contract ở frontend. Backend chưa được tạo trong repo này.

API dự kiến do NPP Core sở hữu:

```text
POST /api/customer/auth/login
POST /api/customer/auth/refresh
POST /api/customer/auth/logout
GET  /api/customer/me
GET  /api/customer/addresses
GET  /api/customer/categories
GET  /api/customer/products
GET  /api/customer/products/:id
POST /api/customer/orders/quote
POST /api/customer/orders
GET  /api/customer/orders
GET  /api/customer/orders/:id
POST /api/customer/orders/:id/cancel
POST /api/customer/orders/:id/reorder
GET  /api/customer/announcements
GET  /api/customer/announcements/:id
POST /api/customer/push/register
```

NPP Core phải là nguồn sự thật cho:

- Khách hàng được phép đăng nhập.
- Quan hệ user với customer/điểm bán.
- Danh mục và sản phẩm được phép bán.
- Quy cách và đơn vị đặt hàng.
- Giá theo khách hàng/nhóm giá.
- Quote đơn hàng.
- Quyền hủy đơn.
- Trạng thái đơn.
- Tin tức và chương trình.
- Push notification và audit.

## 10. Cách xử lý khác repo frontend/backend

Khác repo không phải trở ngại nếu khóa các ranh giới sau.

### 10.1 NPP Core sở hữu OpenAPI

- OpenAPI customer API nằm trong repo `NPP-Platform`.
- Frontend sinh TypeScript client từ OpenAPI.
- Generated client được commit cùng `contractVersion` hoặc contract SHA.
- CI frontend kiểm generated client không lệch contract đã pin.

### 10.2 Dùng BFF cùng domain

Browser chỉ gọi:

```text
order.nguyenlieuhungphat.com/api/*
```

Next Route Handlers gọi NPP Core server-to-server. Lợi ích:

- Tránh CORS phức tạp.
- Không lộ server secret.
- Cookie HttpOnly chỉ thuộc app khách hàng.
- Có thể thay backend URL mà không sửa toàn bộ UI.
- Chuẩn hóa lỗi và timeout ở một nơi.

BFF không được chứa logic giá hoặc tự quyết định trạng thái đơn.

### 10.3 Release độc lập

- Frontend release không tự deploy NPP Core.
- Backend release không tự deploy Customer Ordering.
- Contract breaking change phải có version và thời gian chuyển tiếp.
- Staging phải kiểm tương thích trước production.

## 11. Xác thực và bảo mật đích

Luồng đề xuất:

1. Browser gửi login tới BFF cùng domain.
2. BFF gọi NPP Core Customer Auth API.
3. NPP Core xác thực khách và trả session material.
4. BFF lưu session trong cookie `Secure`, `HttpOnly`, `SameSite` phù hợp.
5. Browser không giữ service token hoặc database credential.
6. Mọi request order phải được kiểm customer scope ở NPP Core.

Yêu cầu backend khi triển khai:

- Deny by default.
- Khách chỉ xem đơn và dữ liệu của chính mình.
- Rate limit login và submit order.
- Idempotency key khi tạo đơn.
- Audit log và outbox.
- CSRF protection phù hợp với cookie session.
- Không đưa `DATABASE_URL` hoặc server secret lên Vercel public env.

## 12. Supabase

Không dùng Supabase làm backend production cho Customer Ordering.

Lý do:

- NPP Core và Heroku PostgreSQL đã là nguồn sự thật.
- Dùng Supabase riêng sẽ tạo hai nơi lưu khách, sản phẩm, giá và đơn.
- Phải đồng bộ trạng thái hai chiều.
- Tăng rủi ro gửi trùng hoặc lệch đơn.
- Sau cùng vẫn phải cutover về NPP Core.

Trong giai đoạn UI chỉ dùng mock adapter cục bộ. Không cần dựng Supabase tạm.

## 13. Kế hoạch thực thi theo vertical slice

### Phase UI-0 — Khóa nền móng

Phạm vi:

- Tạo `customer-ordering/` độc lập.
- Next.js, TypeScript và package lock riêng.
- Design tokens Hưng Phát.
- App shell, header, bottom navigation.
- PWA manifest/icon/service worker policy.
- Mock service interface và storage.
- CI riêng.

Gate:

- Website root không đổi hành vi.
- Customer Ordering build độc lập.
- Mobile shell đúng safe area và viewport.

### Phase UI-1 — Login, Home và Account

Phạm vi:

- Login mock.
- Session mock.
- Trang chủ.
- Account.
- Logout.
- Tin nổi bật mẫu.

Gate:

- Reload/đóng mở giữ session mock.
- Không cache private page sai chính sách.

### Phase UI-2 — Catalog và Product Detail

Phạm vi:

- Danh mục.
- Search.
- Product card.
- Product detail.
- Thêm vào giỏ.

Gate:

- Empty/loading/error states đầy đủ.
- Không vỡ với tên dài, giá thiếu hoặc sản phẩm tạm ngưng.

### Phase UI-3 — Quick Order, Cart và Checkout

Phạm vi:

- Đặt hàng nhanh dạng bảng.
- Giỏ hàng.
- Checkout mock.
- Order success.

Gate:

- Nhập nhiều sản phẩm liên tục.
- Reload không mất giỏ.
- Không tạo hai đơn mock khi bấm lặp.

### Phase UI-4 — Orders

Phạm vi:

- Danh sách đơn.
- Lọc trạng thái.
- Chi tiết/timeline.
- Reorder.
- Cancel eligible state ở UI.

Gate:

- Trạng thái chỉ hiển thị từ data source.
- UI không tự mutate trạng thái nghiệp vụ.

### Phase UI-5 — News, Events và Push UX

Phạm vi:

- Danh sách tin.
- Chi tiết tin.
- Read/unread.
- UI xin quyền thông báo.

Gate:

- Chưa gọi OneSignal production.
- Deep link mock hoạt động.

### Phase UI-6 — Hardening và Demo Gate

Phạm vi:

- Playwright Chromium/WebKit.
- Accessibility.
- Offline state.
- Performance và image loading.
- Hình học PWA iPhone.
- Demo data hoàn chỉnh.

Gate:

- Toàn bộ luồng demo end-to-end chạy bằng mock adapter.
- Không có phụ thuộc NPP Core để trình diễn UI.
- Website và Customer Ordering CI đều xanh độc lập.

### Phase API-1 — Khóa contract với NPP Core

Chỉ bắt đầu sau khi UI được duyệt.

- Chốt OpenAPI.
- Chốt auth/session.
- Chốt price/quote semantics.
- Chốt order status mapping.
- Chốt announcement/push contract.

### Phase API-2 — NPP Core implementation

Thực hiện ở repo `NPP-Platform`, không ở repo này.

- Customer auth.
- Catalog/customer pricing.
- Quote và submit order.
- Idempotency.
- Authorization.
- Audit/outbox.
- Order tracking.
- Announcement và push.

### Phase Integration — Staging và pilot

- Thay mock adapter bằng NPP adapter.
- Chạy staging end-to-end.
- Pilot nhóm khách nhỏ.
- Đối soát đơn app với NPP.
- Kiểm rollback.
- Chỉ rollout rộng sau khi dữ liệu và trạng thái khớp.

## 14. Những việc không làm trong giai đoạn UI

- Không sửa NPP Core.
- Không tạo migration.
- Không chạm production database.
- Không dùng Supabase làm backend tạm.
- Không tạo admin Customer Ordering.
- Không làm công thức F&B.
- Không làm thanh toán online.
- Không mở đăng ký khách hàng công khai.
- Không tự tạo mã khách hàng.
- Không tự quyết định bảng giá.
- Không deploy backend.
- Không thay đổi provider production khi chưa có lệnh rõ.

## 15. Production gate tương lai

Trước khi production Customer Ordering được mở cho khách:

1. UI CI xanh ở exact head.
2. NPP Core CI xanh ở exact head tương thích.
3. Contract version khớp.
4. Production domain và TLS đúng.
5. PWA manifest/icon/install đúng.
6. Login và logout đúng.
7. Quote và tạo đơn có idempotency.
8. Khách không xem được dữ liệu khách khác.
9. Đơn xuất hiện trong NPP Core đúng một lần.
10. Trạng thái đơn đồng bộ.
11. Push notification không làm lộ dữ liệu nhạy cảm.
12. Smoke `390×844` và `430×932` trên PWA.
13. Có rollback frontend độc lập.
14. Không cần deploy website hoặc backend không liên quan.

## 16. Kết luận chốt

- Customer Ordering là frontend PWA riêng trong repo `nguyenlieuhungphat`.
- Folder mục tiêu: `customer-ordering/`.
- Vercel project và domain riêng.
- Làm toàn bộ tính năng UI trước bằng mock adapter.
- Không tạo backend hoặc database riêng.
- Sau khi UI được duyệt, nối vào NPP Core qua Customer API và BFF cùng domain.
- NPP Core/Heroku PostgreSQL là nguồn sự thật duy nhất cho khách, giá, đơn, trạng thái và thông báo.
