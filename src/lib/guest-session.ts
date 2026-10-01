/** Local-only session for tracker features that do not need an account (App Store 5.1.1(v)). */

export const GUEST_SESSION_KEY = 'pins_pets_guest_v1';

export function isGuestSession(): boolean {
  try {
    return localStorage.getItem(GUEST_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function setGuestSession(): void {
  localStorage.setItem(GUEST_SESSION_KEY, '1');
}

export function clearGuestSession(): void {
  localStorage.removeItem(GUEST_SESSION_KEY);
}
