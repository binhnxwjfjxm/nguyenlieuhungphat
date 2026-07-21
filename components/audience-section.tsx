import { Reveal } from "./reveal";

const audienceItems = [
  {
    title: "Trà sữa - cà phê",
    description: "Topping, bột pha chế và nguồn hàng ổn định.",
    note: "Nhập đều, bán đều.",
  },
  {
    title: "Cửa hàng đồ uống",
    description: "Danh mục gọn, báo giá rõ, chốt đơn nhanh.",
    note: "Phù hợp cửa hàng nhỏ đến chuỗi.",
  },
  {
    title: "Mì cay - nhà hàng",
    description: "Nhóm hàng chủ lực, lịch giao ổn định.",
    note: "Giữ menu không bị đứt.",
  },
  {
    title: "Đại lý - mua sỉ",
    description: "Đầu mối rõ, số lượng linh hoạt.",
    note: "Phù hợp bán lại hoặc mua theo lô.",
  },
];

export function AudienceSection() {
  return (
    <section className="section audience-section" id="doi-tuong-khach-hang">
      <div className="container audience-editorial">
        <Reveal>
          <div className="audience-copy audience-copy-editorial">
            <p className="eyebrow">ĐỐI TƯỢNG KHÁCH HÀNG</p>
            <h2 className="gradient-heading">Phù hợp cho khách mua sỉ</h2>
          </div>
        </Reveal>

        <div className="audience-list">
          {audienceItems.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.05}>
              <article className="audience-row">
                <span className="audience-row-index">0{index + 1}</span>
                <div className="audience-row-copy">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <p className="audience-row-note">{item.note}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
