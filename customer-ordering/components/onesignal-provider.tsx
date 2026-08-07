"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useCustomerAuth } from "@/components/clerk-auth-provider";
import {
  loadOneSignalBrowser,
  oneSignalErrorMessage,
  readOneSignalPushSnapshot,
  type OneSignalPushSnapshot,
  type OneSignalSdk,
  type PushSubscriptionChangeEvent,
} from "@/lib/push/onesignal-browser";

type PushStatus = "loading" | "ready" | "unsupported" | "error";

type PushContextValue = OneSignalPushSnapshot & {
  status: PushStatus;
  error: string | null;
  busy: boolean;
  enablePush: () => Promise<void>;
  disablePush: () => Promise<void>;
  refreshPushState: () => Promise<void>;
};

const INITIAL_SNAPSHOT: PushContextValue = {
  status: "loading",
  supported: true,
  permission: false,
  subscribed: false,
  subscriptionId: null,
  error: null,
  busy: false,
  enablePush: async () => undefined,
  disablePush: async () => undefined,
  refreshPushState: async () => undefined,
};

const PUSH_SYNC_TIMEOUT_MS = 8000;
const PUSH_SYNC_POLL_MS = 250;
const PushContext = createContext<PushContextValue | null>(null);

async function waitForPushSubscriptionMutation(
  sdk: OneSignalSdk,
  expectedOptedIn: boolean,
  mutate: () => Promise<void> | void,
): Promise<OneSignalPushSnapshot> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let timeoutId: number | null = null;
    let pollId: number | null = null;

    const cleanup = () => {
      sdk.User.PushSubscription.removeEventListener("change", handleChange);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (pollId !== null) window.clearInterval(pollId);
    };
    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(readOneSignalPushSnapshot(sdk));
    };
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    const matchesExpectedState = () => readOneSignalPushSnapshot(sdk).subscribed === expectedOptedIn;
    const handleChange = (event: PushSubscriptionChangeEvent) => {
      if (event.current.optedIn === expectedOptedIn) finish();
    };

    sdk.User.PushSubscription.addEventListener("change", handleChange);
    pollId = window.setInterval(() => { if (matchesExpectedState()) finish(); }, PUSH_SYNC_POLL_MS);
    timeoutId = window.setTimeout(() => {
      if (matchesExpectedState()) {
        finish();
        return;
      }
      fail(new Error(expectedOptedIn
        ? "Thiết bị chưa đăng ký nhận thông báo. Hãy thử lại."
        : "Thiết bị chưa tắt đăng ký thông báo. Hãy thử lại."));
    }, PUSH_SYNC_TIMEOUT_MS);

    try {
      Promise.resolve(mutate()).then(() => {
        if (matchesExpectedState()) finish();
      }, fail);
    } catch (error) {
      fail(error);
    }
  });
}

