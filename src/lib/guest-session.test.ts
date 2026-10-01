import assert from 'node:assert/strict';
import test from 'node:test';
import { clearGuestSession, GUEST_SESSION_KEY, isGuestSession, setGuestSession } from './guest-session.ts';

const mem = new Map<string, string>();

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => mem.get(key) ?? null,
    setItem: (key: string, value: string) => {
      mem.set(key, value);
    },
    removeItem: (key: string) => {
      mem.delete(key);
    },
  },
});

test('guest flag round-trips in local storage', () => {
  clearGuestSession();
  assert.equal(isGuestSession(), false);
  setGuestSession();
  assert.equal(mem.get(GUEST_SESSION_KEY), '1');
  assert.equal(isGuestSession(), true);
  clearGuestSession();
  assert.equal(isGuestSession(), false);
});
