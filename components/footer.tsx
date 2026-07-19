import { Globe2, Mail, MapPin, Phone, Play, Share2 } from "lucide-react";
import { Logo } from "./logo";

const footerGroups = [
  {
    title: "Về chúng tôi",
    links: ["Giới thiệu", "Tầm nhìn - Sứ mệnh", "Giá trị cốt lõi", "Năng lực doanh nghiệp"],
  },
  {
    title: "Sản phẩm",
    links: ["Nguyên liệu công nghiệp", "Hóa chất & phụ gia", "Nguyên liệu thực phẩm", "Vật tư & bao bì"],
  },
  {
    title: "Hỗ trợ",
    links: ["Chính sách chất lượng", "Chính sách vận chuyển", "Yêu cầu báo giá", "Câu hỏi thường gặp"],
  },
];

export function Footer() {
  return (
    <footer className="site-footer" id="lien-he">
      <div className="container footer-grid">
        <div className="footer-brand-column">
          <Logo />
          <p>
            Nền tảng vững chắc từ nguồn nguyên liệu chất lượng, không ngừng phát triển và vươn tới
            thịnh vượng bền vững.
          </p>
          <div className="social-row">
            <a href="#" aria-label="Facebook"><Globe2 size={18} /></a>
            <a href="#" aria-label="LinkedIn"><Share2 size={18} /></a>
            <a href="#" aria-label="YouTube"><Play size={18} /></a>
          </div>
        </div>

        {footerGroups.map((group) => (
          <div className="footer-group desktop-footer-group" key={group.title}>
            <h3>{group.title}</h3>
            {group.links.map((link) => (
              <a href="#" key={link}>{link}</a>
            ))}
          </div>
        ))}

        <div className="footer-contact">
          <h3>Liên hệ với chúng tôi</h3>
          <a href="tel:0900123456"><Phone size={17} /> 0900 123 456</a>
          <a href="mailto:info@hungphat.com"><Mail size={17} /> info@hungphat.com</a>
          <p><MapPin size={17} /> TP. Hồ Chí Minh, Việt Nam</p>
        </div>

        <div className="mobile-footer-groups">
          {footerGroups.map((group) => (
            <details key={group.title}>
              <summary>{group.title}</summary>
              <div>
                {group.links.map((link) => (
                  <a href="#" key={link}>{link}</a>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 Hưng Phát. All rights reserved.</span>
        <span>Vững nền tảng · Phát triển bền vững</span>
      </div>
    </footer>
  );
}
