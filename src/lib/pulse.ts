const PULSE_CLIENT_ID = (import.meta.env.VITE_PULSE_CLIENT_ID ?? '').trim();
const PULSE_SCRIPT_SRC = 'https://cdn.pulsemessages.com/widget.js';

let pendingRetryTimer: number | undefined;

export function isPulseConfigured(): boolean {
  return PULSE_CLIENT_ID.length > 0;
}

export function ensurePulseWidgetMounted(): void {
  if (!isPulseConfigured() || typeof document === 'undefined') {
    return;
  }
  const existing = document.querySelector<HTMLScriptElement>('script[data-pulse-widget="true"]');
  if (existing) {
    return;
  }
  const script = document.createElement('script');
  script.src = PULSE_SCRIPT_SRC;
  script.defer = true;
  script.dataset.clientId = PULSE_CLIENT_ID;
  script.dataset.pulseWidget = 'true';
  document.body.appendChild(script);
}

function tryTriggerPulseOpen(): boolean {
  const host = document.getElementById('pulse-messages-root');
  const root = host?.shadowRoot;
  if (!root) {
    return false;
  }

  const chatWindow = root.querySelector('.chat-window');
  if (chatWindow) {
    const input = root.querySelector<HTMLElement>('.chat-input input, .chat-input textarea');
    input?.focus();
    return true;
  }

  const launcher =
    root.querySelector<HTMLButtonElement>('button.launcher') ??
    root.querySelector<HTMLButtonElement>('button[aria-label*="Open" i]') ??
    root.querySelector<HTMLButtonElement>('button');

  if (launcher) {
    launcher.click();
    return true;
  }

  return false;
}

export function openPulseWidget(): boolean {
  if (!isPulseConfigured() || typeof document === 'undefined') {
    return false;
  }

  ensurePulseWidgetMounted();

  if (tryTriggerPulseOpen()) {
    return true;
  }

  if (pendingRetryTimer !== undefined) {
    window.clearInterval(pendingRetryTimer);
    pendingRetryTimer = undefined;
  }

  let attempts = 0;
  pendingRetryTimer = window.setInterval(() => {
    attempts += 1;
    if (tryTriggerPulseOpen() || attempts >= 6) {
      if (pendingRetryTimer !== undefined) {
        window.clearInterval(pendingRetryTimer);
        pendingRetryTimer = undefined;
      }
    }
  }, 250);

  return true;
}
