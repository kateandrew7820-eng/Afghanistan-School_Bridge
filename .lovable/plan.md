# Platform Development Plan — Full Execution

Goal: take the Afghanistan Schools Data Portal from "functional but basic" to a polished, ministry-grade product. Five phases, each independently shippable. Decisions already made:

- Execute all 5 phases sequentially.
- Submission UX: merge the 3 school submit pages into a single `/school/submit` workspace with tabs and a shared draft pane.
- Approval workflow: full chained approval **school → district → province → ministry** (every stage required), with "request changes" sending it back.
- Add `@tanstack/react-table` for the shared DataTable.

---

## Phase 1 — Information Architecture & Shell

Foundation. No business-logic changes, only layout and routing structure.

- Promote `RoleLayout` to a true 3-section grouped sidebar across all 5 roles: **کار من / داده‌ها / مدیریت**. Already partially done — finish School, District, Province, Ministry, Admin.
- Top bar: real `Breadcrumb` wired everywhere, scope chip (e.g. `ولایت کابل ← ولسوالی بگرام`) for multi-tier users, notifications bell (placeholder count), profile menu with role badge, ⌘K command palette trigger already wired.
- Add global routes `/inbox` and `/profile` available to every role.
- Centralize role-guarded routing in a single `<RouteGuard role="…">` wrapper instead of inline checks per-route in `App.tsx`.
- IA changes per role:
  - **School**: replace `/school/statistics`, `/school/reports`, `/school/forms` with a single `/school/submit` workspace using a tab rail (statistics | reports | forms) and a shared draft pane. Old URLs redirect to the new workspace with the correct tab pre-selected.
  - **District**: merge `Submissions` + `VerifyData` into `/district/inbox` (the shared Verification Inbox).
  - **Province**: dedicated **Districts → Schools** drill page with breadcrumb scope.
  - **Ministry**: `Dashboard` becomes the National Overview (KPIs + NESP progress + heatmap). Existing tool links move to `/ministry/tools`.
  - **Admin**: split the 400-line `admin/Submissions.tsx` into route-based tabs reusing the shared `<VerificationInbox>`.

---

## Phase 2 — Workspaces & Data-First Dashboards

Make dashboards actually useful instead of stat-card + link-grid pages.

- Dashboard pattern applied to all 5 roles:
  - Hero band: 4 `<KpiCard>` with trend delta vs last month and a recharts sparkline (lazy-loaded).
  - "Action required" panel: pending items with inline approve/reject (no navigation).
  - Activity timeline (last 10 events).
  - Role-specific insight widget:
    - School → submission completeness ring + next deadline countdown.
    - District → schools-without-submission list + on-time rate.
    - Province → district leaderboard + provincial completion %.
    - Ministry → national heatmap by province + NESP progress.
- **Verification Inbox** (one shared component, reused by District / Province / Ministry / Admin):
  - Master/detail layout. Filters: status, type, school, date — persisted in URL search params.
  - Bulk select → bulk approve/reject with a single reason.
  - Keyboard shortcuts: `j/k` navigate, `a` approve, `r` reject, `/` focus search.
  - Multi-stage status visualized with the existing `<Stepper>`.
  - Optimistic updates with 5-second undo toast.
- **DataTable** (`@tanstack/react-table`) replaces ad-hoc card grids on `Schools`, `Provinces`, `Users`: sortable, column visibility, density toggle, sticky header, CSV export, RTL-aware, server-paginated.

---

## Phase 3 — Submission & Multi-Stage Verification Workflow

Core product value. Requires DB additions.

**Submission workspace** (`/school/submit`):
- 5-step wizard: Type → Period → Fill → Review → Submit. Reuse `SignupProgress` styling.
- Auto-save drafts every 1s via the existing `useDraft` hook.
- Field-level inline Dari validation right-aligned per the form standard.
- File uploads via `FileUploadProgress` (drag-drop, retries, thumbnails).
- "Compare to previous submission" diff before final submit.
- Confirmation screen with submission ID, expected review time, and "track status" link.

**Chained approval workflow** (school → district → province → ministry):
- Each stage records actor + timestamp + comment, all visible in a detail timeline.
- Any stage can "request changes" → submission goes back to school with reviewer comments instead of binary reject.
- Comment threads per submission (internal-only OR visible to submitter).
- Immutable audit log per submission.

