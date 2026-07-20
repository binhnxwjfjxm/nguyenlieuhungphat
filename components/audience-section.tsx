import { Check } from "lucide-react";
import { Reveal } from "./reveal";

const audienceItems = [
  {
    title: "Trà sữa - cà phê",
    description: "Nguyên liệu pha chế, topping và hàng đi đều.",
  },
  {
    title: "Cửa hàng đồ uống",
    description: "Danh mục gọn, báo giá rõ, nhập hàng linh hoạt.",
  },
  {
    title: "Mì cay - nhà hàng",
    description: "Nhóm hàng chính, số lượng và lịch giao ổn định.",
  },
  {
    title: "Đại lý - mua sỉ",
    description: "Đầu mối rõ ràng, phản hồi nhanh, làm việc gọn.",
  },
];

export function AudienceSection() {
  return (
    <section className="section audience-section">
      <div className="container audience-grid">
        <Reveal>
          <div className="audience-copy">
            <p className="eyebrow">PHỤC VỤ AI</p>
            <h2 className="gradient-heading">Phù hợp với mô hình B2B</h2>
            <p>Gọn, rõ, đúng nhóm khách cần nhập hàng đều và cần báo giá nhanh.</p>
          </div>
        </Reveal>

        <div className="audience-panel">
          {audienceItems.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.05}>
              <article className="audience-item">
                <span className="audience-bullet">
                  <Check size={15} />
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
