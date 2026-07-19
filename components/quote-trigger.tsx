"use client";

import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { useQuote } from "./quote-provider";

type QuoteTriggerProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    seed?: {
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
  }
>;

function vibrate() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(12);
  }
}

export function QuoteButton({ children, seed, onClick, ...props }: QuoteTriggerProps) {
  const { openQuote } = useQuote();

  return (
    <button
      {...props}
      type={props.type ?? "button"}
      onClick={(event) => {
        vibrate();
        openQuote(seed);
        onClick?.(event);
      }}
    >
      {children}
    </button>
  );
}

export const QuoteTrigger = QuoteButton;
