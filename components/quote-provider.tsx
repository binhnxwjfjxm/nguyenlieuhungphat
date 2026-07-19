"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { QuoteForm } from "./quote-form";

type QuoteSeed = {
  name?: string;
  phone?: string;
  company?: string;
  email?: string;
  product?: string;
  quantity?: string;
  area?: string;
  usage?: string;
  note?: string;
  source?: string;
  pathname?: string;
  website?: string;
};

type QuoteContextValue = {
  openQuote: (seed?: QuoteSeed) => void;
  closeQuote: () => void;
  isOpen: boolean;
  seed: QuoteSeed;
};

const QuoteContext = createContext<QuoteContextValue | null>(null);

export function QuoteProvider({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [seed, setSeed] = useState<QuoteSeed>({});
  const [version, setVersion] = useState(0);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const closeQuote = useCallback(() => setIsOpen(false), []);

  const openQuote = useCallback(
    (nextSeed: QuoteSeed = {}) => {
      setSeed({
        source: nextSeed.source ?? "quote-form",
        pathname: nextSeed.pathname ?? pathname ?? "/",
        website: nextSeed.website ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100",
        ...nextSeed,
      });
      setVersion((current) => current + 1);
      setIsOpen(true);
    },
    [pathname],
  );

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    const previous = document.activeElement as HTMLElement | null;
    const focusTarget = panelRef.current?.querySelector<HTMLElement>("input, textarea, button, select, [tabindex]:not([tabindex='-1'])");
    focusTarget?.focus();

    return () => {
      document.body.style.overflow = "";
      previous?.focus?.();
    };
  }, [isOpen]);

  const contextValue = useMemo(
    () => ({
      openQuote,
      closeQuote,
      isOpen,
      seed,
    }),
    [closeQuote, isOpen, openQuote, seed],
  );

  return (
    <QuoteContext.Provider value={contextValue}>
      {children}
      {isOpen ? (
        <div className="quote-dialog-overlay" role="presentation" onMouseDown={closeQuote}>
          <div
            className="quote-dialog-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Form báo giá"
            onMouseDown={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key !== "Tab") return;
              const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
                "input, textarea, button, select, [tabindex]:not([tabindex='-1'])",
              );
              if (!focusable?.length) return;
              const first = focusable[0];
              const last = focusable[focusable.length - 1];
              if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
              } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
              }
            }}
          >
            <div className="quote-dialog-header">
              <div>
                <p className="eyebrow">NHẬN BÁO GIÁ</p>
                <h2>Hưng Phát báo giá nhanh</h2>
              </div>
              <button className="icon-button quote-dialog-close" type="button" aria-label="Đóng form báo giá" onClick={closeQuote}>
                <X size={20} />
              </button>
            </div>
            <QuoteForm
              key={version}
              inline={false}
              initialValues={seed}
              onClose={closeQuote}
            />
          </div>
        </div>
      ) : null}
    </QuoteContext.Provider>
  );
}

export function useQuote() {
  const context = useContext(QuoteContext);
  if (!context) {
    throw new Error("useQuote must be used within QuoteProvider");
  }
  return context;
}

