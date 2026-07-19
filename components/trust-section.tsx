import { trustItems } from "@/data/site";
import { Reveal } from "./reveal";

export function TrustSection() {
  return (
    <section className="section section-tight" id="gioi-thieu">
      <div className="container">
        <Reveal>
          <div className="section-heading centered-heading compact-heading">
            <p className="eyebrow">GIÁ TRỊ CỐT LÕI</p>
            <h2>Vì sao doanh nghiệp chọn Hưng Phát?</h2>
          </div>
        </Reveal>
        <div className="trust-grid">
          {trustItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.title} delay={index * 0.06}>
                <article className="trust-card">
                  <span className="icon-shell">
                    <Icon size={24} strokeWidth={1.8} />
                  </span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
