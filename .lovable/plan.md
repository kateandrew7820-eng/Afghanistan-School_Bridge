# Full Offline Mode and Background Sync

## What already exists (kept, extended)
- Hand-written app worker (`/service-worker.js`) with precache manifest, network-first pages, cache-first assets, and a `sync` relay.
- Local storage for drafts and an offline queue for school forms, statistics, reports, profile, and chat messages, with a status banner.
- Registration guard that blocks the worker in preview and dev.

## What will be built

1. **Reliable app worker**
   - Switch to the standard generated worker (`vite-plugin-pwa`, generateSW) at `/sw.js`. It precaches the HTML shell, JS, CSS, fonts, and icons, with automatic versioning and old-cache cleanup.
   - Runtime rules: pages network-first with 3s timeout and offline fallback to the shell; hashed assets cache-first; fonts stale-while-revalidate; images cache-first with a size cap. Login callback and backend API calls are never cached.
   - The old `/service-worker.js` becomes a one-release cleanup worker so returning visitors move over without white screens.
   - The background `sync` relay is kept through a small imported script.

2. **Connection detection**
   - Shared connection monitor: browser online/offline events, a lightweight backend ping with timeout, and a "flaky" state after repeated slow or failed pings.
   - One status banner with clear Dari states: آفلاین، ذخیره محلی، در انتظار همگام‌سازی، همگام شد، خطا در همگام‌سازی. Existing English banner text is translated.

3. **Local saving**
   - Every submit form and the profile setup keep using auto-save (debounced on change), surviving tab close and restart.
   - Academic record screens (attendance, marks, students, enrollments) gain the same auto-save for unsent entries.
   - Last-loaded lists (dashboards, students, sections, announcements, deadlines) are kept on the device so they open offline as read-only.

4. **Offline write queue**
   - Extend the queue to attendance, marks, students, and enrollments in addition to current forms and chat.
   - Every queued item carries a unique client ID so a retry can never create a duplicate (upsert on that ID, or a match on natural keys such as student + date for attendance).
   - Sync runs on reconnect, on the background-sync event where supported, and otherwise with retry at growing intervals (5s up to 5min, with jitter). Items are deleted locally only after the server confirms.

5. **Conflicts**
   - Attendance and marks: last write wins using the record's update time. The user is notified when their local change replaced a newer server change.
   - Submissions and profile: if the server copy changed since it was loaded, ask the user to keep theirs or take the server's.
   - Chat: append-only, deduplicated by client ID.

6. **Light and fast**
   - The precache covers only the shell and route chunks needed at startup. Other pages load on demand and are cached after first visit.
   - Storage use is checked, and persistent storage is requested so the browser does not evict queued work.

7. **Testing and docs**
   - Automated tests for the queue, retry timing, deduplication, and conflict rules.
   - Browser checks on a production build: airplane mode, throttled 3G, and on/off flapping. Each check confirms no data is lost and nothing is duplicated.
   - A short document lists edge cases and limits: offline mode works only on the published site, not the editor preview; the first visit must be online; file uploads are limited by device storage; iOS has no background sync, so sync happens when the app is opened.

## Technical details
- Files: `vite.config.ts` (remove the custom precache plugin, add VitePWA with `injectRegister: null`, `devOptions.enabled: false`, `navigateFallbackDenylist: [/^\/~oauth/, /^\/auth\/callback/]`), `src/lib/registerSW.ts` (register `/sw.js`, keep guards and `?sw=off`), `public/service-worker.js` (kill switch), `public/sw-sync.js` (sync relay via `importScripts`), new `src/lib/connection.ts`, `src/lib/offlineStore.ts` (new kinds, backoff, client IDs), `src/components/OfflineStatus.tsx`, academic hooks in `useAcademic.ts` for queued writes and cached reads.
- Dedup: the schema has no client-ID column on academic tables, so natural-key upserts are used. Attendance relies on (student, date); marks rely on (assessment, student). Whether unique indexes exist is unverified. If they are missing, a small migration adding unique indexes is the only schema change, and existing duplicates are checked first.
- No RLS changes and no changes to online behavior. All queued writes go through the same client calls as today.
