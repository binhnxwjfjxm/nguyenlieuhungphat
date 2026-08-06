import { ClipboardList } from "lucide-react";
import { AppShell } from "@/components/app-shell";
export default function Page() { return <AppShell title="Đơn hàng"><section className="placeholder-screen"><span className="placeholder-icon"><ClipboardList aria-hidden="true" size={30} /></span><p className="eyebrow">Customer Ordering PWA</p><h1>Đơn hàng của tôi</h1><p>Danh sách và timeline đơn sẽ được hoàn thiện ở UI-4.</p></section></AppShell>; }
