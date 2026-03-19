# Verification Hierarchy System

## Overview

The verification hierarchy system ensures that only authorized administrators can approve new user accounts, following the real-world education system structure in Afghanistan.

## Hierarchy Chain

```
Student            → Approved by Teacher
Teacher            → Approved by Principal
Principal          → Approved by District Admin
District Admin     → Approved by Province Admin
Province Admin     → Approved by Ministry Admin
Ministry Admin     → Self-approved (no verification needed)
```

## User Flow

### 1. Account Creation (SignUp)
``` 
User fills email, password, full name
↓
Account created in auth
↓
Auto-login (200ms delay for DB sync)
↓
Redirected to /setup-profile
```

### 2. Profile Setup
```
User fills:
- Full Name (pre-filled)
- Role selection (student/teacher/principal/district_admin/province_admin)
- School Name
- District
- Province (dropdown with 34 provinces)
- Phone Number (optional)

↓
Status set to "pending_verification"
↓
Redirected to /pending-verification
```

### 3. Verification Status Check
```
User lands on /pending-verification page
↓
Shows: "حساب شما در حال بررسی است" (Your account is under review)
↓
Auto-refreshes every 10 seconds checking status
↓
If approved → Redirects to dashboard
↓
If rejected → Shows rejection reason
```

### 4. Admin Approval
```
Admin views verification queue in dashboard
↓
Sees pending users filtered by role they approve
↓
Clicks "Approve" or "Reject"
↓
System updates:
  - Status: "verified" or "rejected"
  - verified_by_user_id: admin's user ID
  - verified_at: ISO timestamp
  - rejection_reason: if rejected

↓
User's next auto-refresh detects change
↓
Auto-redirect to dashboard
```

## Code Architecture

### 1. **Verification Hierarchy Utility** (`lib/verificationHierarchy.ts`)

Provides role-based helpers:
- `getApprovingRole(role)` - Who can approve this role
- `canApprove(adminRole, userRole)` - Permission check
- `getVerificationQueueFilter(adminRole)` - Get roles this admin should see
- `getApprovalInstruction(role)` - User-friendly message
- `getRoleLabel(role)` - Localized role names
- `getHierarchyLevel(role)` - Sort by hierarchy

### 2. **Verification Hook** (`hooks/useVerification.ts`)

Returns verification status:
```typescript
{
  isVerified: boolean;
  isPending: boolean;
  isRejected: boolean;
  rejectionReason: string | null;
  canAccessDashboard: boolean; // isVerified OR isDemoMode
  needsSetup: boolean; // User missing profile fields
}
```

### 3. **VerificationPanel Component** (`components/VerificationPanel.tsx`)

Reusable admin component for approving/rejecting users.

Props:
- `filterRole?: string` - Only show users with this role
- `filterDistrict?: string` - Filter by district
- `filterProvince?: string` - Filter by province
- `limit?: number` - Max results (default 10)

Features:
- Shows pending users with their setup info
- Approve button: Updates status, creates user_role entry
- Reject button: Shows reason textarea, tracks rejection
- Auto-removes user after action
- Error handling & loading states

### 4. **Protected Route** (`App.tsx`)

Enhanced `ProtectedRoute` component checks:
1. User authentication
2. Role/tier assignment
3. **Verification status** (NEW)
4. Demo mode bypass (NEW)

Logic:
```typescript
if (!isDemoMode && !verification.canAccessDashboard) {
  if (verification.needsSetup) {
    redirect to /setup-profile
  } else if (verification.isPending) {
    redirect to /pending-verification
  }
}
```

### 5. **Dashboard Integration**

**Admin Dashboard** (`pages/admin/Dashboard.tsx`):
- Shows VerificationPanel filtered by admin's role
- Only displays if admin has approval responsibilities
- Updates in real-time as approvals happen

**School Dashboard** (`pages/school/Dashboard.tsx`):
- Shows green "Account Verified" status badge if verified
- Shows VerificationPanel if user has approval responsibilities (e.g., Principal approving Teachers)
- Auto-hides in demo mode

## Database Schema

### Profile Fields
```sql
status: 'pending_verification' | 'verified' | 'rejected'
verified_by_user_id: uuid (who approved them)
verified_at: timestamp (when approved)
rejection_reason: text (if rejected)
role: string (student/teacher/principal/etc)
phone_number: text (optional)
school_name: text (optional)
```

