export type Product = {
  slug: string;
  name: string;
  englishName: string;
  category: string;
  categorySlug: string;
  image: string;
  shortDescription: string;
  description: string;
  origin: string;
  packaging: string;
  applications: string[];
  features: string[];
  specifications: { label: string; value: string }[];
  featured: boolean;
};

export type ProductCategory = {
  slug: string;
  title: string;
  description: string;
};

export const productCategories: ProductCategory[] = [
  {
    slug: "nguyen-lieu-cong-nghiep",
    title: "Nguyên liệu công nghiệp",
    description: "Hạt nhựa, khoáng chất và nguyên liệu nền cho nhiều dây chuyền sản xuất.",
  },
  {
    slug: "hoa-chat-phu-gia",
    title: "Hóa chất & phụ gia",
    description: "Nhóm nguyên liệu hỗ trợ điều chỉnh tính chất và tối ưu quy trình sản xuất.",
  },
  {
    slug: "nguyen-lieu-thuc-pham",
    title: "Nguyên liệu thực phẩm",
    description: "Nguyên liệu phổ biến cho chế biến thực phẩm và đồ uống.",
  },
  {
    slug: "vat-tu-bao-bi",
    title: "Vật tư & bao bì",
    description: "Giải pháp phục vụ đóng gói, bảo quản và lưu thông hàng hóa.",
  },
];

