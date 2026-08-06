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
}

export interface ClerkSignIn {
  authenticateWithRedirect(input: {
    strategy: "oauth_google";
    redirectUrl: string;
    redirectUrlComplete: string;
  }): Promise<unknown>;
}

export interface ClerkBrowser {
  loaded: boolean;
  user: ClerkUser | null;
  client: {
    signIn: ClerkSignIn;
  };
  load(): Promise<void>;
  addListener(listener: (state: { user?: ClerkUser | null }) => void): () => void;
  setActive(input: { session: string }): Promise<void>;
  signOut(input?: { redirectUrl?: string }): Promise<void>;
  handleRedirectCallback(input: {
    redirectUrl?: string;
    redirectUrlComplete?: string;
    continueSignUpUrl?: string;
  }): Promise<unknown>;
}

declare global {
  interface Window {
    Clerk?: ClerkBrowser;
  }
}

const CLERK_SCRIPT_ID = "hp-clerk-browser";

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

function loadScript(src: string, publishableKey: string): Promise<void> {
  const existing = document.getElementById(CLERK_SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    if (window.Clerk) return Promise.resolve();
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Không tải được dịch vụ đăng nhập.")), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = CLERK_SCRIPT_ID;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.clerkPublishableKey = publishableKey;
    script.src = src;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Không tải được dịch vụ đăng nhập.")), { once: true });
    document.head.appendChild(script);
  });
}

export async function loadClerkBrowser(publishableKey: string): Promise<ClerkBrowser> {
  const frontendApi = decodeFrontendApi(publishableKey);
  await loadScript(
    `https://${frontendApi}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`,
    publishableKey,
  );
  if (!window.Clerk) throw new Error("Dịch vụ đăng nhập chưa sẵn sàng.");
  if (!window.Clerk.loaded) await window.Clerk.load();
  return window.Clerk;
}
