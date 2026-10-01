import { registerPlugin } from '@capacitor/core';

/**
 * iOS ASWebAuthenticationSession for Supabase OAuth.
 * The session returns the custom-scheme callback (`com.two20tech.pinspets://auth/callback`)
 * into the app so PKCE can finish in the WebView. No client secret is stored here.
 */
export interface NativeOAuthSessionPlugin {
  start(options: { url: string; callbackScheme: string }): Promise<{ url: string }>;
}

export const NativeOAuth = registerPlugin<NativeOAuthSessionPlugin>('NativeOAuth');
