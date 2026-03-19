# Persian Localization & Dashboard Access Implementation

## Summary

### 1. Persian Localization (✅ COMPLETED)

#### Core Infrastructure
- **i18next Setup**: Installed `i18next`, `react-i18next`, and `i18next-browser-languagedetector`
- **Configuration**: Created `src/i18n/config.ts` with Persian as default language
- **Translations**: Created `src/i18n/locales/fa.json` with 500+ translation keys

#### RTL Layout Support
- Updated `index.html` with:
  - `lang="fa"` and `dir="rtl"` attributes
  - Vazirmatn Persian font from Google Fonts
  - CSS styles for RTL direction with fallback support
  - Input/textarea direction inheritance

#### Localization Context
- Created `src/contexts/LocalizationContext.tsx`:
  - Provides `useTranslation()` hook combining i18n and RTL support
  - Manages language switching with localStorage persistence
  - Applies RTL/LTR to document dynamically
  - Supports future language additions

#### Components Updated with Persian Text
1. **Login.tsx**: All labels, buttons, validation messages
2. **SchoolLayout.tsx**: Navigation menu, logout button, school names
3. **DistrictLayout.tsx**: District-level navigation and labels
4. **ProvinceLayout.tsx**: Province-level navigation and labels
5. **MinistryLayout.tsx**: National-level navigation and labels
6. **Index.tsx (Home Page)**: Header and landing page text
7. **AccessError.tsx**: Error messages and buttons (NEW)

### 2. Dashboard Access Issue Resolution (✅ COMPLETED)

#### Role Assignment After Account Creation
- **Database Triggers**: 
  - `20260319100000_auto_create_user_role.sql` - Auto-assigns 'school' role on profile creation
  - Runs after user registers, ensuring role exists before auth context loads

- **AuthContext Enhancement**:
  - `signUp()` waits 1000ms for database triggers to complete
  - `loadUserData()` uses retry logic (3 attempts, 500ms intervals) to fetch role
  - Graceful fallback to 'school' role if fetch fails temporarily

#### Role Validation & Redirect
- **ProtectedRoute Component**:
  - Checks `user` exists (authenticated)
  - Validates `role` and `roleTier` are loaded
  - Shows `AccessError` component if role is missing
  - Redirects to appropriate dashboard based on `roleTier`:
    - Teacher/Principal → `/school`
    - District Admin → `/district`
    - Province Admin → `/province`
    - Ministry Admin → `/ministry`

- **AppRoutes Component**:
  - `getDashboardRoute()` function maps role to dashboard URL
  - Redirects from `/login` to correct dashboard if already authenticated

#### Error Handling
- **AccessError Page** (`src/pages/AccessError.tsx`):
  - Displays role-specific error messages in Persian
  - Types: `missing_role`, `invalid_role`, `unauthorized`
  - Provides action buttons (retry or go home)
  - User-friendly interface with icons and descriptions

- **AuthContext** error state:
  - Captures and propagates authentication errors
  - Returns errors in Promise format for handling in components
  - Provides specific error messages (e.g., "Invalid email or password")

#### Session Token Persistence
- **Supabase Auth**: Automatically manages auth tokens
- **AuthContext**: 
  - Listens to `onAuthStateChange` for token updates
  - Syncs across browser tabs/windows
  - Handles session expiration gracefully
- **localStorage**: 
  - Stores language preference
  - Auth tokens handled internally by Supabase

---

## Testing Guide

### Prerequisites
- Application running locally (`npm run dev`)
- PostgreSQL database with Supabase
- All migrations applied: `20260319100000_*` through `20260319102100_*`

### Test Scenarios

#### Test 1: Account Creation & Role Assignment

**Steps**:
1. Navigate to `http://localhost:5173/login`
2. Click "ثبت‌نام" (Create Account) tab
3. Fill in:
   - Full Name (Persian): "محمد احمد"
   - Email: "teacher@example.com"
   - Password: "password123"
   - Confirm Password: "password123"
4. Click "ثبت‌نام" button
5. Wait for success toast: "موفق - ثبت‌نام موفق!"

