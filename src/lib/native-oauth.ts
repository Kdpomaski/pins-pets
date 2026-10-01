import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { completeAuthFromUrl, hasAuthCallbackParams } from '@/lib/auth-callback';
import { NativeOAuth } from '@/lib/native-oauth-session';
import { NATIVE_AUTH_SCHEME, getAuthRedirectUrl, supabase } from '@/lib/supabase';

let listenerReady = false;

/**
 * Listen for OAuth / magic-link returns into the native app.
 * Call once at app boot (AuthProvider).
 */
export function ensureNativeAuthDeepLinkListener(
  onComplete: (result: { error?: string }) => void,
): void {
  if (!Capacitor.isNativePlatform() || listenerReady) return;
  listenerReady = true;

  void App.addListener('appUrlOpen', async ({ url }) => {
    if (!url?.startsWith(`${NATIVE_AUTH_SCHEME}:`)) return;
    try {
      await Browser.close();
    } catch {
      /* browser may already be closed */
    }
    if (!hasAuthCallbackParams(url)) {
      onComplete({ error: 'Sign-in returned without auth params.' });
      return;
    }
    const result = await completeAuthFromUrl(url);
    onComplete(result);
  });
}

function pluginErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message;
  }
  return 'Sign-in failed.';
}

function isNativeOAuthPluginMissing(message: string): boolean {
  return /not implemented|unimplemented/i.test(message);
}

async function openOAuthUrl(url: string, provider: 'google' | 'apple'): Promise<{ error?: string }> {
  if (provider === 'apple' && Capacitor.getPlatform() === 'ios') {
    try {
      const { url: callbackUrl } = await NativeOAuth.start({
        url,
        callbackScheme: NATIVE_AUTH_SCHEME,
      });
      return completeAuthFromUrl(callbackUrl);
    } catch (err) {
      const message = pluginErrorMessage(err);
      if (!isNativeOAuthPluginMissing(message)) return { error: message };
    }
  }

  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url, presentationStyle: 'popover' });
    return {};
  }

  window.location.assign(url);
  return {};
}

/**
 * Sign in with Apple through the Supabase Apple provider already configured
 * for the Pins ecosystem (Team ID K39284B7CL).
 *
 * The OAuth client id is the Services ID stored in that provider — this client
 * does not embed one, and it does not embed a .p8 key. Native return uses the
 * Pets bundle scheme `com.two20tech.pinspets://auth/callback`. On iOS the
 * system auth session delivers that callback; Android and web use the same
 * redirect.
 */
export async function startAppleOAuth(): Promise<{ error?: string }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: getAuthRedirectUrl(),
      skipBrowserRedirect: true,
      scopes: 'name email',
    },
  });
  if (error) return { error: error.message };
  if (!data.url) return { error: 'Apple sign-in URL was not returned.' };
  return openOAuthUrl(data.url, 'apple');
}

/** Open Google OAuth in system browser / SFSafariViewController, return via deep link. */
export async function startGoogleOAuth(): Promise<{ error?: string }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getAuthRedirectUrl(),
      skipBrowserRedirect: true,
      scopes: 'email profile',
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) return { error: error.message };
  if (!data.url) return { error: 'Google sign-in URL was not returned.' };
  return openOAuthUrl(data.url, 'google');
}
