# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Offline and PWA support

The production service worker precaches the built app shell, JavaScript chunks, stylesheets, manifest, and local icons during installation. Page navigations use network-first with the cached app shell as the offline fallback; same-origin static assets use cache-first; Google Fonts use stale-while-revalidate. Supabase/API requests are not cached, so private server data is never served from an HTTP cache. Old SchoolBridge and legacy `vN-*` caches are removed when a new worker activates. The worker is not registered in development, embedded previews, Lovable preview hosts, or when opened with `?sw=off`.

School profile setup, school forms, statistics, and report forms save drafts in IndexedDB as values change. Report attachments are saved as blobs. Submissions are first written to a durable local outbox and then sent using the signed-in Supabase client. IDs are stable across retries to avoid duplicate records; report object paths are also stable. The UI reports offline, pending, failed, and recently synced states. Retry delays grow exponentially up to six hours, and retryable items remain queued until synced. Older completed queue entries are pruned after seven days.

Background Sync is used to wake open app tabs where supported. The service worker only signals a page to sync; it does not persist auth tokens or bypass Supabase row-level security. Since browsers may not wake a page or may suspend Background Sync, queued submissions are retried when the app opens, regains focus/connectivity, and periodically while open. Users need to sign in again if their session expires before syncing. Permanent server validation/permission failures are retained locally and exposed with a manual retry action; retrying cannot resolve a server-side data conflict that requires editing.

### Offline validation

1. Build and serve the production output over HTTPS (`npm run build`, then `npm run preview`); service workers do not run in Vite development mode.
2. Open the app online once and wait for the service worker to install and activate. In browser DevTools, confirm the `schoolbridge-static-*` cache contains the generated app assets.
3. Open a school form/statistics/report, enter values (and attach a report file), then reload or close and reopen the app. Confirm the draft and attachment are restored.
4. Go offline in DevTools or enable airplane mode. Confirm the app shell and form pages still load, edit a draft, submit it, and verify the UI reports `Pending sync`.
5. Restore connectivity, including a throttled/intermittent profile. Confirm the queued record appears once on the server, the report attachment is present, and the UI reports `Synced`. Verify that a failed request remains queued and is retried after backoff.
6. Confirm that API-backed dashboards and reference data still require a live connection. Offline mode currently covers the app shell, form drafting, and submission queue; server-backed dashboard data, chat, and other remote reads are not available offline.

IndexedDB can be unavailable in private browsing or cleared/evicted by the browser, and device storage can fill up. In those cases the UI displays a storage warning; users should keep the page open and avoid clearing browser data until pending submissions sync. Browser/device loss cannot be recovered by this client-only queue.
