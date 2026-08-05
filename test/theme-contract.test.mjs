import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const theme = readFileSync(new URL('../app/hung-phat-warm-gold.css', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8');

const tokens = {
  '--hp-canvas': '#f7f5f1',
  '--hp-surface': '#ffffff',
  '--hp-bronze': '#98600f',
  '--hp-bronze-strong': '#754706',
  '--hp-ink': '#2d2924',
  '--hp-border': '#d8d0c4',
};

test('Website and ordering use the shared Hưng Phát warm-gold tokens', () => {
  for (const [name, value] of Object.entries(tokens)) {
    assert.match(theme, new RegExp(`${name}:\\s*${value}`, 'i'));
  }
  assert.match(theme, /\.site-header/);
  assert.match(theme, /\.button-primary/);
  assert.match(theme, /@media \(max-width: 760px\)/);
});

test('Website focus ring has an opaque edge for light and dark surfaces', () => {
  assert.match(theme, /--hp-focus-inner:\s*#fffdf8/i);
  assert.match(theme, /--hp-focus-outer:\s*#754706/i);
  assert.match(theme, /outline:\s*2px solid var\(--hp-focus-inner\)/);
  assert.match(theme, /box-shadow:\s*0 0 0 4px var\(--hp-focus-outer\)/);
});

test('customer theme loads after sprint overrides and aligns browser chrome', () => {
  const themeIndex = layout.indexOf('import "./hung-phat-warm-gold.css";');
  const sprintIndex = layout.indexOf('import "./sprint3.css";');
  assert.ok(themeIndex >= 0, 'warm-gold theme import must exist');
  assert.ok(sprintIndex >= 0, 'sprint3 override import must exist');
  assert.ok(themeIndex > sprintIndex);
  assert.match(layout, /viewportFit:\s*"cover"/);
  assert.match(layout, /themeColor:\s*"#754706"/);
});
