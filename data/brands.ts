import { productFamilies } from "./products";

export type BrandLogo = {
  name: string;
  logoSrc: string;
  logoTone: "light" | "dark";
  sourceUrl: string;
};

const currentBrandNames = new Set(
  productFamilies
    .map((family) => family.brand?.trim())
    .filter((brand): brand is string => Boolean(brand)),
);

const officialBrandLogos: BrandLogo[] = [
  {
    name: "Berrino",
    logoSrc: "https://www.berrino.vn/wp-content/uploads/2024/11/Group-13.png",
    logoTone: "light",
    sourceUrl: "https://www.berrino.vn/",
  },
  {
    name: "DINGFONG",
    logoSrc: "https://dingfongfood.com/wp-content/themes/dingfong-wp/assets/logo/logo.svg",
    logoTone: "light",
    sourceUrl: "https://dingfongfood.com/",
  },
  {
    name: "Cozy",
    logoSrc: "https://cozy.vn/wp-content/uploads/2023/06/logo.png",
    logoTone: "light",
    sourceUrl: "https://cozy.vn/",
  },
  {
    name: "Phúc Long",
    logoSrc: "https://cdn.hstatic.net/files/200001075806/file/thi_t_k__ch_a_c__t_n_-_2025-12-16t135848.750.png",
    logoTone: "dark",
    sourceUrl: "https://coffee.phuclong.com.vn/",
  },
  {
    name: "Rich",
    logoSrc: "https://richs.com.vn/wp-content/uploads/2025/05/footer-logo-1.png",
    logoTone: "dark",
    sourceUrl: "https://richs.com.vn/",
  },
];

export const brands = officialBrandLogos.filter((brand) => currentBrandNames.has(brand.name));