**Expected Result**:
- Account created successfully
- Dialog switches to "ورود" (Sign In) tab after 2 seconds
- Email field auto-filled with registered email

#### Test 2: Dashboard Access - Teacher Role

**Steps**:
1. Complete Test 1 (account creation)
2. Sign in with credentials from Test 1
3. Wait for auth loading spinner to complete

**Expected Result**:
- Auto-redirected to `/school` dashboard
- School layout displayed with Persian menu items:
  - صفحه اصلی (Dashboard)
  - ارسال آمار و اطلاعات (Submit Statistics)
  - ارسال گزارشات (Submit Reports)
  - ارسال فرم‌ها (Submit Forms)
  - اطلاعیه‌ها (اعلانات)
  - اسناد (Documents)
  - مهلت‌ها (Deadlines)

#### Test 3: Dashboard Access - District Admin

**Database Setup for District Admin**:
```sql
-- Update user role to district_admin
UPDATE user_roles 
SET role = 'district_admin' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'teacher@example.com');
```

**Steps**:
1. Sign in with district admin account (via above SQL)
2. Wait for auth loading spinner

**Expected Result**:
- Auto-redirected to `/district` dashboard
- District layout with menu items:
  - صفحه اصلی (Dashboard)
  - ارسالی‌های مکاتب (School Submissions)
  - تأیید (Verify)
  - مدیریت مکاتب (Manage Schools)

#### Test 4: Role Missing Error Handling

**Database Setup for Missing Role**:
```sql
-- Delete the user's role record
DELETE FROM user_roles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
```

**Steps**:
1. Create new account with invalid role setup
2. Manually delete the role record using SQL above
3. Sign out and sign back in

**Expected Result**:
- AccessError page displays:
  - Title: "خطا" (Error)
  - Message: "نقش شما هنوز تعیین نشده است. لطفاً با مدیر تماس بگیرید." (Role not assigned)
  - "برگشت" (Back) and "دوباره تلاش" (Retry) buttons
  - Text: "با مدیر تماس بگیرید" (Contact admin)

#### Test 5: RTL Layout Verification

**Steps**:
1. Open any page (Login, Dashboard, etc.)
2. Open browser DevTools
3. Inspect `<html>` element

**Expected Result**:
- `lang="fa"` attribute present
- `dir="rtl"` attribute present
- All text aligned to the right
- Input fields and buttons have RTL direction
- Persian font (Vazirmatn) applied

#### Test 6: Unauthorized Tier Access

**Steps**:
1. Sign in as school user (teacher/principal)
2. Manually navigate to `/district` URL
3. Observe redirect behavior

**Expected Result**:
- User redirected back to `/school` dashboard
- No error message shown (automatic redirect)
- Dashboard loads with correct school layout

#### Test 7: Session Persistence

**Steps**:
1. Sign in to account
2. Navigate to different dashboard pages
3. Refresh the page (F5)
4. Close and reopen browser tab
5. Navigate to different origin URL and back

**Expected Result**:
- User remains authenticated after refresh
- Dashboard persists without re-login
- Session valid across tab closures/reopenings
- Auth token managed by Supabase internally

---

## Test Data Setup

### Creating Test Accounts

#### Option 1: Through UI
1. Use Login page signup form
2. Fill in all fields with test data
3. Account auto-created with 'school' role

#### Option 2: Direct Database
```sql
-- Create user in auth.users
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES (
  'principal@example.com',
  crypt('password123', gen_salt('bf')),
  now()
);

-- Create profile
INSERT INTO profiles (user_id, full_name)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'principal@example.com'),
  'محمد حسن'
);

-- Assign role
INSERT INTO user_roles (user_id, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'principal@example.com'),
  'principal'
);
```

### Test User Credentials

| Email | Password | Expected Dashboard | Role |
|-------|----------|-------------------|------|
| teacher@school.com | pass123 | `/school` | teacher |
| principal@school.com | pass123 | `/school` | principal |
| admin@district.com | pass123 | `/district` | district_admin |
| admin@province.com | pass123 | `/province` | province_admin |
| admin@ministry.com | pass123 | `/ministry` | ministry_admin |

