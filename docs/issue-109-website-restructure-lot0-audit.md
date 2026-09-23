# Issue #109 — Lô 0: Audit và khóa contract tái cấu trúc Website Công Ty

Baseline audit: `main@f90f82200cdfbf71ce03888974b48a3f33ca1e01`  
Ảnh tham khảo: `/anh-tham-khao-tai-cau-truc-noi-dung.png`  
Phạm vi: Website Công Ty ở repo root. `customer-ordering/**` là deployment unit riêng và không thuộc phạm vi sửa UI của issue này.

## 1. Sự thật kiến trúc đã xác nhận

- Website Công Ty là Next.js 16 App Router ở repo root, chạy dev/start cổng 3100.
- Customer Ordering nằm trong `customer-ordering/**`, chạy cổng 3200 và có CI/deploy riêng.
- Website Công Ty có CI riêng tại `.github/workflows/frontend-ci.yml`; gate hiện tại là `npm run test && npm run lint && npm run build`.
- Website đang dùng `Be Vietnam Pro`, Framer Motion và Lucide.
- Ảnh website thật được map qua `lib/site-assets.ts` từ R2, có fallback local trong `public/images/**`.
- Logo thật có `public/logo-transparent.png` và `public/logo.jpg`.

Không được gộp Website Công Ty và Customer Ordering chỉ vì cùng repo.

## 2. Route và nội dung hiện tại

| Route | Vai trò hiện tại | Nhận xét Lô 0 |
| --- | --- | --- |
| `/` | Trang chủ | Đang thiên về catalog/báo giá hơn website giới thiệu |
| `/gioi-thieu` | Giới thiệu Công Ty | Giữ, tái trình bày theo tone mới |
| `/nganh-hang` | Cẩm nang/hướng dẫn | Tên route và nội dung đang lệch nghĩa; cần tái cấu trúc |
| `/nganh-hang/[slug]` | Ngành hàng + sản phẩm + link đặt hàng | Giữ route để bảo toàn SEO, đổi thành nội dung giới thiệu ngành hàng |
| `/san-pham` | Catalog tìm/lọc sản phẩm | Giữ route/SEO trong giai đoạn chuyển đổi, đổi vai trò thành catalog giới thiệu |
| `/san-pham/[slug]` | Chi tiết SKU + báo giá | Giữ URL nếu đang index, nhưng bỏ hành vi dựng yêu cầu mua |
| `/lien-he` | Liên hệ + form báo giá | Đổi thành form liên hệ/tư vấn trung tính |
| `/tuyen-dung` | Tuyển dụng | Giữ |
| `/chinh-sach-bao-mat` | Chính sách bảo mật | Giữ |

### Route mục tiêu bổ sung

Điều hướng mục tiêu của Issue #109 cần biểu đạt rõ:

`Trang chủ | Giới thiệu | Ngành hàng | Nhãn hàng | Năng lực | Cẩm nang | Tuyển dụng | Liên hệ`

Các route mới như `/nhan-hang`, `/nang-luc`, `/cam-nang` chỉ được thêm ở lô triển khai sau khi mapping SEO/redirect được khóa. Không đổi/xóa route cũ trong Lô 0.

## 3. Dấu hiệu giao dịch đang tồn tại trên Website Công Ty

Audit source xác nhận các điểm sau:

1. `components/header.tsx`
   - có nút `Cài app`;
   - có `Nhận báo giá`;
   - có `Đặt hàng` dẫn thẳng sang Customer Ordering;
   - mobile có `Cài app đặt hàng` và `Đặt hàng khách hàng`.

2. `components/app-install-guide.tsx`
   - hướng dẫn cài PWA của `sales.nguyenlieuhungphat.com` ngay trong Website Công Ty.

3. `components/product-card.tsx`
   - mỗi card có `Nhận báo giá`;
   - card lưu sản phẩm vào localStorage;
   - UI được tổ chức như catalog lựa sản phẩm.

4. `app/san-pham/page.tsx`
   - CTA `Xem catalog đầy đủ & đặt hàng`;
   - catalog có search/filter/sort theo sản phẩm.

5. `app/nganh-hang/[slug]/page.tsx`
   - CTA `Xem catalog & đặt hàng`;
   - fallback cũng dẫn thẳng sang catalog đặt hàng.

6. `components/quote-form.tsx`
   - thu họ tên, điện thoại, Công Ty/cửa hàng, email;
   - thu sản phẩm cần tìm;
   - thu số lượng dự kiến;
   - thu khu vực giao hàng;
   - POST vào `/api/telegram/quote`.

7. `app/san-pham/[slug]/page.tsx`
   - có nhiều điểm mở form báo giá;
   - có form báo giá inline đã điền sẵn sản phẩm.

8. `components/process-section.tsx`
   - mô tả luồng `Tiếp nhận nhu cầu -> Rà soát danh mục -> Gửi báo giá -> Xác nhận giao nhận`.

9. `components/footer.tsx`
   - có `Yêu cầu báo giá`;
   - có `Đặt hàng khách hàng` dẫn sang Customer Ordering.

Kết luận kỹ thuật: Website Công Ty hiện chưa phải presentation-only surface. Lô 1–4 phải làm sạch các dấu hiệu này theo contract của Issue #109. Đây là kết luận về hành vi source, không phải kết luận pháp lý.

## 4. SEO hiện tại

- Root metadata có title/description/keywords, canonical, OpenGraph và Twitter card.
- `app/sitemap.ts` đang index:
  - trang chủ;
  - giới thiệu;
  - ngành hàng;
  - từng ngành hàng;
  - sản phẩm;
  - từng SKU;
  - liên hệ;
  - tuyển dụng;
  - chính sách bảo mật.
