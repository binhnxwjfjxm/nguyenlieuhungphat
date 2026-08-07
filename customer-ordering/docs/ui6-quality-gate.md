# UI-6 — Mobile/PWA quality gate

UI-6 là bước polish cuối trước khi mở tích hợp NPP Core. Không thêm nghiệp vụ mới và không thay nguồn sự thật của auth, đơn hàng hay thông báo.

## Viewport bắt buộc

- 390 × 844
- 430 × 932

Ở cả hai kích thước phải giữ đúng một vùng cuộn nội dung, không có horizontal scroll, header và bottom navigation tính safe area đúng một lần.

## App chrome

- Header và bottom navigation dùng glass surface có alpha thật + backdrop blur.
- Không chuyển hai thanh sang `position: fixed`; giữ grid shell để không tạo gap đáy hoặc hai vùng cuộn.
- Tap target chính tối thiểu 48px, icon header tối thiểu 44px.

## PWA

- Manifest `standalone` và icon hiện hữu phải giữ nguyên.
- Root service worker `/sw.js` chỉ cache tài nguyên shell an toàn và fallback `/offline`; không cache dữ liệu riêng tư.
- Service worker phải register cả khi effect chạy sau sự kiện `window.load`.
- Install prompt chỉ mở sau thao tác người dùng. iOS hiển thị hướng dẫn Share → Add to Home Screen khi không có `beforeinstallprompt`.
- OneSignal worker tiếp tục ở scope riêng `/push/onesignal/`, không chiếm root scope của PWA.

## Regression flow

- Clerk: đăng nhập, đăng ký, đăng xuất và auth gate.
- Cart → checkout → submit → order success.
- Orders: list/detail, reorder, guarded cancel.
- News/notifications: loading/empty/error, read state, deep link.
- OneSignal: permission, opt-in/opt-out, Clerk user ID binding.

## Accessibility

- Keyboard focus rõ cho button/link/input/select/textarea.
- Reduced motion được tôn trọng.
- Nội dung không vỡ ở 390px/430px; title dài phải co/ellipsis thay vì đẩy header tràn ngang.