**DB additions (one migration)**:
- New enum `review_stage` with values: `submitted`, `district_approved`, `province_approved`, `ministry_approved`, `changes_requested`, `rejected`.
- `current_stage` column on `statistics_submissions`, `report_submissions`, `form_submissions` (replaces the basic `status` string for workflow, keep `status` for backward compat as a derived field via trigger).
- `submission_events` table: `submission_id`, `submission_type` (stats/report/form), `actor_id`, `action`, `comment`, `created_at`. Append-only, RLS aligned with existing geographic policies.
- `submission_comments` table: threaded, RLS via `is_admin()` + `get_user_district()` / `get_user_province()` / `get_user_school_id()`.
- Stage-transition RLS: e.g. district admin can move `submitted → district_approved` only for own district; province admin only when `current_stage = district_approved`; ministry only when `current_stage = province_approved`.

---

## Phase 4 — Design System Polish

Within existing constraints (light theme, Roboto/Montserrat, no heavy transitions).

- Token audit in `index.css` and `tailwind.config.ts`: ensure semantic tokens for every surface (`--surface-1/2`, `--border-subtle`, `--text-muted`, `--state-success/warning/danger/info` + `-bg`). Find/replace remaining hardcoded colors (~15 spots in `admin/Submissions.tsx`).
- Single elevation scale (xs/sm/md) and unified radii (`rounded-lg` inputs/buttons, `rounded-xl` cards, `rounded-2xl` hero).
- Documented type scale: `text-display / text-h1 / text-h2 / text-body / text-small`.
- Component upgrades:
  - `Badge` variants per status with icon + Dari label baked in (single source of truth in `statusConfig.ts`).
  - `<KpiCard>` with trend + sparkline.
  - `<Timeline>` (activity/audit).
  - `<DetailDrawer>` slide-in right panel.
  - `<Stepper>` for stage visualization (already exists, generalize).
  - `Toast` redesign with undo button, grouped by type, max 3 visible.
- RTL polish: replace every `ml-`/`mr-` with logical `ms-`/`me-`. One helper for directional icon mirroring.
- Micro-interactions: 150ms ease-out for hover/focus/status only. No ripples, no parallax. Skeleton loaders match real layout.

---

## Phase 5 — Performance, Quality, Observability

- Execute the already-documented perf fixes (fonts, chunks, cache headers).
- Migrate remaining `useState + useEffect` data fetches to React Query.
- Per-route `ErrorBoundary` with friendly Dari retry card.
- Global 401 interceptor → redirect to login with "session expired" toast.
- Lighthouse target: mobile ≥ 90 across all 5 role dashboards.
- In-app feedback widget (top-bar button) writing to a `feedback` table.

---

## Suggested Order of Implementation

```text
1. Phase 1 — IA, shell, RouteGuard, /school/submit redirects     ~ foundation
2. Phase 4 partial — tokens, KpiCard, Badge, Stepper, Drawer      ~ unlocks UI
3. Phase 2 — dashboards + Verification Inbox + DataTable          ~ visible win
4. Phase 3 — submission wizard + chained workflow + audit log     ~ core value
5. Phase 4 remaining — RTL audit, micro-interactions, toasts      ~ polish
6. Phase 5 — perf + React Query + error handling + Lighthouse     ~ ship-ready
```

---

## Technical Notes

- New deps: `@tanstack/react-table`. Recharts already present (sparklines).
- DB: one migration in Phase 3 adds `review_stage` enum, `current_stage` columns, `submission_events`, `submission_comments`, plus stage-transition RLS aligned with `is_admin()`, `has_role()`, `get_user_district()`, `get_user_province()`, `get_user_school_id()`.
- Reuse existing: `useDraft`, `useFileUpload`, `useRecentItems`, `CommandPalette`, `Breadcrumb`, `EmptyState`, `ErrorBoundary`, `sanitizeError`, `verificationHierarchy`.
- All UI remains Dari + RTL. DB statuses stay English (`submitted`, `district_approved`, …).
- Out of scope per project memory: "coming soon" features, dark mode, role storage on profiles.

---

## Starting Point

Begin with Phase 1: finalize `RoleLayout` adoption (already done for Admin/School), wire breadcrumbs and scope chip everywhere, add `<RouteGuard>`, then create the `/school/submit` workspace shell with the 3 tabs (no content changes yet — just routing + redirects from the 3 old URLs).
