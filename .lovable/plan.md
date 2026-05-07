
# Production Upgrade — NESP Integration, Performance, Hardening

PDF saved at `public/docs/National-Education-Strategic-Plan-for-Afghanistan.pdf` (1.3 MB) and downloadable from the in-app **Help / Resources** page.

---

## 1. NESP Statistics Integration

The PDF is the *National Education Strategic Plan for Afghanistan* (Ministry of Education). It is **strategic/historical reference data**, not live operational data — so we wire it in three places without polluting real submissions:

**a) New `nesp_reference` master table** (read-only, ministry-managed)
```
id | metric_key | metric_label_fa | value_numeric | value_text | year | category | source_page
```
Seeded with key NESP figures from the PDF:
- Children enrolled (baseline 5.4M, 35% girls; target 7.7M, 60% girls / 75% boys)
- Teachers grown 7×; only 22% meet Grade-14 minimum; 28% female (target 40%)
- ~25% schools have usable buildings (target 90%)
- ~11M illiterate adults (target <8M)
- 4,900 new schools + 4,800 outreach classes target
- Provincial GER spread (Helmand 61% → Baghlan high; Kabul 64% → Uruzgan low)

**b) Ministry/Province dashboard "National Targets" widget** — shows current platform totals next to NESP targets with a progress bar (e.g. *teachers registered: 12,430 / target 200,000*). Pulls from `nesp_reference` + live aggregates.

**c) `/help` page → "اسناد ملی" tab** — embedded PDF viewer (lazy `<iframe>` only when tab is opened), with a "دانلود" button.

**No fake numbers in real submission tables** — NESP figures live in their own table and are clearly labeled "هدف ملی NESP".

---

## 2. Performance Fixes (Lighthouse 76 → 95+)

| Issue | Fix |
|---|---|
| **Render-blocking fonts (-810 ms)** | Move Google Fonts `<link>` from blocking to `rel="preload" as="style"` + `onload` swap; drop `Roboto` (only Vazirmatn + Montserrat actually used). Self-host Vazirmatn `woff2` subset (Arabic + Latin) in `/public/fonts` for instant FCP. |
| **Render-blocking CSS (-302 ms)** | Inline critical above-the-fold CSS in `index.html` (already partial); ensure Tailwind `index.css` ships only used utilities (already JIT). |
| **Unused JS (-95 KiB)** | Tree-shake: remove unused `@radix-ui` exports from `vendor-ui` chunk; split `vendor-supabase` so auth-only routes don't pull realtime/storage; lazy-load `xlsx` (only ministry export). |
| **Network dependency chain** | Add `<link rel="modulepreload">` for the main app chunk; remove the chained Google Fonts CSS by self-hosting. |
| **Cache lifetimes (-97 KiB)** | Update `public/.htaccess` (or add `_headers`) to set `Cache-Control: public, max-age=31536000, immutable` for `/assets/*` and `/fonts/*`. Service worker already caches — extend its `CACHE_VERSION` strategy to include fonts and hashed assets with stale-while-revalidate. |
| **LCP element render delay (2.7 s)** | Landing page hero text is the LCP — preload its font, remove the lazy boundary around the hero, and inline the hero markup in `index.html` skeleton so first paint = LCP. |
| **Bundle splitting** | Split `react-router-dom` into its own chunk; lazy import `cmdk` (CommandPalette already lazy — confirm); verify `recharts` chunk only loads on analytics pages. |

Expected gains: FCP 3.8 s → ~1.5 s, LCP 4.1 s → ~2.0 s, total JS −95 KiB.

---

## 3. Production Hardening (Bug & UX Pass)

**Error handling**
- Wrap each route group (`SchoolLayout`, `DistrictLayout`, etc.) in its own `<ErrorBoundary>` with a localized retry card so one broken page never blanks the app.
- `useSubmissionActions` already toasts raw `error.message` — replace with `sanitizeError()` (consistency with the security pass).
- Add a global Supabase error interceptor that auto-redirects on `401` (session expired) instead of silent failures.

**Form & data integrity**
- Wire `useDraft` into `SubmitStatistics`, `SubmitReports`, `SubmitForms` (auto-save every 1 s, "بازیابی پیش‌نویس؟" banner).
- Add a 100 KB client-side guard in `SubmitForms` to match the DB constraint and show a friendly Dari error before the server rejects.
- Province/district selectors everywhere must use `provinces` + `districts` master tables (cascading) — audit and fix any remaining free-text inputs.

**Navigation & memory**
- Migrate `useSubmissions` to React Query with `staleTime: 30 s` + `keepPreviousData` so back-navigation is instant.
- Add `usePrefetchRoute` on sidebar link hover.
- Sticky filter memory (`sessionStorage`) on every list page.

**UX polish**
- Wire the existing `Breadcrumb` component into every inner page.
- Add `EmptyState` with friendly Dari copy + primary CTA on every list (currently inconsistent).
- Optimistic approve/reject with "بازگردانی" undo toast (5 s window).
- Standardize `<ListSkeleton rows={n}/>` for loading states.

**Real functionality (kill remaining placeholders)**
- `province/Districts.tsx`: real district list from master table with submission counts → drill-down.
- `ministry/Provinces.tsx`: real province grid (schools, submissions, pending, NESP target progress).
- `ministry/Users.tsx`: inline verify/reject + role assignment writing to `user_roles`.
- `district/Schools.tsx`: edit / deactivate / search / status badge.

---

## 4. Files & Migrations

**New files**
- `supabase/migrations/<ts>_nesp_reference.sql` — table + RLS (read for authenticated, write for `is_admin()`) + seed inserts from PDF.
- `src/components/NationalTargetsCard.tsx` — NESP progress widget.
- `src/components/ListSkeleton.tsx`, route-level `RouteErrorBoundary.tsx`.
- `src/hooks/usePrefetchRoute.ts`.
- `public/fonts/Vazirmatn-*.woff2` (self-hosted subset).
- `public/_headers` (cache control for Lovable hosting).

**Edited**
- `index.html` — preload fonts, remove Roboto, inline critical CSS, modulepreload main chunk.
- `vite.config.ts` — refine `manualChunks` (split router, supabase-auth vs supabase-realtime, lazy xlsx).
- `public/service-worker.js` — bump cache version, add font + asset SWR strategy.
- `src/App.tsx` — per-layout ErrorBoundary, prefetch hooks.
- `src/pages/Help.tsx` — NESP PDF tab.
- `src/pages/ministry/Dashboard.tsx`, `province/Dashboard.tsx` — NationalTargetsCard.
- `src/pages/ministry/Provinces.tsx`, `ministry/Users.tsx`, `province/Districts.tsx`, `district/Schools.tsx` — real functionality.
- `src/pages/school/Submit*.tsx` — wire `useDraft` + 100 KB guard.
- `src/hooks/useSubmissions.ts` → React Query.
- `src/hooks/useSubmissionActions.ts` — `sanitizeError`, optimistic update + undo.

---

## Implementation Order

1. **Performance pass** (fonts, cache, chunks, service worker) — biggest visible win.
2. **NESP table + seed migration + Help page tab + NationalTargetsCard**.
3. **Error boundaries + sanitizeError + 401 interceptor**.
4. **React Query migration + draft autosave + filter memory**.
5. **Real functionality on remaining placeholder pages**.
6. **Final polish**: breadcrumbs, EmptyStates, ListSkeleton, optimistic undo.

After all six steps the platform should hit Lighthouse mobile ≥90, have zero placeholder buttons, and surface NESP national targets directly to ministry/province users.
