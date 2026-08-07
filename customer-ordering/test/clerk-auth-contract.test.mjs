import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Customer Ordering loads Clerk UI and browser SDK through a public key only", async () => {
  const [provider, browser, exampleEnv] = await Promise.all([read("components/clerk-auth-provider.tsx"), read("lib/auth/clerk-browser.ts"), read(".env.example")]);
  assert.match(provider, /NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY/);
  assert.match(browser, /@clerk\/ui@1/);
  assert.match(browser, /@clerk\/clerk-js@6/);
  assert.match(browser, /script\.dataset\.clerkPublishableKey = publishableKey/);
  assert.doesNotMatch(provider, /CLERK_SECRET_KEY/);
  assert.doesNotMatch(browser, /CLERK_SECRET_KEY/);
  assert.doesNotMatch(exampleEnv, /^CLERK_SECRET_KEY=/m);
});

test("Hưng Phát login exposes explicit Clerk sign-in and sign-up modes", async () => {
  const [login, browser, appearance] = await Promise.all([read("components/login-card.tsx"), read("lib/auth/clerk-browser.ts"), read("lib/auth/clerk-appearance.ts")]);
  assert.match(login, /mountSignIn/);
  assert.match(login, /mountSignUp/);
  assert.match(login, /authMode === "sign-up"/);
  assert.match(login, /role="tablist"/);
  assert.match(login, />\s*Đăng ký\s*</);
  assert.match(login, /oauthFlow: "redirect"/);
  assert.match(browser, /mountSignUp\(node: HTMLDivElement/);
  assert.match(appearance, /socialButtonsBlockButton/);
});

test("account tab keeps shop registration and Clerk account management compact until opened", async () => {
  const [account, location, profile] = await Promise.all([read("components/account-auth-card.tsx"), read("components/vietnam-address-fields.tsx"), read("components/clerk-user-profile.tsx")]);
  assert.match(account, /Đăng ký điểm bán/);
  assert.match(account, /account-collapsible/);
  assert.match(account, /<details/);
  assert.match(account, /SHOP_REGISTRATION_STORAGE_PREFIX/);
  assert.match(account, /window\.localStorage\.getItem/);
  assert.match(account, /window\.localStorage\.setItem/);
  assert.match(account, /expiresAt/);
  assert.match(account, /VietnamAddressFields/);
  assert.match(account, /provinceCode/);
  assert.match(account, /wardCode/);
  assert.match(account, />Xóa</);
  assert.match(location, /navigator\.geolocation\.getCurrentPosition/);
  assert.match(location, /provinces\.open-api\.vn\/api\/v2\/w/);
  assert.match(account, /ClerkUserProfilePanel/);
  assert.match(profile, /onToggle/);
  assert.match(profile, /open && status === "signed-in"/);
  assert.match(profile, /mountUserProfile/);
  assert.match(profile, /routing: "hash"/);
  assert.doesNotMatch(account, /NPP Core|Giai đoạn UI|Mock UI/);
});

test("legacy Google redirect callback remains available during the auth transition", async () => {
  const [callback, callbackPage] = await Promise.all([read("components/google-auth-callback.tsx"), read("app/login/sso-callback/page.tsx")]);
  assert.match(callback, /handleRedirectCallback/);
  assert.match(callback, /id="clerk-captcha"/);
  assert.match(callbackPage, /GoogleAuthCallback/);
});

test("protected app shell uses Clerk auth gate", async () => {
  const [shell, layout] = await Promise.all([read("components/app-shell.tsx"), read("app/layout.tsx")]);
  assert.match(shell, /CustomerAuthGate/);
  assert.match(layout, /ClerkAuthProvider/);
});
