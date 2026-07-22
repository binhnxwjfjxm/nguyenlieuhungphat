import { Globe2, Mail, MapPin, Phone, Play, Share2 } from "lucide-react";
import { categories } from "@/data/site";
import { Logo } from "./logo";
import { HapticLink } from "./haptic-link";
import { QuoteButton } from "./quote-trigger";

const footerGroups = [
  {
    title: "Khám phá",
    links: [
      { label: "Giới thiệu", href: "/gioi-thieu" },
      { label: "Cẩm nang", href: "/nganh-hang" },
      { label: "Danh mục sản phẩm", href: "/san-pham" },
      { label: "Tuyển dụng", href: "/tuyen-dung" },
    ],
  },
  {
    title: "Danh mục nổi bật",
    links: categories.map((category) => ({
      label: category.title,
      href: `/nganh-hang/${category.slug}`,
    })),
  },
  {
    title: "Hỗ trợ",
    links: [
      { label: "Yêu cầu báo giá", href: "/lien-he" },
      { label: "Liên hệ tư vấn", href: "/lien-he" },
      { label: "Gọi hotline", href: "tel:0900123456" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="site-footer" id="lien-he">
      <div className="container footer-grid">
        <div className="footer-brand-column">
          <Logo />
          <div className="social-row">
            <a href="#" aria-label="Facebook">
              <Globe2 size={18} />
            </a>
            <a href="#" aria-label="LinkedIn">
              <Share2 size={18} />
            </a>
            <a href="#" aria-label="YouTube">
              <Play size={18} />
            </a>
          </div>
        </div>

        {footerGroups.map((group) => (
          <div className="footer-group desktop-footer-group" key={group.title}>
            <h3>{group.title}</h3>
            {group.links.map((link) =>
              link.label === "Yêu cầu báo giá" ? (
                <QuoteButton className="footer-link-button" key={link.label}>
                  {link.label}
                </QuoteButton>
              ) : link.href.startsWith("/") ? (
                <HapticLink className="footer-link-button" href={link.href} key={link.label}>
                  {link.label}
                </HapticLink>
              ) : (
                <a href={link.href} key={link.label}>
                  {link.label}
                </a>
              ),
            )}
          </div>
        ))}

        <div className="footer-contact">
          <h3>Liên hệ với chúng tôi</h3>
          <a href="tel:0900123456">
            <Phone size={17} /> 0900 123 456
          </a>
          <a href="mailto:baogia@nguyenlieuhungphat.com">
            <Mail size={17} /> baogia@nguyenlieuhungphat.com
          </a>
          <p>
            <MapPin size={17} /> TP. Hồ Chí Minh, Việt Nam
          </p>
        </div>

        <div className="mobile-footer-groups">
          {footerGroups.map((group) => (
            <details key={group.title}>
              <summary>{group.title}</summary>
              <div>
                {group.links.map((link) => (
                  link.href.startsWith("/") ? (
                    <HapticLink href={link.href} key={link.label}>
                      {link.label}
                    </HapticLink>
                  ) : (
                    <a href={link.href} key={link.label}>
                      {link.label}
                    </a>
                  )
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 Hưng Phát. All rights reserved.</span>
        <span>Nguồn hàng đúng nhu cầu · Phân phối linh hoạt</span>
      </div>
    </footer>
  );
}
