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

const PushContext = createContext<PushContextValue | null>(null);

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

    if (authStatus !== "signed-in" || !user?.id) {
      const linkedUserId = linkedUserIdRef.current;
      if (linkedUserId) {
        linkedUserIdRef.current = null;
        void loadOneSignalBrowser()
          .then((loaded) => loaded.logout())
          .catch(() => undefined);
      }
      return;
    }

    void loadOneSignalBrowser()
      .then(async (loaded) => {
        if (!active) return;
        sdk = loaded;
        if (!loaded.Notifications.isPushSupported()) {
          setSnapshot((current) => ({
            ...current,
            status: "unsupported",
            supported: false,
            error: null,
          }));
          return;
        }

        await loaded.login(user.id);
        await loaded.User.setLanguage?.("vi");
        if (!active) return;
        linkedUserIdRef.current = user.id;

        permissionListener = () => updateFromSdk(loaded);
        subscriptionListener = () => updateFromSdk(loaded);
        loaded.Notifications.addEventListener("permissionChange", permissionListener);
        loaded.User.PushSubscription.addEventListener("change", subscriptionListener);
        updateFromSdk(loaded);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setSnapshot((current) => ({
          ...current,
          status: "error",
          error: oneSignalErrorMessage(error),
        }));
      });

    return () => {
      active = false;
      if (sdk && permissionListener) {
        sdk.Notifications.removeEventListener("permissionChange", permissionListener);
      }
      if (sdk && subscriptionListener) {
        sdk.User.PushSubscription.removeEventListener("change", subscriptionListener);
      }
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
        setSnapshot((current) => ({
          ...current,
          busy: false,
          supported: false,
          status: "unsupported",
        }));
        return;
      }
      if (user?.id && sdk.User.externalId !== user.id) {
        await sdk.login(user.id);
        linkedUserIdRef.current = user.id;
      }
      if (!sdk.Notifications.permission) {
        await sdk.Notifications.requestPermission();
      }
      if (sdk.Notifications.permission) {
        await sdk.User.PushSubscription.optIn();
      }
      const next = readOneSignalPushSnapshot(sdk);
      setSnapshot((current) => ({
        ...current,
        ...next,
        status: next.supported ? "ready" : "unsupported",
        busy: false,
        error: null,
      }));
    } catch (error) {
      setSnapshot((current) => ({
        ...current,
        busy: false,
        status: "error",
        error: oneSignalErrorMessage(error),
      }));
    }
  }, [user?.id]);

  const disablePush = useCallback(async () => {
    setSnapshot((current) => ({ ...current, busy: true, error: null }));
    try {
      const sdk = await loadOneSignalBrowser();
      await sdk.User.PushSubscription.optOut();
      const next = readOneSignalPushSnapshot(sdk);
      setSnapshot((current) => ({
        ...current,
        ...next,
        status: next.supported ? "ready" : "unsupported",
        busy: false,
        error: null,
      }));
    } catch (error) {
      setSnapshot((current) => ({
        ...current,
        busy: false,
        status: "error",
        error: oneSignalErrorMessage(error),
      }));
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
