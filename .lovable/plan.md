# Production Upgrade Roadmap — SchoolBridge Afghanistan

A focused, phased plan that turns the current codebase into a polished production platform: zero placeholder buttons, faster perceived navigation, persistent short-term memory, and consistent UX inspired by Linear, Notion, and Vercel dashboards.

---

## Phase 1 — Bug & Consistency Fixes

1. **Profile field consistency**: `profile?.school_name` is read in `school/Dashboard.tsx` but the relation `profile.schools.name` is also used in the layout. Normalize: always read `profile.schools?.name ?? profile.school_name`.
2. **District dashboard double padding**: `DistrictLayout` already wraps `<main>` in `p-4 lg:p-6`, but `DistrictDashboard` also adds `px-4 py-6`. Remove the inner padding (matches School/Province/Ministry).
3. **Province admin sees Schools list**: `ProvinceLayout` is missing a "Schools (review/confirm)" link even though province admins have RLS to update schools. Add a `/province/schools` route + page (reuse list pattern from district) so province confirmation actually works.
4. **District/Province "Announcements/Documents/Deadlines" reuse School pages** — these currently show no admin-edit affordance even when role allows it. Pass a `readOnly` prop and unify to a single component.
5. **`PlaceholderPage` removal**: file unused but kept. Delete it and its lazy import in `App.tsx`.
6. **`AfghanistanInfoPage`** loads eagerly. Switch to `lazy()` like the rest.
7. **`is_admin()` self-grant edge case**: The `Admins can manage profiles` ALL policy still lets an admin set their own `role` column directly. Add a trigger that blocks non-ministry users from changing their own `role`.
8. **`profiles.role` is text but `user_roles.role` is enum** — they drift. Add a trigger that on `user_roles` INSERT/UPDATE syncs `profiles.role` text to keep the dashboard tier consistent.
9. **Submission `province/district` text mismatches** with master tables (e.g. "Kabul" vs "کابل"). Add a normalization step in the trigger `populate_submission_location` to also fill `province_id`/`district_id` if the school has them.
10. **Empty-state polish** across every list page (no skeleton flash for empty data, friendly message + primary CTA).

---

## Phase 2 — Real Functionality (no fake buttons)

| Page | Current | Upgrade |
|---|---|---|
| `province/Districts.tsx` | Placeholder list | Show real districts (master table) with submission counts + drill-down to `/province/submissions?district=…` |
| `province/Submissions.tsx` | Basic list | Add filters (status, type, district), bulk approve/reject, and CSV export |
| `province/Analytics.tsx` | Stat cards | Add real charts (Recharts) — submissions over time, by district, attendance trend |
| `ministry/Provinces.tsx` | Placeholder | Real province grid with totals (schools, submissions, pending) and drill-down |
| `ministry/Analytics.tsx` | Cards | National charts: provincial heat ranking, submission velocity, attendance avg |
| `ministry/Users.tsx` | List | Inline status change (verify/reject), role assignment (writes to `user_roles`), search/filter |
| `ministry/Export.tsx` | CSV only | Add date range, status filter, **XLSX export** (via `xlsx` lib), and a "stats snapshot" XLSX with per-school rollups |
| `district/Schools.tsx` | Add school | Edit/deactivate, search, status badge (pending/approved by province) |
| `school/Documents.tsx` | List only | Add download tracking + filter by category |
| `Announcements/Deadlines` admin | Cards | Add edit + delete + publish-toggle with optimistic UI |

All "fake" navigations get removed; every menu item routes to a working screen.

---

## Phase 3 — Speed & Short-term Memory

1. **React Query as the data backbone**: migrate `useSubmissions` hand-rolled fetcher to `useQuery` with `staleTime: 30s` and `keepPreviousData`. This gives instant back-navigation (the cached page renders before refetch).
2. **Persistent query cache**: add `@tanstack/query-sync-storage-persister` writing to `sessionStorage` so navigating between tiers/pages feels instant within a session.
3. **Route-level prefetch on hover**: small hook `usePrefetchRoute(href)` that warms the React Query cache for the destination page when a sidebar link is hovered/touched.
4. **Recent items memory**: localStorage-backed "Recently viewed" (last 5 schools / submissions) shown on each dashboard.
5. **Form draft memory**: SubmitStatistics / SubmitReports / SubmitForms autosave to localStorage every 1s; restored on revisit with a "Restore draft?" banner.
6. **Filter memory**: list pages remember last filter (status, type, search) per route in `sessionStorage`.
7. **Skeleton → suspense boundaries**: replace ad-hoc `loading &&` checks with a single `<ListSkeleton rows={n}/>` component for visual consistency.
8. **Bundle**: split Recharts into its own chunk (already lazy via charts page); enable `manualChunks` in `vite.config.ts` for `react`, `recharts`, `@radix-ui`.

