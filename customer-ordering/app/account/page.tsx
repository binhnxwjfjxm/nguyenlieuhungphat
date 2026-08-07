import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { AccountAuthCard } from "@/components/account-auth-card";
import { PwaInstallCard } from "@/components/pwa-install-card";

export const metadata: Metadata = { title: "Tài khoản" };

export default function AccountPage() {
  return (
    <AppShell title="Tài khoản">
      <AccountAuthCard />
      <PwaInstallCard />
    </AppShell>
  );
}
