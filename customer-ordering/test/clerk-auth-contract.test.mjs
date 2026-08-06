import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Customer Ordering loads Clerk UI and browser SDK through a public key only", async () => {
  const [provider, browser, exampleEnv] = await Promise.all([
    read("components/clerk-auth-provider.tsx"),
    read("lib/auth/clerk-browser.ts"),
    read(".env.example"),
  ]);
  assert.match(provider, /NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY/);
  assert.match(browser, /@clerk\/ui@1/);
  assert.match(browser, /@clerk\/clerk-js@6/);
  assert.match(browser, /__internal_ClerkUICtor/);
  assert.match(browser, /script\.dataset\.clerkPublishableKey = publishableKey/);
  assert.doesNotMatch(provider, /CLERK_SECRET_KEY/);
  assert.doesNotMatch(browser, /CLERK_SECRET_KEY/);
  assert.doesNotMatch(exampleEnv, /^CLERK_SECRET_KEY=/m);
});

test("Hưng Phát login embeds Clerk sign-in-or-up with configured providers", async () => {
  const [login, appearance] = await Promise.all([
    read("components/login-card.tsx"),
    read("lib/auth/clerk-appearance.ts"),
  ]);
  assert.match(login, /mountSignIn/);
  assert.match(login, /withSignUp: true/);
  assert.match(login, /oauthFlow: "redirect"/);
  assert.match(login, /src="\/logo-transparent\.png"/);
  assert.match(login, /Google, email hoặc tên đăng nhập/);
  assert.doesNotMatch(login, /function GoogleMark/);
  assert.doesNotMatch(login, /authenticateWithRedirect/);
  assert.match(appearance, /socialButtonsBlockButton/);
  assert.match(appearance, /#dadce0/);
});

test("account tab combines shop registration with Clerk account and security management", async () => {
  const [account, profile] = await Promise.all([
    read("components/account-auth-card.tsx"),
    read("components/clerk-user-profile.tsx"),
  ]);
  assert.match(account, /Đăng ký điểm bán/);
  assert.match(account, /SHOP_REGISTRATION_STORAGE_KEY/);
  assert.match(account, /window\.localStorage\.setItem/);
  assert.match(account, /ClerkUserProfilePanel/);
  assert.match(profile, /mountUserProfile/);
  assert.match(profile, /routing: "hash"/);
  assert.match(profile, /Tạo hoặc đổi mật khẩu/);
  assert.doesNotMatch(account, /NPP Core/);
});

test("legacy Google redirect callback remains available during the auth transition", async () => {
  const [callback, callbackPage] = await Promise.all([
    read("components/google-auth-callback.tsx"),
    read("app/login/sso-callback/page.tsx"),
  ]);
  assert.match(callback, /handleRedirectCallback/);
  assert.match(callback, /id="clerk-captcha"/);
  assert.match(callbackPage, /GoogleAuthCallback/);
});

test("protected app shell uses Clerk auth gate", async () => {
  const [shell, layout] = await Promise.all([
    read("components/app-shell.tsx"),
    read("app/layout.tsx"),
  ]);
  assert.match(shell, /CustomerAuthGate/);
  assert.match(layout, /ClerkAuthProvider/);
});
