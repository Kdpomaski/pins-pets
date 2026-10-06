import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Lock, LogOut, Shield, Trash2, X } from 'lucide-react';
import { ACCOUNT_DELETE_CONFIRMATION, ACCOUNT_DELETE_SUMMARY } from '@/lib/account-deletion-copy';
import { useAuth } from '@/lib/auth-context';
import { useSecurity } from '@/lib/security-context';
import { PRIVACY } from '@/lib/privacy';
import { Button } from '@/components/ui/button';
import { useEntitlementsOptional } from '@/lib/billing/entitlement-context';
import { PAYWALL_ENABLED } from '@/lib/billing/feature-flags';
import {
  PAYWALL_COPY,
  restorePurchases,
} from '@/lib/billing';
import { SUPPORT_EMAIL, SUPPORT_MAILTO, SUPPORT_URL } from '@/lib/support';
import { VET_DISCLAIMER } from '@/lib/vet-disclaimer';
import {
  getShotDueNotificationsEnabled,
  setShotDueNotificationsEnabled,
} from '@/lib/notification-prefs';
import {
  cancelAllShotNotifications,
  requestShotNotificationPermission,
  rescheduleShotDueNotifications,
} from '@/lib/shot-notifications';
import { usePinsStore } from '@/lib/store';

type SecuritySettingsProps = {
  open: boolean;
  onClose: () => void;
};

export function SecurityBadge() {
  const { encryptionMode } = useSecurity();

  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-card border border-border rounded-full px-2.5 py-1">
      <Shield size={11} className="text-primary" />
      Local · {encryptionMode === 'passphrase' ? 'Passphrase' : 'Encrypted'}
    </span>
  );
}

