"use client";

import { useEffect, useMemo, useState } from "react";
import { createCustomerOrderingService } from "@/lib/customer-ordering-service";
import { CUSTOMER_NOTIFICATIONS_CHANGED_EVENT } from "@/lib/notification-events";

export function NotificationBadge() {
  const service = useMemo(() => createCustomerOrderingService(), []);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      void service
        .listAnnouncements()
        .then((items) => {
          if (active) setUnreadCount(items.filter((item) => !item.readAt).length);
        })
        .catch(() => undefined);
    };

    refresh();
    window.addEventListener(CUSTOMER_NOTIFICATIONS_CHANGED_EVENT, refresh);
    return () => {
      active = false;
      window.removeEventListener(CUSTOMER_NOTIFICATIONS_CHANGED_EVENT, refresh);
    };
  }, [service]);

  if (unreadCount === 0) return null;
  return <span aria-label={`${unreadCount} thông báo chưa đọc`} className="notification-dot" />;
}
