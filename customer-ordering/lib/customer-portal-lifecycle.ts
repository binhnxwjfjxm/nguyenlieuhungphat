import { loadClerkBrowser } from "@/lib/auth/clerk-browser";

export type PortalLifecycleState =
  | "unregistered"
  | "submitted"
  | "under_review"
  | "need_more_info"
  | "approved"
  | "linked_existing"
  | "activation_pending"
  | "active_customer"
  | "rejected"
  | "cancelled"
  | "suspended";

export interface PortalCustomerSnapshot {
  name: string;
  phone: string | null;
  businessType?: string | null;
  address: {
    label: string;
    addressLine1: string;
    addressLine2: string | null;
    ward: string | null;
    district: string | null;
    province: string | null;
    postalCode: string | null;
    countryCode: string;
  };
}

export interface PortalRegistration {
  id: string;
  status: string;
  version: number;
  proposedCustomer: PortalCustomerSnapshot;
  reviewReason: string | null;
  submittedAt: string;
  updatedAt: string;
}

export interface PortalLifecycleSnapshot {
  state: PortalLifecycleState;
  registration: PortalRegistration | null;
  profile: { customerCode?: string; outletName?: string } | null;
}

export interface PortalEditableAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  ward: string;
  district: string;
  province: string;
  postalCode: string;
  countryCode: string;
  isDefault: boolean;
  updatedAt: string;
}

export interface PortalProfile {
  customerCode: string;
  displayName: string;
  outletName: string;
  phone: string;
  customerUpdatedAt: string;
  address: PortalEditableAddress | null;
}

export interface PortalRegistrationInput {
  proposedCustomer: {
    name: string;
    phone: string;
    businessType: string;
    address: {
      label: string;
      addressLine1: string;
      ward: string;
      province: string;
      countryCode: "VN";
    };
  };
}

export interface PortalProfileUpdateInput {
  outletName: string;
  phone: string;
  expectedCustomerUpdatedAt: string;
  expectedAddressUpdatedAt: string;
  address: {
    id: string;
    addressLine1: string;
    ward: string;
    province: string;
    countryCode: string;
  };
}

type ClerkRuntime = Awaited<ReturnType<typeof loadClerkBrowser>> & {
  session?: { getToken(): Promise<string | null> };
  user?: { id?: string };
};

type PortalEnvelope<T> = {
  data?: T;
  error?: { code?: string; message?: string; retryable?: boolean };
};

export class PortalLifecycleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly retryable: boolean,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "PortalLifecycleError";
  }
}

async function clerkToken(): Promise<string> {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  if (!publishableKey) throw new PortalLifecycleError("CLERK_NOT_CONFIGURED", "Đăng nhập khách hàng chưa được cấu hình.", false, 503);
  const clerk = await loadClerkBrowser(publishableKey) as ClerkRuntime;
  const token = await clerk.session?.getToken();
  if (!clerk.user?.id?.trim() || !token) {
    throw new PortalLifecycleError("CUSTOMER_PORTAL_AUTH_REQUIRED", "Vui lòng đăng nhập lại để tiếp tục.", false, 401);
  }
  return token;
}

async function requestPortal<T>(path: string, init: RequestInit = {}, idempotencyKey?: string): Promise<T> {
  const token = await clerkToken();
  let response: Response;
  try {
    response = await fetch(`/api/customer-portal${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new PortalLifecycleError("CUSTOMER_PORTAL_UNAVAILABLE", "Không kết nối được hệ thống điểm bán. Vui lòng thử lại.", true, 503);
  }
  let envelope: PortalEnvelope<T> = {};
  try { envelope = await response.json() as PortalEnvelope<T>; } catch { /* normalized below */ }
  if (!response.ok || envelope.data === undefined) {
    throw new PortalLifecycleError(
      envelope.error?.code || "CUSTOMER_PORTAL_REQUEST_FAILED",
      envelope.error?.message || "Yêu cầu Customer Portal không thành công.",
      envelope.error?.retryable === true || response.status >= 500,
      response.status,
    );
  }
  return envelope.data;
}

export async function getPortalLifecycle(): Promise<PortalLifecycleSnapshot> {
  return requestPortal<PortalLifecycleSnapshot>("/registrations/current");
}

export async function submitPortalRegistration(input: PortalRegistrationInput, idempotencyKey: string): Promise<PortalLifecycleSnapshot> {
  return requestPortal<PortalLifecycleSnapshot>(
    "/registrations",
    { method: "POST", body: JSON.stringify(input) },
    idempotencyKey,
  );
}

export async function resubmitPortalRegistration(registration: PortalRegistration, input: PortalRegistrationInput, idempotencyKey: string): Promise<PortalLifecycleSnapshot> {
  return requestPortal<PortalLifecycleSnapshot>(
    `/registrations/${encodeURIComponent(registration.id)}/resubmit`,
    { method: "POST", body: JSON.stringify({ ...input, expectedVersion: registration.version }) },
    idempotencyKey,
  );
}

export async function getPortalProfile(): Promise<PortalProfile> {
  const result = await requestPortal<{ profile: PortalProfile }>("/me");
  return result.profile;
}

export async function updatePortalProfile(input: PortalProfileUpdateInput, idempotencyKey: string): Promise<PortalProfile> {
  const result = await requestPortal<{ profile: PortalProfile }>(
    "/me",
    { method: "PATCH", body: JSON.stringify(input) },
    idempotencyKey,
  );
  return result.profile;
}