export function SecuritySettings({ open, onClose }: SecuritySettingsProps) {
  const { user, signOut, deleteAccount, exitGuest, status } = useAuth();
  const { encryptionMode, enablePassphrase, lock } = useSecurity();
  const entitlements = useEntitlementsOptional();
  const { data } = usePinsStore();
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [billingMsg, setBillingMsg] = useState('');
  const [shotDueOn, setShotDueOn] = useState(getShotDueNotificationsEnabled);
  const [notifMsg, setNotifMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleShotDueToggle = async (next: boolean) => {
    setNotifMsg('');
    if (next) {
      const granted = await requestShotNotificationPermission();
      if (!granted) {
        setShotDueOn(false);
        setShotDueNotificationsEnabled(false);
        setNotifMsg('Notification permission is required to enable dose reminders.');
        return;
      }
      setShotDueOn(true);
      setShotDueNotificationsEnabled(true);
      await rescheduleShotDueNotifications({
        schedule: data.schedule,
        logs: data.logs,
        pets: data.pets,
        enabled: true,
      });
      return;
    }
    setShotDueOn(false);
    setShotDueNotificationsEnabled(false);
    await cancelAllShotNotifications();
  };

  const resetForm = () => {
    setPassphrase('');
    setConfirm('');
    setError('');
    setConfirmDelete(false);
    setDeleteError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    setDeleteError('');
    const result = await deleteAccount();
    setLoading(false);
    if (result.error) {
      setDeleteError(result.error);
      return;
    }
    resetForm();
    onClose();
  };

  const handleEnablePassphrase = async () => {
    if (passphrase.length < 8) {
      setError('Passphrase must be at least 8 characters.');
      return;
    }
    if (passphrase !== confirm) {
      setError('Passphrases do not match.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await enablePassphrase(passphrase);
      resetForm();
      onClose();
    } catch {
      setError('Could not enable passphrase protection. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-3xl max-w-md mx-auto shadow-2xl p-6 pb-safe max-h-[90dvh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-primary" />
                <h2 className="text-lg font-semibold">Settings</h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 -mr-2 text-muted-foreground bg-secondary/50 rounded-full"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="rounded-xl border border-border bg-background/50 p-4 space-y-2">
                <p className="font-medium">Local-first · Beta account</p>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>Health data encrypted on this device ({PRIVACY.localFirst ? 'yes' : 'no'})</li>
                  <li>AES-256-GCM encryption at rest</li>
                  <li>Account stores age range &amp; gender only (anonymous stats)</li>
                  <li>E2E cloud backup not enabled yet</li>
                </ul>
                {user?.email && (
                  <p className="text-xs text-muted-foreground pt-1">Signed in as {user.email}</p>
                )}
              </div>

              {user ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => void signOut()}
                >
                  <LogOut size={16} />
                  Sign out
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    You&apos;re using Pins Pets without an account. Pet logs stay on this device.
                  </p>
                  <Button variant="outline" className="w-full" onClick={exitGuest}>
                    Sign in
                  </Button>
                </div>
              )}

              {user && (
                <div
                  className="rounded-xl border border-destructive/40 bg-background/50 p-4 space-y-3"
                  role="region"
                  aria-label="Delete account"
                >
                  <div className="flex items-center gap-2">
                    <Trash2 size={16} className="text-destructive" />
                    <p className="font-medium">Delete account</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{ACCOUNT_DELETE_SUMMARY}</p>
                  {confirmDelete ? (
                    <div className="space-y-3" role="alertdialog" aria-labelledby="delete-account-title">
                      <p id="delete-account-title" className="text-sm font-medium">
                        Delete account permanently?
                      </p>
                      <p className="text-xs text-muted-foreground">{ACCOUNT_DELETE_CONFIRMATION}</p>
                      {deleteError && <p className="text-xs text-destructive">{deleteError}</p>}
                      <Button
                        variant="destructive"
                        className="w-full"
                        disabled={loading}
                        onClick={() => void handleDeleteAccount()}
                      >
                        {loading ? 'Deleting account…' : 'Delete account permanently'}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={loading}
                        onClick={() => {
                          setConfirmDelete(false);
                          setDeleteError('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => {
                        setDeleteError('');
                        setConfirmDelete(true);
                      }}
                    >
                      Delete account
                    </Button>
                  )}
                </div>
              )}

              {status === 'guest' && !user && (
                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  Sign in if you want an account. Local tracker features do not require one.
                </p>
              )}

              {encryptionMode === 'device' ? (
                <div className="space-y-3">
                  <p className="text-muted-foreground text-xs">
                    Optional: protect data with a passphrase you enter each session. Your existing data
                    will be re-encrypted automatically.
                  </p>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="New passphrase (min 8 chars)"
                    className="w-full border border-border rounded-lg p-3 bg-input/30 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Confirm passphrase"
                    className="w-full border border-border rounded-lg p-3 bg-input/30 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && void handleEnablePassphrase()}
                  />
                  {error && <p className="text-destructive text-xs">{error}</p>}
                  <Button
                    className="w-full"
                    disabled={loading || !passphrase || !confirm}
                    onClick={() => void handleEnablePassphrase()}
                  >
                    Enable passphrase lock
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-muted-foreground text-xs">
                    Passphrase protection is on. Lock the app to require your passphrase again.
                  </p>
                  <Button variant="outline" className="w-full" onClick={lock}>
                    Lock now
                  </Button>
                </div>
              )}

              {PAYWALL_ENABLED && (
                <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                  <p className="font-medium">Pins Pets Pro</p>
                  <p className="text-xs text-muted-foreground">
                    {entitlements?.isPro
                      ? `You're on Pins Pets Pro${entitlements.entitlement.plan !== 'none' ? ` · ${entitlements.entitlement.plan}` : ''}.`
                      : 'Free includes 1 pet, 2 protocols, and full map history. Pro unlocks unlimited pets, sync, and exports.'}
                  </p>
                  {!entitlements?.isPro && (
                    <Button
                      className="w-full"
                      variant="default"
                      onClick={() => entitlements?.openPaywall('manual')}
                    >
                      See Pro plans
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={loading}
                    onClick={() => {
                      void (async () => {
                        setLoading(true);
                        setBillingMsg('');
                        try {
                          const result = await restorePurchases({ userId: user?.id });
                          if (!result.ok) {
                            setBillingMsg(result.error);
                          } else if (result.restored) {
                            setBillingMsg('Purchases restored.');
                            await entitlements?.refresh();
                          } else {
                            setBillingMsg('No purchases to restore.');
                          }
                        } finally {
                          setLoading(false);
                        }
                      })();
                    }}
                  >
                    {PAYWALL_COPY.restore}
                  </Button>
                  {billingMsg && <p className="text-xs text-muted-foreground">{billingMsg}</p>}
                </div>
              )}

              <div className="rounded-xl border border-border bg-background/50 p-4">
                <p className="text-[10px] leading-relaxed text-muted-foreground">{VET_DISCLAIMER}</p>
              </div>

              <div className="rounded-xl border border-border bg-background/50 p-4 space-y-2">
                <p className="font-medium">Support</p>
                <a
                  href={SUPPORT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-primary underline break-all"
                >
                  {SUPPORT_URL}
                </a>
                <a href={SUPPORT_MAILTO} className="block text-xs text-primary underline">
                  {SUPPORT_EMAIL}
                </a>
              </div>

              <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Bell size={16} className="text-primary" />
                    <p className="font-medium">Shot-due reminders</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={shotDueOn}
                    onClick={() => void handleShotDueToggle(!shotDueOn)}
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors ${
                      shotDueOn ? 'bg-primary border-primary' : 'bg-muted border-border'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-background shadow transition ${
                        shotDueOn ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Local alert when a calendar dose is due — compound and dose in the notification.
                </p>
                {notifMsg && <p className="text-xs text-destructive">{notifMsg}</p>}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}