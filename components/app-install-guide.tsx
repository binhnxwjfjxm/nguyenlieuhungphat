"use client";

import { Download, ExternalLink, Share2, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { CUSTOMER_ORDERING_URL } from "@/lib/contact";
import styles from "./app-install-guide.module.css";

type AppInstallGuideProps = {
  className?: string;
  label?: string;
  onOpen?: () => void;
};

function isAppleMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function AppInstallGuide({ className = "", label = "Cài app", onOpen }: AppInstallGuideProps) {
  const [open, setOpen] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setIsIos(isAppleMobileDevice());
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function showGuide() {
    setOpen(true);
    onOpen?.();
  }

  return (
    <>
      <button className={`${className} ${styles.trigger}`.trim()} type="button" onClick={showGuide}>
        <Download aria-hidden="true" size={17} />
        <span>{label}</span>
      </button>

      {open ? (
        <div className={styles.overlay} role="presentation" onMouseDown={() => setOpen(false)}>
          <section
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-install-guide-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className={styles.close} type="button" aria-label="Đóng hướng dẫn cài app" onClick={() => setOpen(false)}>
              <X aria-hidden="true" size={20} />
            </button>

            <div className={styles.heading}>
              <span className={styles.icon}><Smartphone aria-hidden="true" size={24} /></span>
              <div>
                <p>HƯNG PHÁT ĐẶT HÀNG</p>
                <h2 id="app-install-guide-title">Cài app lên màn hình điện thoại</h2>
              </div>
            </div>

            <p className={styles.lead}>
              Đây là ứng dụng PWA, không cần tải từ App Store. Hãy mở app đặt hàng trước, sau đó cài từ trình duyệt trên điện thoại.
            </p>

            <a className={`button button-primary ${styles.openApp}`} href={CUSTOMER_ORDERING_URL} target="_blank" rel="noreferrer">
              Mở app đặt hàng <ExternalLink aria-hidden="true" size={17} />
            </a>

            <div className={`${styles.instructions} ${isIos ? styles.highlight : ""}`}>
              <div className={styles.instructionTitle}>
                <Share2 aria-hidden="true" size={18} />
                <strong>iPhone / iPad</strong>
                {isIos ? <span>Thiết bị của bạn</span> : null}
              </div>
              <ol>
                <li>Mở <strong>sales.nguyenlieuhungphat.com</strong> bằng Safari.</li>
                <li>Nếu đang mở trong Zalo, Facebook hoặc trình duyệt khác, chọn mở bằng Safari trước.</li>
                <li>Trong Safari, bấm nút <strong>Chia sẻ</strong>.</li>
                <li>Chọn <strong>Thêm vào Màn hình chính</strong>, rồi bấm <strong>Thêm</strong>.</li>
              </ol>
            </div>

            <div className={styles.instructions}>
              <div className={styles.instructionTitle}>
                <Download aria-hidden="true" size={18} />
                <strong>Android / máy tính</strong>
              </div>
              <p>Mở app bằng Chrome/Edge, sau đó chọn <strong>Cài ứng dụng</strong> hoặc <strong>Thêm vào màn hình chính</strong> trong menu trình duyệt.</p>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}