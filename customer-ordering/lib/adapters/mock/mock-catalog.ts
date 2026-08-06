import type { Category, Product } from "@/lib/contracts";

export const MOCK_CATEGORIES: Category[] = [
  { id: "flour", name: "Bột mì", shortName: "Bột mì" },
  { id: "sugar", name: "Đường", shortName: "Đường" },
  { id: "starch", name: "Tinh bột", shortName: "Tinh bột" },
  { id: "additive", name: "Phụ gia", shortName: "Phụ gia" },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "bot-mi-da-dung-25kg",
    categoryId: "flour",
    code: "HP-BOT-001",
    name: "Bột mì đa dụng",
    aliases: ["bột số 8", "bot so 8", "bột làm bánh"],
    packaging: "Bao 25 kg",
    unit: "bao",
    description: "Dòng bột mì đa dụng dùng cho nhiều nhóm bánh và chế biến thực phẩm.",
    availability: "available",
    price: { amount: 385000, currency: "VND", status: "available" },
    visualTone: "wheat",
  },
  {
    id: "bot-mi-banh-mi-25kg",
    categoryId: "flour",
    code: "HP-BOT-002",
    name: "Bột mì bánh mì",
    aliases: ["bột số 13", "bot so 13", "bread flour"],
    packaging: "Bao 25 kg",
    unit: "bao",
    description: "Bột mì có độ đạm phù hợp cho bánh mì và các sản phẩm cần kết cấu dai.",
    availability: "available",
    price: { amount: 412000, currency: "VND", status: "available" },
    visualTone: "wheat",
  },
  {
    id: "duong-tinh-luyen-rs-50kg",
    categoryId: "sugar",
    code: "HP-DUONG-001",
    name: "Đường tinh luyện RS",
    aliases: ["đường cát trắng", "duong cat trang", "rs"],
    packaging: "Bao 50 kg",
    unit: "bao",
    description: "Đường tinh luyện dạng hạt, phù hợp cho sản xuất và chế biến thực phẩm.",
    availability: "available",
    price: { amount: 1050000, currency: "VND", status: "available" },
    visualTone: "sugar",
  },
  {
    id: "tinh-bot-bap-25kg",
    categoryId: "starch",
    code: "HP-TINH-001",
    name: "Tinh bột bắp",
    aliases: ["bột bắp", "bot bap", "corn starch"],
    packaging: "Bao 25 kg",
    unit: "bao",
    description: "Tinh bột bắp dùng tạo độ sánh và ổn định kết cấu sản phẩm.",
    availability: "available",
    price: { amount: null, currency: "VND", status: "customer_price_pending" },
    visualTone: "starch",
  },
  {
    id: "bot-nang-25kg",
    categoryId: "starch",
    code: "HP-TINH-002",
    name: "Bột năng",
    aliases: ["tinh bột khoai mì", "bot nang", "tapioca starch"],
    packaging: "Bao 25 kg",
    unit: "bao",
    description: "Bột năng dùng tạo độ dai, trong và kết dính cho nhiều dòng sản phẩm.",
    availability: "out_of_stock",
    price: { amount: 468000, currency: "VND", status: "available" },
    visualTone: "starch",
  },
  {
    id: "bot-no-10kg",
    categoryId: "additive",
    code: "HP-PG-001",
    name: "Bột nở",
    aliases: ["baking powder", "bot no"],
    packaging: "Thùng 10 kg",
    unit: "thùng",
    description: "Phụ gia tạo nở cho các sản phẩm bánh; hiện đang tạm ngưng nhận đơn.",
    availability: "paused",
    price: { amount: null, currency: "VND", status: "customer_price_pending" },
    visualTone: "additive",
  },
];

export function normalizeCatalogText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("vi")
    .trim();
}

export function cloneProduct(product: Product): Product {
  return {
    ...product,
    aliases: [...product.aliases],
    price: { ...product.price },
  };
}
