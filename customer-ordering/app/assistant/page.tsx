import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { CustomerAssistant } from "@/components/customer-assistant";

export const metadata: Metadata = { title: "Hỏi Hưng Phát" };

export default function AssistantPage() {
  return (
    <AppShell title="Hỏi Hưng Phát">
      <CustomerAssistant />
    </AppShell>
  );
}
