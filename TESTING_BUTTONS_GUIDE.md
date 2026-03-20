# Testing Guide: Fully Functional Buttons & Workflows

## Quick Start Testing

### 1. Local Development Setup
```bash
npm run dev
# Server starts at http://localhost:5173
```

### 2. Demo Mode Login
**Credentials** (any of these work):
- Email: `demo@school.com` Password: `demo123`
- Email: `admin@district.com` Password: `demo123`
- Email: `admin@province.com` Password: `demo123`
- Email: `admin@ministry.com` Password: `demo123`

Or use **Quick Enter** feature for instant access to any role.

---

## Test Scenarios

### 🏫 **School Teacher Workflow**

**Objective**: Test complete submission workflow

**Steps**:
1. Login as `school_admin` or `teacher`
2. Navigate to: `/school` (dashboard)
3. View **Quick Actions cards**:
   - "ارسال آمار" card
   - "ارسال گزارش" card  
   - "ارسال فرم" card

**Expected Results**:
- ✅ Cards are clickable
- ✅ Hover effect appears (border color changes)
- ✅ Click navigates to correct page

---

### 📊 **Statistics Submission Test**

**URL**: `/school/statistics`

**Test File Upload**:
1. Open the form
2. Leave fields empty
3. Click "ارسال آمار" button
4. **Expected**: Error summary appears at top showing required fields
5. Fill "کل دانش‌آموزان" field with invalid value (e.g., "-100")
6. **Expected**: Error shows "این فیلد باید بین 0 تا 10000 باشد"
7. Fill all required fields with valid data:
   - Academic Year: `1403`
   - Total Students: `250`
   - Teachers: `12`
   - Attendance Rate: `85`
8. Click "ارسال آمار"
9. **Expected Results**:
   - ✅ Loading spinner appears on button
   - ✅ Button becomes disabled
   - ✅ After 2-3 seconds, success page appears
   - ✅ Green checkmark icon visible
   - ✅ Success toast notification
   - ✅ "ارسال اطلاعات دیگری" button displayed

---

### 📄 **File Upload Test**

**URL**: `/school/reports`

**Test 1 - Valid File Upload**:
1. Open form
2. Drag PDF file to upload area
   - **Expected**: Area highlights with blue border
3. File appears in upload box
4. Watch progress bar fill from 0-100%
5. See "آپلود مکمل" message
6. Fill title: "گزارش حضور و غیاب"
7. Click "ارسال گزارش"
8. **Expected**: Success confirmation

**Test 2 - Invalid File**:
1. Try to upload .exe file
2. **Expected**: Red error message "فقط فرمت‌های .pdf, .doc, .docx, .xls, .xlsx پشتیبانی می‌شوند"
3. Try to upload 50MB file
4. **Expected**: Red error message "اندازه فایل باید کمتر از 10MB باشد"

**Test 3 - Drag & Drop**:
1. Drag GIF file to upload area
2. **Expected**: File rejected with format error
3. Drag valid PDF file
4. **Expected**: File accepted, progress shows upload

---

### 📝 **Form Submission Test**

**URL**: `/school/forms`

**Test 1 - Validation**:
1. Click submit without filling fields
2. **Expected**: Error summary shows "نوع فرم الزامی است"
3. Select form type: "درخواست منابع"
4. Click submit again
5. **Expected**: New errors for title and details
6. Fill title: "نیاز به پروژکتور"
7. Fill details: "برای کلاس سوم الف"
8. click submit
9. **Expected**: Success confirmation

**Test 2 - Error Recovery**:
1. Fill form and submit
2. See error toast
3. Close toast (X button)
4. Modify data
5. Submit again
6. **Expected**: Success on retry

---

### ✅ **District Approval Workflow**

**Login as**: `district_admin`

**URL**: `/district`

**Dashboard Test**:
1. View stats cards:
   - تعداد مکاتب (Schools)
   - تعداد ارسال‌ها (Submissions)
   - تأیید شده (Approved)
   - الزام توجه (Pending)
2. **Expected**: Numbers display correctly
3. Click "مشاهده ارسال‌ها" link
4. **Expected**: Redirect to `/admin/submissions`

**Approval Test** (on Submissions page):
1. See three tabs: آمار, گزارش‌ها, فرم‌ها
2. Each tab shows submission cards
3. Find a card with status "در انتظار بررسی"
4. Click "تایید" button
5. **Expected**: 
   - Button becomes disabled
   - Status changes to "تأیید شده"
   - Green checkmark appears
   - Toast: "ارسال با موفقیت تأیید شد"
6. Find another pending submission
7. Click "رد" button
8. **Expected**: Dialog appears asking for rejection reason
9. Type: "اطلاعات ناقص است"
10. Click "تأیید"
11. **Expected**:
    - Status changes to "رد شده"
    - Reason is stored and visible
    - Toast: "ارسال با موفقیت رد شد"

---

### 🏛️ **Province Analytics Test**

**Login as**: `province_admin`

**URL**: `/province`

**Test**:
1. View statistics cards:
   - تعداد اناحیه (Districts)
   - تعداد مکاتب (Schools)  
   - کل ارسال‌ها (Submissions)
   - در انتظار (Pending)
   - تأیید شده (Approved)
   - کل دانش‌آموزان (Students)
2. **Expected**: All cards show numbers
3. See district summary table at bottom
4. **Expected**: District names with stats shown

---

### 🌐 **Ministry National Dashboard Test**

**Login as**: `ministry_admin`

**URL**: `/ministry`

