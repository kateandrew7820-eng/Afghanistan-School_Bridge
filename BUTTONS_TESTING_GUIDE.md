# ⚡ Quick Start: Testing All Buttons & Functions

## 🚀 Get Started in 2 Minutes

### Step 1: Start Dev Server
```bash
npm run dev
```

### Step 2: Open in Browser
```
http://localhost:8080
```

---

## 🎮 Three Ways to Test

### **Option A: Demo Mode (Easiest)**
1. Click "حالت نمایشی" button on home page
2. Select any role (Teacher, Principal, District Admin, etc.)
3. You're now logged in as that role!
4. Test any button → Works without database

### **Option B: Test Buttons Page (Best for Testing)**
1. Go to http://localhost:8080/test-buttons
2. See all buttons for all roles
3. Click any button → Simulates action with loading/success
4. Perfect for testing UX without navigating

### **Option C: Full App Testing (With Real Database)**
1. Go to http://localhost:8080/login
2. Sign up or login with real credentials
3. Test actual database submissions
4. See real error handling

---

## 📋 What Each Button Does

### In Demo Mode

✅ **Navigation Buttons**
- Click → Goes to that page
- Page loads normally
- Can interact with forms

✅ **Simulation Buttons** (marked with 🧪)
- Click → Shows loading spinner (500-2000ms)
- Then shows success or error message
- Perfect for testing UX

### In Test Buttons Page (`/test-buttons`)

All buttons are simulations with visual feedback:
- 🔄 Loading → Spinner appears
- ✅ Success → Green checkmark + message in Persian
- ❌ Error → Red alert + error message
- Auto-resets after 2-3 seconds

---

## 📱 Try These Scenarios

### Scenario 1: Submit Statistics (School Role)
```
1. Go to /demo
2. Click "معلم" (Teacher)
3. Click "ارسال آمار" (Submit Statistics)
4. Fill in numbers:
   - Year: 1402
   - Total: 100
   - Male: 55
   - Female: 45
   - Teachers: 10
   - Attendance: 92
5. Click "ارسال"
6. See success message!
```

### Scenario 2: Test All Buttons (Quick)
```
1. Go to http://localhost:8080/test-buttons
2. Select role dropdown to see different buttons
3. Click "🧪 آزمایش ارسال" (Test Submission)
4. Watch loading spinner, then success message
```

### Scenario 3: Upload Report (School Role)
```
1. Go to /demo → Select role
2. Click "ارسال گزارش" (Submit Reports)
3. Enter title: "اختبار گزارش"
4. Drag/drop or click to upload any file
   (PDF, DOC, DOCX, XLS, XLSX - max 10MB)
5. Click "ارسال گزارش"
6. See success message!
```

---

## ✨ Visual Indicators

### Demo Mode
- See blue banner: "🎨 حالت نمایشی"
- Means: No real data saved ✓ (That's correct!)

### Loading
- See spinner icon
- Button is disabled
- Says "در حال ارسال..."
- Wait 500-2000ms

### Success
- See green checkmark ✅
- Toast message appears
- Success screen shown
- "ارسال با موفقیت انجام شد"

### Error
- See red alert ⚠️
- Error message in Persian
- Can retry

---

## 🔧 For Developers

### Add Mock Submission to a New Form

```typescript
import { useMockSubmission } from '@/hooks/useMockSubmission';

export default function MyForm() {
  const { isDemoMode } = useAuth();
  const { submitForm: mockSubmit } = useMockSubmission();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isDemoMode) {
      // Use mock for testing
      const result = await mockSubmit(formData);
      if (result.success) {
        showSuccess(); // Show success screen
      }
    } else {
      // Use real database
      const { error } = await supabase.from('table').insert(...);
      if (!error) showSuccess();
    }
  };
}
```

### Test Submission State Machine
```
INITIAL → SUBMITTING → SUCCESS → RESET
              ↓
            ERROR → RETRY
```

---

## 🐛 Troubleshooting

### Button Not Working?
- ✅ Check if you're in demo mode (blue banner)
- ✅ Check if form is filled correctly
- ✅ Look for validation errors (red text)
- ✅ Check browser console for errors

### Form Won't Submit?
- ✅ Make sure all required fields are filled
- ✅ Check that numbers are valid (not negative)
- ✅ For file uploads, check file is under 10MB
- ✅ Refresh page and try again

### No Success Message?
- ✅ Wait 2-3 seconds (simulation might be slow)
- ✅ Check browser notifications (top right)
- ✅ Look at success screen (should auto-appear)

### Database Not Saving?
- ⚠️ This is EXPECTED in demo mode!
- ✅ Switch from demo to real login to save to DB
- ✅ Real submissions require actual database connection

---

## 📊 What Gets Tested

### ✅ Form Validation
- Required fields
- Number ranges (0-100)
- File sizes
- File types
- Field matching

### ✅ UX Feedback
- Loading spinners
- Success messages in Persian
- Error messages in Persian
- Auto-reset after success
- Disabled buttons during loading

### ✅ Role-Based Access
- Different buttons per role
- Can't access wrong role dashboard
- Navigation works correctly

### ✅ Demo Mode Safety
- No database writes in demo
- Data not stored
- Clear warning displayed
- Functions still work

---

## 🎯 Test Checklist

Before deploying, verify:

- [ ] Can submit statistics form
- [ ] Can upload report file
- [ ] Can fill all form fields
- [ ] Validation errors show correctly
- [ ] Success messages appear in Persian
- [ ] Error messages appear in Persian
- [ ] Loading spinners appear during submit
- [ ] Demo mode warning shows
- [ ] All role dashboards accessible
- [ ] Test buttons page works at /test-buttons
- [ ] No console errors in dev tools
- [ ] Mobile responsive (try on phone)

---

## 📞 Common Questions

**Q: Is my data saved in demo mode?**
A: No! Demo mode is for testing. Data is not saved. See the blue warning banner.

**Q: How do I save real data?**
A: Log out of demo mode and use real login (no password needed if signup enabled).

**Q: Why is loading slow?**
A: Simulated network delay (500-2000ms) for testing. Real servers will be similar speed.

**Q: Can I test file uploads in demo?**
A: Yes! File upload UI works, but file not actually stored (demo mode).

**Q: What files can I upload?**
A: PDF, DOC, DOCX, XLS, XLSX - Maximum 10MB each

**Q: How do I see different roles?**
A: Go to `/demo` and select different role. Or use test buttons page.

**Q: Are buttons working correctly if I see errors?**
A: If error message appears in Persian, YES! The system is working. Try again.

---

## 🚀 Next Steps

After testing:
1. ✅ All buttons working → Ready to deploy
2. ✅ All UX feedback working → Ready for users
3. ✅ Demo mode working → Great for onboarding
4. ✅ Error handling working → Professional experience

## Production Checklist
- [ ] Deploy to production server
- [ ] Test with real database
- [ ] Setup email notifications  
- [ ] Configure file storage buckets
- [ ] Setup monitoring/logging
- [ ] Train admin users
- [ ] Create user documentation
- [ ] Monitor first week of usage

---

Made with ❤️ for the Afghan Education System
Last Updated: March 20, 2026
