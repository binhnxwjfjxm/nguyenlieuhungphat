# Customer Ordering — Clerk trước, kết nối NPP Core sau

## 1. Quyết định hiện tại

Customer Ordering dùng **Clerk cho toàn bộ danh tính người dùng bên ngoài** trong khi NPP Core chưa hoàn thiện customer portal authentication và deny-by-default authorization.

Quyết định này thay thế phần auth cũ chỉ dùng Google trong tài liệu trước:

- đăng nhập/đăng ký bằng Google OAuth;
- đăng nhập/đăng ký bằng email hoặc username + password khi các phương thức đó được bật trong Clerk Dashboard;
- email verification, quên mật khẩu, đổi/tạo mật khẩu và liên kết phương thức đăng nhập do Clerk xử lý;
- tab Tài khoản nhúng Clerk User Profile để quản lý Account và Security;
- frontend chỉ dùng `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`;
- không đưa secret, token hoặc database URL vào frontend, repo hoặc log;
- chưa gọi NPP Core và chưa đọc dữ liệu thật;
- đăng ký quán ở giai đoạn UI chỉ là bản nháp trên thiết bị, chưa tạo customer thật.

Màn hình vẫn mang thương hiệu Hưng Phát. Các flow nhạy cảm không tự viết lại từng phần; ứng dụng nhúng Clerk prebuilt UI đã tùy biến để Clerk tự xử lý verification, reset password, MFA/session task và các trường hợp biên.

## 2. Một Clerk user, nhiều cách đăng nhập

Core không được gắn khách hàng vào Google account, email hay username riêng lẻ. Khóa danh tính ổn định là Clerk user ID (`provider_subject`).

```text
Google OAuth ─────────────┐
Email/username + password ├─ cùng Clerk user ID ─→ portal identity ─→ membership
Các phương thức liên kết ─┘
```

Nếu khách tạo mật khẩu sau khi đã đăng nhập Google trên cùng Clerk user, Core vẫn thấy đúng một `provider_subject`. Nếu Clerk tạo hai user khác nhau do hai email khác nhau hoặc người dùng đăng ký tách rời, Core không tự gộp chỉ dựa trên email/phone; phải có flow liên kết hoặc duyệt rõ ràng.

## 3. Tách tuyệt đối nhân viên và khách hàng

```text
Nhân viên nội bộ
shared.users + employee_id + Core role/permission
Không dùng Clerk

Khách hàng bên ngoài
Clerk user + portal identity/membership trong Core sau này
Không đưa vào shared.users
```

Core không đồng bộ nhân viên sang Clerk. Chế độ hỗ trợ/impersonation trong tương lai phải có audit, không tạo tài khoản khách giả cho nhân viên.

## 4. Trạng thái người dùng

Hiện tại app chỉ biết:

```text
signed_out
signed_in_unlinked
```

Khi Core tích hợp:

```text
không có membership active -> guest
invitation pending          -> pending_activation
membership active           -> customer
membership bị khóa          -> suspended
```

Không lưu guest/customer làm nguồn sự thật trong Clerk metadata. Cùng một Clerk user có thể từ khách vãng lai thành khách hệ thống bằng cách thêm membership, không tạo user mới.

## 5. Luồng auth hiện tại

```text
Khách mở /login
        ↓
Clerk SignIn hiển thị các phương thức đã bật:
Google / email / username / password
        ↓
Clerk xử lý sign-in hoặc sign-up, verification, reset password
        ↓
Clerk tạo session cho cùng user ID
        ↓
App hiển thị dữ liệu mock
```

Tab Tài khoản gồm:

- thông tin tài khoản hiện tại;
- khu vực đăng ký quán/điểm bán ở mức bản nháp UI;
- Clerk User Profile để tạo/đổi mật khẩu, quản lý email, liên kết Google và bảo mật;
- đăng xuất.

## 6. Mô hình dữ liệu Core tương lai

Không sửa `shared.users`. Migration trong `NPP-Platform` nên bổ sung các bảng tương đương:

```text
shared.portal_users
- id
- installation_id
- display_name
- normalized_email
- normalized_phone nullable
- status
- created_at
- updated_at

shared.portal_identities
- id
- installation_id
- portal_user_id
- provider             -- clerk
- provider_subject     -- Clerk user id
- created_at
UNIQUE (installation_id, provider, provider_subject)

sales.customer_contacts
- id
- installation_id
- customer_id
- full_name
- email
- phone
- is_active

sales.customer_portal_memberships
- id
- installation_id
- portal_user_id
- customer_id
- contact_id
- role
- status
- linked_method
- linked_by_actor_id
- linked_at

sales.customer_portal_invitations
- id
- installation_id
- customer_id
- contact_id
- intended_email
- intended_phone nullable
- role
- token_hash
- status
- expires_at
- created_by_actor_id
```

Tên bảng cuối cùng phải theo master plan và migration convention của Core tại thời điểm triển khai.

