import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';

import App from './App';
import { assertNoTelemetry } from '@/lib/privacy';
import { ensureAndroidBackButton } from '@/lib/native-back';

import './index.css';

assertNoTelemetry();

// Native WebView often reports 0 for env(safe-area-inset-*) until layout settles.
// Keep at least a status-bar-sized top inset so titles are not trapped under the island.
// Android system nav / gesture bar also needs a bottom floor so BottomNav clears chrome.
if (Capacitor.isNativePlatform()) {
  document.documentElement.style.setProperty(
    '--pins-safe-top',
    'max(env(safe-area-inset-top, 0px), 47px)',
  );

  if (Capacitor.getPlatform() === 'android') {
    document.documentElement.style.setProperty(
      '--pins-safe-bottom',
      'max(env(safe-area-inset-bottom, 0px), 24px)',
    );
  }

  ensureAndroidBackButton();
}

createRoot(document.getElementById('root')!).render(<App />);
