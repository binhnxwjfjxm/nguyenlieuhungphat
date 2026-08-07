"use client";

import { BellRing, CheckCircle2, Smartphone, VolumeX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePushNotifications } from "@/components/onesignal-provider";
import { createCustomerOrderingService } from "@/lib/customer-ordering-service";
import type { NotificationPreference } from "@/lib/contracts";

const preferenceLabels: Array<{
  key: keyof Pick<NotificationPreference, "orderUpdates" | "companyNews" | "promotions">;
  label: string;
  description: string;
}> = [
  {
    key: "orderUpdates",
    label: "Cập nhật đơn hàng",
    description: "Xác nhận, xử lý, đang giao và hoàn tất.",
  },
  {
    key: "companyNews",
    label: "Tin Hưng Phát",
    description: "Tin công ty, sự kiện và hướng dẫn sử dụng.",
  },
  {
    key: "promotions",
    label: "Chương trình & khuyến mại",
    description: "Chương trình dành cho khách hàng phù hợp.",
  },
];

export function NotificationPreferences() {
  const service = useMemo(() => createCustomerOrderingService(), []);
  const push = usePushNotifications();
  const [preference, setPreference] = useState<NotificationPreference | null>(null);
  const [preferenceError, setPreferenceError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void service
      .getNotificationPreference()
      .then((next) => {
        if (active) setPreference(next);
      })
      .catch((error: unknown) => {
        if (active) {
          setPreferenceError(error instanceof Error ? error.message : "Không tải được tùy chọn thông báo.");
        }
      });
    return () => {
      active = false;
    };
  }, [service]);

  async function updatePreference(
    key: keyof Pick<NotificationPreference, "orderUpdates" | "companyNews" | "promotions">,
    enabled: boolean,
  ) {
    if (!preference) return;
    setSaving(true);
    setPreferenceError(null);
    try {
      const saved = await service.saveNotificationPreference({
        ...preference,
        [key]: enabled,
        updatedAt: new Date().toISOString(),
      });
      setPreference(saved);
    } catch (error) {
      setPreferenceError(error instanceof Error ? error.message : "Không lưu được tùy chọn thông báo.");
    } finally {
      setSaving(false);
    }
  }

  const pushCopy =
    push.status === "unsupported"
      ? "Thiết bị hoặc trình duyệt này chưa hỗ trợ web push."
      : push.status === "error"
        ? push.error ?? "OneSignal chưa sẵn sàng."
        : push.subscribed
          ? "Thiết bị này đang nhận thông báo đẩy."
          : "Bật để nhận cập nhật ngay cả khi không mở ứng dụng.";

  return (
    <section className="notification-preferences-card">
      <div className="notification-section-heading">
        <span className="notification-section-icon">
          <BellRing aria-hidden="true" size={21} />
        </span>
        <div>
          <p className="eyebrow">Thông báo</p>
          <h2>Tùy chọn nhận thông tin</h2>
          <p>Push dùng OneSignal; danh sách nội dung vẫn nằm trong ứng dụng để xem lại.</p>
        </div>
      </div>

      <div className="push-permission-row">
        <span className="push-state-icon">
          {push.subscribed ? (
            <CheckCircle2 aria-hidden="true" size={20} />
          ) : push.status === "unsupported" ? (
            <VolumeX aria-hidden="true" size={20} />
          ) : (
            <Smartphone aria-hidden="true" size={20} />
          )}
        </span>
        <div className="push-state-copy">
          <strong>Thông báo trên thiết bị</strong>
          <span>{pushCopy}</span>
        </div>
        {push.status !== "unsupported" ? (
          <button
            className={push.subscribed ? "secondary-button" : "primary-button"}
            disabled={push.busy || push.status === "loading"}
            onClick={() => void (push.subscribed ? push.disablePush() : push.enablePush())}
            type="button"
          >
            {push.busy ? "Đang xử lý..." : push.subscribed ? "Tắt push" : "Bật thông báo"}
          </button>
        ) : null}
      </div>

      <p className="push-ios-note">
        iPhone/iPad cần thêm PWA vào Màn hình chính rồi mở từ biểu tượng ứng dụng để nhận web push.
      </p>

      <div className="notification-preference-list">
        {preferenceLabels.map((item) => (
          <label className="notification-preference-row" key={item.key}>
            <span>
              <strong>{item.label}</strong>
              <small>{item.description}</small>
            </span>
            <input
              checked={preference?.[item.key] ?? true}
              disabled={!preference || saving}
              onChange={(event) => void updatePreference(item.key, event.target.checked)}
              type="checkbox"
            />
          </label>
        ))}
      </div>

      {preferenceError ? <p className="notification-inline-error">{preferenceError}</p> : null}
    </section>
  );
}
