import { AccountAuthCard } from "@/components/account-auth-card";
import { AppShell } from "@/components/app-shell";
import { PwaInstallCard } from "@/components/pwa-install-card";

export default function AccountPage() {
  return (
    <AppShell title="Tài khoản">
      <AccountAuthCard />
      <PwaInstallCard />
    </AppShell>
  );
}
