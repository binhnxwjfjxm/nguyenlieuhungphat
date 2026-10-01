# CUSTOMER ORDERING — VERCEL DEPLOY BOUNDARY

## 1. Mục tiêu

Repo `binhnxwjfjxm/nguyenlieuhungphat` sẽ chứa hai frontend độc lập và phải deploy bằng hai đường riêng:

| Frontend | Source root | Vercel root directory | Domain mục tiêu |
|---|---|---|---|
| Website công ty | repo root | `.` | `nguyenlieuhungphat.com` |
| Customer Ordering PWA | `customer-ordering/` | `customer-ordering` | `order.nguyenlieuhungphat.com` |

Không được dùng một script hoặc một workflow chung để tự chọn project theo phỏng đoán. Mỗi frontend phải có project ID, guard, deploy, smoke và rollback riêng.

Tài liệu này chỉ khóa yêu cầu. Chưa tạo project Vercel, chưa tạo secret, chưa deploy production.

## 2. Auto Deploy

- Auto Deploy của cả Website và Customer Ordering luôn OFF.
- Production chỉ được deploy bằng lệnh thủ công rõ ràng trên GitHub Issue được workflow xác thực chính xác.
- Merge vào `main` không tự động deploy bất kỳ frontend nào.
- Deploy Customer Ordering không được kéo theo deploy Website.
- Deploy Website không được kéo theo deploy Customer Ordering.
- Không deploy NPP Core hoặc bất kỳ backend nào từ repo này.

## 3. File phải tạo khi bắt đầu code

### 3.1 Script dùng chung để khóa ranh giới

```text
scripts/vercel/verify-project-boundary.mjs
```

Script phải nhận loại frontend và xác minh:

- Đúng repository.
- Đúng exact `origin/main` SHA.
- Working tree của runner sạch.
- Đúng Vercel project ID được truyền qua secret.
- Đúng root directory.
- Đúng production branch `main`.
- Không dùng project ID của frontend còn lại.
- Không in token, project ID đầy đủ hoặc secret ra log.

### 3.2 Script deploy Website

```text
scripts/vercel/deploy-website-production.mjs
```

Ràng buộc:

- Chỉ dùng `VERCEL_WEBSITE_PROJECT_ID`.
- Root directory bắt buộc là `.`.
- Không đọc `VERCEL_CUSTOMER_ORDERING_PROJECT_ID` để fallback.
- Build Website bằng package/lockfile tại repo root.
- Deploy đúng exact SHA đã checkout.
- Xuất evidence đã làm sạch gồm SHA, deployment ID rút gọn, trạng thái và smoke result.

### 3.3 Script deploy Customer Ordering

```text
scripts/vercel/deploy-customer-ordering-production.mjs
```

Ràng buộc:

- Chỉ dùng `VERCEL_CUSTOMER_ORDERING_PROJECT_ID`.
- Root directory bắt buộc là `customer-ordering`.
- Không đọc `VERCEL_WEBSITE_PROJECT_ID` để fallback.
- Build bằng `customer-ordering/package.json` và lockfile riêng.
- Deploy đúng exact SHA đã checkout.
- Xuất evidence đã làm sạch gồm SHA, deployment ID rút gọn, trạng thái và smoke result.

## 4. GitHub Actions phải tách riêng

### 4.1 Website production deploy

```text
.github/workflows/vercel-website-production-manual.yml
```

Lệnh issue comment dự kiến:

```text
/deploy-website-production
```

Workflow chỉ chạy khi:

- Comment khớp chính xác toàn bộ chuỗi.
- Người gọi có quyền phù hợp.
- Checkout exact `main`.
- Guard xác nhận project Website và root `.`.
- Website CI tại exact SHA đã xanh.

### 4.2 Customer Ordering production deploy

```text
.github/workflows/vercel-customer-ordering-production-manual.yml
```

Lệnh issue comment dự kiến:

```text
/deploy-customer-ordering-production
```

Workflow chỉ chạy khi:

- Comment khớp chính xác toàn bộ chuỗi.
- Người gọi có quyền phù hợp.
- Checkout exact `main`.
- Guard xác nhận project Customer Ordering và root `customer-ordering`.
- Customer Ordering CI tại exact SHA đã xanh.

Hai workflow không được gọi lẫn script deploy của nhau.

## 5. Tên biến môi trường và secret

