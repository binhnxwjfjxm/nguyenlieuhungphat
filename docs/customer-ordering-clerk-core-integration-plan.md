# Customer Ordering — Clerk trước, kết nối NPP Core sau

## 1. Mục tiêu và quyết định đã khóa

Customer Ordering dùng **Clerk làm hệ xác thực duy nhất cho người dùng bên ngoài** ngay từ giai đoạn UI.

NPP Core hiện chưa hoàn thiện login và deny-by-default authorization cho customer portal, vì vậy phase hiện tại:

- chỉ xác thực số điện thoại và giữ phiên bằng Clerk;
- chưa gọi NPP Core;
- chưa đọc khách hàng, bảng giá, công nợ, địa chỉ hoặc đơn hàng thật;
- chưa tạo database/migration;
- không sửa repo `NPP-Platform`;
- không merge hoặc deploy production nếu chưa có lệnh rõ.

Khách hàng chỉ thấy giao diện Hưng Phát. Tên Clerk, provider subject và khóa kỹ thuật không xuất hiện trong giao diện nghiệp vụ.

## 2. Không trùng tài khoản nhân viên nội bộ

Hai miền danh tính phải tách tuyệt đối:

```text
Nhân viên nội bộ
Core shared.users + employee_id + role/permission
Không cần Clerk khi Core tạo user nhân viên

Khách hàng bên ngoài
Clerk user + customer portal identity/membership trong Core sau này
Không được đưa vào shared.users của nhân viên
```

Core không được đồng bộ toàn bộ nhân viên sang Clerk. Clerk chỉ phục vụ Customer Ordering và các portal bên ngoài nếu sau này có quyết định rõ.

## 3. Trạng thái người dùng Customer Ordering

Trong phase Clerk-only, ứng dụng chỉ biết danh tính đã xác minh:

```text
signed_out
signed_in_unlinked
```

Khi Core tích hợp, trạng thái nghiệp vụ được suy ra từ membership:

```text
Không có membership active  -> guest
Có invitation pending       -> pending_activation
Có membership active        -> customer
Membership bị khóa           -> suspended
```

Không lưu `user_type=guest/customer` cố định trong Clerk, vì một khách vãng lai có thể được liên kết thành khách hệ thống mà không đổi tài khoản.

## 4. Luồng hiện tại: Clerk-only

```text
Khách nhập số điện thoại trên sales.nguyenlieuhungphat.com
        ↓
Clerk gửi OTP
        ↓
Số đã có Clerk user: đăng nhập
Số chưa có Clerk user: tạo khách vãng lai
        ↓
Clerk giữ session
        ↓
App hiển thị dữ liệu mock
```

UI dùng custom flow của Hưng Phát, không dùng trang Account Portal công khai của Clerk.

Biến môi trường duy nhất ở frontend:

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
```

Không đưa `CLERK_SECRET_KEY`, API key, token hoặc database URL vào repo, client bundle, ảnh chụp hoặc tài liệu có giá trị thật.

## 5. Mô hình dữ liệu Core tương lai

Không sửa `shared.users` hiện tại của nhân viên. Khi Core sẵn sàng, migration trong repo `NPP-Platform` nên bổ sung các bảng tương đương:

```text
shared.portal_users
- id
- installation_id
- display_name
- normalized_phone
- normalized_email
- status
- created_at
- updated_at

shared.portal_identities
- id
- portal_user_id
- provider              -- clerk
- provider_subject      -- Clerk user id
- created_at
UNIQUE (installation_id, provider, provider_subject)

sales.customer_contacts
- id
- installation_id
- customer_id
- full_name
- phone
- email
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
- intended_phone
- intended_email
- role
- token_hash
- status
- expires_at
- created_by_actor_id
```

Tên bảng cuối cùng phải theo master plan và migration convention của NPP Core sau khi audit exact main tại thời điểm làm integration.

## 6. Khách có sẵn trong Core

Core không tạo password và không tạo một hệ login thứ hai.

Luồng cấp quyền:

```text
Nhân viên mở khách hàng có sẵn trong Core
        ↓
Chọn/thêm người liên hệ cụ thể
        ↓
Bấm "Cấp quyền dùng app"
        ↓
Core tạo portal invitation pending
        ↓
Khách xác minh đúng số điện thoại bằng giao diện Hưng Phát
        ↓
Backend lấy Clerk subject từ session đã xác minh
        ↓
