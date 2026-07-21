import { Reveal } from "./reveal";

const audienceItems = [
  {
    title: "Trà sữa - cà phê",
    description: "Cần topping, bột pha chế và nguồn hàng ổn định để quay vòng đều mỗi ngày.",
    note: "Ưu tiên hàng dễ nhập, dễ bán và giữ chất lượng ổn định.",
  },
  {
    title: "Cửa hàng đồ uống",
    description: "Muốn danh mục gọn, báo giá rõ và chốt đơn theo từng đợt nhập.",
    note: "Phù hợp mô hình cửa hàng nhỏ đến chuỗi bán lẻ.",
  },
  {
    title: "Mì cay - nhà hàng",
    description: "Cần nhóm hàng chủ lực, hàng đi đều và lịch giao ổn định để không đứt menu.",
    note: "Tập trung vào độ sẵn hàng và phản hồi nhanh.",
  },
  {
    title: "Đại lý - mua sỉ",
    description: "Cần đầu mối rõ ràng, làm việc gọn và có thể phối hợp số lượng linh hoạt.",
    note: "Phù hợp đối tác bán lại hoặc mua theo lô.",
  },
];

export function AudienceSection() {
  return (
    <section className="section audience-section" id="doi-tuong-khach-hang">
      <div className="container audience-editorial">
        <Reveal>
          <div className="audience-copy audience-copy-editorial">
            <p className="eyebrow">ĐỐI TƯỢNG KHÁCH HÀNG</p>
            <h2 className="gradient-heading">Phù hợp với mô hình nhập hàng đều và cần báo giá nhanh</h2>
            <p>
              Giữ cách trình bày rõ ràng để khách đọc vào là hiểu ngay Hưng Phát phục vụ ai và phục vụ theo kiểu gì.
            </p>
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
