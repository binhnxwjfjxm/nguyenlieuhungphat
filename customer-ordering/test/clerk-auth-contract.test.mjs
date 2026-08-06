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

test("custom Hưng Phát login supports phone OTP, guest sign-up and CAPTCHA", async () => {
  const login = await read("components/login-card.tsx");
  assert.match(login, /strategy: "phone_code"/);
  assert.match(login, /signUp\.create/);
  assert.match(login, /form_identifier_not_found/);
  assert.match(login, /id="clerk-captcha"/);
  assert.match(login, /src="\/logo-transparent\.png"/);
  assert.doesNotMatch(login, /mountSignIn/);
});

test("protected app shell uses Clerk auth gate", async () => {
  const [shell, layout] = await Promise.all([
    read("components/app-shell.tsx"),
    read("app/layout.tsx"),
  ]);
  assert.match(shell, /CustomerAuthGate/);
  assert.match(layout, /ClerkAuthProvider/);
});

test("customer-facing copy does not expose internal provider or Core terminology", async () => {
  const [account, gate] = await Promise.all([
    read("components/account-auth-card.tsx"),
    read("components/customer-auth-gate.tsx"),
  ]);
  assert.doesNotMatch(account, /NPP Core/);
  assert.doesNotMatch(gate, /khóa đăng nhập Clerk/);
  assert.match(account, /hồ sơ khách hàng Hưng Phát/);
});