Chỉ khóa tên biến, không ghi giá trị thật vào repo, issue, log hoặc screenshot:

```text
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_WEBSITE_PROJECT_ID
VERCEL_CUSTOMER_ORDERING_PROJECT_ID
WEBSITE_PRODUCTION_ORIGIN
CUSTOMER_ORDERING_PRODUCTION_ORIGIN
```

Các biến Customer Ordering kết nối NPP Core chỉ được thêm sau Phase API/Integration. Không tạo secret backend giả trong giai đoạn UI mock.

## 6. CI độc lập trước deploy

### Website

Workflow hiện tại:

```text
.github/workflows/frontend-ci.yml
```

Phải tiếp tục chỉ kiểm Website root. Không chạy `npm ci` của Customer Ordering trong job Website.

### Customer Ordering

Workflow mới:

```text
.github/workflows/customer-ordering-ci.yml
```

Path filter:

```text
customer-ordering/**
.github/workflows/customer-ordering-ci.yml
scripts/vercel/**
.github/workflows/vercel-customer-ordering-production-manual.yml
```

Job phải chạy trong `customer-ordering/` với package và lockfile riêng.

## 7. Smoke production tách riêng

### Website

Sau deploy Website phải kiểm tối thiểu:

```text
/
/san-pham
/_next/static/*
```

Phải xác nhận domain thật trả đúng nội dung Website, không chỉ dựa vào trạng thái `READY` của Vercel.

### Customer Ordering

Sau deploy Customer Ordering phải kiểm tối thiểu:

```text
/login
/
/products
/quick-order
/orders
/manifest.webmanifest
/_next/static/*
```

Khi auth thật chưa có, smoke phải hiểu đúng redirect/login contract. Sau khi có auth, bổ sung kiểm tra reload PWA giữ phiên.

## 8. Rollback độc lập

- Website rollback chỉ trỏ lại deployment Website trước đó.
- Customer Ordering rollback chỉ trỏ lại deployment Customer Ordering trước đó.
- Không rollback cả hai chỉ vì một frontend lỗi.
- Evidence phải ghi rõ frontend, source SHA, deployment trước/sau và smoke result.

## 9. Provider audit trước khi tạo hoặc deploy

Trước thay đổi provider thực tế phải audit:

1. Team/org Vercel đang kết nối.
2. Project Website hiện tại, project ID, root directory, production branch và domain.
3. Customer Ordering project đã tồn tại hay chưa.
4. Auto Deploy của từng project.
5. Domain/DNS thực tế trên Cloudflare.
6. Không được đoán project name hoặc tái sử dụng nhầm project Website cho Customer Ordering.

Nếu Customer Ordering project chưa tồn tại, phải tạo project riêng sau khi có lệnh rõ; không sửa root directory của project Website hiện hữu.

## 10. Gate triển khai script

Các script/workflow chỉ được coi là hoàn tất khi có test khóa:

- Website script từ chối Customer Ordering project ID.
- Customer Ordering script từ chối Website project ID.
- Sai root directory phải fail trước build/deploy.
- Sai exact SHA phải fail.
- Sai issue comment phải không chạy.
- Thiếu CI xanh tại exact SHA phải fail.
- Log không chứa token hoặc secret.
- Smoke domain thật phải chạy sau deploy.
- Không có backend deploy hoặc database migration.

## 11. Thứ tự thực hiện

1. Merge master plan sau khi được duyệt.
2. Phase UI-0 tạo app `customer-ordering/` và CI riêng.
3. Cùng Phase UI-0 tạo guard và hai script deploy tách biệt, nhưng chưa deploy production.
4. Tạo hai workflow production thủ công.
5. Test guard bằng dữ liệu giả/fixture, không dùng secret thật trong PR.
6. Chỉ audit/tạo Vercel Customer Ordering project khi có yêu cầu rõ.
7. Chỉ production deploy khi CI xanh và có lệnh chính xác.

## 12. Kết luận

- Một repo có thể chứa hai frontend, nhưng runtime và deploy phải tách tuyệt đối.
- Website giữ root `.` và project hiện hữu.
- Customer Ordering dùng root `customer-ordering` và project Vercel riêng.
- Có hai script, hai workflow, hai smoke và hai rollback độc lập.
- Không tự deploy backend, không tạo database riêng và không dùng Supabase làm backend Customer Ordering.