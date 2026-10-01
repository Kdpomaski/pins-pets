import { startAppleOAuth } from '@/lib/native-oauth';

/** Thin alias matching startGoogleSignIn. */
export async function startAppleSignIn(): Promise<{ error?: string }> {
  return startAppleOAuth();
}
