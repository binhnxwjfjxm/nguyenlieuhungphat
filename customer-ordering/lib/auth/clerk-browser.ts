import type { ClerkAppearance } from "@/lib/auth/clerk-appearance";

export type CustomerAuthStatus =
  | "loading"
  | "signed-in"
  | "signed-out"
  | "unconfigured"
  | "error";

export interface ClerkPhoneNumber {
  id: string;
  phoneNumber: string;
}

export interface ClerkEmailAddress {
  id: string;
  emailAddress: string;
}

export interface ClerkUser {
  id: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  primaryPhoneNumber: ClerkPhoneNumber | null;
  primaryEmailAddress: ClerkEmailAddress | null;
  passwordEnabled?: boolean;
}

export interface ClerkSignIn {
  authenticateWithRedirect(input: {
    strategy: "oauth_google";
    redirectUrl: string;
    redirectUrlComplete: string;
  }): Promise<unknown>;
}

export type ClerkComponentRouting = "hash" | "path";

export interface ClerkSignInProps {
  routing?: ClerkComponentRouting;
  path?: string;
  withSignUp?: boolean;
  oauthFlow?: "redirect" | "popup" | "auto";
  forceRedirectUrl?: string;
  fallbackRedirectUrl?: string;
  signUpForceRedirectUrl?: string;
  signUpFallbackRedirectUrl?: string;
  appearance?: ClerkAppearance;
}

export interface ClerkSignUpProps {
  routing?: ClerkComponentRouting;
  path?: string;
  oauthFlow?: "redirect" | "popup" | "auto";
  forceRedirectUrl?: string;
  fallbackRedirectUrl?: string;
  signInForceRedirectUrl?: string;
  signInFallbackRedirectUrl?: string;
  appearance?: ClerkAppearance;
}

export interface ClerkUserProfileProps {
  routing?: ClerkComponentRouting;
  path?: string;
  appearance?: ClerkAppearance;
}

export interface ClerkBrowser {
  loaded: boolean;
  user: ClerkUser | null;
  client: {
    signIn: ClerkSignIn;
  };
  load(input?: {
    ui?: { ClerkUI: unknown };
    localization?: Record<string, unknown>;
  }): Promise<void>;
  addListener(listener: (state: { user?: ClerkUser | null }) => void): () => void;
  setActive(input: { session: string }): Promise<void>;
  signOut(input?: { redirectUrl?: string }): Promise<void>;
  handleRedirectCallback(input: {
    redirectUrl?: string;
    redirectUrlComplete?: string;
    continueSignUpUrl?: string;
  }): Promise<unknown>;
  mountSignIn(node: HTMLDivElement, props?: ClerkSignInProps): void;
  unmountSignIn(node: HTMLDivElement): void;
  mountSignUp(node: HTMLDivElement, props?: ClerkSignUpProps): void;
  unmountSignUp(node: HTMLDivElement): void;
  mountUserProfile(node: HTMLDivElement, props?: ClerkUserProfileProps): void;
  unmountUserProfile(node: HTMLDivElement): void;
}

declare global {
  interface Window {
    Clerk?: ClerkBrowser;
    __internal_ClerkUICtor?: unknown;
  }
}

const CLERK_SCRIPT_ID = "hp-clerk-browser";
const CLERK_UI_SCRIPT_ID = "hp-clerk-ui";
const scriptLoadPromises = new Map<string, Promise<void>>();

const HP_CLERK_LOCALIZATION: Record<string, unknown> = {
  dividerText: "hoặc",
  formButtonPrimary: "Tiếp tục",
  formFieldLabel__emailAddress: "Email",
  formFieldLabel__emailAddress_username: "Email hoặc tên đăng nhập",
  formFieldLabel__username: "Tên đăng nhập",
  formFieldLabel__password: "Mật khẩu",
  formFieldLabel__confirmPassword: "Nhập lại mật khẩu",
  formFieldAction__forgotPassword: "Quên mật khẩu?",
  signIn: {
    start: {
      title: "Đăng nhập",
      subtitle: "Đăng nhập để đặt hàng cùng Hưng Phát",
      actionText: "Chưa có tài khoản?",
      actionLink: "Đăng ký",
    },
  },
  signUp: {
    start: {
      title: "Đăng ký tài khoản",
      subtitle: "Tạo tài khoản khách hàng Hưng Phát",
      actionText: "Đã có tài khoản?",
      actionLink: "Đăng nhập",
    },
  },
};

