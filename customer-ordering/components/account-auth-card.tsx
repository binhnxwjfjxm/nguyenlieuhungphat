"use client";

import { AlertCircle, Building2, CheckCircle2, Clock3, LogOut, Mail, Phone, RefreshCw, Save, Store } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { AccountModal } from "@/components/account-modal";
import { ClerkUserProfilePanel } from "@/components/clerk-user-profile";
import { ClerkAvatar } from "@/components/clerk-avatar";
import { useCustomerAuth } from "@/components/clerk-auth-provider";
import { rememberCustomerPortalAccess } from "@/components/customer-portal-access-gate";
import { VietnamAddressFields, type VietnamAddressValue } from "@/components/vietnam-address-fields";
import {
  getPortalLifecycle,
  getPortalProfile,
  PortalLifecycleError,
  resubmitPortalRegistration,
  submitPortalRegistration,
  updatePortalProfile,
  type PortalLifecycleSnapshot,
  type PortalProfile,
  type PortalRegistration,
  type PortalRegistrationInput,
} from "@/lib/customer-portal-lifecycle";

const BUSINESS_TYPES = [
  "Cửa hàng bán lẻ",
  "Trà sữa / đồ uống",
  "Mỳ cay / quán ăn",
  "Tiệm bánh",
  "Nhà hàng",
  "Nhà phân phối",
  "Khác",
] as const;

type ShopForm = VietnamAddressValue & {
  shopName: string;
  phone: string;
  businessType: string;
};

type ShopTextField = "shopName" | "phone" | "businessType";

const EMPTY_FORM: ShopForm = {
  shopName: "",
  phone: "",
  businessType: "Cửa hàng bán lẻ",
  provinceCode: "",
  provinceName: "",
  wardCode: "",
  wardName: "",
  addressLine: "",
  latitude: null,
  longitude: null,
};

function formFromRegistration(registration: PortalRegistration | null): ShopForm {
  const customer = registration?.proposedCustomer;
  return customer ? {
    shopName: customer.name ?? "",
    phone: customer.phone ?? "",
    businessType: customer.businessType || "Cửa hàng bán lẻ",
    provinceCode: "",
    provinceName: customer.address?.province ?? "",
    wardCode: "",
    wardName: customer.address?.ward ?? "",
    addressLine: customer.address?.addressLine1 ?? "",
    latitude: null,
    longitude: null,
  } : EMPTY_FORM;
}

function formFromProfile(profile: PortalProfile): ShopForm {
  return {
    shopName: profile.outletName ?? "",
    phone: profile.phone ?? "",
    businessType: "Cửa hàng bán lẻ",
    provinceCode: "",
    provinceName: profile.address?.province ?? "",
    wardCode: "",
    wardName: profile.address?.ward ?? "",
    addressLine: profile.address?.addressLine1 ?? "",
    latitude: null,
    longitude: null,
  };
}

function registrationInput(form: ShopForm): PortalRegistrationInput {
  return {
    proposedCustomer: {
      name: form.shopName.trim(),
      phone: form.phone.trim(),
      businessType: form.businessType,
      address: {
        label: "Địa chỉ chính",
        addressLine1: form.addressLine.trim(),
        ward: form.wardName.trim(),
        province: form.provinceName.trim(),
        countryCode: "VN",
      },
    },
  };
}

const STATE_COPY: Record<string, { title: string; description: string }> = {
  unregistered: { title: "Chưa đăng ký điểm bán", description: "Gửi thông tin điểm bán để Hưng Phát xác minh trước khi mở danh mục và đặt hàng." },
  submitted: { title: "Đã gửi đăng ký", description: "Hưng Phát đã nhận thông tin và đang chờ xử lý." },
  under_review: { title: "Đang xác minh", description: "Thông tin điểm bán đang được bộ phận phụ trách kiểm tra." },
  need_more_info: { title: "Cần bổ sung thông tin", description: "Cập nhật lại thông tin theo ghi chú bên dưới rồi gửi lại." },
  approved: { title: "Đã duyệt, đang kích hoạt", description: "Hệ thống đang hoàn tất liên kết khách hàng và membership." },
  linked_existing: { title: "Đã liên kết, đang kích hoạt", description: "Hệ thống đang hoàn tất membership cho khách hàng hiện có." },
  activation_pending: { title: "Đã duyệt, đang kích hoạt", description: "Chưa mở đặt hàng cho tới khi membership hoạt động đầy đủ." },
  active_customer: { title: "Điểm bán đã liên thông Core", description: "Danh mục và đặt hàng đã được mở. Thông tin bên dưới là dữ liệu chính thức trên Core." },
  rejected: { title: "Đăng ký chưa được chấp thuận", description: "Xem ghi chú xử lý và liên hệ Hưng Phát nếu cần hỗ trợ." },
  cancelled: { title: "Đăng ký đã hủy", description: "Yêu cầu này đã kết thúc. Liên hệ Hưng Phát nếu cần mở lại quy trình." },
  suspended: { title: "Liên kết điểm bán tạm khóa", description: "Tài khoản hoặc membership hiện không sử dụng được. Vui lòng liên hệ Hưng Phát." },
};

