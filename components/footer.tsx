import { Mail, MapPin, MessageCircle } from "lucide-react";
import { categories } from "@/data/site";
import {
  COMPANY_ADDRESS_DISPLAY,
  COMPANY_EMAIL,
  CUSTOMER_ORDERING_URL,
  PRIVACY_POLICY_PATH,
  ZALO_PHONE_DISPLAY,
  ZALO_URL,
} from "@/lib/contact";
import { Logo } from "./logo";
import { HapticLink } from "./haptic-link";
import { QuoteButton } from "./quote-trigger";

type FooterLink = {
  label: string;
  href?: string;
  action?: "quote";
};

const footerGroups: { title: string; links: FooterLink[] }[] = [
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
      { label: "Yêu cầu báo giá", action: "quote" },
      { label: "Đặt hàng khách hàng", href: CUSTOMER_ORDERING_URL },
      { label: "Liên hệ tư vấn", href: "/lien-he" },
      { label: "Chính sách bảo mật", href: PRIVACY_POLICY_PATH },
      { label: "Chat Zalo", href: ZALO_URL },
    ],
  },
];

function FooterLinkItem({ link, className }: { link: FooterLink; className?: string }) {
  if (link.action === "quote") {
    return <QuoteButton className={className}>{link.label}</QuoteButton>;
  }
  if (!link.href) return null;
  if (link.href.startsWith("/")) {
    return (
      <HapticLink className={className} href={link.href}>
        {link.label}
      </HapticLink>
    );
  }
  return (
    <a className={className} href={link.href}>
      {link.label}
    </a>
  );
}

export function Footer() {
  return (
    <footer className="site-footer" id="lien-he">
      <div className="container footer-grid">
        <div className="footer-brand-column">
          <Logo />
          <div className="social-row">
            <a href={ZALO_URL} aria-label={`Zalo Hưng Phát ${ZALO_PHONE_DISPLAY}`}>
              <MessageCircle size={18} />
            </a>
          </div>
        </div>

        {footerGroups.map((group) => (
          <div className="footer-group desktop-footer-group" key={group.title}>
            <h3>{group.title}</h3>
            {group.links.map((link) => (
              <FooterLinkItem className="footer-link-button" key={link.label} link={link} />
            ))}
          </div>
        ))}

        <div className="footer-contact">
          <h3>Liên hệ với chúng tôi</h3>
          <a href={ZALO_URL}>
            <MessageCircle size={17} /> Zalo {ZALO_PHONE_DISPLAY}
          </a>
          <a href={`mailto:${COMPANY_EMAIL}`}>
            <Mail size={17} /> {COMPANY_EMAIL}
          </a>
          <p>
            <MapPin size={17} /> {COMPANY_ADDRESS_DISPLAY}
          </p>
        </div>

        <div className="mobile-footer-groups">
          {footerGroups.map((group) => (
            <details key={group.title}>
              <summary>{group.title}</summary>
              <div>
                {group.links.map((link) => (
                  <FooterLinkItem key={link.label} link={link} />
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
