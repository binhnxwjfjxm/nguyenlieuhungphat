import { stats } from "@/data/site";
import { Reveal } from "./reveal";

export function TrustSection() {
  return (
    <section className="section-tight trust-strip-section" id="gioi-thieu">
      <div className="container">
        <Reveal>
          <div className="trust-strip">
            <div className="trust-strip-copy">
              <p className="eyebrow">DẤU HIỆU TIN CẬY</p>
              <h2 className="gradient-heading">4 tín hiệu cốt lõi</h2>
              <p>2016, 3 nhóm hàng, B2B và báo giá linh hoạt.</p>
            </div>
            <div className="trust-strip-grid" aria-label="Thông tin tin cậy">
              {stats.map((stat) => (
                <div className="trust-strip-item" key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
