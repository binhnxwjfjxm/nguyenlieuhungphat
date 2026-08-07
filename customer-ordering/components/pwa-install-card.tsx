"use client";

import { CheckCircle2, Download, Share2, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

type InstallOutcome = "accepted" | "dismissed" | null;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function detectStandalone(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || iosNavigator.standalone === true;
}

function detectIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function PwaInstallCard() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<InstallOutcome>(null);

  useEffect(() => {
    const bootstrapId = window.setTimeout(() => {
      setInstalled(detectStandalone());
      setIsIos(detectIos());
    }, 0);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setOutcome("accepted");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.clearTimeout(bootstrapId);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!installPrompt || busy) return;
    setBusy(true);
    setOutcome(null);
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setOutcome(choice.outcome);
      if (choice.outcome === "accepted") {
        setInstallPrompt(null);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="pwa-install-card" aria-labelledby="pwa-install-title">
      <span className="pwa-install-icon">
        {installed ? (
          <CheckCircle2 aria-hidden="true" size={23} />
        ) : (
          <Smartphone aria-hidden="true" size={23} />
        )}
      </span>
      <div className="pwa-install-copy">
        <p className="eyebrow">Ứng dụng trên điện thoại</p>
        <h2 id="pwa-install-title">{installed ? "Đã cài Hưng Phát" : "Cài Hưng Phát Đặt Hàng"}</h2>
        {installed ? (
          <p>Ứng dụng đang chạy ở chế độ PWA, dùng toàn màn hình và giữ lối tắt trên thiết bị.</p>
        ) : installPrompt ? (
          <p>Cài ứng dụng để mở nhanh từ màn hình chính. Việc cài không làm thay đổi tài khoản hoặc dữ liệu đơn hàng.</p>
        ) : isIos ? (
          <p className="pwa-ios-instruction">
            <Share2 aria-hidden="true" size={17} />
            Trên Safari: chọn Chia sẻ → Thêm vào Màn hình chính.
          </p>
        ) : (
          <p>Khi trình duyệt hỗ trợ cài PWA, nút cài sẽ xuất hiện tại đây.</p>
        )}
        {outcome === "dismissed" ? (
          <small className="pwa-install-note" role="status">Đã bỏ qua lần này. Anh/chị có thể cài lại sau.</small>
        ) : null}
      </div>
      {!installed && installPrompt ? (
        <button className="primary-button pwa-install-button" disabled={busy} onClick={handleInstall} type="button">
          <Download aria-hidden="true" size={18} />
          {busy ? "Đang mở..." : "Cài ứng dụng"}
        </button>
      ) : null}
    </section>
  );
}
