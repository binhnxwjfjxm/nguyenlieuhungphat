"use client";

import { Megaphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AccountModal } from "@/components/account-modal";
import { createCustomerOrderingService } from "@/lib/customer-ordering-service";
import type { CustomerHomeContent } from "@/lib/contracts";
import styles from "./home-screen.module.css";

export function ManagedHomeBanner() {
  const service = useMemo(() => createCustomerOrderingService(), []);
  const [content, setContent] = useState<CustomerHomeContent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void service.getHomeContent()
      .then((next) => {
        if (active) setContent(next);
      })
      .catch(() => {
        if (active) setContent(null);
      });
    return () => { active = false; };
  }, [service]);

  if (!content?.visible || !content.bannerUrl) return null;

  const programContent = content.programContent.trim();
  const paragraphs = programContent ? programContent.split(/\n\s*\n/) : [];

  return (
    <>
      <section className="content-section home-managed-banner-section">
        <div className="section-heading">
          <h2>{content.sectionTitle}</h2>
        </div>
        <button
          aria-haspopup="dialog"
          aria-label={`Xem chi tiết ${content.sectionTitle}`}
          className={styles.managedBanner}
          onClick={() => setDetailOpen(true)}
          type="button"
        >
          <img src={content.bannerUrl} alt={content.sectionTitle} />
        </button>
      </section>

      <AccountModal
        description="Thông tin chương trình"
        icon={<Megaphone aria-hidden="true" size={22} />}
        onClose={() => setDetailOpen(false)}
        open={detailOpen}
        title={content.sectionTitle}
      >
        <div className={styles.programDetail}>
          <img className={styles.programDetailImage} src={content.bannerUrl} alt="" />
          <div className={styles.programDetailCopy}>
            {paragraphs.length > 0
              ? paragraphs.map((paragraph, index) => <p key={`${index}-${paragraph}`}>{paragraph}</p>)
              : <p className={styles.programDetailEmpty}>Thông tin chi tiết chương trình đang được cập nhật.</p>}
          </div>
        </div>
      </AccountModal>
    </>
  );
}
