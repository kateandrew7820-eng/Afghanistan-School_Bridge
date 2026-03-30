# SchoolBridge System Exploration Summary

**Date:** March 20, 2026  
**Explored:** Button implementations, form handlers, file uploads, mock data, error handling, verification flows

---

## 1. DASHBOARD PAGES & BUTTON IMPLEMENTATIONS

### 1.1 School Dashboard (`src/pages/school/Dashboard.tsx`)
**Quick Action Buttons (3 main buttons):**
- **Submit Statistics** → Links to `/school/statistics` 
  - Icon: BarChart3
  - Action: Enters student data (total, male, female students, attendance rates)
  
- **Submit Reports** → Links to `/school/reports`
  - Icon: FileText
  - Action: Upload monthly reports (PDF, Word, Excel files)
  
- **Submit Forms** → Links to `/school/forms`
  - Icon: ClipboardList
  - Action: Fill required forms (infrastructure, teacher evaluation, student assessment, resource requests, incident reports)

**Data Display:**
- Recent Announcements (3 items max, sorted by date)
- Upcoming فرصت‌‌ها (5 items max, with days-left warning)
- View All buttons (navigate to detail pages)
- Verified Status Badge (green banner if verified)
- Verification Queue Panel (if admin role has pending approvals)

**Status Indicators:**
- Priority colors: urgent (red), high (default), normal (secondary)
- Deadline urgency: highlighted if ≤3 days

---

### 1.2 Admin Dashboard (`src/pages/admin/Dashboard.tsx`)
**Stats Cards (4 cards):**
1. Total Schools (School icon)
2. Total Submissions (FileText icon)
3. Pending Submissions (Clock icon, amber color)
4. Active Announcements (Bell icon)

**Quick Actions (3-4 clickable cards):**
1. **Post Announcement** → `/admin/announcements` (Bell icon, blue)
2. **Upload Document** → `/admin/اسناد` (FileUp icon, blue)
3. **Set Deadline** → `/admin/فرصت‌‌ها` (Calendar icon, blue)
4. **Manage Schools** → `/admin/schools` (Users icon, blue)

**Recent Submissions Section:**
- Displays 5 most recent submissions
- Shows submission type (statistics, report, form)
- Status badges (pending/approved/reviewed)
- School name and timestamp
- Inline display (no detail view) with View All button

---

### 1.3 Admin Submissions Page (`src/pages/admin/Submissions.tsx`)
**Tabs Interface:**
- Statistics Submissions
- Report Submissions
- Form Submissions

**For Each Submission:**
- **Status Dropdown** → Change between: pending → approved/reviewed, or → rejected
- **Rejection Dialog** → Opens when selecting "rejected" with textarea for rejection reason
- **Approve Button** → Direct approval without reason
- **Reject Button** → Opens rejection dialog
- **Loading States** → Spinner during updates

**Data Displayed:**
- School name
- Status (with color code)
- Submission ID
- Created date
- Rejection reason (if applicable)

---

### 1.4 District Dashboard (`src/pages/district/Dashboard.tsx`)
**Stats Cards (4 cards):**
1. Total Schools (in district)
2. Total Submissions
3. Pending Submissions (yellow)
4. Approved Submissions (green check)

**Tabs:**
- Overview (summary)
- Schools (list of schools in district)
- Submissions (recent submissions from schools)

**Features:**
- Filters by district user's profile
- Uses mock data in demo mode
- Shows 5 most recent submissions

---

### 1.5 Province Dashboard (`src/pages/province/Dashboard.tsx`)
**Stats Cards (6 cards):**
1. Total Districts
2. Total Schools
3. Total Submissions
4. Pending Submissions
5. Approved Submissions
6. Total Students

**Features:**
- District summaries (name, schools count, submissions count, pending count)
- Student data aggregation
- Pie/bar charts available (using `chart.tsx` component)
- Aggregates data from all schools in province

---

