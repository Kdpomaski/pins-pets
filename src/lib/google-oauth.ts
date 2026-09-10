import { startGoogleOAuth } from '@/lib/native-oauth';

/** @deprecated Prefer startGoogleOAuth — kept as a thin alias for Auth.tsx imports. */
export async function startGoogleSignIn(): Promise<{ error?: string }> {
  return startGoogleOAuth();
}
