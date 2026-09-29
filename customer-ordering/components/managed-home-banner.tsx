"use client";

import { useEffect, useMemo, useState } from "react";
import { createCustomerOrderingService } from "@/lib/customer-ordering-service";
import type { CustomerHomeContent } from "@/lib/contracts";
import styles from "./home-screen.module.css";

export function ManagedHomeBanner() {
  const service = useMemo(() => createCustomerOrderingService(), []);
  const [content, setContent] = useState<CustomerHomeContent | null>(null);

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

  return (
    <section className="content-section home-managed-banner-section">
      <div className="section-heading">
        <h2>{content.sectionTitle}</h2>
      </div>
      <div className={styles.managedBanner}>
        <img src={content.bannerUrl} alt={content.sectionTitle} />
      </div>
    </section>
  );
}
