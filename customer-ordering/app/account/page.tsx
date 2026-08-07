import { AccountAuthCard } from "@/components/account-auth-card";
import { AppShell } from "@/components/app-shell";
import { NotificationPreferences } from "@/components/notification-preferences";

export default function AccountPage() {
  return (
    <AppShell title="Tài khoản">
      <AccountAuthCard />
      <div className="account-notification-preferences">
        <NotificationPreferences />
      </div>
    </AppShell>
  );
}