export function OneSignalProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { status: authStatus, user } = useCustomerAuth();
  const [snapshot, setSnapshot] = useState(INITIAL_SNAPSHOT);
  const linkedUserIdRef = useRef<string | null>(null);

  const updateFromSdk = useCallback((sdk: OneSignalSdk) => {
    const next = readOneSignalPushSnapshot(sdk);
    setSnapshot((current) => ({
      ...current,
      ...next,
      status: next.supported ? "ready" : "unsupported",
      error: null,
    }));
  }, []);

  useEffect(() => {
    let active = true;
    let sdk: OneSignalSdk | null = null;
    let permissionListener: ((permission: boolean) => void) | null = null;
    let subscriptionListener: ((event: PushSubscriptionChangeEvent) => void) | null = null;
    let focusListener: (() => void) | null = null;
    let visibilityListener: (() => void) | null = null;

    void loadOneSignalBrowser()
      .then(async (loaded) => {
        if (!active) return;
        sdk = loaded;
        if (!loaded.Notifications.isPushSupported()) {
          setSnapshot((current) => ({ ...current, status: "unsupported", supported: false, error: null }));
          return;
        }

        if (authStatus === "signed-in" && user?.id) {
          if (loaded.User.externalId !== user.id) await loaded.login(user.id);
          await loaded.User.setLanguage?.("vi");
          linkedUserIdRef.current = user.id;
        } else if (authStatus === "signed-out" && (linkedUserIdRef.current || loaded.User.externalId)) {
          await loaded.logout();
          linkedUserIdRef.current = null;
        }
        if (!active) return;

        permissionListener = () => updateFromSdk(loaded);
        subscriptionListener = () => updateFromSdk(loaded);
        focusListener = () => updateFromSdk(loaded);
        visibilityListener = () => {
          if (document.visibilityState === "visible") updateFromSdk(loaded);
        };
        loaded.Notifications.addEventListener("permissionChange", permissionListener);
        loaded.User.PushSubscription.addEventListener("change", subscriptionListener);
        window.addEventListener("focus", focusListener);
        document.addEventListener("visibilitychange", visibilityListener);
        updateFromSdk(loaded);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setSnapshot((current) => ({ ...current, status: "error", error: oneSignalErrorMessage(error) }));
      });

    return () => {
      active = false;
      if (sdk && permissionListener) sdk.Notifications.removeEventListener("permissionChange", permissionListener);
      if (sdk && subscriptionListener) sdk.User.PushSubscription.removeEventListener("change", subscriptionListener);
      if (focusListener) window.removeEventListener("focus", focusListener);
      if (visibilityListener) document.removeEventListener("visibilitychange", visibilityListener);
    };
  }, [authStatus, updateFromSdk, user?.id]);

  const refreshPushState = useCallback(async () => {
    const sdk = await loadOneSignalBrowser();
    updateFromSdk(sdk);
  }, [updateFromSdk]);

  const enablePush = useCallback(async () => {
    setSnapshot((current) => ({ ...current, busy: true, error: null }));
    try {
      const sdk = await loadOneSignalBrowser();
      if (!sdk.Notifications.isPushSupported()) {
        setSnapshot((current) => ({ ...current, busy: false, supported: false, status: "unsupported" }));
        return;
      }

      if (!sdk.Notifications.permission) await sdk.Notifications.requestPermission();
      const permissionSnapshot = readOneSignalPushSnapshot(sdk);
      if (!permissionSnapshot.permission) {
        setSnapshot((current) => ({
          ...current,
          ...permissionSnapshot,
          busy: false,
          status: "error",
          error: "Trình duyệt chưa cấp quyền thông báo. Hãy cho phép rồi thử lại.",
        }));
        return;
      }

      if (user?.id && sdk.User.externalId !== user.id) {
        await sdk.login(user.id);
        linkedUserIdRef.current = user.id;
      }

      const next = await waitForPushSubscriptionMutation(sdk, true, () => sdk.User.PushSubscription.optIn());
      setSnapshot((current) => ({
        ...current,
        ...next,
        status: next.supported ? "ready" : "unsupported",
        busy: false,
        error: null,
      }));
    } catch (error) {
      setSnapshot((current) => ({ ...current, busy: false, status: "error", error: oneSignalErrorMessage(error) }));
    }
  }, [user?.id]);

  const disablePush = useCallback(async () => {
    setSnapshot((current) => ({ ...current, busy: true, error: null }));
    try {
      const sdk = await loadOneSignalBrowser();
      const next = await waitForPushSubscriptionMutation(sdk, false, () => sdk.User.PushSubscription.optOut());
      setSnapshot((current) => ({
        ...current,
        ...next,
        status: next.supported ? "ready" : "unsupported",
        busy: false,
        error: null,
      }));
    } catch (error) {
      setSnapshot((current) => ({ ...current, busy: false, status: "error", error: oneSignalErrorMessage(error) }));
    }
  }, []);

  const value = useMemo<PushContextValue>(
    () => ({ ...snapshot, enablePush, disablePush, refreshPushState }),
    [disablePush, enablePush, refreshPushState, snapshot],
  );

  return <PushContext.Provider value={value}>{children}</PushContext.Provider>;
}

export function usePushNotifications(): PushContextValue {
  const context = useContext(PushContext);
  if (!context) throw new Error("usePushNotifications phải nằm trong OneSignalProvider.");
  return context;
}