## 7. Cấp quyền cho khách có sẵn trong Core

Core không tạo password và không tạo hệ login thứ hai.

```text
Nhân viên mở khách hàng trong Core
        ↓
Chọn/thêm người liên hệ cụ thể
        ↓
Bấm “Cấp quyền dùng app”
        ↓
Core tạo invitation pending
        ↓
Khách mở link và đăng nhập bằng bất kỳ phương thức Clerk đã liên kết
        ↓
Backend xác minh Clerk session + invitation
        ↓
Core tạo portal identity + membership
```

Không tự liên kết chỉ vì email hoặc số điện thoại trong `customers` trùng. Liên kết chỉ được phép khi:

1. Clerk session hợp lệ;
2. invitation active đúng installation;
3. invitation khớp đúng một contact/customer;
4. transaction chưa được nhận trước đó;
5. mutation có idempotency, audit và outbox.

Trùng hoặc không rõ phải chuyển sang duyệt trong Core.

## 8. Đăng ký quán và khách vãng lai

Giai đoạn UI:

- form “Đăng ký điểm bán” chỉ lưu bản nháp local;
- không gọi backend, không tạo customer code và không tự cấp quyền;
- nội dung phải ghi rõ chưa gửi chính thức.

Khi Core sẵn sàng:

```text
Clerk user hiện tại
        +
Đề nghị mở mới hoặc link-existing customer được duyệt
        ↓
Tạo portal user/identity + customer membership
        ↓
Cùng tài khoản đăng nhập tiếp tục sử dụng
```

Lịch sử app gắn với `portal_user_id`; dữ liệu thương mại gắn với `customer_id`.

## 9. API contract tương lai

```text
GET  /api/customer-portal/me
POST /api/customer-portal/activation/claim
POST /api/customer-portal/registrations
POST /api/customer-portal/context/select
```

Backend phải xác minh Clerk session ở server, lấy provider subject rồi tự tra quyền trong PostgreSQL. Không tin `customerId`, role, price list, credit limit hoặc địa chỉ do frontend gửi lên.

## 10. Authorization

```text
Clerk: người đăng nhập là ai?
Core: người đó được làm gì với customer nào?
```

Mã khách, bảng giá, công nợ, hạn mức, quyền đặt hàng, địa chỉ và trạng thái khóa không lưu làm nguồn sự thật trong Clerk metadata.

Mọi API phải deny-by-default và kiểm tra installation + portal identity + membership + permission tại server. Client route guard hiện tại chỉ bảo vệ UI, không phải authorization cho dữ liệu thật.

## 11. Webhook và đồng bộ

- activation/registration upsert identity đồng bộ trong request;
- webhook Clerk chỉ dùng đối soát user/email và vô hiệu hóa;
- không chờ webhook để hoàn tất activation;
- webhook verify signature, idempotent và có audit/outbox;
- xóa Clerk user không xóa customer hoặc đơn hàng.

## 12. Lộ trình

### AUTH-1 — hiện tại

- Clerk prebuilt SignIn được nhúng trong giao diện Hưng Phát;
- Google + email/username/password theo cấu hình Dashboard;
- sign-up, email verification, forgot/reset password và session tasks do Clerk xử lý;
- Clerk User Profile trong tab Tài khoản;
- đăng ký quán ở mức bản nháp UI;
- không Core API.

### AUTH-2 — Core contract và migrations

Chỉ bắt đầu khi Core đạt gate authentication + deny-by-default authorization:

- portal user/identity/contact/membership/invitation/registration;
- server-side Clerk token verification;
- `/customer-portal/me` và registration API;
- audit, outbox, idempotency và installation isolation tests.

### AUTH-3 — Cấp quyền từ Core

- mục “Người dùng app” trong chi tiết khách hàng;
- tạo/thu hồi/gửi lại invitation;
- duyệt đăng ký quán;
- link existing customer;
- nhân viên vẫn dùng Core user/role, không dùng Clerk.

### AUTH-4 — Đổi adapter

```text
UI
  -> CustomerOrderingService
      -> NppCustomerApiAdapter
          -> Core customer portal API
```

Chỉ đổi adapter sau khi contract, migration rehearsal, backup gate và exact-head CI xanh.

## 13. Acceptance gate

- một Clerk subject không tạo hai portal user;
- đổi cách đăng nhập không đổi Core identity;
- khách vãng lai được link mà không đổi tài khoản;
- khách Core chỉ được cấp quyền qua contact/invitation rõ ràng;
- nhân viên không bị đồng bộ sang Clerk;
- không auto-link chỉ bằng email/phone;
- đăng ký quán UI không giả vờ đã gửi Core;
- deny-by-default và installation isolation có test;
- mutations có idempotency, audit và outbox;
- không secret trong frontend/repo/log;
- migration có backup xác nhận và restore rehearsal;
- Core và Customer Ordering deploy độc lập, Auto Deploy luôn OFF.