export function clerkErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const errors = "errors" in error ? (error as { errors?: unknown }).errors : null;
  if (!Array.isArray(errors) || !errors[0] || typeof errors[0] !== "object") return null;
  const code = "code" in errors[0] ? (errors[0] as { code?: unknown }).code : null;
  return typeof code === "string" ? code : null;
}

export function clerkErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const errors = "errors" in error ? (error as { errors?: unknown }).errors : null;
    if (Array.isArray(errors) && errors[0] && typeof errors[0] === "object") {
      const first = errors[0] as { longMessage?: unknown; message?: unknown };
      if (typeof first.longMessage === "string") return first.longMessage;
      if (typeof first.message === "string") return first.message;
    }
  }
  return error instanceof Error ? error.message : "Không thể xác thực tài khoản.";
}

function decodeFrontendApi(publishableKey: string): string {
  const parts = publishableKey.split("_");
  const environment = parts[1];
  const encoded = parts[2];
  if (!encoded || (environment !== "test" && environment !== "live")) {
    throw new Error("Clerk publishable key không hợp lệ.");
  }

  try {
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = window.atob(padded);
    const domain = decoded.endsWith("$") ? decoded.slice(0, -1) : decoded;
    if (!domain.includes(".")) throw new Error("invalid-domain");
    return domain;
  } catch {
    throw new Error("Không xác định được Clerk Frontend API.");
  }
}

function ensureScript(
  id: string,
  src: string,
  isReady: () => boolean,
  errorMessage: string,
  configure?: (script: HTMLScriptElement) => void,
): Promise<void> {
  if (isReady()) return Promise.resolve();

  const trackedLoad = scriptLoadPromises.get(id);
  if (trackedLoad) return trackedLoad;

  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing) {
    existing.remove();
  }

  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = src;
  script.dataset.hpLoadState = "loading";
  configure?.(script);

  const loadPromise = new Promise<void>((resolve, reject) => {
    script.addEventListener(
      "load",
      () => {
        if (isReady()) {
          script.dataset.hpLoadState = "loaded";
          resolve();
          return;
        }

        script.dataset.hpLoadState = "error";
        reject(new Error(`${errorMessage} Script đã tải nhưng API chưa sẵn sàng.`));
      },
      { once: true },
    );
    script.addEventListener(
      "error",
      () => {
        script.dataset.hpLoadState = "error";
        reject(new Error(errorMessage));
      },
      { once: true },
    );
    document.head.appendChild(script);
  });

  scriptLoadPromises.set(id, loadPromise);
  return loadPromise.finally(() => {
    if (scriptLoadPromises.get(id) === loadPromise) {
      scriptLoadPromises.delete(id);
    }
  });
}

export async function loadClerkBrowser(publishableKey: string): Promise<ClerkBrowser> {
  const frontendApi = decodeFrontendApi(publishableKey);

  await ensureScript(
    CLERK_UI_SCRIPT_ID,
    `https://${frontendApi}/npm/@clerk/ui@1/dist/ui.browser.js`,
    () => Boolean(window.__internal_ClerkUICtor),
    "Không tải được giao diện đăng nhập.",
  );

  await ensureScript(
    CLERK_SCRIPT_ID,
    `https://${frontendApi}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`,
    () => Boolean(window.Clerk),
    "Không tải được dịch vụ đăng nhập.",
    (script) => {
      script.dataset.clerkPublishableKey = publishableKey;
    },
  );

  if (!window.Clerk || !window.__internal_ClerkUICtor) {
    throw new Error("Dịch vụ đăng nhập chưa sẵn sàng.");
  }

  await window.Clerk.load({
    ui: { ClerkUI: window.__internal_ClerkUICtor },
    localization: HP_CLERK_LOCALIZATION,
  });

  return window.Clerk;
}