Core tạo portal identity + customer membership
```

Không tự liên kết chỉ vì `customers.phone` trùng. Số điện thoại chung của cửa hàng có thể thuộc nhiều người hoặc được nhập tạm.

Tự động liên kết chỉ được phép khi:

1. số điện thoại đã được Clerk xác minh;
2. có invitation active cho đúng installation;
3. invitation khớp đúng một contact/customer;
4. transaction chưa được nhận trước đó;
5. mutation có idempotency, audit và outbox.

Trường hợp trùng hoặc không rõ phải chuyển sang duyệt trong Core.

## 7. Khách vãng lai chuyển thành khách hệ thống

Không tạo Clerk user mới.

```text
Clerk user hiện tại
        +
Core phê duyệt khách mới hoặc link-existing customer
        ↓
Tạo customer portal membership
        ↓
Cùng tài khoản đăng nhập trở thành khách hệ thống
```

Lịch sử app gắn với `portal_user_id`; dữ liệu thương mại gắn với `customer_id`. Việc liên kết không làm mất phiên hoặc bắt khách đổi mật khẩu.

## 8. API contract tương lai

Customer Ordering gọi backend Core/BFF cùng domain hoặc boundary đã được duyệt:

```text
GET  /api/customer-portal/me
POST /api/customer-portal/activation/claim
POST /api/customer-portal/context/select
```

`GET /me` tối thiểu trả:

```json
{
  "portalUser": {
    "id": "uuid",
    "displayName": "Nguyễn Văn A",
    "phone": "+84901234567"
  },
  "memberships": [
    {
      "customerId": "uuid",
      "customerCode": "KH00128",
      "customerName": "Cửa hàng Minh Phát",
      "role": "owner",
      "status": "active"
    }
  ],
  "activeCustomerId": "uuid-or-null"
}
```

Backend phải xác minh Clerk session token ở server, lấy provider subject, rồi tự tra quyền trong PostgreSQL. Không tin `customerId`, role, credit limit hoặc price list do frontend gửi lên.

## 9. Authorization và ranh giới bảo mật

Clerk trả lời:

```text
Người đăng nhập là ai?
```

NPP Core trả lời:

```text
Người đó được làm gì với customer nào?
```

Các quyền nghiệp vụ không lưu làm nguồn sự thật trong Clerk metadata:

- mã khách hàng;
- bảng giá;
- công nợ/hạn mức;
- quyền xem hoặc đặt hàng;
- địa chỉ được phép dùng;
- trạng thái khóa giao dịch.

Mọi API phải deny-by-default, kiểm tra installation, portal identity, membership và permission tại server.

Phase Clerk-only hiện tại chỉ là authentication UI/session. Client route guard không được coi là authorization hoặc hàng rào bảo vệ dữ liệu thật.

## 10. Đồng bộ và webhook

Khi Core có backend portal:

- luồng login/activation phải upsert identity đồng bộ trong request;
- webhook Clerk chỉ dùng để đối soát thay đổi user/phone và xử lý vô hiệu hóa;
- không chờ webhook để hoàn tất activation;
- webhook phải verify signature, idempotent và ghi audit/outbox;
- xóa Clerk user không tự xóa customer hoặc đơn hàng.

## 11. Các phase triển khai sau

### AUTH-1 — Clerk foundation trong Customer Ordering

- custom phone OTP sign-in/sign-up;
- session và logout;
- protected UI route;
- env placeholder;
- không Core API.

### AUTH-2 — Core contract và migrations

Chỉ bắt đầu khi NPP Core đã đạt gate authentication + deny-by-default authorization:

- portal user/identity/contact/membership/invitation migrations;
- server-side Clerk token verification;
- `/customer-portal/me`;
- audit, outbox và idempotency;
- test isolation theo installation.

### AUTH-3 — Cấp quyền từ giao diện Core

- mục "Người dùng app" trong chi tiết khách hàng;
- tạo/thu hồi/gửi lại invitation;
- link existing customer;
- không tạo password;
- nhân viên nội bộ vẫn dùng user/role Core, không dùng Clerk.

### AUTH-4 — Chuyển mock adapter sang NPP adapter

```text
UI
  -> CustomerOrderingService
      -> NppCustomerApiAdapter
          -> NPP Core customer portal API
```

Chỉ thay adapter sau khi contract, migration rehearsal, backup gate và exact-head CI xanh.

## 12. Acceptance gate cho integration tương lai

- một Clerk user không bị tạo thành hai portal user;
- khách vãng lai được link thành khách hệ thống mà không đổi login;
- khách Core có sẵn chỉ được cấp quyền qua contact/invitation rõ ràng;
- nhân viên nội bộ không bị đồng bộ sang Clerk;
- không tin phone/customerId từ client để tự cấp quyền;
- deny-by-default và installation isolation có test;
- mutation có idempotency, audit và outbox;
- không có secret trong frontend, repo hoặc log;
- migration có backup xác nhận và restore rehearsal trước production;
- Core và Customer Ordering deploy độc lập, Auto Deploy vẫn OFF.
