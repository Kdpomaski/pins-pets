import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

/**
 * Capacitor WebView history.length is typically already > 1 on first paint
 * (about:blank ? app URL, splash, or plugin bootstrap). The App plugin's
 * canGoBack maps to WebView.canGoBack() and is often true for the same reason.
 * Neither is a reliable "are we at the SPA root?" signal — using them as
 * `canGoBack || history.length > 1` makes Back call history.back() forever
 * and never exitApp().
 *
 * Track only in-app pushState depth. Depth 0 = the first route we rendered.
 */
function trackSpaHistoryDepth(): () => number {
  let depth = 0;

  const pushState = history.pushState.bind(history);
  history.pushState = function (...args) {
    depth += 1;
    return pushState(...args);
  };

  window.addEventListener("popstate", () => {
    depth = Math.max(0, depth - 1);
  });

  return () => depth;
}

function dismissOpenOverlay(): boolean {
  const custom = document.querySelector<HTMLElement>("[data-pins-overlay-dismiss]");
  if (custom) {
    custom.click();
    return true;
  }

  const dialog = document.querySelector('[role="dialog"][data-state="open"]');
  if (dialog) {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    return true;
  }

  return false;
}

/** Overlay ? close. In-app history ? pop. SPA root ? leave the app. */
export function ensureAndroidBackButton(): void {
  if (Capacitor.getPlatform() !== "android") return;

  const spaDepth = trackSpaHistoryDepth();

  void App.addListener("backButton", () => {
    if (dismissOpenOverlay()) return;

    if (spaDepth() > 0) {
      window.history.back();
      return;
    }

    void App.exitApp();
  });
}
