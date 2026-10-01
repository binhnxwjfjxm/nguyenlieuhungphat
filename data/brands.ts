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
  // Catalog label "Gold" corresponds to Golden Farm product families in the imported data.
  {
    name: "Gold",
    logoSrc: "https://www.google.com/s2/favicons?domain=goldenfarm.com.vn&sz=256",
    logoTone: "light",
    sourceUrl: "https://goldenfarm.com.vn/",
  },
  {
    name: "Torani",
    logoSrc: "https://www.google.com/s2/favicons?domain=torani.com&sz=256",
    logoTone: "light",
    sourceUrl: "https://www.torani.com/",
  },
  {
    name: "Luave",
    logoSrc: "https://www.google.com/s2/favicons?domain=luave.com&sz=256",
    logoTone: "light",
    sourceUrl: "https://luave.com/",
  },
  {
    name: "Hùng Chương",
    logoSrc: "https://www.google.com/s2/favicons?domain=hungchuong.com&sz=256",
    logoTone: "light",
    sourceUrl: "https://www.hungchuong.com/",
  },
  {
    name: "BKB",
    logoSrc: "https://www.google.com/s2/favicons?domain=nguyenlieuphachebkb.com&sz=256",
    logoTone: "light",
    sourceUrl: "https://nguyenlieuphachebkb.com/",
  },
  {
    name: "Lộc Phát",
    logoSrc: "https://theme.hstatic.net/1000403402/1000681347/14/logo.png?v=197",
    logoTone: "light",
    sourceUrl: "https://tralocphat.com/",
  },
  {
    name: "Douxian",
    logoSrc: "https://www.google.com/s2/favicons?domain=dautien.vn&sz=256",
    logoTone: "light",
    sourceUrl: "https://dautien.vn/",
  },
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
    name: "GTP",
    logoSrc: "https://gtp.com.vn/assets2/images/logo/logo.png",
    logoTone: "light",
    sourceUrl: "https://gtp.com.vn/",
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
