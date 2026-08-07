export type PushSubscriptionChangeEvent = {
  previous: { id?: string | null; token?: string | null; optedIn?: boolean };
  current: { id?: string | null; token?: string | null; optedIn?: boolean };
};

type PushSubscriptionListener = (event: PushSubscriptionChangeEvent) => void;
type PermissionListener = (permission: boolean) => void;

export interface OneSignalSdk {
  init(options: {
    appId: string;
    serviceWorkerPath: string;
    serviceWorkerParam: { scope: string };
    notifyButton: { enable: boolean };
    allowLocalhostAsSecureOrigin?: boolean;
  }): Promise<void>;
  login(externalId: string): Promise<void>;
  logout(): Promise<void>;
  User: {
    externalId?: string | null;
    setLanguage?: (language: string) => Promise<void> | void;
    PushSubscription: {
      id?: string | null;
      token?: string | null;
      optedIn?: boolean;
      optIn(): Promise<void> | void;
      optOut(): Promise<void> | void;
      addEventListener(event: "change", listener: PushSubscriptionListener): void;
      removeEventListener(event: "change", listener: PushSubscriptionListener): void;
    };
  };
  Notifications: {
    permission: boolean;
    isPushSupported(): boolean;
    requestPermission(): Promise<void>;
    addEventListener(event: "permissionChange", listener: PermissionListener): void;
    removeEventListener(event: "permissionChange", listener: PermissionListener): void;
  };
}

export interface OneSignalPushSnapshot {
  supported: boolean;
  permission: boolean;
  subscribed: boolean;
  subscriptionId: string | null;
}

type OneSignalDeferredCallback = (sdk: OneSignalSdk) => void | Promise<void>;

const ONESIGNAL_SCRIPT_ID = "hp-onesignal-web-sdk";
const ONESIGNAL_SCRIPT_URL = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
export const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim() || "e1404fc3-14c4-44f0-b010-20ad08336833";
export const ONESIGNAL_WORKER_PATH = "OneSignalSDKWorker.js";
export const ONESIGNAL_WORKER_SCOPE = "/";

declare global {
  interface Window {
    OneSignalDeferred?: OneSignalDeferredCallback[];
    __hpOneSignalPromise?: Promise<OneSignalSdk>;
    __hpOneSignalInitialized?: boolean;
  }
}

export function oneSignalErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (/ServiceWorker|bad HTTP response|404/i.test(message)) {
    return "Không tải được bộ nhận thông báo. Hãy tải lại ứng dụng rồi thử bật thông báo.";
  }
  return message || "Không thể khởi tạo thông báo đẩy.";
}

export function readOneSignalPushSnapshot(sdk: OneSignalSdk): OneSignalPushSnapshot {
  const supported = sdk.Notifications.isPushSupported();
  return {
    supported,
    permission: supported && sdk.Notifications.permission,
    subscribed: supported && sdk.User.PushSubscription.optedIn === true,
    subscriptionId: sdk.User.PushSubscription.id ?? null,
  };
}

export function loadOneSignalBrowser(): Promise<OneSignalSdk> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("OneSignal chỉ chạy trong trình duyệt."));
  }

  if (window.__hpOneSignalPromise) return window.__hpOneSignalPromise;

  const promise = new Promise<OneSignalSdk>((resolve, reject) => {
    const deferred = window.OneSignalDeferred ?? [];
    window.OneSignalDeferred = deferred;

    deferred.push(async (sdk) => {
      try {
        if (!window.__hpOneSignalInitialized) {
          await sdk.init({
            appId: ONESIGNAL_APP_ID,
            serviceWorkerPath: ONESIGNAL_WORKER_PATH,
            serviceWorkerParam: { scope: ONESIGNAL_WORKER_SCOPE },
            notifyButton: { enable: false },
            allowLocalhostAsSecureOrigin: process.env.NODE_ENV !== "production",
          });
          window.__hpOneSignalInitialized = true;
        }
        resolve(sdk);
      } catch (error) {
        reject(error);
      }
    });

    const existing = document.getElementById(ONESIGNAL_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) return;

    const script = document.createElement("script");
    script.id = ONESIGNAL_SCRIPT_ID;
    script.src = ONESIGNAL_SCRIPT_URL;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.addEventListener("error", () => reject(new Error("Không tải được OneSignal Web SDK.")), { once: true });
    document.head.appendChild(script);
  });

  window.__hpOneSignalPromise = promise.catch((error) => {
    window.__hpOneSignalPromise = undefined;
    throw error;
  });
  return window.__hpOneSignalPromise;
}
