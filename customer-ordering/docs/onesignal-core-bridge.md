# Customer Ordering — OneSignal / NPP Core bridge

## Mục tiêu

UI-5 dùng OneSignal cho web push ngay ở frontend, nhưng không biến OneSignal thành nguồn dữ liệu nghiệp vụ. Khi NPP Core được nối vào Customer Ordering, Core vẫn là nguồn sự thật cho đơn hàng, tin công ty, đối tượng nhận và tùy chọn thông báo.

## Ranh giới hiện tại

```text
Notification UI
    -> CustomerOrderingService
        -> MockCustomerOrderingAdapter       # hiện tại
        -> NppCustomerApiAdapter             # giai đoạn Core

Signed-in browser
    -> OneSignal Web SDK v16
    -> external_id = Clerk user ID
```

OneSignal chỉ phụ trách permission, push subscription và delivery. Danh sách thông báo trong app không đọc từ OneSignal.

## Identity contract

Frontend gọi `OneSignal.login(clerkUser.id)` sau khi Clerk xác định người dùng. Clerk user ID chính là `provider_subject` mà Core sẽ dùng để ánh xạ external identity; không dùng email làm khóa nối.

Khi người dùng đăng xuất, frontend gọi `OneSignal.logout()` để tách subscription khỏi external identity cũ.

Core sau này chỉ cần lấy Clerk `provider_subject` của khách đã liên kết để target đúng OneSignal `external_id`.

## Customer API contract cần Core triển khai sau

Frontend đã khóa các method sau trong `CustomerOrderingAdapter`:

- `listAnnouncements()`
- `getAnnouncementById(announcementId)`
- `markAnnouncementRead(announcementId)`
- `getNotificationPreference()`
- `saveNotificationPreference(preference)`

`NppCustomerApiAdapter` sẽ thay Mock adapter mà không đổi component UI.

## Luồng gửi production sau này

```text
NPP Core domain event
    -> audit/outbox
    -> tạo notification/inbox record cho khách
    -> commit DB
    -> worker/outbox sender
    -> OneSignal REST API
       target external_id = Clerk provider_subject
    -> Customer PWA
```

Push là tín hiệu nhắc. Inbox/notification record trong Core mới là dữ liệu có thể tải lại, đánh dấu đã đọc và đối soát.

## Sự kiện dự kiến

- Đơn đã được tiếp nhận.
- Đơn đã xác nhận.
- Đơn đang xử lý.
- Đơn đang giao.
- Đơn hoàn tất / bị từ chối / bị hủy.
- Tin công ty.
- Chương trình hoặc khuyến mại theo đối tượng khách.

Payload push nên chỉ mang dữ liệu điều hướng tối thiểu như `type`, `entity_id`, `deep_link` và `event_id`; frontend mở route tương ứng rồi tải dữ liệu thật từ Core.

## OneSignal server boundary

- App ID là public client configuration.
- REST API key chỉ dùng trong backend/outbox sender của Core.
- Không đưa REST API key vào `customer-ordering/**` client bundle.
- Core chịu trách nhiệm retry, audit và chống gửi lặp theo event/outbox id.

## Service worker

Customer Ordering dùng đúng một worker gốc:

```text
/OneSignalSDKWorker.js
scope: /
```

Worker này vừa import OneSignal Web Push worker, vừa giữ offline fallback và các tài nguyên PWA an toàn. Không đăng ký thêm `/sw.js` hoặc worker OneSignal ở scope con vì nhiều registration cùng tồn tại làm vòng đời PWA khó kiểm soát.

Client chỉ kiểm tra cập nhật worker theo chu kỳ sau khi trang đã tải và trình duyệt rảnh; không ép `update()` mỗi lần mở app. Worker mới không tự `skipWaiting()` hoặc `clients.claim()`, nên bản cập nhật không chiếm quyền điều khiển giữa phiên đang dùng.