- `app/robots.ts` đang allow toàn site và khai báo sitemap.
- Route động ngành hàng/SKU có metadata/canonical riêng.

### Contract SEO cho các lô sau

- Không xóa route `/san-pham/[slug]` hoặc `/nganh-hang/[slug]` hàng loạt chỉ vì đổi IA.
- Nếu đổi ý nghĩa route, giữ URL hoặc redirect 301 có mapping cụ thể.
- Không để sitemap trỏ vào URL chết.
- Metadata phải chuyển từ ngôn ngữ “mua sỉ/báo giá/đặt hàng” sang ngôn ngữ giới thiệu Công Ty mà vẫn giữ giá trị tìm kiếm thật.

## 5. Audit UI density

Source CSS hiện có các dấu hiệu khiến UI nặng/thô hơn tone tham khảo:

- `.button-large` có `min-height: 52px`;
- button mặc định có `min-height: 42px`;
- product card body dùng padding khoảng `19px 19px 21px`;
- compact product card vẫn có `border-radius: 22px` và shadow;
- trust/category/product/process/contact đều dùng nhiều lớp card;
- process step có `min-height: 190px`;
- mobile có override card nhưng chưa có một contract chung về density.

### Quy tắc UI bắt buộc đã khóa

Áp dụng từ Lô 1 trở đi:

- button thon gọn, chiều cao vừa phải, padding cân đối;
- card nhẹ, bo vừa, viền/bóng rất nhẹ;
- icon/badge/chip/tab/filter/CTA cùng một density system;
- ưu tiên typography + spacing + ảnh để tạo hierarchy, không dùng nhiều khung;
- mobile không phóng button/card thành khối dày;
- nguyên tắc kiểm cuối: **gọn hơn, nhẹ hơn, ít chrome hơn nhưng vẫn dễ bấm và dễ đọc**.

Lô 1 phải giải quyết từ design token/base class trước, không vá từng component.

## 6. Content model mục tiêu

### Ngành hàng
Nguồn hiện có trong `data/site.ts` đủ nền cho 6 nhóm:
- Trà sữa & pha chế
- Mì cay
- Đông lạnh
- Ăn vặt
- Bao bì
- Gia vị & sốt

Mỗi ngành hàng cần: slug, title, mô tả, ảnh, nhóm nội dung/ứng dụng liên quan. Không cần `orderingCategoryId` cho presentation UI; field này chỉ được giữ nếu integration riêng còn cần và không lộ thành CTA giao dịch.

### Nhãn hàng
Product data hiện có `brand` ở cấp sản phẩm, nhưng chưa có content model/page nhãn hàng riêng. Lô sau cần derive danh sách nhãn hàng từ dữ liệu thật hoặc khai báo curated metadata, không tự bịa logo/thương hiệu.

### Năng lực
Nguồn nội dung hiện có:
- `CompanyCapabilitySection`;
- `siteAssets.warehouse.*`;
- các thông tin năm 2016, 6 ngành hàng, B2B.

Không được tạo số liệu kiểu số khách hàng/tỉnh/thành nếu source không có dữ liệu xác nhận.

### Cẩm nang
Nội dung hiện đang nằm nhầm ở `/nganh-hang`. Cần tách semantic:
- `/nganh-hang` = giới thiệu ngành hàng;
- `/cam-nang` = bài viết/hướng dẫn;
- giữ URL cũ bằng mapping/redirect phù hợp khi triển khai.

## 7. Asset contract

Được phép tái sử dụng:
- logo thật trong `public/`;
- ảnh R2 đã map trong `lib/site-assets.ts`;
- ảnh category/warehouse/page hero hiện có;
- ảnh tham khảo root `anh-tham-khao-tai-cau-truc-noi-dung.png` chỉ làm chuẩn tone/bố cục.

Không lấy số liệu/text giả từ ảnh tham khảo làm dữ liệu Công Ty.

## 8. Responsive/accessibility hiện trạng

- Có breakpoint 1080/820/760/430 và một số component mobile-specific.
- Có `prefers-reduced-motion`, focus ring và keyboard handling ở nhiều control.
- Header đã có menu mobile.
- Catalog/filter có mobile state riêng.

Các lô sau phải giữ các nền tảng accessibility này, đồng thời giảm density chứ không xóa focus/target-size chỉ để “mỏng” hơn.

## 9. Quyết định implementation cho Lô 1–5

1. Không clone pixel-perfect ảnh tham khảo; lấy tone, hierarchy, tỷ lệ khoảng trắng và cảm giác gọn.
2. Website Công Ty là presentation/content surface.
3. Customer Ordering vẫn là order surface riêng.
4. Header Website Công Ty bỏ dần các hành vi cài app/đặt hàng/báo giá trực tiếp, thay bằng CTA liên hệ trung tính.
5. Product pages có thể giữ để SEO nhưng trình bày như hồ sơ sản phẩm/nhãn hàng, không như SKU mua hàng.
6. Form liên hệ mục tiêu chỉ giữ dữ liệu cần cho liên hệ/tư vấn; không dùng quantity/delivery area để dựng nhu cầu mua.
7. Tách đúng semantic `Ngành hàng` và `Cẩm nang`.
8. Lô 1 phải xây density/design tokens trước rồi mới refactor component.
9. Không sửa `customer-ordering/**` trong Issue #109.
10. Merge không đồng nghĩa production deploy.

## 10. Lô 0 exit gate

Lô 0 hoàn tất khi:
- audit source/route/API/UI/SEO/assets được lưu trong repo;
- contract UI density được khóa;
- Website/Customer Ordering boundary được khóa;
- target content model được khóa;
- regression test bảo vệ contract Lô 0 chạy trong Website frontend CI;
- CI exact-head xanh trước merge.
