import Link from "next/link";
import { WifiOff } from "lucide-react";
export default function OfflinePage() { return <main className="offline-page"><WifiOff aria-hidden="true" size={44} /><h1>Đang mất kết nối</h1><p>Vui lòng kiểm tra mạng. Dữ liệu riêng tư không được lưu trong bộ nhớ cache.</p><Link className="primary-button" href="/">Thử lại</Link></main>; }
