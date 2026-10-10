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
6. Confirm that API-backed dashboards and reference data still require a live connection. Offline mode covers the app shell, form drafting, submission queue, cached chat contacts/conversation summaries/recent messages, and queued outgoing chat messages. Server-backed dashboard data, contact lookup, new conversation creation, and uncached remote reads still require a live connection.

IndexedDB can be unavailable in private browsing or cleared/evicted by the browser, and device storage can fill up. In those cases the UI displays a storage warning; users should keep the page open and avoid clearing browser data until pending submissions sync. Browser/device loss cannot be recovered by this client-only queue.

### Private chat contacts

New chat discovery uses an exact, case-insensitive email lookup RPC and returns only the verified user's id, display name, and role. Search attempts are rate-limited; there is no client-side user directory or partial-email discovery. Partial email/name filtering is limited to contacts the signed-in user has already saved. The contact list, conversation summaries, recent 200 messages per conversation, and pending outgoing messages are stored in IndexedDB per account. Pending messages and attachment blobs are retried with exponential backoff; the app syncs on reconnect, focus, and while open. Server-backed contact discovery and first-time conversation creation need a connection.

The `20261010201000_private_chat_contacts.sql` migration preserves existing conversation/member/message identifiers and adds contact, block, and report storage plus restricted RPCs. Existing chats are deliberately **not** backfilled as mutual contacts: each account must add the other before either can see the other's phone number. Email and phone values are only returned by server functions to an authenticated participant in a direct chat; phone is null until both contact edges exist. Blocking prevents new direct messages and private presence/typing subscriptions, and signals the other active client to close the chat. Reports are insertable only through a server-validated RPC and are visible to admins. The migration does not delete old messages or conversations.

To reverse the application rollout, deploy the previous client first. Keep the new tables and functions until any contact/block/report data has been explicitly exported or intentionally discarded; dropping those tables would destroy user-managed state and reports. The new message insert policy can be restored to the prior member-only rule only if the contact/block feature is fully rolled back. This migration has not been applied to a live database as part of this change.

## Navigation menu audit (2026-10-10)

Reviewed the burger menus for Ministry, Province, District, School, and Admin roles.

- **Ministry:** Removed the duplicate “تمام مکاتب” link from Insights (it remains under Management), moved the regions page into Insights and relabeled it “ولسوالی‌ها”, and consolidated the announcements/opportunities navigation to the Announcements page by removing the separate Deadlines menu entry. The deadlines route remains unchanged.
- **School:** Moved Academic Insights from “کار من” into its own “بینش‌ها” section.
- **Province, District, Admin:** No duplicate or misplaced menu entries matching these issues were found; unchanged.
