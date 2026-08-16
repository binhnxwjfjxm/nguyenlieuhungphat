import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("active Customer Ordering profile persists captured GPS as the canonical location URL only", async () => {
  const [account, lifecycle, addressFields] = await Promise.all([
    read("components/account-auth-card.tsx"),
    read("lib/customer-portal-lifecycle.ts"),
    read("components/vietnam-address-fields.tsx"),
  ]);

  assert.match(lifecycle, /interface PortalEditableAddress[\s\S]*locationUrl: string;/);
  assert.match(lifecycle, /interface PortalProfileUpdateInput[\s\S]*locationUrl\?: string;/);
  assert.match(account, /function locationUrlFromForm\(form: ShopForm\): string \| undefined/);
  assert.match(account, /https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=\$\{form\.latitude\},\$\{form\.longitude\}/);
  assert.match(account, /const locationUrl = locationUrlFromForm\(form\);/);
  assert.match(account, /\.\.\.\(locationUrl \? \{ locationUrl \} : \{\}\)/);
  assert.match(addressFields, /navigator\.geolocation\.getCurrentPosition/);

  const updateInput = lifecycle.match(/export interface PortalProfileUpdateInput \{[\s\S]*?\n\}/)?.[0] ?? "";
  assert.doesNotMatch(updateInput, /latitude\s*:/);
  assert.doesNotMatch(updateInput, /longitude\s*:/);
  assert.doesNotMatch(account, /locationUrl:\s*profile\.address\.locationUrl/);
});

test("touched account copy uses office language instead of exposing Core terminology", async () => {
  const account = await read("components/account-auth-card.tsx");
  assert.match(account, /Điểm bán \/ Công Ty/);
  assert.match(account, /Mã khách Công Ty:/);
  assert.match(account, /Lưu lên Công Ty/);
  assert.doesNotMatch(account, />[^<]*Core[^<]*</);
  assert.doesNotMatch(account, /"[^"]*membership[^"]*"/i);
});
