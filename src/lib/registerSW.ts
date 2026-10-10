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
  if (typeof window === 'undefined' || window.top !== window.self) return true;
  if (new URLSearchParams(window.location.search).get('sw') === 'off') return true;
  return isLovablePreviewHost(window.location.hostname);
}

async function unregisterAppWorkers(): Promise<void> {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations
      .filter((registration) => {
        const scriptUrl = registration.active?.scriptURL ||
          registration.installing?.scriptURL ||
          registration.waiting?.scriptURL || '';
        return scriptUrl.includes('/service-worker.js') || scriptUrl.includes('/sw.js');
      })
      .map((registration) => registration.unregister()));
  } catch (error) {
    console.warn('Could not remove a previously registered app service worker:', error);
  }
}

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  if (shouldRefuseRegistration()) {
    void unregisterAppWorkers();
    return;
  }

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/service-worker.js')
      .catch((error: unknown) => {
        console.error('Service worker registration failed:', error);
      });
  }, { once: true });
}
