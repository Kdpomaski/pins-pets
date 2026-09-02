import { getAuthRedirectUrl, supabase } from '@/lib/supabase';

const GOOGLE_CLIENT_SUFFIX = '.apps.googleusercontent.com';

export const GOOGLE_SETUP_STEPS = [
  'Create a Web OAuth client in Google Cloud (not a name like Pins.App).',
  'Authorized redirect URI must be exactly: https://ucijobfqdwkqhdqdffno.supabase.co/auth/v1/callback',
  'Paste that Client ID + Secret into Supabase → Authentication → Providers → Google, then Save.',
];

export function googleClientIdLooksValid(clientId: string): boolean {
  return clientId.endsWith(GOOGLE_CLIENT_SUFFIX) && !clientId.includes(' ');
}

export async function startGoogleSignIn(): Promise<{ error?: string }> {
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

  let clientId = '';
  try {
    clientId = new URL(data.url).searchParams.get('client_id') ?? '';
  } catch {
    return { error: 'Google sign-in URL was invalid.' };
  }

  if (!googleClientIdLooksValid(clientId)) {
    return {
      error:
        `Google is misconfigured in Supabase. Client ID is currently "${clientId || '(empty)'}" — it must be a Google Cloud Web client ending in .apps.googleusercontent.com. ` +
        'Open https://supabase.com/dashboard/project/ucijobfqdwkqhdqdffno/auth/providers → Google, replace Client ID and Secret, Save, then try again. ' +
        'Create the client at https://console.cloud.google.com/auth/clients/create (Web application). Redirect URI: https://ucijobfqdwkqhdqdffno.supabase.co/auth/v1/callback',
    };
  }

  window.location.assign(data.url);
  return {};
}
