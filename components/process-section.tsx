import { MessageSquareText, Search, Send, Truck } from "lucide-react";
import { Reveal } from "./reveal";

const processSteps = [
  {
    icon: Search,
    title: "Tiếp nhận nhu cầu",
    description: "Ghi nhận ngành hàng, sản phẩm và khu vực.",
  },
  {
    icon: MessageSquareText,
    title: "Rà soát danh mục",
    description: "Đối chiếu dữ liệu để lọc đúng nhóm.",
  },
  {
    icon: Send,
    title: "Gửi báo giá",
    description: "Tổng hợp phương án phù hợp rồi phản hồi.",
  },
  {
    icon: Truck,
    title: "Xác nhận giao nhận",
    description: "Chốt lịch giao, số lượng và người nhận.",
  },
];

export function ProcessSection() {
  return (
    <section className="section process-section">
      <div className="container">
        <Reveal>
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">QUY TRÌNH</p>
              <h2 className="gradient-heading">Từ nhu cầu đến giao hàng</h2>
            </div>
          </div>
        </Reveal>

        <div className="process-timeline">
          {processSteps.map((step, index) => {
            const Icon = step.icon;

            return (
              <Reveal key={step.title} delay={index * 0.05}>
                <article className="process-step">
                  <span className="process-step-index">0{index + 1}</span>
                  <span className="process-step-icon">
                    <Icon size={18} />
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
