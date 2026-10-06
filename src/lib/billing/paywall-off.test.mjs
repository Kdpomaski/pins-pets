import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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

test('bundled legal pages do not name Bioworx or a mailto', () => {
  for (const html of [privacy, terms]) {
    assert.doesNotMatch(html, /220bioworx/i);
    assert.doesNotMatch(html, /bioworx/i);
    assert.doesNotMatch(html, /mailto:/i);
    assert.match(html, /https:\/\/the220tech\.com/);
  }
});

test('store build numbers', () => {
  assert.equal(pbx.match(/CURRENT_PROJECT_VERSION = 16;/g)?.length, 2);
  assert.doesNotMatch(pbx, /CURRENT_PROJECT_VERSION = 15;/);
  assert.match(pbx, /MARKETING_VERSION = 1\.0\.0;/);
  assert.match(gradle, /versionCode 14/);
  assert.match(gradle, /versionName "1\.0\.0"/);
});
