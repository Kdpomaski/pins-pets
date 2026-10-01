import { ACCOUNT_DELETE_CONFIRMATION, ACCOUNT_DELETE_SUMMARY } from '@/lib/account-deletion-copy';
import { supabase } from '@/lib/supabase';

export { ACCOUNT_DELETE_CONFIRMATION, ACCOUNT_DELETE_SUMMARY };

function formatDeleteError(message: string): string {
  if (/delete_own_account|PGRST202|Could not find the function/i.test(message)) {
    return 'Account deletion is unavailable right now. Try again later.';
  }
  return message;
}

/**
 * Permanently delete the signed-in Supabase user.
 * Requires `public.delete_own_account()` (see supabase/delete-own-account.sql).
 * Local pet logs are not part of the account and are left on device.
 */
export async function deleteOwnAccount(): Promise<{ error?: string }> {
  const { error } = await supabase.rpc('delete_own_account');
  if (error) return { error: formatDeleteError(error.message) };

  const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
  if (signOutError) return { error: signOutError.message };
  return {};
}
