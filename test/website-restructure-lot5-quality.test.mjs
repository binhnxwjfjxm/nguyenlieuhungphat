import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("lot 5 dialogs trap keyboard focus, close with Escape and restore the trigger", () => {
  const hook = read("components/use-accessible-dialog.ts");
  const catalog = read("components/product-catalog.tsx");
  const recruitment = read("components/recruitment-board.tsx");

  assert.match(hook, /FOCUSABLE_SELECTOR/);
  assert.match(hook, /event\.key === "Escape"/);
  assert.match(hook, /event\.key !== "Tab"/);
  assert.match(hook, /triggerRef\.current\?\.focus/);
  assert.match(hook, /document\.body\.style\.overflow = "hidden"/);

  assert.match(catalog, /useAccessibleDialog/);
  assert.match(catalog, /ref=\{dialogRef\}/);
  assert.match(catalog, /tabIndex=\{-1\}/);

  assert.match(recruitment, /useAccessibleDialog/);
  assert.match(recruitment, /aria-haspopup="dialog"/);
  assert.match(recruitment, /id="recruitment-role-dialog"/);
});

test("lot 5 mobile navigation and filters expose state to assistive technology", () => {
  const header = read("components/header.tsx");
  const catalog = read("components/product-catalog.tsx");

  assert.match(header, /aria-controls="mobile-primary-navigation"/);
  assert.match(header, /event\.key !== "Escape"/);
  assert.match(header, /useReducedMotion/);

  assert.match(catalog, /aria-expanded=\{mobileFiltersOpen\}/);
  assert.match(catalog, /aria-controls="catalog-filter-panel"/);
  assert.match(catalog, /aria-pressed=\{category === item\.slug\}/);
});

test("lot 5 image helpers reserve intrinsic space and retain lazy loading", () => {
  const picture = read("components/responsive-asset-picture.tsx");

  assert.match(picture, /intrinsicWidth = 1600/);
  assert.match(picture, /intrinsicHeight = 1000/);
  assert.match(picture, /width=\{intrinsicWidth\}/);
  assert.match(picture, /height=\{intrinsicHeight\}/);
  assert.match(picture, /loading=\{loading \?\? \(priority \? "eager" : "lazy"\)\}/);
});

test("lot 5 CSS prevents overflow and respects safe-area on small screens", () => {
  const globals = read("app/globals.css");
  const company = read("app/company-site-v2.css");
  const chatbot = read("app/chatbot.css");

  assert.match(globals, /html \{[\s\S]*overflow-x: clip/);
  assert.match(globals, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(company, /max-height: calc\(100dvh - 68px - env\(safe-area-inset-bottom\)\)/);
  assert.match(company, /\.recruitment-modal-panel[\s\S]*max-height: calc\(100dvh - 16px - env\(safe-area-inset-bottom\)\)/);
  assert.match(company, /overscroll-behavior: contain/);
  assert.match(chatbot, /100dvh/);
});

test("lot 5 forms expose submitting state and Customer Ordering remains independently verified", () => {
  const contact = read("components/contact-form.tsx");
  const recruitment = read("components/recruitment-form.tsx");
  const orderingWorkflow = read(".github/workflows/customer-ordering-ci.yml");
  const orderingPackage = read("customer-ordering/package.json");

  assert.match(contact, /aria-busy=\{status === "submitting"\}/);
  assert.match(recruitment, /aria-busy=\{isSubmitting\}/);
  assert.match(orderingWorkflow, /customer-ordering\/\*\*/);
  assert.match(orderingWorkflow, /npm run verify/);
  assert.match(orderingPackage, /"verify":/);
});