**Test**:
1. View national statistics cards:
   - ولایات (Provinces): 34
   - مکاتب (Schools): Number displayed
   - دانش‌آموزان (Students): K format (e.g., 925K)
   - معلمان (Teachers): Number displayed
   - ارسال‌ها (Submissions): Total count
   - این ماه (This Month): Current month submissions
   - نسبت (Ratio): Student/Teacher ratio
   - گزارش (Report): Export button
2. **Expected**: All values display correctly
3. Click "نمایش" button next to reports
4. **Expected**: Can export data or view more details

---

## 🎬 **Animation & UX Tests**

### Loading Indicators
- [ ] Submit button shows spinner while loading
- [ ] Buttons become disabled during action
- [ ] Text changes to "درحال..." while processing
- [ ] Modal buttons show loading state

### Error Messages
- [ ] Red color for errors
- [ ] Error icons displayed
- [ ] Toast notifications appear/dismiss
- [ ] Error summary shows all issues

### Success Feedback
- [ ] Green checkmark appears
- [ ] Success toast shows
- [ ] Auto-dismisses after 3 seconds
- [ ] 'Continue' button allows next action

### Hover States
- [ ] Cards have hover effect
- [ ] Buttons change color on hover
- [ ] Cursor changes to pointer
- [ ] Visual feedback on interactions

---

## 📱 **Mobile Responsiveness Tests**

### Tablet (768px width)
- [ ] Cards stack to 2 columns
- [ ] Buttons are touch-friendly (44px+ height)
- [ ] Text is readable without zoom
- [ ] Form inputs are large enough

### Mobile (375px width)
- [ ] Cards stack to 1 column
- [ ] Buttons fill width
- [ ] No horizontal scroll
- [ ] Tabs show icons only on small screens
- [ ] File upload is mobile-friendly

---

## 🔐 **Permission Tests**

### Test Role-Based Visibility

**Teacher Role**:
- [ ] Cannot see approval buttons
- [ ] Cannot access `/admin/submissions`
- [ ] Can submit forms/reports

**District Admin**:
- [ ] Can see approval buttons
- [ ] Can access `/admin/submissions`
- [ ] Cannot see ministry dashboard

**Province Admin**:
- [ ] Can see all district submissions
- [ ] Can approve/reject across districts
- [ ] Cannot manage school registry

**Ministry Admin**:
- [ ] Full access to all features
- [ ] Can see national analytics
- [ ] Can manage all submissions

---

## ⚠️ **Error Handling Tests**

### Network Errors
1. Open DevTools Network tab
2. Throttle to offline
3. Try to submit form
4. **Expected**: Error toast with "خطا در ارسال"
5. Change back to online
6. **Expected**: Retry mechanism works

### Validation Errors
1. Submit form with blank required field
2. **Expected**: Error message immediately
3. Fill field
4. **Expected**: Error clears
5. Leave valid data
6. **Expected**: No error

---

## ✨ **Performance Tests**

### Page Load Times
- [ ] Dashboard loads in < 2 seconds
- [ ] Forms load in < 1 second
- [ ] Submissions page loads in < 3 seconds

### Form Responsiveness
- [ ] Typing in inputs is instant
- [ ] Validation debounces properly
- [ ] No lag on large file upload

---

## 📋 **Checklist for Sign-Off**

### Core Functionality
- [ ] All submit buttons work
- [ ] All approval buttons work
- [ ] All navigation buttons work
- [ ] Forms validate correctly

### User Feedback
- [ ] Loading states are visible
- [ ] Success messages appear
- [ ] Error messages are clear
- [ ] Toasts dismiss appropriately

### Role-Based Access
- [ ] Teachers see teacher options
- [ ] Admins see admin options
- [ ] Unauthorized access is blocked

### Mobile Experience
- [ ] Works on iPhone
- [ ] Works on Android
- [ ] Touch targets are adequate
- [ ] Text is readable

### Error Handling
- [ ] Network errors handled gracefully
- [ ] Validation errors shown clearly
- [ ] Retry mechanisms work
- [ ] Error boundaries catch crashes

---

## 🚀 **Production Readiness**

**Before deploying to production, verify**:
- [ ] All TypeScript errors resolved
- [ ] No console warnings
- [ ] All tests passing
- [ ] Performance optimized
- [ ] Security checks passed
- [ ] Accessibility audit complete
- [ ] Cross-browser tested
- [ ] Mobile tested on real devices

---

## 💡 **Tips for Testing**

1. **Use Browser DevTools**:
   - Network tab to see API calls
   - Console for error messages
   - Performance tab for speed

2. **Test Different Screen Sizes**:
   - Desktop (1920x1080)
   - Tablet (768x1024)
   - Mobile (375x667)

3. **Test Different Browsers**:
   - Chrome
   - Firefox
   - Safari
   - Edge

4. **Test With Different Roles**:
   - Use demo mode to switch roles
   - Test each workflow completely
   - Verify permissions are enforced

---

## Support & Debugging

If buttons don't work:
1. Check browser console (F12 → Console)
2. Check network errors (F12 → Network)
3. Verify user is authenticated
4. Check role permissions
5. Try hard refresh (Ctrl+Shift+R)

## Contact

For issues or questions, check:
- [BUTTONS_IMPLEMENTATION_GUIDE.md](BUTTONS_IMPLEMENTATION_GUIDE.md)
- [ERROR_HANDLING_QUICK_REFERENCE.md](ERROR_HANDLING_QUICK_REFERENCE.md)
- GitHub Issues