export const products: Product[] = [
  {
    slug: "hat-nhua-pp",
    name: "Hạt nhựa PP",
    englishName: "Polypropylene",
    category: "Nguyên liệu công nghiệp",
    categorySlug: "nguyen-lieu-cong-nghiep",
    image: "/images/product-pp.svg",
    shortDescription: "Hạt nhựa nhiệt dẻo có độ bền cơ học tốt, trọng lượng nhẹ và khả năng gia công linh hoạt.",
    description:
      "Hạt nhựa PP phù hợp cho nhiều ứng dụng ép phun, thổi màng và sản xuất bao bì. Hưng Phát tư vấn lựa chọn cấp hạt theo yêu cầu độ cứng, độ trong và điều kiện gia công thực tế.",
    origin: "Châu Á",
    packaging: "Bao 25 kg",
    applications: ["Bao bì", "Ép phun", "Gia dụng", "Dệt bao"],
    features: ["Trọng lượng nhẹ", "Độ bền cơ học tốt", "Kháng ẩm", "Dễ gia công"],
    specifications: [
      { label: "Dạng", value: "Hạt nguyên sinh / tái sinh theo yêu cầu" },
      { label: "Màu sắc", value: "Tự nhiên hoặc theo mẫu" },
      { label: "Quy cách", value: "Bao 25 kg" },
      { label: "Lưu kho", value: "Nơi khô ráo, tránh ánh nắng trực tiếp" },
    ],
    featured: true,
  },
  {
    slug: "bot-da-caco3",
    name: "Bột đá CaCO₃",
    englishName: "Calcium Carbonate",
    category: "Nguyên liệu công nghiệp",
    categorySlug: "nguyen-lieu-cong-nghiep",
    image: "/images/product-caco3.svg",
    shortDescription: "Khoáng chất độ trắng cao dùng làm chất độn và điều chỉnh tính chất sản phẩm.",
    description:
      "Bột đá CaCO₃ được cung ứng theo nhiều dải kích thước hạt và độ trắng, phù hợp cho nhựa, sơn, cao su, giấy và vật liệu xây dựng. Thông số được tư vấn theo từng mục đích sử dụng.",
    origin: "Việt Nam",
    packaging: "Bao 25–50 kg",
    applications: ["Nhựa", "Sơn", "Cao su", "Giấy"],
    features: ["Độ trắng ổn định", "Phân tán tốt", "Giảm chi phí phối liệu", "Nhiều cỡ hạt"],
    specifications: [
      { label: "Thành phần chính", value: "Calcium Carbonate" },
      { label: "Dạng", value: "Bột mịn" },
      { label: "Quy cách", value: "Bao 25 kg hoặc 50 kg" },
      { label: "Ứng dụng", value: "Nhựa, sơn, cao su, giấy" },
    ],
    featured: true,
  },
  {
    slug: "duong-tinh-luyen",
    name: "Đường tinh luyện",
    englishName: "Refined Sugar",
    category: "Nguyên liệu thực phẩm",
    categorySlug: "nguyen-lieu-thuc-pham",
    image: "/images/product-sugar.svg",
    shortDescription: "Đường tinh thể trắng, vị ngọt sạch, phù hợp cho chế biến thực phẩm và đồ uống.",
    description:
      "Đường tinh luyện được lựa chọn theo tiêu chí độ tinh khiết, màu sắc và khả năng hòa tan. Sản phẩm phù hợp cho các cơ sở sản xuất thực phẩm, bánh kẹo, đồ uống và chế biến công nghiệp.",
    origin: "Việt Nam",
    packaging: "Bao 50 kg",
    applications: ["Đồ uống", "Bánh kẹo", "Thực phẩm", "Chế biến"],
    features: ["Độ tinh khiết cao", "Hòa tan nhanh", "Màu trắng ổn định", "Nguồn cung đều"],
    specifications: [
      { label: "Dạng", value: "Tinh thể trắng" },
      { label: "Mùi vị", value: "Ngọt sạch, không mùi lạ" },
      { label: "Quy cách", value: "Bao 50 kg" },
      { label: "Bảo quản", value: "Khô ráo, tránh ẩm" },
    ],
    featured: true,
  },
  {
    slug: "axit-citric",
    name: "Axit Citric",
    englishName: "Citric Acid",
    category: "Hóa chất & phụ gia",
    categorySlug: "hoa-chat-phu-gia",
    image: "/images/product-citric.svg",
    shortDescription: "Phụ gia điều chỉnh độ chua và pH, được sử dụng rộng rãi trong thực phẩm và công nghiệp.",
    description:
      "Axit Citric là nguyên liệu phổ biến trong chế biến thực phẩm, đồ uống, tẩy rửa và nhiều quy trình công nghiệp. Hưng Phát hỗ trợ lựa chọn loại phù hợp với tiêu chuẩn và quy cách đóng gói cần dùng.",
    origin: "Châu Á",
    packaging: "Bao 25 kg",
    applications: ["Thực phẩm", "Đồ uống", "Tẩy rửa", "Điều chỉnh pH"],
    features: ["Độ tinh khiết ổn định", "Dễ hòa tan", "Ứng dụng đa dạng", "Quy cách tiêu chuẩn"],
    specifications: [
      { label: "Tên hóa học", value: "Citric Acid" },
      { label: "Dạng", value: "Tinh thể trắng" },
      { label: "Quy cách", value: "Bao 25 kg" },
      { label: "Bảo quản", value: "Kín, khô ráo, thoáng mát" },
    ],
    featured: true,
  },
  {
    slug: "hat-nhua-hdpe",
    name: "Hạt nhựa HDPE",
    englishName: "High-density Polyethylene",
    category: "Nguyên liệu công nghiệp",
    categorySlug: "nguyen-lieu-cong-nghiep",
    image: "/images/product-hdpe.svg",
    shortDescription: "Hạt nhựa có độ cứng và khả năng chịu va đập tốt cho thổi chai, ống và bao bì.",
    description:
      "HDPE phù hợp cho các ứng dụng cần độ cứng, độ bền và khả năng kháng hóa chất. Nguồn hàng được phân loại theo chỉ số chảy và phương pháp gia công.",
    origin: "Châu Á",
    packaging: "Bao 25 kg",
    applications: ["Thổi chai", "Ống nhựa", "Bao bì", "Ép phun"],
    features: ["Chịu va đập", "Kháng hóa chất", "Độ cứng tốt", "Gia công ổn định"],
    specifications: [
      { label: "Dạng", value: "Hạt" },
      { label: "Màu sắc", value: "Tự nhiên" },
      { label: "Quy cách", value: "Bao 25 kg" },
      { label: "Phương pháp", value: "Thổi, ép phun, đùn" },
    ],
    featured: false,
  },
  {
    slug: "hat-nhua-pvc",
    name: "Hạt nhựa PVC",
    englishName: "Polyvinyl Chloride",
    category: "Nguyên liệu công nghiệp",
    categorySlug: "nguyen-lieu-cong-nghiep",
    image: "/images/product-pvc.svg",
    shortDescription: "Nguyên liệu nền cho ống, tấm, dây cáp và nhiều sản phẩm nhựa kỹ thuật.",
    description:
      "PVC được cung ứng cho các ứng dụng cứng và mềm, có thể phối hợp cùng hệ phụ gia phù hợp để đáp ứng yêu cầu cơ lý, màu sắc và độ bền thời tiết.",
    origin: "Châu Á",
    packaging: "Bao 25 kg",
    applications: ["Ống nhựa", "Dây cáp", "Tấm nhựa", "Gia dụng"],
    features: ["Ứng dụng rộng", "Dễ phối màu", "Độ bền tốt", "Tùy biến công thức"],
    specifications: [
      { label: "Dạng", value: "Bột hoặc hạt compound" },
      { label: "Loại", value: "Cứng / mềm" },
      { label: "Quy cách", value: "Bao 25 kg" },
      { label: "Ứng dụng", value: "Đùn, ép phun" },
    ],
    featured: false,
  },
  {
    slug: "tinh-bot-san",
    name: "Tinh bột sắn",
    englishName: "Tapioca Starch",
    category: "Nguyên liệu thực phẩm",
    categorySlug: "nguyen-lieu-thuc-pham",
    image: "/images/product-starch.svg",
    shortDescription: "Tinh bột màu trắng, độ mịn tốt, phù hợp cho thực phẩm và nhiều ứng dụng kỹ thuật.",
    description:
      "Tinh bột sắn được sử dụng để tạo độ sánh, kết dính và điều chỉnh cấu trúc trong thực phẩm. Ngoài ra sản phẩm còn phù hợp cho giấy, dệt và một số ứng dụng công nghiệp.",
    origin: "Việt Nam",
    packaging: "Bao 25–50 kg",
    applications: ["Thực phẩm", "Bánh kẹo", "Giấy", "Dệt"],
    features: ["Độ mịn tốt", "Màu trắng", "Khả năng kết dính", "Nguồn hàng trong nước"],
    specifications: [
      { label: "Dạng", value: "Bột trắng" },
      { label: "Nguồn gốc", value: "Tinh bột sắn" },
      { label: "Quy cách", value: "Bao 25 kg hoặc 50 kg" },
      { label: "Bảo quản", value: "Nơi khô ráo" },
    ],
    featured: false,
  },
  {
    slug: "muoi-cong-nghiep",
    name: "Muối công nghiệp",
    englishName: "Industrial Salt",
    category: "Hóa chất & phụ gia",
    categorySlug: "hoa-chat-phu-gia",
    image: "/images/product-salt.svg",
    shortDescription: "Nguồn natri clorua cho xử lý nước, hóa chất và nhiều quy trình sản xuất.",
    description:
      "Muối công nghiệp được phân loại theo độ tinh khiết và kích thước hạt, phù hợp với xử lý nước, sản xuất hóa chất và các ứng dụng công nghiệp khác.",
    origin: "Việt Nam",
    packaging: "Bao 50 kg",
    applications: ["Xử lý nước", "Hóa chất", "Dệt nhuộm", "Công nghiệp"],
    features: ["Nguồn cung ổn định", "Nhiều cấp độ tinh khiết", "Dễ lưu kho", "Quy cách phổ biến"],
    specifications: [
      { label: "Thành phần chính", value: "Sodium Chloride" },
      { label: "Dạng", value: "Hạt tinh thể" },
      { label: "Quy cách", value: "Bao 50 kg" },
      { label: "Bảo quản", value: "Tránh ẩm và nước" },
    ],
    featured: false,
  },
];

export const featuredProducts = products.filter((product) => product.featured);

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getRelatedProducts(product: Product, limit = 4) {
  return products
    .filter((item) => item.slug !== product.slug && item.categorySlug === product.categorySlug)
    .slice(0, limit);
}

export const productOrigins = Array.from(new Set(products.map((product) => product.origin))).sort();
export const productApplications = Array.from(
  new Set(products.flatMap((product) => product.applications)),
).sort();
