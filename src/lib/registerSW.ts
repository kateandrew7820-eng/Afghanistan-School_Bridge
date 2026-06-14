/**
 * Guarded service-worker registration.
 *
 * For now we only ship the kill-switch worker at /service-worker.js so any
 * browser that still has the broken cache gets evicted. We deliberately do
 * NOT register a new offline worker yet — that comes in a follow-up using
 * vite-plugin-pwa with a NetworkFirst HTML strategy.
 *
 * Registration is refused in dev, inside iframes, on Lovable preview hosts,
 * and when the URL contains ?sw=off (manual kill switch).
 */

function isLovablePreviewHost(host: string): boolean {
  return (
    host.startsWith('id-preview--') ||
    host.startsWith('preview--') ||
    host === 'lovableproject.com' ||
    host.endsWith('.lovableproject.com') ||
    host === 'lovableproject-dev.com' ||
    host.endsWith('.lovableproject-dev.com') ||
    host === 'beta.lovable.dev' ||
    host.endsWith('.beta.lovable.dev')
  );
}

function shouldRefuseRegistration(): boolean {
  if (!import.meta.env.PROD) return true;
  if (typeof window === 'undefined') return true;
  if (window.top !== window.self) return true; // inside iframe
  if (new URLSearchParams(window.location.search).has('sw') &&
      new URLSearchParams(window.location.search).get('sw') === 'off') return true;
  if (isLovablePreviewHost(window.location.hostname)) return true;
  return false;
}

async function unregisterAllAppWorkers() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      regs
        .filter((r) => {
          const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || '';
          return url.includes('/service-worker.js') || url.includes('/sw.js');
        })
        .map((r) => r.unregister())
    );
  } catch {
    /* ignore */
  }
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  if (shouldRefuseRegistration()) {
    // Clean up any stale registrations that might be left over.
    void unregisterAllAppWorkers();
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .catch(() => {
        /* swallow — SW is best-effort */
      });
  });
}
