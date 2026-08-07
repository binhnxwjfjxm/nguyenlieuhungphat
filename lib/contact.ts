export const COMPANY_NAME = "Công ty TNHH TM Nguyên Liệu Hưng Phát";
export const COMPANY_EMAIL = "baogia@nguyenlieuhungphat.com";
export const COMPANY_ADDRESS_DISPLAY = "152 Yersin, phường Đạo Thạnh, tỉnh Đồng Tháp";
export const COMPANY_ADDRESS_STREET = "152 Yersin";
export const COMPANY_ADDRESS_LOCALITY = "phường Đạo Thạnh";
export const COMPANY_ADDRESS_REGION = "Đồng Tháp";

export const ZALO_PHONE_DISPLAY = "0396 980 168";
export const ZALO_PHONE = "0396980168";
export const ZALO_URL = `https://zalo.me/${ZALO_PHONE}`;

export const CUSTOMER_ORDERING_URL = "https://sales.nguyenlieuhungphat.com";
export function getCustomerOrderingCategoryUrl(categoryId: string) {
  return `${CUSTOMER_ORDERING_URL}/products?category=${encodeURIComponent(categoryId)}`;
}

export const PRIVACY_POLICY_PATH = "/chinh-sach-bao-mat";
