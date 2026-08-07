import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("UI-5 replaces the news placeholder with an inbox and detail route", async () => {
  const [newsPage, detailPage, center, contracts, service] = await Promise.all([
    read("app/news/page.tsx"),
    read("app/news/[articleId]/page.tsx"),
    read("components/notification-center.tsx"),
    read("lib/contracts.ts"),
    read("lib/customer-ordering-service.ts"),
  ]);

  assert.match(newsPage, /NotificationCenter/);
  assert.doesNotMatch(newsPage, /hoàn thiện ở UI-5/);
  assert.match(detailPage, /AnnouncementDetail/);
  assert.match(center, /Chưa đọc/);
  assert.match(contracts, /interface Announcement/);
  assert.match(contracts, /interface NotificationPreference/);
  assert.match(service, /listAnnouncements/);
  assert.match(service, /markAnnouncementRead/);
});

test("OneSignal uses the v16 browser SDK, Clerk identity and subscription change synchronization", async () => {
  const [browser, provider, preferences, layout, worker] = await Promise.all([
    read("lib/push/onesignal-browser.ts"),
    read("components/onesignal-provider.tsx"),
    read("components/notification-preferences.tsx"),
    read("app/layout.tsx"),
    read("public/push/onesignal/OneSignalSDKWorker.js"),
  ]);

  assert.match(browser, /OneSignalSDK\.page\.js/);
  assert.match(browser, /ONESIGNAL_WORKER_PATH = "push\/onesignal\/OneSignalSDKWorker\.js"/);
  assert.match(browser, /ONESIGNAL_WORKER_SCOPE = "\/push\/onesignal\/"/);
  assert.doesNotMatch(browser, /ONESIGNAL_WORKER_PATH = "\/push\/onesignal\//);
  assert.match(browser, /serviceWorkerPath: ONESIGNAL_WORKER_PATH/);
  assert.match(browser, /serviceWorkerParam: \{ scope: ONESIGNAL_WORKER_SCOPE \}/);
  assert.match(provider, /loaded\.login\(user\.id\)/);
  assert.match(provider, /loaded\.logout\(\)/);
  assert.match(provider, /requestPermission/);
  assert.match(provider, /waitForPushSubscriptionMutation/);
  assert.match(provider, /PushSubscription\.addEventListener\("change"/);
  assert.match(provider, /PushSubscription\.optIn/);
  assert.match(provider, /PushSubscription\.optOut/);
  assert.match(provider, /visibilitychange/);
  assert.match(preferences, /push\.permission/);
  assert.match(preferences, /Đồng bộ lại/);
  assert.match(layout, /OneSignalProvider/);
  assert.match(worker, /OneSignalSDK\.sw\.js/);
  assert.doesNotMatch(browser, /os_v2_app_/);
  assert.doesNotMatch(provider, /os_v2_app_/);
});

test("notification preferences live in the notification tab rather than the account tab", async () => {
  const [adapter, accountPage, newsPage, preferences, badge] = await Promise.all([
    read("lib/adapters/mock/mock-customer-ordering-adapter.ts"),
    read("app/account/page.tsx"),
    read("app/news/page.tsx"),
    read("components/notification-preferences.tsx"),
    read("components/notification-badge.tsx"),
  ]);

  assert.match(adapter, /ANNOUNCEMENT_READ_KEY/);
  assert.match(adapter, /NOTIFICATION_PREFERENCE_KEY/);
  assert.match(adapter, /saveNotificationPreference/);
  assert.doesNotMatch(accountPage, /NotificationPreferences/);
  assert.match(newsPage, /NotificationPreferences/);
  assert.match(preferences, /Cập nhật đơn hàng/);
  assert.match(preferences, /Chương trình & khuyến mại/);
  assert.match(badge, /listAnnouncements/);
});

test("Core bridge keeps the inbox authoritative and OneSignal server send behind Core", async () => {
  const bridge = await read("docs/onesignal-core-bridge.md");
  assert.match(bridge, /external_id = Clerk user ID/);
  assert.match(bridge, /NppCustomerApiAdapter/);
  assert.match(bridge, /audit\/outbox/);
  assert.match(bridge, /OneSignal REST API/);
  assert.match(bridge, /REST API key chỉ dùng trong backend/);
});
