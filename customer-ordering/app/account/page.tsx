import { AccountAuthCard } from "@/components/account-auth-card";
import { AppShell } from "@/components/app-shell";

export default function AccountPage() {
  return (
    <AppShell title="Tài khoản">
      <AccountAuthCard />
    </AppShell>
  );
}
