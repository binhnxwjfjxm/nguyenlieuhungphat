import type { Metadata } from "next";
import { LoginCard } from "@/components/login-card";

export const metadata: Metadata = { title: "Đăng nhập" };
export default function LoginPage() { return <LoginCard />; }