const STATE_BADGE: Record<string, { label: string; tone: "danger" | "info" | "neutral" | "progress" | "success" | "warning" }> = {
  unregistered: { label: "Chưa đăng ký", tone: "neutral" },
  submitted: { label: "Đã gửi", tone: "info" },
  under_review: { label: "Đang xác minh", tone: "progress" },
  need_more_info: { label: "Cần bổ sung", tone: "warning" },
  approved: { label: "Đang kích hoạt", tone: "info" },
  linked_existing: { label: "Đang kích hoạt", tone: "info" },
  activation_pending: { label: "Đang kích hoạt", tone: "info" },
  active_customer: { label: "Đã kích hoạt", tone: "success" },
  rejected: { label: "Chưa chấp thuận", tone: "danger" },
  cancelled: { label: "Đã kết thúc", tone: "neutral" },
  suspended: { label: "Tạm khóa", tone: "danger" },
};

export function AccountAuthCard() {
  const { user, signOut } = useCustomerAuth();
  const mutationKeyRef = useRef<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snapshot, setSnapshot] = useState<PortalLifecycleSnapshot | null>(null);
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [form, setForm] = useState<ShopForm>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [shopModalOpen, setShopModalOpen] = useState(false);
  const displayName = user?.fullName || user?.firstName || "Khách hàng Hưng Phát";
  const email = user?.primaryEmailAddress?.emailAddress || "Chưa có email";
  const userId = user?.id;

  const applyLifecycleSnapshot = useCallback(async (next: PortalLifecycleSnapshot) => {
    setSnapshot(next);
    if (userId) rememberCustomerPortalAccess(userId, next.state);
    if (next.state === "active_customer") {
      const activeProfile = await getPortalProfile();
      setProfile(activeProfile);
      setForm(formFromProfile(activeProfile));
    } else {
      setProfile(null);
      setForm(formFromRegistration(next.registration));
    }
  }, [userId]);

  const refreshPortal = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError("");
    try {
      const next = await getPortalLifecycle();
      await applyLifecycleSnapshot(next);
    } catch (loadError: unknown) {
      setSnapshot(null);
      setProfile(null);
      setError(loadError instanceof PortalLifecycleError ? loadError.message : "Không tải được trạng thái điểm bán.");
    } finally {
      setLoading(false);
    }
  }, [applyLifecycleSnapshot, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    void (async () => {
      try {
        const next = await getPortalLifecycle();
        const activeProfile = next.state === "active_customer" ? await getPortalProfile() : null;
        if (cancelled) return;
        rememberCustomerPortalAccess(user.id, next.state);
        setSnapshot(next);
        setProfile(activeProfile);
        setForm(activeProfile ? formFromProfile(activeProfile) : formFromRegistration(next.registration));
      } catch (loadError: unknown) {
        if (cancelled) return;
        setSnapshot(null);
        setProfile(null);
        setError(loadError instanceof PortalLifecycleError ? loadError.message : "Không tải được trạng thái điểm bán.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  function currentMutationKey(): string {
    if (!mutationKeyRef.current) mutationKeyRef.current = crypto.randomUUID();
    return mutationKeyRef.current;
  }

  function markFormChanged() {
    mutationKeyRef.current = null;
    setNotice("");
    setError("");
  }

  function updateField(field: ShopTextField, value: string) {
    markFormChanged();
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateAddress(value: VietnamAddressValue) {
    markFormChanged();
    setForm((current) => ({ ...current, ...value }));
  }

  async function handleShopSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!snapshot) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (snapshot.state === "unregistered") {
        const next = await submitPortalRegistration(registrationInput(form), currentMutationKey());
        mutationKeyRef.current = null;
        await applyLifecycleSnapshot(next);
        setNotice("Đã gửi đăng ký điểm bán về Hưng Phát.");
      } else if (snapshot.state === "need_more_info" && snapshot.registration) {
        const next = await resubmitPortalRegistration(snapshot.registration, registrationInput(form), currentMutationKey());
        mutationKeyRef.current = null;
        await applyLifecycleSnapshot(next);
        setNotice("Đã gửi lại thông tin bổ sung.");
      } else if (snapshot.state === "active_customer" && profile?.address) {
        const updated = await updatePortalProfile({
          outletName: form.shopName.trim(),
          phone: form.phone.trim(),
          expectedCustomerUpdatedAt: profile.customerUpdatedAt,
          expectedAddressUpdatedAt: profile.address.updatedAt,
          address: {
            id: profile.address.id,
            addressLine1: form.addressLine.trim(),
            ward: form.wardName.trim(),
            province: form.provinceName.trim(),
            countryCode: profile.address.countryCode || "VN",
          },
        }, currentMutationKey());
        mutationKeyRef.current = null;
        setProfile(updated);
        setForm(formFromProfile(updated));
        setNotice("Đã cập nhật thông tin điểm bán trên Core.");
      }
    } catch (saveError: unknown) {
      const portalError = saveError instanceof PortalLifecycleError ? saveError : null;
      if (portalError?.statusCode === 409 && portalError.code !== "IDEMPOTENCY_IN_PROGRESS") {
        mutationKeyRef.current = null;
        await refreshPortal();
        setError("Dữ liệu trên Core đã thay đổi. Hãy kiểm tra dữ liệu mới rồi gửi lại.");
        return;
      }
      if (!portalError?.retryable && portalError?.code !== "IDEMPOTENCY_IN_PROGRESS") mutationKeyRef.current = null;
      setError(portalError?.message ?? "Không lưu được thông tin điểm bán.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try { await signOut(); } finally { setSigningOut(false); }
  }

  const state = snapshot?.state ?? "unregistered";
  const copy = STATE_COPY[state] ?? STATE_COPY.unregistered;
  const badge = STATE_BADGE[state] ?? STATE_BADGE.unregistered;
  const editableState = state === "unregistered" || state === "need_more_info" || state === "active_customer";
  const editable = Boolean(snapshot) && editableState && (state !== "active_customer" || Boolean(profile?.address));
  const submitLabel = state === "active_customer" ? "Lưu lên Core" : state === "need_more_info" ? "Gửi lại thông tin" : "Gửi đăng ký điểm bán";
  const openFormLabel = state === "active_customer" ? "Chỉnh sửa thông tin" : state === "need_more_info" ? "Bổ sung thông tin" : "Đăng ký điểm bán";

  return <div className="account-hub">
    <section className="account-identity-card"><ClerkAvatar className="account-avatar" imageSize={58} /><div className="account-identity-copy"><h1>{displayName}</h1><p className="account-email"><Mail aria-hidden="true" size={17} />{email}</p></div><button className="account-signout-button" disabled={signingOut} onClick={handleSignOut} type="button"><LogOut aria-hidden="true" size={18} />{signingOut ? "Đang đăng xuất..." : "Đăng xuất"}</button></section>

    <section className="account-section account-link-summary" id="shop-registration"><div className="account-section-heading"><span className="account-section-icon"><Building2 aria-hidden="true" size={21} /></span><div><p className="eyebrow">Điểm bán / Core</p><h2>{loading ? "Đang kiểm tra trạng thái..." : error && !snapshot ? "Không đọc được trạng thái điểm bán" : copy.title}</h2><p>{loading ? "Đang đọc dữ liệu chính thức từ Core." : error && !snapshot ? "Không mở luồng đăng ký hoặc đặt hàng khi chưa xác minh được trạng thái Core." : copy.description}</p>{state === "active_customer" && profile?.customerCode ? <p><strong>Mã khách Core:</strong> {profile.customerCode}</p> : null}</div>{snapshot ? <span className={`status-pill portal-status-${badge.tone}`}>{state === "active_customer" ? <CheckCircle2 aria-hidden="true" size={15} /> : <Clock3 aria-hidden="true" size={15} />}{badge.label}</span> : null}</div>
      {snapshot?.registration?.reviewReason ? <div className="shop-registration-notice"><AlertCircle aria-hidden="true" size={18} /><span>{snapshot.registration.reviewReason}</span></div> : null}
      {state === "active_customer" && profile && !profile.address ? <div className="shop-registration-notice"><AlertCircle aria-hidden="true" size={18} /><span>Điểm bán chưa có địa chỉ đang hoạt động. Vui lòng liên hệ Hưng Phát để khôi phục địa chỉ trước khi chỉnh sửa.</span></div> : null}
      {editable && !loading ? <button className="account-card-action" onClick={() => setShopModalOpen(true)} type="button"><Store aria-hidden="true" size={18} />{openFormLabel}</button> : null}
      {snapshot && !editable && !loading ? <button className="secondary-action-button" onClick={() => void refreshPortal()} type="button"><RefreshCw aria-hidden="true" size={17} />Tải lại trạng thái</button> : null}
    </section>

    {editable && !loading ? <AccountModal
      description={state === "active_customer" ? "Thông tin được đồng bộ trực tiếp với hồ sơ điểm bán trên Core." : "Thông tin sẽ được gửi tới Hưng Phát để xác minh."}
      icon={<Store aria-hidden="true" size={22} />}
      onClose={() => setShopModalOpen(false)}
      open={shopModalOpen}
      title={state === "active_customer" ? "Chỉnh sửa thông tin điểm bán" : state === "need_more_info" ? "Bổ sung thông tin điểm bán" : "Đăng ký điểm bán"}
    >
      <div className="shop-registration-modal-intro"><strong>{state === "active_customer" ? "Thông tin chính thức trên Core" : "Thông tin gửi Hưng Phát xác minh"}</strong><p>{state === "active_customer" ? "Chỉ thông tin điểm bán được phép thay đổi; mã khách, kho và kênh bán do Core quản lý." : "Tên quán / điểm bán sẽ là tên khách mới nếu Hưng Phát duyệt tạo mã."}</p></div>
      <form className="shop-registration-form" onSubmit={handleShopSubmit}>
        <label><span>Tên quán hoặc điểm bán</span><div className="input-with-icon"><Store aria-hidden="true" size={18} /><input autoComplete="organization" disabled={saving} onChange={(event) => updateField("shopName", event.target.value)} placeholder="Tên quán / điểm bán" required value={form.shopName} /></div></label>
        <label><span>Số điện thoại</span><div className="input-with-icon"><Phone aria-hidden="true" size={18} /><input autoComplete="tel" disabled={saving} inputMode="tel" onChange={(event) => updateField("phone", event.target.value)} placeholder="Số điện thoại" required value={form.phone} /></div></label>
        <VietnamAddressFields disabled={saving} onChange={updateAddress} value={form} />
        {state !== "active_customer" ? <label><span>Mô hình quán / loại hình kinh doanh</span><select disabled={saving} onChange={(event) => updateField("businessType", event.target.value)} required value={form.businessType}>{BUSINESS_TYPES.map((businessType) => <option key={businessType} value={businessType}>{businessType}</option>)}</select></label> : null}
        {notice ? <div className="shop-registration-notice"><CheckCircle2 aria-hidden="true" size={18} /><span>{notice}</span></div> : null}
        {error ? <small className="field-error">{error}</small> : null}
        <div className="shop-registration-actions"><button className="primary-button shop-registration-submit" disabled={saving} type="submit"><Save aria-hidden="true" size={18} />{saving ? "Đang lưu..." : submitLabel}</button></div>
      </form>
    </AccountModal> : null}

    {error && !editable ? <section className="account-section"><small className="field-error">{error}</small><button className="secondary-action-button" onClick={() => void refreshPortal()} type="button"><RefreshCw aria-hidden="true" size={17} />Thử lại</button></section> : null}
    <ClerkUserProfilePanel />
  </div>;
}
