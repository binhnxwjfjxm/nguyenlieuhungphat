"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  loadClerkBrowser,
  type ClerkBrowser,
  type ClerkUser,
  type CustomerAuthStatus,
} from "@/lib/auth/clerk-browser";

type CustomerAuthContextValue = {
  status: CustomerAuthStatus;
  clerk: ClerkBrowser | null;
  user: ClerkUser | null;
  error: string | null;
  signOut: () => Promise<void>;
};

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

export function ClerkAuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? "";
  const [status, setStatus] = useState<CustomerAuthStatus>(
    publishableKey ? "loading" : "unconfigured",
  );
  const [clerk, setClerk] = useState<ClerkBrowser | null>(null);
  const [user, setUser] = useState<ClerkUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publishableKey) return;

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void loadClerkBrowser(publishableKey)
      .then((loadedClerk) => {
        if (cancelled) return;
        const sync = (nextUser: ClerkUser | null | undefined = loadedClerk.user) => {
          setUser(nextUser ?? null);
          setStatus(nextUser ? "signed-in" : "signed-out");
        };

        setClerk(loadedClerk);
        sync();
        unsubscribe = loadedClerk.addListener((state) => sync(state.user));
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : "Không tải được dịch vụ đăng nhập.");
        setStatus("error");
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [publishableKey]);

  const signOut = useCallback(async () => {
    if (!clerk) return;
    await clerk.signOut({ redirectUrl: "/login" });
    setUser(null);
    setStatus("signed-out");
  }, [clerk]);

  const value = useMemo<CustomerAuthContextValue>(
    () => ({ status, clerk, user, error, signOut }),
    [clerk, error, signOut, status, user],
  );

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth(): CustomerAuthContextValue {
  const context = useContext(CustomerAuthContext);
  if (!context) throw new Error("useCustomerAuth phải nằm trong ClerkAuthProvider.");
  return context;
}
