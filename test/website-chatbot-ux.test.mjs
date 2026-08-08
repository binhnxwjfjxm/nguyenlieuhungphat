import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const chatbot = await readFile("components/chatbot.tsx", "utf8");
const chatbotCss = await readFile("app/chatbot.css", "utf8");
const layout = await readFile("app/layout.tsx", "utf8");

test("chatbot keeps routine success feedback inside the conversation", () => {
  assert.doesNotMatch(chatbot, /toast\.success/);
  assert.doesNotMatch(chatbot, /setStatus/);
  assert.doesNotMatch(chatbot, /chatbot-status/);
  assert.match(chatbot, /toast\.error/);
  assert.match(chatbot, /replyText/);
});

test("chatbot Enter sends while Shift Enter keeps multiline input", () => {
  assert.match(chatbot, /event\.key !== "Enter" \|\| event\.shiftKey \|\| event\.nativeEvent\.isComposing/);
  assert.match(chatbot, /event\.currentTarget\.form\?\.requestSubmit\(\)/);
  assert.match(chatbot, /onKeyDown=\{submitOnEnter\}/);
  assert.match(chatbot, /enterKeyHint="send"/);
  assert.match(chatbot, /rows=\{1\}/);
});

test("chatbot uses a viewport-bounded shell with internal message scrolling", () => {
  assert.ok(layout.indexOf('import "./chatbot.css";') > layout.indexOf('import "./hung-phat-warm-gold.css";'));
  assert.match(chatbotCss, /\.chatbot-panel\s*\{[\s\S]*?height:\s*min\(680px,\s*calc\(100dvh/);
  assert.match(chatbotCss, /\.chatbot-panel\.is-minimized\s*\{[\s\S]*?height:\s*auto/);
  assert.match(chatbotCss, /\.chatbot-body\s*\{[\s\S]*?flex:\s*1 1 auto[\s\S]*?overflow:\s*hidden/);
  assert.match(chatbotCss, /\.chatbot-messages\s*\{[\s\S]*?flex:\s*1 1 auto[\s\S]*?overflow-y:\s*auto/);
  assert.match(chatbotCss, /\.chatbot-compose\s*\{[\s\S]*?flex:\s*0 0 auto/);
  assert.match(chatbotCss, /@media \(max-width:\s*430px\)[\s\S]*?100dvh/);
});