---

## Phase 4 — UX inspired by Linear / Notion / Vercel

1. **Command palette (`⌘K` / `Ctrl+K`)** — uses `cmdk`, lists routes the user has access to, recent items, and quick actions ("Approve last submission", "New school"). This is the single biggest usability lift.
2. **Global search bar** in the top header (schools, submissions, users) that opens the palette pre-filled.
3. **Breadcrumbs** on every inner page (component already exists — wire it up).
4. **Toast → inline status pattern** for approve/reject (Linear-style "Approved · Undo" for 5s) using the existing `useSubmissionActions` optimistic update.
5. **Keyboard shortcuts**: `g d` (dashboard), `g s` (submissions), `j/k` to move through list rows, `e` to approve, `r` to reject.
6. **Notification center**: bell icon in header with realtime feed (pending submissions for admins, status changes for schools) using `supabase.channel` already enabled.
7. **Empty states with illustrations + CTA** (lucide icons, friendly Dari copy).
8. **Theming refresh**: tighten spacing scale, unify card radii, soften shadows, add subtle hover transitions (already in some cards — propagate).
9. **RTL polish**: audit all `mr-*/ml-*` for proper RTL flipping; convert to `me-*/ms-*` (Tailwind logical properties).
10. **Onboarding tour**: first-login 3-step coachmark for each role using a tiny custom popover (no heavy dep).

---

## Phase 5 — Production Hardening

1. **Auth UX**: replace dev "quick login" panel with environment gate (`MODE === 'development'` only); already partial — make strict.
2. **Error boundary per route** (not only global) so a broken page doesn't blank the whole app.
3. **Sentry-style logger stub** (`src/lib/logger.ts`) ready for later wiring.
4. **`security--run_security_scan`** before release; address any remaining RLS warnings.
5. **PWA polish**: service-worker already present — add offline cache for submitted-form drafts and translation files.
6. **i18n completeness**: scan for hard-coded Dari strings inside components (we found many), move to `fa.json`.
7. **Accessibility pass**: focus rings on all interactive elements, `aria-live` on toasts, color-contrast check.
8. **Tests**: add Vitest smoke tests for `useSubmissions`, `useSubmissionActions`, and a render test per dashboard.

---

## Phase 6 — Documentation & Roadmap Surfaces

1. In-app `Help` page (`/help`) per role with short videos / GIFs / FAQ.
2. README.md: production setup, role matrix, RLS overview, CSV/XLSX export format.
3. Public roadmap page (`/roadmap`) — read from a `roadmap.json` so non-devs can update.

---

## Technical Implementation Notes

- New deps: `cmdk`, `xlsx`, `@tanstack/query-sync-storage-persister`, `@tanstack/react-query-persist-client`.
- New files (planned):
  - `src/components/CommandPalette.tsx`
  - `src/components/NotificationCenter.tsx`
  - `src/components/ListSkeleton.tsx`
  - `src/components/EmptyState.tsx`
  - `src/hooks/useDraft.ts`, `useRecentItems.ts`, `usePrefetchRoute.ts`, `useKeyboardShortcuts.ts`
  - `src/lib/logger.ts`, `src/lib/exportXlsx.ts`
  - `src/pages/province/Schools.tsx`, `src/pages/Help.tsx`, `src/pages/Roadmap.tsx`
- Migrations:
  - Trigger: block self-role change on `profiles`.
  - Trigger: sync `user_roles` → `profiles.role`.
  - Update `populate_submission_location` to also fill `*_id`.

## Implementation Order (one phase per iteration)

1. Phase 1 — bug fixes & consistency (small, fast).
2. Phase 2 — real functionality on every page.
3. Phase 3 — caching, drafts, prefetch, query persistence.
4. Phase 4 — command palette + notifications + keyboard UX.
5. Phase 5 — hardening, tests, security scan.
6. Phase 6 — help + roadmap surfaces.

After your approval I'll start with Phase 1 + 2 in the first build pass (they have the most user-visible impact), then move into Phase 3–4.
