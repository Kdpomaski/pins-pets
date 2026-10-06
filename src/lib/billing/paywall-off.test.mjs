import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const flags = readFileSync(new URL('./feature-flags.ts', import.meta.url), 'utf8');
const products = readFileSync(new URL('./products.ts', import.meta.url), 'utf8');
const settings = readFileSync(new URL('../../components/SecuritySettings.tsx', import.meta.url), 'utf8');
const app = readFileSync(new URL('../../App.tsx', import.meta.url), 'utf8');
const privacy = readFileSync(new URL('../../../public/legal/privacy.html', import.meta.url), 'utf8');
const terms = readFileSync(new URL('../../../public/legal/terms.html', import.meta.url), 'utf8');
const pbx = readFileSync(new URL('../../../ios/App/App.xcodeproj/project.pbxproj', import.meta.url), 'utf8');
const gradle = readFileSync(new URL('../../../android/app/build.gradle', import.meta.url), 'utf8');

test('paywall flag is a false constant', () => {
  assert.match(flags, /export const PAYWALL_ENABLED = false;/);
  assert.match(flags, /return PAYWALL_ENABLED;/);
});

test('free caps are skipped when the paywall flag is off', () => {
  assert.match(products, /if \(!PAYWALL_ENABLED\) \{\s*return \{ allowed: true \};/);
});

test('Settings renders the Pro card only when the paywall flag is on', () => {
  const gateAt = settings.indexOf('{PAYWALL_ENABLED && (');
  const disclaimerAt = settings.indexOf('{VET_DISCLAIMER}');
  assert.ok(gateAt > -1 && disclaimerAt > gateAt);
  const gated = settings.slice(gateAt, disclaimerAt);
  assert.match(gated, /Pins Pets Pro/);
  assert.match(gated, /Restore purchases|PAYWALL_COPY\.restore/);
  assert.match(gated, /\n\s*\)\}/);
  assert.doesNotMatch(gated, /VET_DISCLAIMER/);
});

test('paywall modal is not mounted when the flag is off', () => {
  assert.match(app, /\{PAYWALL_ENABLED \? <SoftPaywallModal \/> : null\}/);
});

test('support contact is the official https page and mailbox', () => {
  const support = readFileSync(new URL('../support.ts', import.meta.url), 'utf8');
  assert.match(support, /https:\/\/the220tech\.com\/support/);
  assert.match(support, /info@the220tech\.com/);
  assert.match(settings, /SUPPORT_URL/);
  assert.match(settings, /SUPPORT_MAILTO/);
  for (const html of [privacy, terms]) {
    assert.doesNotMatch(html, /220bioworx/i);
    assert.doesNotMatch(html, /bioworx/i);
    assert.match(html, /href="https:\/\/the220tech\.com\/support"/);
    assert.match(html, /href="mailto:info@the220tech\.com"/);
  }
});

function listSources(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) listSources(path, acc);
    else if (/\.(ts|tsx|html)$/.test(name)) acc.push(path);
  }
  return acc;
}

test('no external purchase or checkout opener while paywall code is gated', () => {
  const catalog = readFileSync(new URL('./catalog-link.ts', import.meta.url), 'utf8');
  const openAt = catalog.indexOf('window.open');
  const guardAt = catalog.indexOf('if (!PAYWALL_ENABLED) return;');
  assert.ok(guardAt > -1 && openAt > guardAt);

  const srcRoot = new URL('../../', import.meta.url);
  const files = listSources(srcRoot.pathname);
  const windowOpens = files.filter((file) => readFileSync(file, 'utf8').includes('window.open'));
  assert.deepEqual(
    windowOpens.map((file) => file.split('/src/')[1]),
    ['lib/billing/catalog-link.ts'],
  );
  const browserOpens = files.filter((file) => readFileSync(file, 'utf8').includes('Browser.open'));
  assert.deepEqual(
    browserOpens.map((file) => file.split('/src/')[1]),
    ['lib/native-oauth.ts'],
  );

  const joined = files.map((file) => readFileSync(file, 'utf8')).join('\n');
  assert.doesNotMatch(joined, /stripe|revenuecat|checkout\.com|buy\.stripe/i);
  assert.match(readFileSync(new URL('../../lib/native-oauth.ts', import.meta.url), 'utf8'), /signInWithOAuth/);
});

test('store build numbers', () => {
  assert.equal(pbx.match(/CURRENT_PROJECT_VERSION = 16;/g)?.length, 2);
  assert.doesNotMatch(pbx, /CURRENT_PROJECT_VERSION = 15;/);
  assert.match(pbx, /MARKETING_VERSION = 1\.0\.0;/);
  assert.match(gradle, /versionCode 14/);
  assert.match(gradle, /versionName "1\.0\.0"/);
});
