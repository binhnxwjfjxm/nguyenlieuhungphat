# Customer Ordering — Clerk trước, kết nối NPP Core sau

## 1. Quyết định hiện tại

Customer Ordering dùng **Clerk cho danh tính người dùng bên ngoài** trong khi NPP Core chưa hoàn thiện login và deny-by-default authorization cho customer portal.

Giai đoạn hiện tại:

- đăng nhập và tự đăng ký bằng **Google OAuth**;
- Google account mới trở thành khách vãng lai;
- chưa gọi NPP Core và chưa đọc dữ liệu thật;
- chưa tạo migration/database;
- không sửa repo `NPP-Platform`;
- frontend chỉ dùng `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`;
- không đưa secret, token hoặc database URL vào frontend/repo/log.

Username/password hoặc email/password là khả năng Clerk hỗ trợ, nhưng **không bật trong phase này** để tránh tạo thêm flow xác minh email, quên mật khẩu và liên kết tài khoản trùng với Google.

## 2. Tách tuyệt đối nhân viên và khách hàng

```text
Nhân viên nội bộ
shared.users + employee_id + Core role/permission
Không dùng Clerk

Khách hàng bên ngoài
Clerk user + portal identity/membership trong Core sau này
Không đưa vào shared.users
```

Core không đồng bộ nhân viên sang Clerk. Một nhân viên cần truy cập Customer Ordering với tư cách hỗ trợ phải dùng chế độ hỗ trợ/impersonation có audit sau này, không tạo tài khoản khách giả.

## 3. Trạng thái người dùng

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

Không lưu guest/customer làm nguồn sự thật trong Clerk metadata. Cùng một Clerk user có thể từ khách vãng lai trở thành khách hệ thống bằng cách thêm membership, không tạo user mới.

## 4. Luồng Google hiện tại

```text
Khách bấm "Tiếp tục với Google"
        ↓
Google xác minh danh tính
        ↓
Clerk sign-in hoặc tự chuyển sang sign-up nếu chưa có user
        ↓
Callback hoàn tất session
        ↓
App hiển thị dữ liệu mock
```

Khách chỉ thấy giao diện Hưng Phát. Tên provider, Clerk subject và khóa kỹ thuật không xuất hiện trong nghiệp vụ.

## 5. Mô hình dữ liệu Core tương lai

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

## 6. Cấp quyền cho khách có sẵn trong Core

Core không tạo password và không tạo hệ login thứ hai.

```text
Nhân viên mở khách hàng trong Core
        ↓
Chọn/thêm người liên hệ cụ thể
        ↓
Bấm "Cấp quyền dùng app"
        ↓
Core tạo invitation pending
        ↓
Khách mở link và đăng nhập Google
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

## 7. Khách vãng lai thành khách hệ thống

```text
Clerk user hiện tại
        +
Core phê duyệt khách mới hoặc link-existing customer
        ↓
Tạo customer portal membership
        ↓
Cùng tài khoản Google trở thành khách hệ thống
```

Lịch sử app gắn với `portal_user_id`; dữ liệu thương mại gắn với `customer_id`.

## 8. API contract tương lai

```text
GET  /api/customer-portal/me
POST /api/customer-portal/activation/claim
POST /api/customer-portal/context/select
```

`GET /me` tối thiểu trả portal user, memberships và active customer. Backend phải xác minh Clerk session ở server, lấy provider subject rồi tự tra quyền trong PostgreSQL. Không tin `customerId`, role, price list, credit limit hoặc địa chỉ do frontend gửi lên.

## 9. Authorization

```text
Clerk: người đăng nhập là ai?
Core: người đó được làm gì với customer nào?
```

Mã khách, bảng giá, công nợ, hạn mức, quyền đặt hàng, địa chỉ và trạng thái khóa không lưu làm nguồn sự thật trong Clerk metadata.

Mọi API phải deny-by-default và kiểm tra installation + portal identity + membership + permission tại server. Client route guard hiện tại chỉ là bảo vệ UI, không phải authorization cho dữ liệu thật.

## 10. Webhook và đồng bộ

- activation upsert identity đồng bộ trong request;
- webhook Clerk chỉ dùng đối soát user/email và vô hiệu hóa;
- không chờ webhook để hoàn tất activation;
- webhook verify signature, idempotent và có audit/outbox;
- xóa Clerk user không xóa customer hoặc đơn hàng.

## 11. Lộ trình

### AUTH-1 — hiện tại

- Google OAuth sign-in/sign-up;
- session, logout và protected UI route;
- callback + CAPTCHA cho sign-up;
- dữ liệu mock;
- không Core API.

### AUTH-2 — Core contract và migrations

Chỉ bắt đầu khi Core đạt gate authentication + deny-by-default authorization:

- portal user/identity/contact/membership/invitation;
- server-side Clerk token verification;
- `/customer-portal/me`;
- audit, outbox, idempotency và installation isolation tests.

### AUTH-3 — Cấp quyền từ Core

- mục “Người dùng app” trong chi tiết khách hàng;
- tạo/thu hồi/gửi lại invitation;
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

## 12. Acceptance gate

- một Clerk subject không tạo hai portal user;
- khách vãng lai được link mà không đổi tài khoản;
- khách Core chỉ được cấp quyền qua contact/invitation rõ ràng;
- nhân viên không bị đồng bộ sang Clerk;
- không auto-link chỉ bằng email/phone;
- deny-by-default và installation isolation có test;
- mutations có idempotency, audit và outbox;
- không secret trong frontend/repo/log;
- migration có backup xác nhận và restore rehearsal;
- Core và Customer Ordering deploy độc lập, Auto Deploy luôn OFF.