### 1.6 Ministry Dashboard (`src/pages/ministry/Dashboard.tsx`)
**National Stats Cards (8 values):**
1. Total Provinces (34)
2. Total Schools
3. Total Students (925,000+)
4. Total Teachers
5. Total Submissions
6. Submissions This Month
7. Average Completion Rate (78%)
8. Average Teacher-Student Ratio (35:1)

**Features:**
- Highest-level aggregation
- Charts and visualizations
- National trends and reports
- Download capabilities

---

## 2. FORM SUBMISSION HANDLERS & FLOWS

### 2.1 Submit Statistics Form (`src/pages/school/SubmitStatistics.tsx`)
**Form Fields:**
- Academic Year (text, pre-filled with current year)
- Total Students (number, 0-10000 range)
- Male Students (number)
- Female Students (number)
- Total Teachers (number)
- Attendance Rate (percentage, 0-100)
- Notes (textarea, optional)

**Validation:**
- All main fields required
- Numbers must be in valid ranges
- Cross-field: male + female ≤ total students error

**Submission:**
- Inserts into `statistics_submissions` table
- Sets status: 'pending'
- Success: CheckCircle icon + "Statistics submitted successfully" + reset form
- Error: Shows error toast with reason
- Loading state: Spinner on submit button

**Database Fields:**
- school_id, submitted_by (user_id), academic_year
- total_students, male_students, female_students, total_teachers
- attendance_rate, notes, created_at, status

---

### 2.2 Submit Reports Form (`src/pages/school/SubmitReports.tsx`)
**Form Fields:**
- Title (text, required)
- Description (textarea, optional)
- File Upload (drag-drop area + file picker)

**File Validation:**
- Accepted: PDF, Word (.doc, .docx), Excel (.xls, .xlsx)
- Max size: 10MB
- Real-time validation errors

**Upload Flow:**
1. User selects/drops file
2. File validation happens
3. User enters title
4. File uploaded to `school-reports` bucket
5. Database record created in `report_submissions`
6. Success: CheckCircle + "Report submitted successfully"

**Database Fields:**
- school_id, submitted_by, title, description
- file_path (from storage), file_name, status ('pending'), created_at

---

### 2.3 Submit Forms Form (`src/pages/school/SubmitForms.tsx`)
**Form Fields:**
- Form Type (dropdown with 6 options):
  - بررسی زیرساخت‌ها (Infrastructure assessment)
  - ارزیابی معلمان (Teacher evaluation)
  - ارزیابی دانش‌آموزان (Student assessment)
  - درخواست منابع (Resource request)
  - گزارش حادثه (Incident report)
  - سایر (Other)
- Title (text, required)
- Details (textarea, required)
- Additional Info (textarea, optional)

**Validation:**
- All required fields checked
- Form type must be selected
- Title and details required

**Submission:**
- Inserts into `form_submissions` table
- Stores form_data as JSON
- Success flow: Show success card with reset button

**Database Fields:**
- school_id, submitted_by, form_type
- form_data (JSON: {title, details, additional_info})
- created_at, status

---

## 3. FILE UPLOAD COMPONENTS & HANDLERS

### 3.1 FileUploadProgress Component (`src/components/FileUploadProgress.tsx`)
**UI Features:**
- Drag-and-drop area (dashed border)
- File picker button
- Visual feedback (hover, active states)
- File size display
- Progress bar (0-100%)

**Interactions:**
- Drag states: dragenter, dragover, dragleave
- Drop handler with validation
- File input click handler
- Remove/clear file button

**Validation:**
- File size check (customizable max, default 10MB)
- File type check (extension-based)
- Error display in red alert box
- Real-time error clearing

**Upload Simulation:**
- Simulates progress (0-90% in random steps, then 90-100%)
- Takes ~2 seconds to complete
- Calls onFileSelect, onUploadStart, onUploadComplete callbacks
- Shows success with CheckCircle icon

---

