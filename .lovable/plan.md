
# Professional Modernization Plan

Goal: take the portal from "functional but basic" to a polished, native-feeling ministry-grade product. Work is grouped into 5 phases so you can ship value incrementally and stop at any phase.

---

## Phase 1 — Information Architecture & Navigation (the "where things live" pass)

Today every role has a flat sidebar of 6–8 links with no grouping, no context, and dashboards that mostly re-list links. We restructure the IA so each role has a real workspace.

**New layout shell (all 5 roles)**
- Persistent right-side rail split into 3 sections: **کار من** (action items), **داده‌ها** (browsing), **مدیریت** (admin/settings).
- Top bar gets: command palette (⌘K, already exists — promote it), global search, notifications bell, profile menu with role badge, and a context switcher for ministry/province users (province → district drill).
- Replace the static page-title in the header with a real breadcrumb (`Breadcrumb.tsx` already exists, not wired everywhere).
- Add a compact "current scope" chip (e.g. `ولایت کابل ← ولسوالی بگرام`) so multi-tier users always know what data they're looking at.

**Role-specific IA**
- **School**: collapse 3 separate "Submit*" pages into one `/school/submit` workspace with a left tab rail (Statistics / Reports / Forms) and a shared draft pane. The current 3-pages model forces re-navigation and loses context.
- **District**: merge `Submissions` + `VerifyData` into a single **Verification Inbox** with filters (status, type, school, date). Today `VerifyData` is 43 lines and duplicates Submissions logic.
- **Province**: dedicated **Districts → Schools** drill view with a map-style breadcrumb scope.
- **Ministry**: add a **National Overview** as the dashboard (KPIs + NESP progress + heatmap) and move the link grid to a secondary `/ministry/tools` page.
- **Admin**: split `Submissions.tsx` (currently 400+ lines, three tabs, inline dialogs) into route-based tabs with shared `<VerificationInbox>` component reused by district/province/ministry.

**Routing & guards**
- Centralize role-guarded routes in a `RouteGuard` component (currently inline per-route).
- Add `/inbox` and `/profile` as global routes available to every role.

---

## Phase 2 — Workspaces & Data-First Dashboards

Dashboards today are stat cards + a recent list + an "open more" link. We make them actually useful.

**Dashboard pattern (apply to all 5 roles)**
- Hero band: 4 KPI cards with **trend deltas** (vs last month, sparkline) — not just static numbers.
- "Action required" panel: pending items the user can act on, with **inline approve/reject** (no navigation).
- Activity timeline (last 10 events: submissions, approvals, comments).
- Role-specific insight widget:
  - School → submission completeness ring + next deadline countdown
  - District → schools-without-submission list + on-time rate
  - Province → district leaderboard + provincial completion %
  - Ministry → national heatmap (provinces colored by completion) + NESP progress
- Empty states use `EmptyState.tsx` consistently with primary CTA.

**Verification Inbox (shared component)**
- Master/detail layout: left = filterable list, right = full submission detail with history, attachments, comments.
- Bulk actions (select many → approve/reject with one reason).
- Keyboard shortcuts: `j/k` navigate, `a` approve, `r` reject, `/` focus search.
- Status timeline ("submitted → district approved → province approved → ministry") visualized as a horizontal stepper.
- Optimistic updates with 5-second undo toast (already planned in `.lovable/plan.md`).

**Data tables**
- Replace ad-hoc card grids on list pages (`Schools.tsx`, `Provinces.tsx`, `Users.tsx`) with a real `<DataTable>` built on `@tanstack/react-table`: sortable columns, column visibility, server-side pagination, sticky header, density toggle, CSV export, RTL-aware.
- Persistent filters via URL search params (shareable links + back-button restores state).

---

## Phase 3 — Submission & Verification Workflow (the core product)

Current submit pages are basic forms; verification is a yes/no toggle. Make this a real workflow.

**Submission UX**
- Multi-step wizard with progress (`SignupProgress` exists, generalize it): Type → Period → Fill → Review → Submit.
- Auto-save drafts every 1s using `useDraft` (already exists, not wired into the submit pages — `.lovable/plan.md` flagged this).
- Field-level inline validation with Dari error messages right-aligned.
- File uploads with chunked upload, drag-drop, preview thumbnails, retry on failure (`FileUploadProgress.tsx` exists, integrate).
- A "compare to previous submission" diff view before final submit.
- After submit: confirmation screen with submission ID, expected review time, and "track status" link.

**Verification workflow**
- Multi-stage approval matrix matching the 5-tier model: school → district → province → ministry. Each stage records actor + timestamp + comment, all visible in the detail timeline.
- Reviewer can request changes (sends back to school with comments instead of binary reject).
- Comment threads on each submission (internal-only or visible to submitter).
- Audit log table per submission (immutable history of every state change).

