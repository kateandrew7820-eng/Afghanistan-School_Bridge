# Development Bypass Mode - Quick Testing Feature

## Purpose

The **Dev Bypass Mode** allows developers to test the onboarding flow and dashboards **without waiting for admin approvals**. This speeds up development and UI testing significantly.

## How It Works

### In Development Environment
```
Fill Profile Form
        ↓
Status = "verified" (auto-approved)
        ↓
Redirects directly to dashboard
        ↓
No waiting for admin approval
```

### In Production
```
Fill Profile Form
        ↓
Status = "pending_verification"
        ↓
Redirects to pending verification page
        ↓
User waits for admin approval
```

## What Changed

### SetupProfile.tsx (/setup-profile page)

**Added:**
1. **Dev Mode Detection** - Checks if `import.meta.env.MODE === 'development'`
2. **Auto-Verification** - Sets `status = "verified"` instead of `"pending_verification"`
3. **Direct Dashboard Redirect** - Skips pending verification page
4. **Dev Mode Banner** - Shows yellow warning banner so developers know they're in dev mode

**Code:**
```typescript
const DEV_MODE = import.meta.env.MODE === 'development';

// Auto-verify in dev, pending in production
updateData.status = DEV_MODE ? 'verified' : 'pending_verification';

// Redirect to dashboard in dev, pending page in production
if (DEV_MODE) {
  navigate(dashboardRoute); // e.g., /school
} else {
  navigate('/pending-verification');
}
```

### Dashboard Routes by Role
```
Student        → /school
Teacher        → /school
Principal      → /school
District Admin → /district
Province Admin → /province
Ministry Admin  → /ministry
```

## Using Dev Bypass

### Quick Start
1. **Sign up** with any email/password
2. **Fill profile form** - Choose any role
3. **See dev mode banner** - Yellow box says "حالت توسعه فعال"
4. **Instantly redirected** to dashboard - No waiting!
5. **Test dashboards** - Full access to all features

### Example Testing Flow
```
1. Go to /login
2. Create account: test@example.com
3. Fill profile:
   - Name: Ahmed Ali
   - Role: Teacher
   - School: Test High School
   - District: Kabul
   - Province: Kabul
4. Click Submit
5. See [DEV MODE] banner with yellow background
6. Auto-redirected to /school dashboard
7. Start testing features
```

## Important Notes

### This is DEVELOPMENT ONLY
- Code checks: `import.meta.env.MODE === 'development'`
- Only active when running locally or in dev environment
- **Completely disabled in production**

### Visual Indicator
The form shows a clear **amber/yellow banner** saying:
```
⚙️ حالت توسعه فعال
(Development Mode Active)

در حالت توسعه، پروفایل شما بلافاصله تأیید می‌شود و به صفحه اصلی منتقل می‌شوید.
این فقط برای آزمایش است.
(In dev mode, your profile is immediately verified and you're redirected to dashboard.
This is for testing only.)
```

### Toast Message
When submitting in dev mode, users see:
```
موفقیت
[DEV MODE] پروفایل شما تأیید شد. به صفحه اصلی منتقل می‌شوید...
(Success - [DEV MODE] Your profile is verified. Redirecting to dashboard...)
```

## Database State

Even in dev mode:
- ✅ Profile is saved to database with all fields
- ✅ Status is set to "verified" in database
- ✅ User can re-access dashboard normally
- ✅ If you manually change status back to "pending" in database, normal flow resumes

This means:
- Testing is realistic
- Database operations are real
- You can test the verification queue by manually updating status

## Testing Scenarios

### Scenario 1: Test Dashboard Immediately
```
1. Signup
2. Fill profile as "Student"
3. See /school dashboard
4. Test all student features
```

### Scenario 2: Test Role-Based Dashboards
```
1. Create account 1 as "Teacher" → See /school
2. Create account 2 as "District Admin" → See /district
3. Create account 3 as "Ministry Admin" → See /ministry
4. Verify each role sees correct dashboard
```

### Scenario 3: Test اعلانات, فرصت‌‌ها, etc.
```
1. Login as any role (dev mode auto-verifies)
2. See dashboard
3. Try اعلانات, فرصت‌‌ها, submissions
4. Add/edit content
5. Test all features without approval bottleneck
```

### Scenario 4: Test Real Verification Flow
```
1. Turn off dev mode (impossible - would need code change)
2. Or manually change user status to "pending_verification" in database
3. Test admin approval queue
4. Test pending verification page
```

## Disabling Dev Bypass

### Temporary (For Testing Real Flow)
Change status in database manually:
```sql
UPDATE profiles SET status = 'pending_verification' WHERE user_id = 'xxx';
```

Then user will be redirected to pending page and see normal verification flow.

### Permanent (For Production)
- Already disabled automatically in production build
- No code changes needed
- Deploy to production with confidence

## Key Differences from Production

| Feature | Dev Mode | Production |
|---------|----------|-----------|
| After Profile Form | Auto-verified | Pending approval |
| Redirect | Dashboard | Pending page |
| Banner | Shows "DEV MODE" | No banner |
| Toast Message | Says "[DEV MODE]" | Normal message |
| Database Status | "verified" | "pending_verification" |
| User Access | Immediate | Waits for admin |

## Code Location

**File:** `src/pages/SetupProfile.tsx`

**Key Section:** `handleSubmit` function (lines ~118-190)

**Dev Mode Check:**
```typescript
const DEV_MODE = import.meta.env.MODE === 'development';
```

**Logic:**
```typescript
updateData.status = DEV_MODE ? 'verified' : 'pending_verification';

if (DEV_MODE) {
  // Redirect to dashboard
  navigate(dashboardRoute);
} else {
  // Redirect to pending verification page
  navigate('/pending-verification');
}
```

## Benefits

✅ **No Waiting** - Test flows immediately after signup  
✅ **No Admin Needed** - No need to open multiple browsers  
✅ **Realistic Database** - Real database operations, real data  
✅ **Role Testing** - Test each role's dashboard quickly  
✅ **UI Testing** - See all UI flows without approval bottleneck  
✅ **Feature Development** - Develop new features in dashboards freely  
✅ **Edit & Test** - Create اعلانات, فرصت‌‌ها, submissions, and test immediately  

## QA/Testing Example

### Test All Dashboards in 5 Minutes
```
1. Create account as Student → /school ✓
2. Create account as Teacher → /school ✓
3. Create account as Principal → /school ✓
4. Create account as District Admin → /district ✓
5. Create account as Province Admin → /province ✓
6. Create account as Ministry Admin → /ministry ✓
```

All without any admin approvals or waiting!

## Troubleshooting

**Q: I don't see the [DEV MODE] banner**  
A: You're likely in production mode. This feature only works in local development.

**Q: User wasn't auto-verified**  
A: Check browser console for errors. Make sure you're running with `npm run dev` (development mode).

**Q: Role mismatch - wrong dashboard**  
A: The code maps roles to dashboard URL. Check the `dashboardRoutes` object in SetupProfile.tsx.

**Q: Redirect doesn't happen**  
A: Check network errors. Profile save might have failed. Look at database directly.

## Summary

This dev bypass mode **speeds up development significantly** by:
- Removing approval wait time
- Eliminating need for multiple browser windows
- Allowing immediate testing of new dashboard features
- Making UI testing much faster and easier

**Use it to develop and test rapidly. It's automatically disabled in production.**