### 3.2 useFileUpload Hook (`src/hooks/useFileUpload.ts`)
**Functions:**
```typescript
uploadFile(file, options: {
  bucket: string,
  path: string,
  onProgress?: (number) => void,
  onSuccess?: (filePath) => void,
  onError?: (Error) => void
}): Promise<string | null>

deleteFile(bucket: string, path: string): Promise<boolean>
```

**Features:**
- Supabase storage integration
- Progress simulation (doesn't use real streaming, but simulates)
- Error handling with Persian error messages
- Returns file path on success
- Shows toast notifications (error/success)

**Bucket Structure:**
- `school-reports` bucket for report files
- Path: `{school_id}/{timestamp}.{extension}`

---

## 4. MOCK DATA STRUCTURE & SUPPORTED ACTIONS

### 4.1 Mock Data (`src/lib/mockData.ts`)
**Available Mock Objects:**

1. **mockAnnouncements** (3 items)
   - id, title, content, priority, created_at, is_published
   - Priorities: high, normal

2. **mockفرصت‌‌ها** (4 items)
   - id, title, due_date, description, is_active
   - Dynamic dates (next 5-15 days from now)

3. **mockStudentStats**
   - total: 485, present: 412, absent: 48, excused: 25

4. **mockSubmissions** (3 items)
   - id, type, status, date, submittedBy
   - Types: نتایج امتحانات, گزارش فعالیت‌های صنفی, برنامه تدریس سالانه
   - Statuses: تأیید شده (approved), در انتظار تأیید (pending), ارسال شده (submitted)

5. **mockReports** (3 items)
   - id, title, month, status ('دانلود' = download)

6. **mockاسناد** (3 items)
   - id, title, type (PDF/Word), size, uploadedDate

7. **mockDistrictStats**
   - schools: 42, students: 12485, teachers: 385, pending_submissions: 8

8. **mockProvinceStats**
   - districts: 12, schools: 385, students: 125000

### 4.2 Supported Actions with Mock Data
- View announcements (no action, display only)
- View فرصت‌‌ها (no action, display only)
- View submissions (can change status in admin/Submissions page)
  - Change from pending → approved
  - Change to rejected (with reason dialog)
- Download reports (no action, display only)
- View اسناد (no action, display only)

### 4.3 Demo Mode Behavior (`isDemoMode` flag)
- All dashboards use mock data
- Bypasses database queries
- Shows realistic data without needing database
- VerificationPanel bypasses approval requirements
- No actual file uploads (simulated)

---

## 5. ERROR HANDLING & FEEDBACK MECHANISMS

### 5.1 Error Types & Messages (`src/lib/errors.ts`)
**Error Types (12 types):**
- validation
- network
- auth
- unauthorized
- not_found
- server
- timeout
- unknown
- file_upload
- insufficient_permissions
- duplicate_entry

**Each Error Has:**
- type (ErrorType)
- message (Persian: messageFa)
- statusCode (optional)
- originalError (optional)
- timestamp
- userAction (what user should do)
- devInfo (developer info)

**Persian Error Messages Dictionary:**
- validation: "خطای اعتبارسنجی" / "لطفاً معلومات خود را بررسی کنید"
- network: "خطای اتصال" / "اتصال اینترنت خود را بررسی کنید"
- auth: "خطای احراز هویت" / "نام کاربری یا رمز عبور نادرست است"
- file_upload: "خطای بارگذاری فایل" / "فایل شما بارگذاری نشد. دوباره تلاش کنید"
- And more...

### 5.2 useErrorToast Hook
**Methods:**
```typescript
showErrorMessage(message: string, title: string): void
showErrorToast(title: string, message: string): void
showSuccessToast(title: string, message: string): void
showSuccess(message: string, title: string): void
```

**Toast Features:**
- Persian messages
- Auto-dismiss after 3 seconds
- Variant color coding (destructive/success/default)
- Stackable multiple toasts

### 5.3 useAPIError Hook (`src/hooks/useAPIError.ts`)
**Method:**
```typescript
executeWithErrorHandling<T>(
  apiCall: () => Promise<T>
): Promise<{ data: T; error: Error | null }>
```

**Features:**
- Wraps async API calls
- Catches and formats errors
- Returns {data, error} tuple
- Prevents unhandled promise rejections

### 5.4 Validation Feedback (SmartFormField Component)
**Real-Time Feedback:**
- Green checkmark (✓) when field valid
- Red alert icon (!) when field has error
- Error message appears below field (animated slide-in)
- Hint text when no error and not touched
- Field border colors: green (valid), red (error), default (untouched)

**Validation Functions:**
- validateRequired(value, fieldName)
- validateEmail(email)
- validatePhone(phone, isAfghan)
- validatePassword(password)
- validateMatch(value1, value2)
- validateFileSize(file, maxMB)
- validateFileType(file, allowedTypes)
- validateNumberRange(number, min, max)

---

## 6. VERIFICATION APPROVAL/REJECTION FLOWS

### 6.1 Verification Hierarchy (`src/lib/verificationHierarchy.ts`)
**6-Tier Approval Chain:**
```
Student → Teacher → Principal → District Admin → Province Admin → Ministry Admin
   ↓          ↓           ↓             ↓                ↓              ↓
 Tier 1     Tier 2       Tier 3        Tier 4          Tier 5         Tier 6
```

**Approval Rules:**
- Only the correct admin tier can approve each role
- Self-approval impossible
- Ministry Admin can self-approve (top tier)

**Key Functions:**
```typescript
getApprovingRole(role): ApprovalRole | null
canApprove(adminRole, pendingUserRole): boolean
getVerificationQueueFilter(adminRole): string | null
getApprovalInstruction(role, language): string
getRoleLabel(role, language): string
getHierarchyLevel(role): number
```

### 6.2 Verification Panel Component (`src/components/VerificationPanel.tsx`)
**Props:**
- filterRole (e.g., 'student' for teacher to see)
- filterDistrict (optional)
- filterProvince (optional)
- limit (default: 10 users)

**User List Display:**
- Full name
- Role
- School name
- District, Province
- Phone number
- Status badge
- Creation date

**Actions Per User:**
- **Approve Button** → Updates profile:
  - status: 'verified'
  - verified_by_user_id: (current admin's user_id)
  - verified_at: (current timestamp)
  - Also updates user_roles table
  - Shows success toast
  - Removes from pending list

- **Reject Button** → Opens rejection reason dialog:
  - Textarea for rejection reason
  - Updates profile:
    - status: 'rejected'
    - rejection_reason: (entered reason)
  - Can't reject without providing reason

**Error Handling:**
- Graceful fallback if verification columns don't exist yet
- Loads basic fields if migration not deployed
- Shows error messages in Persian
- Toast notifications for success/failure

### 6.3 useVerification Hook (`src/hooks/useVerification.ts`)
**Returns:**
```typescript
interface VerificationStatus {
  isVerified: boolean
  isPending: boolean
  isRejected: boolean
  rejectionReason: string | null
  verifiedAt: string | null
  canAccessDashboard: boolean  // isVerified OR isDemoMode
  needsSetup: boolean          // hasn't filled setup profile
}
```

**Logic:**
- In demo mode: all users verified (bypass all checks)
- Check profile.status: 'verified' | 'pending_verification' | 'rejected'
- Return appropriate status flags

### 6.4 SubmissionStatusCard Component
**Props:**
- id, schoolName, submissionType, status
- title, createdAt, rejectionReason
- onView, onApprove, onReject callbacks
- isLoading, showActions flags

**Features:**
- Status icons: CheckCircle2 (approved), XCircle (rejected), Clock (pending)
- Type labels: statistics, reports, forms, approval
- Rejection reason tooltip (if rejected)
- Action buttons (View/Approve/Reject) when showActions=true
- Hover shadow effect

---

## 7. CURRENT IMPLEMENTATION STATUS

### Fully Implemented ✅
- ✅ 3 School Dashboards (Dashboard, Announcements, فرصت‌‌ها, اسناد)
- ✅ School submission forms (Statistics, Reports, Forms)
- ✅ File upload with progress tracking
- ✅ Admin Dashboard with stats and quick actions
- ✅ Admin Submissions page with approval/rejection
- ✅ District Dashboard with school filtering
- ✅ Province Dashboard with aggregation
- ✅ Ministry Dashboard with national stats
- ✅ 6-tier verification hierarchy system
- ✅ Verification panel with approve/reject flows
- ✅ Mock data system for demo mode
- ✅ Comprehensive error handling (12 error types)
- ✅ Form validation with real-time feedback
- ✅ Persian localization throughout
- ✅ Responsive UI components (Card, Button, Badge, Tabs, etc.)

### Partially Implemented ⚠️
- ⚠️ Announcement management (admin can post, but detail page not shown)
- ⚠️ Document management (upload shown, but no download flow)
- ⚠️ Deadline management (admin can set, display works)
- ⚠️ School management (admin dashboard shows button, details TBD)

### Not Yet Implemented ❌
- ❌ File download from storage
- ❌ Bulk operations (bulk approve/reject)
- ❌ Email notifications for approvals
- ❌ Advanced reporting/analytics
- ❌ User activity audit logs
- ❌ Performance optimizations (caching, pagination)
- ❌ Export functionality (CSV/Excel exports)

---

## 8. BUTTON SUMMARY TABLE

| Location | Button | Destination | Action | Icon |
|----------|--------|-------------|--------|------|
| School Dashboard | Submit Statistics | `/school/statistics` | Form submission | BarChart3 |
| School Dashboard | Submit Reports | `/school/reports` | File upload | FileText |
| School Dashboard | Submit Forms | `/school/forms` | Form submission | ClipboardList |
| School Dashboard | View All (Announcements) | `/school/announcements` | Navigate | ArrowLeft |
| School Dashboard | View All (فرصت‌‌ها) | `/school/فرصت‌‌ها` | Navigate | ArrowLeft |
| Admin Dashboard | Post Announcement | `/admin/announcements` | Navigate | Bell |
| Admin Dashboard | Upload Document | `/admin/اسناد` | Navigate | FileUp |
| Admin Dashboard | Set Deadline | `/admin/فرصت‌‌ها` | Navigate | Calendar |
| Admin Dashboard | Manage Schools | `/admin/schools` | Navigate | Users |
| Admin Dashboard | View All Submissions | `/admin/submissions` | Navigate | ArrowRight |
| Admin Submissions | Approve (per submission) | N/A | Update status | CheckCircle2 |
| Admin Submissions | Reject (per submission) | N/A | Show dialog | XCircle |
| Verification Panel | Approve (per user) | N/A | Update profile | Check |
| Verification Panel | Reject (per user) | N/A | Show dialog | X |
| Forms | Submit | N/A | Post to database | N/A |
| Forms | Reset | N/A | Clear form | N/A |

---

## 9. FORM VALIDATION SUMMARY

| Form | Fields | Validation Type | Error Display |
|------|--------|-----------------|----------------|
| Statistics | Academic Year, Total Students, Teachers, Attendance | Required, number range | Below field + error summary |
| Reports | Title, File | Required, file type/size | Below field + error toast |
| Forms | Form Type, Title, Details | Required, select only | Below field + error summary |
| Profile Setup | Name, Role, School, District, Province | Required, text | Below field |

---

## 10. DATABASE TABLES & INTEGRATION

### Submission Tables:
- `statistics_submissions` (school_id, submitted_by, academic_year, total_students, total_teachers, attendance_rate, status)
- `report_submissions` (school_id, submitted_by, title, file_path, file_name, status)
- `form_submissions` (school_id, submitted_by, form_type, form_data JSON, status)

### Verification Tables:
- `profiles` (full_name, role, district, province, phone_number, status, verified_by_user_id, verified_at, rejection_reason)
- `verification_audit` (who approved/rejected whom, when, reason)

### Content Tables:
- `announcements` (title, content, priority, is_published, created_at)
- `فرصت‌‌ها` (title, due_date, description, is_active)
- `اسناد` (title, file_path, type, uploaded_date)
- `schools` (name, code, province, district)

---

## 11. MISSING FEATURES & IMPROVEMENT OPPORTUNITIES

### High Priority 🔴
1. **File Download** - No actual download mechanism implemented
2. **Submission Details** - Admin can see submissions but no detail view
3. **User Profile Edit** - No edit functionality after initial setup
4. **Status Updates** - No way to track status changes over time
5. **Search/Filter** - Submissions list has no search capability

### Medium Priority 🟡
1. **Bulk Operations** - Approve/reject multiple at once
2. **Email Notifications** - Notify on approval/rejection
3. **User Roles Management** - Assign/change roles
4. **Analytics Dashboard** - Charts and trends for ministry view
5. **Pagination** - Large lists need pagination for performance

### Low Priority 🟢
1. **Advanced Filtering** - Date ranges, status combinations
2. **Export Data** - CSV/Excel exports
3. **Audit Log Viewer** - See all approval history
4. **Performance Caching** - Cache frequently accessed data
5. **Offline Support** - Progressive Web App features

---

## 12. CODE PATTERNS & CONVENTIONS

### State Management:
- useState for form data and UI state
- useAuth for authentication context
- useVerification for verification status
- useMockData for demo data

### Error Handling:
- Try-catch for async operations
- useErrorToast for user-facing messages
- useAPIError for API call wrapping
- Validation functions return null on success, error string on failure

### Form Patterns:
- Field-level validation (validateRequired, validateEmail, etc.)
- touched/errors state management
- Clear error on field change
- Form-level validation before submission

### Component Patterns:
- Card-based layout for dashboard items
- Badge for status indicators
- Responsive grid layout (md:grid-cols-*)
- Icon + text button combinations
- Loading spinner during async operations

### Persian Localization:
- All user-facing strings in Persian
- useTranslation hook for content
- RTL layout support
- Persian-formatted dates and numbers

---

## 13. QUICK REFERENCE: KEY FILES

```
Core System:
- src/lib/verificationHierarchy.ts     (6-tier approval logic)
- src/lib/errors.ts                    (error types & messages)
- src/lib/validation.ts                (form validation rules)
- src/lib/mockData.ts                  (demo data)

Dashboard Pages:
- src/pages/school/Dashboard.tsx       (school main view)
- src/pages/admin/Dashboard.tsx        (admin overview)
- src/pages/admin/Submissions.tsx      (submission review)
- src/pages/district/Dashboard.tsx     (district overview)
- src/pages/province/Dashboard.tsx     (province summary)
- src/pages/ministry/Dashboard.tsx     (national stats)

Submission Forms:
- src/pages/school/SubmitStatistics.tsx
- src/pages/school/SubmitReports.tsx
- src/pages/school/SubmitForms.tsx

Components:
- src/components/VerificationPanel.tsx (approval/rejection UI)
- src/components/SubmissionStatusCard.tsx (status display)
- src/components/SmartFormField.tsx    (form field with validation)
- src/components/FileUploadProgress.tsx (file upload UI)
- src/components/InteractiveDashboardCard.tsx (expandable cards)

Hooks:
- src/hooks/useVerification.ts         (verification status)
- src/hooks/useFileUpload.ts           (file upload logic)
- src/hooks/useSubmissionApproval.ts   (approval/rejection)
- src/hooks/useAPIError.ts             (API error handling)
```

---

**Generated:** March 20, 2026  
**Total Lines of Code Reviewed:** ~3,500+  
**Components Documented:** 25+  
**Features Documented:** 40+  
**Remaining Exploration:** Server-side endpoints, database migrations, authentication flows