---

## Phase 4 — Design System Polish (the "native, premium" feel)

Project memory says light theme, Roboto/Montserrat, RTL, low-end Android. Within those constraints we still upgrade fidelity significantly.

**Tokens & components**
- Audit `index.css` to ensure every surface uses semantic tokens: `--surface-1`, `--surface-2`, `--border-subtle`, `--text-muted`, `--state-success/warning/danger/info` + `-bg` variants. Find/replace any leftover hardcoded `bg-gray-50`, `text-yellow-800` etc. (grep shows ~15 spots in `admin/Submissions.tsx`).
- Define a single elevation scale (xs/sm/md) and apply consistently — current cards mix `shadow-sm`, `shadow-md`, and no shadow.
- Unify radii: `rounded-lg` for inputs/buttons, `rounded-xl` for cards, `rounded-2xl` for hero surfaces. Currently mixed.
- Type scale: heading sizes (`text-2xl` everywhere now) → use a documented scale `text-display / text-h1 / text-h2 / text-body / text-small`.

**Components to upgrade**
- `Badge` variants for each status (`pending`, `approved`, `rejected`, `under_review`, `changes_requested`) with icon + Dari label baked in. One source of truth in `statusConfig.ts`.
- New `<KpiCard>` with optional trend, sparkline (recharts, lazy), and click target.
- New `<Timeline>` for activity/audit.
- New `<DetailDrawer>` (slide-in right panel) so list→detail doesn't force navigation.
- New `<Stepper>` for multi-stage status visualization.
- `Toast` redesign: action toasts (with undo button), grouped by type, max 3 visible.

**Micro-interactions (respecting the no-heavy-transitions rule)**
- Subtle 150ms ease-out for state changes only (hover, focus, status change). No ripples, no parallax.
- Skeleton loaders match the real layout (`ListSkeleton` planned in `.lovable/plan.md`).
- Focus rings: 2px primary, visible, accessible.

**RTL polish**
- Audit every `ml-`/`mr-` and replace with logical `ms-`/`me-` (Tailwind logical utilities) for true RTL/LTR support — future Pashto/English readiness.
- Icon mirroring for directional icons (arrows, chevrons) handled in one helper.

---

## Phase 5 — Performance, Quality, Observability

- Wire all of `.lovable/plan.md` Phase 2 performance fixes (fonts, chunks, cache headers) — already documented, just execute.
- Migrate remaining `useState + useEffect` data fetches to React Query (`useSubmissions` already partially done) for cache + back-nav instant restore.
- Per-route `ErrorBoundary` with friendly Dari retry card.
- Global 401 interceptor → redirect to login with "session expired" toast.
- Lighthouse target: mobile ≥ 90 across all 5 role dashboards.
- Add an in-app feedback widget (small button in top bar) writing to a `feedback` table.

---

## Suggested Order of Implementation

```text
1. Phase 1 (IA + layout shell + breadcrumbs + role guards)        ~ foundation
2. Phase 4 partial (tokens, KpiCard, Badge, Stepper, DetailDrawer)  ~ unlock UI
3. Phase 2 (dashboards + Verification Inbox + DataTable)           ~ visible win
4. Phase 3 (submission wizard + multi-stage workflow + audit log)  ~ core value
5. Phase 4 remaining (RTL audit, micro-interactions, toasts)       ~ polish
6. Phase 5 (perf + React Query + error handling + Lighthouse)      ~ ship-ready
```

Each phase is independently shippable. Phase 1+2 alone already make the product feel like a different app.

---

## Technical Notes

- New deps: `@tanstack/react-table` (DataTable). Recharts already present (sparklines).
- DB additions for Phase 3: `submission_events` (audit log: submission_id, actor_id, action, comment, created_at), `submission_comments` (threaded), and a `review_stage` enum column on each submissions table. Provide via one migration with RLS aligned to the existing `is_admin()` + geographic policies.
- No new external services. Lovable Cloud only.
- Reuse existing: `useDraft`, `useFileUpload`, `useRecentItems`, `CommandPalette`, `Breadcrumb`, `EmptyState`, `ErrorBoundary`, `sanitizeError`, `verificationHierarchy`.
- Out of scope (per project memory): "coming soon" features, dark mode, role storage on profiles table.

---

## Open Questions (answer before I start building)

1. **Scope to start with**: do you want me to execute all 5 phases sequentially, or ship Phase 1+2 first and review before continuing?
2. **Submission wizard**: keep current 3 separate submit pages but upgrade each, or fully merge into the unified `/school/submit` workspace I described?
3. **Multi-stage approval**: should approval truly require all 4 stages (school→district→province→ministry), or is it currently just "district OR province OR ministry approves"? This changes the DB design in Phase 3.
