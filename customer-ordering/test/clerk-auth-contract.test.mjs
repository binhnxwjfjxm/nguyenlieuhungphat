import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Customer Ordering loads Clerk through a public browser key only", async () => {
  const [provider, browser, exampleEnv] = await Promise.all([
    read("components/clerk-auth-provider.tsx"),
    read("lib/auth/clerk-browser.ts"),
    read(".env.example"),
  ]);
  assert.match(provider, /NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY/);
  assert.match(browser, /@clerk\/clerk-js@6/);
  assert.doesNotMatch(provider, /CLERK_SECRET_KEY/);
  assert.doesNotMatch(browser, /CLERK_SECRET_KEY/);
  assert.doesNotMatch(exampleEnv, /^CLERK_SECRET_KEY=/m);
});

test("custom Hưng Phát login uses Google OAuth for both sign-in and sign-up", async () => {
  const [login, callback, callbackPage] = await Promise.all([
    read("components/login-card.tsx"),
    read("components/google-auth-callback.tsx"),
    read("app/login/sso-callback/page.tsx"),
  ]);
  assert.match(login, /strategy: "oauth_google"/);
  assert.match(login, /authenticateWithRedirect/);
  assert.match(login, /redirectUrl: "\/login\/sso-callback"/);
  assert.match(login, /src="\/logo-transparent\.png"/);
  assert.doesNotMatch(login, /phone_code/);
  assert.doesNotMatch(login, /Nhận mã xác minh/);
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

test("customer-facing copy uses Google identity without exposing internal Core terminology", async () => {
  const [account, gate] = await Promise.all([
    read("components/account-auth-card.tsx"),
    read("components/customer-auth-gate.tsx"),
  ]);
  assert.doesNotMatch(account, /NPP Core/);
  assert.doesNotMatch(gate, /khóa đăng nhập Clerk/);
  assert.match(account, /hồ sơ khách hàng Hưng Phát/);
  assert.match(account, /tài khoản Google này/);
  assert.match(account, /primaryEmailAddress/);
});