### Verification Audit Table
- Tracks all approvals/rejections
- Provides audit trail for compliance
- Auto-indexed for fast lookups

## Demo Mode

In development (`/demo` route), demo users:
- Bypass all verification checks
- Can access dashboards immediately
- See VerificationPanel if their role has approvers
- Simulates all roles for testing

```typescript
// In AuthContext and useVerification hook:
if (isDemoMode) {
  canAccessDashboard = true; // Always
  needsSetup = false;
  isVerified = true;
}
```

## Persian/RTL Support

All UI components are Persian (Farsi/Dari):
- SetupProfile form: "فرم تنظیم پروفایل"
- PendingVerification: "حساب شما در حال بررسی است"
- VerificationPanel: "صف تایید کاربران"
- Role labels: "دانش‌آموز", "معلم", "مدیر مکتب", etc.
- Status messages: Localized approval instructions

## Usage Examples

### 1. Check if User is Verified
```typescript
const verification = useVerification();

if (verification.isVerified) {
  // Show verified state
}

if (verification.isPending) {
  // Show pending message
}
```

### 2. Get Admin's Queue
```typescript
import { getVerificationQueueFilter } from '@/lib/verificationHierarchy';

const { role } = useAuth();
const filterRole = getVerificationQueueFilter(role);

// In Component:
{filterRole && (
  <VerificationPanel filterRole={filterRole} limit={10} />
)}
```

### 3. High Hierarchy Level = Can Approve More Roles
```typescript
import { getHierarchyLevel, getApprovingRole } from '@/lib/verificationHierarchy';

// Ministry Admin (level 6) approves Province Admin (level 5)
const levelOfAdmin = getHierarchyLevel('ministry_admin'); // 6
const roleToApprove = getApprovingRole('province_admin'); // 'ministry_admin'

// System ensures: You can only approve roles below you
```

## Future Enhancements

1. **Bulk Approval** - Admin approves multiple users at once
2. **Approval Timeline** - Show how long users have been pending
3. **Notification System** - Email admins about pending approvals
4. **Appeal Process** - Users can appeal rejections
5. **Statistics** - Dashboard shows approval metrics and trends
6. **Scheduled Verification** - Auto-approve at certain dates
7. **Role Reassignment** - Admin can change user roles before approval

## Security Considerations

1. **RLS Policies** - Verification operations check user permissions
2. **Audit Trail** - All approvals/rejections tracked in verification_audit
3. **No Self-Approval** - Users cannot approve themselves
4. **Hierarchy Enforcement** - Only correct admin tier can approve each role
5. **Status Immutability** - Once verified, can only be manually changed by higher admin

## Testing in Demo Mode

```
1. Go to /demo
2. Select any role (student/teacher/principal/etc)
3. Select tier (school/district/province/ministry)
4. View dashboard immediately (no verification needed)
5. VerificationPanel shows if role has approvers
6. Test UI without needing to:
   - Fill setup form
   - Wait for admin approval
   - Deploy database migration
```

## Troubleshooting

**Issue: User stuck on /pending-verification**
- Check verification_audit table for approvals
- Check profile.status field
- Check auto-refresh is running (every 10 seconds)
- Try manual "Check Status" button

**Issue: VerificationPanel shows no users**
- Check profile.status = 'pending_verification'
- Check verificationQueueRole matches profile.role
- Check limit parameter
- Verify role hierarchy is configured

**Issue: Demo mode not working**
- Ensure MODE === 'development'
- Check isDemoMode state in AuthContext
- Verify demo user data is loaded in mock profile

## Related Files

- `src/lib/verificationHierarchy.ts` - Hierarchy logic
- `src/hooks/useVerification.ts` - Status hook
- `src/components/VerificationPanel.tsx` - Admin component
- `src/pages/SetupProfile.tsx` - User profile form
- `src/pages/PendingVerification.tsx` - Status page
- `src/pages/admin/Dashboard.tsx` - Admin view
- `src/pages/school/Dashboard.tsx` - School view
- `src/App.tsx` - Protected route logic
- `src/contexts/AuthContext.tsx` - Auth + demo mode
- `supabase/migrations/20260319104000_add_verification_workflow.sql` - DB schema