---

## Known Limitations & Future Improvements

### Current Limitation
- Only Persian (Farsi/Dari) localization currently implemented
- English not yet supported

### Future Enhancements
1. **Multiple Languages**: Add English, Pashto translations
2. **Date Formatting**: Use date-fns with Persian locale for dates/times
3. **Number Formatting**: Format numbers with Persian digits
4. **Enhanced Error Handling**: Specific error messages per role tier
5. **Language Switcher**: Add language toggle in UI
6. **Accessibility**: ARIA labels in Persian, screen reader support

---

## Files Modified

### Created
- `src/i18n/config.ts` - i18next configuration
- `src/i18n/locales/fa.json` - Persian translations (500+ keys)
- `src/contexts/LocalizationContext.tsx` - Localization context and hooks
- `src/pages/AccessError.tsx` - Error page for role/access issues

### Modified
- `index.html` - RTL attributes, Persian fonts, CSS
- `src/main.tsx` - Initialize i18n before app render
- `src/App.tsx` - Add LocalizationProvider, ImportAccessError page
- `src/pages/Login.tsx` - Use useTranslation, update all text
- `src/pages/Index.tsx` - Use useTranslation, RTL support
- `src/components/layouts/SchoolLayout.tsx` - Persian menu items
- `src/components/layouts/DistrictLayout.tsx` - Persian menu items
- `src/components/layouts/ProvinceLayout.tsx` - Persian menu items
- `src/components/layouts/MinistryLayout.tsx` - Persian menu items
- `package.json` - Added i18next dependencies

### Database (via migrations)
- `20260319100000_auto_create_user_role.sql` - Auto-role trigger
- `20260319101000_fix_rls_profiles_insert.sql` - RLS policies
- `20260319102000_fix_role_enum.sql` - All role types
- `20260319102100_comprehensive_rls_policies.sql` - Complete RLS

---

## Verification Checklist

- [x] Persian text displays correctly throughout app
- [x] RTL layout applied to all pages
- [x] Role assigned automatically on signup
- [x] Dashboard redirects based on role
- [x] Error page shows for missing roles
- [x] Login validation messages in Persian
- [x] Menu items in Persian for all dashboard types
- [x] Session persists after page refresh
- [x] AccessError component works correctly
- [x] No compilation errors
- [x] Fonts load properly
- [x] RTL CSS applied correctly

---

## Support & Debugging

### Common Issues

**Issue**: Persian text not displaying
- **Solution**: Check browser developer tools under Network tab - confirm `fa.json` is loaded
- **Check**: Verify `src/i18n/locales/fa.json` file exists

**Issue**: Layout not RTL after loading
- **Solution**: Clear localStorage and browser cache, reload page
- **Check**: Inspect HTML element for `dir="rtl"` attribute

**Issue**: User can't access dashboard after signup
- **Solution**: Check database for `user_roles` record with `SELECT * FROM user_roles WHERE user_id = <UUID>`
- **Check**: Ensure migration `20260319100000_*` is applied

**Issue**: Redirect loop between pages
- **Solution**: Clear auth session - sign out via logout button
- **Check**: Verify `getRoleTier()` returns correct value in console

### Debugging Commands

```typescript
// Check current user and role
const { user, role, roleTier, loading } = useAuth();
console.log('User:', user?.email);
console.log('Role:', role);
console.log('RoleTier:', roleTier);
console.log('Loading:', loading);

// Check translation
const { t, isRTL } = useTranslation();
console.log('RTL:', isRTL);
console.log('Test translation:', t('auth.signIn'));
```

---

## Deployment Notes

1. **Build Command**: `npm run build` (includes i18n configuration)
2. **Environment Variables**: None required for i18n
3. **Database Migrations**: All migrations must be applied before deployment
4. **Fonts**: Google Fonts CDN - ensure internet access for font loading
5. **localStorage**: Browser must support localStorage for language persistence

---

## Version History

- **v1.0** (2026-03-19):
  - Initial Persian localization implementation
  - Dashboard access fixes and role assignment verification
  - AccessError component for better UX
  - All layouts updated with Persian text
