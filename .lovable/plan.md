

# Comprehensive UI Refinement, Accessibility, and Performance Plan

## Overview
This plan addresses all current build errors (13+ TypeScript issues) while improving UI polish, accessibility (a11y), and performance across the entire application.

---

## Phase 1: Fix All Build Errors (Critical)

These must be resolved first to get the app running.

### 1.1 Fix `showErrorToast`/`showSuccessToast` misuse (6 files)
The `useErrorToast()` hook returns `showError`, `showSuccess`, `showErrorMessage` — NOT `showErrorToast`/`showSuccessToast`. Files referencing the wrong names:
- `src/pages/SetupProfile.tsx` (line 70)
- `src/pages/TestButtons.tsx` (line 27)
- `src/hooks/useMockSubmission.ts` (line 19)
- `src/pages/school/SubmitForms.tsx` (line 30)
- `src/pages/school/SubmitReports.tsx` (line 24)
- `src/pages/school/SubmitStatistics.tsx` (line 22)

**Fix:** Replace destructured names with the correct ones:
```ts
// Before
const { showErrorToast, showSuccessToast } = useErrorToast();
// After
const { showError, showSuccess } = useErrorToast();
```
Then update all call sites accordingly.

### 1.2 Fix `aria-invalid` type error in SmartFormField
`aria-invalid={hasError}` passes a boolean, but the spread of `{...props}` may also include an `aria-invalid` string, causing a type conflict.

**Fix:** Cast explicitly: `aria-invalid={hasError ? "true" : undefined}` and place it after `{...props}` to take precedence.

### 1.3 Fix `profile.email` in ProfileCompletionModal
The `Profile` interface has no `email` field.

**Fix:** Remove `email` from the identity state initialization, or source it from `user.email` via the auth context.

### 1.4 Fix Ministry Dashboard `created_at` type error
`statistics_submissions` query selects `id, total_students, total_teachers` — no `created_at`. But the code later filters by `s.created_at`.

**Fix:** Add `created_at` to the statistics query select: `'id, total_students, total_teachers, created_at'`.

### 1.5 Fix `executeWithErrorHandling` return type (3 files)
Supabase `.upsert()` / `.insert()` without a terminal `.select()` or `.then()` returns a `PostgrestFilterBuilder`, not a `Promise`. Files: `SetupProfile.tsx`, `SubmitForms.tsx`, `SubmitStatistics.tsx`.

**Fix:** Append `.select()` to each query chain so it returns a proper Promise.

### 1.6 Fix `errors` type mismatch (4 files)
`FormErrorSummary` expects `errors` as `Record<string, string>` but receives `string[]` from `Object.values(errors)`.

**Fix:** Pass `errors` (the object) directly, or change `FormErrorSummary` to accept `string[]`.

### 1.7 Fix SubmitReports file validation type errors
`validateFileSize` and `validateFileType` receive wrong argument types (number/string instead of File).

**Fix:** Pass the correct File properties: `validateFileSize(selectedFile.size, MAX_FILE_SIZE)` is correct for size — check the function signatures and align.

---

## Phase 2: UI Refinement

### 2.1 Consistent card styling
- Add subtle hover elevation (`hover:shadow-md transition-shadow`) to all dashboard cards
- Standardize card padding and border-radius across all role dashboards
- Add loading skeleton states for dashboard cards

### 2.2 Form UX improvements
- Add focus-visible ring styling consistently to all form inputs
- Improve error message positioning (below field, with slide-in animation)
- Add character counters for text areas with `maxLength`

### 2.3 Navigation polish
- Highlight active sidebar item with a left/right border accent (RTL-aware)
- Add smooth transitions for sidebar collapse/expand
- Improve mobile menu overlay with backdrop blur

---

## Phase 3: Accessibility (a11y)

### 3.1 ARIA and semantic HTML
- Add `role="main"` to main content areas and `role="navigation"` to sidebars
- Add `aria-label` to all icon-only buttons (sidebar toggle, close buttons)
- Add `aria-live="polite"` to toast/notification containers for screen reader announcements
- Ensure all form fields have associated `<label>` elements (not just visual labels)

### 3.2 Keyboard navigation
- Ensure all interactive elements are focusable and have visible focus indicators
- Add `tabIndex` management for modal dialogs (trap focus inside modals)
- Support `Escape` key to close modals and sidebar on mobile

### 3.3 Color contrast and RTL
- Audit muted-foreground color (`215 12% 50%`) for WCAG AA compliance against background — may need darkening
- Ensure all status colors (success green, warning yellow, destructive red) meet 4.5:1 contrast ratio
- Verify RTL layout doesn't break icon positioning in form fields (validation icons currently use `right-3`, should be `left-3` in RTL)

---

## Phase 4: Performance Optimization

### 4.1 Component-level optimizations
- Wrap expensive dashboard card components in `React.memo`
- Use `useMemo` for computed statistics in dashboard pages
- Debounce form validation in real-time validated fields

### 4.2 Bundle and loading
- Add proper `loading="lazy"` to any images
- Ensure all heavy pages remain lazy-loaded (already in place, verify no regressions)
- Consider replacing the recharts exclude from optimizeDeps if it causes waterfall loading

### 4.3 Network efficiency
- Add `staleTime` overrides for infrequently changing data (announcements, deadlines) to reduce refetches
- Use Supabase `.select()` with minimal columns instead of selecting all fields

---

## Files to be modified

| File | Changes |
|------|---------|
| `src/pages/SetupProfile.tsx` | Fix toast names, add `.select()`, fix errors type |
| `src/pages/TestButtons.tsx` | Fix toast names |
| `src/hooks/useMockSubmission.ts` | Fix toast names |
| `src/pages/school/SubmitForms.tsx` | Fix toast names, add `.select()`, fix errors type |
| `src/pages/school/SubmitReports.tsx` | Fix toast names, fix validation types, fix errors type |
| `src/pages/school/SubmitStatistics.tsx` | Fix toast names, add `.select()`, fix errors type |
| `src/components/SmartFormField.tsx` | Fix aria-invalid type, RTL icon positioning |
| `src/components/ProfileCompletionModal.tsx` | Remove `profile.email` reference |
| `src/pages/ministry/Dashboard.tsx` | Add `created_at` to stats query |
| `src/components/layouts/SchoolLayout.tsx` | Add ARIA labels, keyboard support |
| `src/components/layouts/DistrictLayout.tsx` | Add ARIA labels, keyboard support |
| `src/components/layouts/ProvinceLayout.tsx` | Add ARIA labels, keyboard support |
| `src/components/layouts/MinistryLayout.tsx` | Add ARIA labels, keyboard support |
| `src/pages/school/Dashboard.tsx` | React.memo cards, useMemo stats, skeleton loading |
| `src/index.css` | Adjust contrast values, add focus-visible utilities |

