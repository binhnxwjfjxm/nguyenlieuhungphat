"use client";

import { LocateFixed, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export interface VietnamAddressValue {
  provinceCode: string;
  provinceName: string;
  wardCode: string;
  wardName: string;
  addressLine: string;
  latitude: number | null;
  longitude: number | null;
}

type Province = { code: number; name: string };
type Ward = { code: number; name: string; province_code?: number };

const PROVINCES: Province[] = [
  { code: 1, name: "Thành phố Hà Nội" }, { code: 4, name: "Tỉnh Cao Bằng" }, { code: 8, name: "Tỉnh Tuyên Quang" },
  { code: 11, name: "Tỉnh Điện Biên" }, { code: 12, name: "Tỉnh Lai Châu" }, { code: 14, name: "Tỉnh Sơn La" },
  { code: 15, name: "Tỉnh Lào Cai" }, { code: 19, name: "Tỉnh Thái Nguyên" }, { code: 20, name: "Tỉnh Lạng Sơn" },
  { code: 22, name: "Tỉnh Quảng Ninh" }, { code: 24, name: "Tỉnh Bắc Ninh" }, { code: 25, name: "Tỉnh Phú Thọ" },
  { code: 31, name: "Thành phố Hải Phòng" }, { code: 33, name: "Tỉnh Hưng Yên" }, { code: 37, name: "Tỉnh Ninh Bình" },
  { code: 38, name: "Tỉnh Thanh Hóa" }, { code: 40, name: "Tỉnh Nghệ An" }, { code: 42, name: "Tỉnh Hà Tĩnh" },
  { code: 44, name: "Tỉnh Quảng Trị" }, { code: 46, name: "Thành phố Huế" }, { code: 48, name: "Thành phố Đà Nẵng" },
  { code: 51, name: "Tỉnh Quảng Ngãi" }, { code: 52, name: "Tỉnh Gia Lai" }, { code: 56, name: "Tỉnh Khánh Hòa" },
  { code: 66, name: "Tỉnh Đắk Lắk" }, { code: 68, name: "Tỉnh Lâm Đồng" }, { code: 75, name: "Tỉnh Đồng Nai" },
  { code: 79, name: "Thành phố Hồ Chí Minh" }, { code: 80, name: "Tỉnh Tây Ninh" }, { code: 82, name: "Tỉnh Đồng Tháp" },
  { code: 86, name: "Tỉnh Vĩnh Long" }, { code: 91, name: "Tỉnh An Giang" }, { code: 92, name: "Thành phố Cần Thơ" },
  { code: 96, name: "Tỉnh Cà Mau" },
];

function normalizedName(value: string): string {
  return value.trim().toLocaleLowerCase("vi");
}

export function VietnamAddressFields({ value, onChange, disabled = false }: Readonly<{ value: VietnamAddressValue; onChange: (next: VietnamAddressValue) => void; disabled?: boolean }>) {
  const [wards, setWards] = useState<Ward[]>([]);
  const [wardsError, setWardsError] = useState("");
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const explicitProvinceCode = Number(value.provinceCode || 0);
  const selectedProvince = useMemo(() => {
    if (explicitProvinceCode) return PROVINCES.find((province) => province.code === explicitProvinceCode) ?? null;
    const provinceName = normalizedName(value.provinceName);
    return provinceName ? PROVINCES.find((province) => normalizedName(province.name) === provinceName) ?? null : null;
  }, [explicitProvinceCode, value.provinceName]);
  const selectedProvinceCode = selectedProvince ? String(selectedProvince.code) : "";
  const selectedWardCode = useMemo(() => {
    if (value.wardCode) return value.wardCode;
    const wardName = normalizedName(value.wardName);
    const ward = wardName ? wards.find((item) => normalizedName(item.name) === wardName) : null;
    return ward ? String(ward.code) : "";
  }, [value.wardCode, value.wardName, wards]);

  useEffect(() => {
    if (!selectedProvince) return;
    const controller = new AbortController();
    void fetch(`https://provinces.open-api.vn/api/v2/w/?province=${selectedProvince.code}`, { signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error("ward-load-failed"); return response.json() as Promise<Ward[]>; })
      .then((items) => {
        setWardsError("");
        setWards(items.sort((a, b) => a.name.localeCompare(b.name, "vi")));
      })
      .catch((error: unknown) => { if ((error as { name?: string })?.name !== "AbortError") setWardsError("Không tải được danh sách xã/phường."); });
    return () => controller.abort();
  }, [selectedProvince]);

  function updateProvince(code: string) {
    const province = PROVINCES.find((item) => String(item.code) === code) ?? null;
    setWards([]); setWardsError("");
    onChange({ ...value, provinceCode: code, provinceName: province?.name ?? "", wardCode: "", wardName: "" });
  }
  function updateWard(code: string) {
    const ward = wards.find((item) => String(item.code) === code) ?? null;
    onChange({ ...value, wardCode: code, wardName: ward?.name ?? "" });
  }
  function locate() {
    if (disabled) return;
    if (!navigator.geolocation) { setLocationError("Thiết bị không hỗ trợ định vị."); return; }
    setLocating(true); setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (position) => { onChange({ ...value, latitude: Number(position.coords.latitude.toFixed(6)), longitude: Number(position.coords.longitude.toFixed(6)) }); setLocating(false); },
      () => { setLocationError("Không lấy được vị trí. Kiểm tra quyền định vị trên thiết bị."); setLocating(false); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  return <div className="vietnam-address-fields">
    <label><span>Tỉnh / thành phố</span><select disabled={disabled} required onChange={(event) => updateProvince(event.target.value)} value={selectedProvinceCode}><option value="">Chọn tỉnh / thành phố</option>{PROVINCES.map((province) => <option key={province.code} value={province.code}>{province.name}</option>)}</select></label>
    <label><span>Xã / phường / đặc khu</span><select disabled={disabled || !selectedProvince || wards.length === 0} required onChange={(event) => updateWard(event.target.value)} value={selectedWardCode}><option value="">{selectedProvince && wards.length === 0 && !wardsError ? "Đang tải..." : "Chọn xã / phường"}</option>{wards.map((ward) => <option key={ward.code} value={ward.code}>{ward.name}</option>)}</select>{wardsError ? <small className="field-error">{wardsError}</small> : null}</label>
    <label className="address-line-field"><span>Số nhà, tên đường</span><div className="input-with-icon"><MapPin aria-hidden="true" size={18} /><input autoComplete="street-address" disabled={disabled} onChange={(event) => onChange({ ...value, addressLine: event.target.value })} placeholder="Số nhà, tên đường" required value={value.addressLine} /></div></label>
    <div className="location-row"><button className="location-button" disabled={disabled || locating} onClick={locate} type="button"><LocateFixed aria-hidden="true" size={18} />{locating ? "Đang lấy vị trí..." : "Lấy vị trí hiện tại"}</button>{value.latitude !== null && value.longitude !== null ? <span>Đã lưu vị trí</span> : null}</div>
    {locationError ? <small className="field-error">{locationError}</small> : null}
  </div>;
}
