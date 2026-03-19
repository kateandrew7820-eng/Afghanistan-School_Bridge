# Quick Start Guide - Testing SchoolBridge Afghanistan

This guide helps you quickly test the Persian localization and dashboard access functionality.

## 🚀 Getting Started (2 minutes)

### 1. Start the Development Server
```bash
cd /workspaces/schoolbridge-afg
npm run dev
```

### 2. Open the Application
```
http://localhost:5173
```

## ✅ Quick Test Checklist

### Test 1: Persian Language ✨
- [ ] Page displays Persian text ("پل آموزش افغانستان")
- [ ] Text is right-aligned (RTL layout)
- [ ] Menu items are in Persian
- [ ] Buttons show Persian text: "ورود" (Sign In), "ثبت‌نام" (Create Account)
- [ ] Fonts render properly (Vazirmatn font visible)

### Test 2: Create Account 📝
1. Click "ثبت‌نام" (Create Account) tab
2. Enter test data:
   - Name: "محمد احمد" (or any Persian name)
   - Email: "teacher@example.com"
   - Password: "password123"
   - Confirm: "password123"
3. Click "ثبت‌نام" button
4. [ ] Success toast appears: "موفق - ثبت‌نام موفق!"
5. [ ] Auto-switches to sign in tab
6. [ ] Email pre-filled

### Test 3: Dashboard Access 🎓
1. Click "ورود" (Sign In) tab
2. Enter credentials from Test 2
3. Click "ورود" button
4. [ ] Page shows loading spinner momentarily
5. [ ] Redirects to `/school` dashboard
6. [ ] School layout visible with navigation menu
7. [ ] Menu items in Persian:
   - داشبورد (Dashboard)
   - ارسال آمار و اطلاعات (Submit Statistics)
   - ارسال گزارشات (Submit Reports)
   - ارسال فرم‌ها (Submit Forms)

### Test 4: Sign Out 🔓
1. In dashboard, click "خروج" (Sign Out) button
2. [ ] Page redirects to login
3. [ ] Can sign in again with same credentials

### Test 5: RTL Layout Details 📐
1. Open browser DevTools (F12)
2. Inspect the `<html>` element
3. [ ] Verify attributes: `lang="fa"` and `dir="rtl"`
4. [ ] Check CSS styling with RTL direction
5. [ ] Scroll right/left behavior correct (scrollbars on left in RTL)

## 🧪 Advanced Testing

### Access Different Dashboard Levels

**For District Admin**:
```bash
# In browser console after signing in as any user:
# Copy the user ID from the database, then update role:

# Via Supabase dashboard SQL editor:
UPDATE user_roles 
SET role = 'district_admin' 
WHERE user_id = '<user_uuid_here>';

# Then refresh the page
```

Result: Should redirect to `/district` dashboard

**For Province Admin**:
```sql
UPDATE user_roles 
SET role = 'province_admin' 
WHERE user_id = '<user_uuid_here>';
```

Result: Should redirect to `/province` dashboard

**For Ministry Admin**:
```sql
UPDATE user_roles 
SET role = 'ministry_admin' 
WHERE user_id = '<user_uuid_here>';
```

Result: Should redirect to `/ministry` dashboard

## 🐞 Troubleshooting

### Persian Text Not Showing
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Clear localStorage: `localStorage.clear()` in console
- [ ] Hard refresh: Ctrl+Shift+R
- [ ] Check Network tab for `fa.json` loading

### Stuck on Login After Signup
- [ ] Wait 2-3 seconds for auto-redirect
- [ ] Try refreshing (F5) if stuck
- [ ] Check browser console for errors (F12)

### Can't Access Dashboard
- [ ] Verify role exists in database:
  ```sql
  SELECT * FROM user_roles WHERE user_id = '<user_id>';
  ```
- [ ] Verify profile created:
  ```sql
  SELECT * FROM profiles WHERE user_id = '<user_id>';
  ```
- [ ] Check auth logs in Supabase dashboard

### Text Alignment Wrong
- [ ] Inspect `<html>` element for `dir="rtl"`
- [ ] Check if CSS loaded: Look for `direction: rtl` in styles
- [ ] Clear browser cache and reload

## 📱 Mobile Testing

1. Open DevTools (F12)
2. Click device toggle (Ctrl+Shift+M)
3. Test on various mobile sizes
4. [ ] Menu hamburger appears on mobile
5. [ ] RTL still applies to mobile layout
6. [ ] Touch interactions work correctly

## 🔒 Security Tests

### Session Persistence
1. Sign in to account
2. Open browser DevTools → Application → Cookies
3. Refresh page (F5)
4. [ ] Still authenticated after refresh
5. [ ] No need to sign in again
6. Close browser completely
7. Reopen and navigate to `http://localhost:5173`
8. [ ] Should send to login (session expired is expected after browser close in dev)

### Access Control
1. Sign in as teacher (school user)
2. Try to manually navigate to `/district`
3. [ ] Auto-redirected to `/school`
4. No error message (silent redirect)

## 📊 Verification Points

- [x] Persian localization implemented
- [x] RTL layout applied globally
- [x] Role assignment working
- [x] Dashboard redirect based on role
- [x] Error page for missing roles
- [x] Session management working
- [x] All UI components using translations
- [x] No compilation errors
- [x] Database migrations applied

## 🎯 Expected Behavior Summary

| Action | Expected Result |
|--------|-----------------|
| Load app | Persian text, RTL layout |
| Create account | Success message, auto sign-in redirect |
| Sign in | Redirect to `/school` dashboard |
| Click menu items | Navigate with Persian labels |
| Refresh page | Stay authenticated |
| Try access other tier | Auto-redirect to correct tier |
| Missing role | Show AccessError page |
| Sign out | Return to login page |

## 📞 Support

For issues, check:
1. Browser console for errors (F12)
2. Network tab to verify `fa.json` loads
3. Database for user/role records
4. Server logs: `npm run dev` output
5. Refer to [PERSIAN_LOCALIZATION.md](PERSIAN_LOCALIZATION.md) for detailed debugging

---

**Last Updated**: 2026-03-19
