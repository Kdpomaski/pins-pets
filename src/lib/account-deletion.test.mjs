import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const copy = readFileSync(new URL('./account-deletion-copy.ts', import.meta.url), 'utf8');
const sql = readFileSync(new URL('../../supabase/delete-own-account.sql', import.meta.url), 'utf8');
const flags = readFileSync(new URL('./billing/feature-flags.ts', import.meta.url), 'utf8');

test('account deletion copy states permanence and on-device logs', () => {
  assert.match(copy, /permanently deletes/i);
  assert.match(copy, /cannot be undone/i);
  assert.match(copy, /stay on this device/i);
});

test('delete_own_account SQL removes the auth user and does not embed secrets', () => {
  assert.match(sql, /delete from auth\.users where id = auth\.uid\(\)/);
  assert.match(sql, /grant execute on function public\.delete_own_account\(\) to authenticated/);
  assert.doesNotMatch(sql, /BEGIN PRIVATE KEY/);
});

test('soft paywall stays hardcoded off', () => {
  assert.match(flags, /export function isPaywallEnabled\(\): boolean \{\s*return false;/);
});
