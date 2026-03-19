# SchoolBridge Dashboard Implementation Guide

## ✅ **COMPLETED**

### 1. **Authentication & Role-Based Redirect System**
- ✅ Fixed login redirect to go to **role-specific dashboards** (not home page)
- ✅ Role detection happens in AuthContext based on database role field
- ✅ Automatic redirect mapping:
  - `teacher`/`principal` → `/school`
  - `district_admin` → `/district`
  - `province_admin` → `/province`
  - `ministry_admin`/`admin` → `/ministry`
- ✅ Public landing page for unauthenticated users
- ✅ All layouts are role-aware with proper navigation

### 2. **Database Schema & RLS Policies**
- ✅ Comprehensive RLS policies for all 5 role tiers
- ✅ Proper role enum supporting all role types
- ✅ Auto-trigger to assign default 'school' role on user signup

### 3. **Auth Components**
- ✅ Professional login/signup page with validation
- ✅ Error handling and retry logic
- ✅ User-friendly error messages

---

## 🟡 **IN PROGRESS - Priority Build Order**

### **Tier 1: School Dashboard (HIGHEST PRIORITY)**
Currently exists but needs enhancement:
- ✅ Dashboard overview with announcements & deadlines
- ✅ Submit Statistics form (working with validation)
- 🔄 SubmitReports.tsx - needs file upload UI
- 🔄 SubmitForms.tsx - needs multi-form support
- 📍 Profile/Settings page (account info, school)
- 📍 Submission history & status tracking

**Required Pages:**
```
/school → Dashboard (done)
/school/statistics → Submit student statistics (done)
/school/reports → Upload reports/PDFs (needs work)
/school/forms → Submit monthly/yearly forms (needs work)
/school/announcements → View announcements (done)
/school/documents → View center documents (done)
/school/deadlines → View deadlines (done)
/school/profile → User & school profile (todo)
```

---

### **Tier 2: District Dashboard**
Skeleton exists, needs metrics & functionality:
- 📍 Dashboard with school submission counts
- 📍 Submissions viewer (pending/approved/rejected)
- 📍 Approve/reject submissions with feedback
- 📍 School management interface
- 📍 Announcements/documents/deadlines management

**Required Pages:**
```
/district → Dashboard with stats
/district/submissions → View & manage school submissions
/district/verify → Approve/reject/provide feedback
/district/schools → Manage district schools
/district/announcements → Create/manage announcements
/district/documents → Upload/manage documents
/district/deadlines → Create/manage deadlines
```

---

### **Tier 3: Province Dashboard**
Skeleton exists, needs metrics & views:
- 📍 Dashboard with district summary
- 📍 Aggregate district data visualization
- 📍 Announcements & documents broadcast
- 📍 Analytics (submission trends, completion %)
- 📍 District management

**Required Pages:**
```
/province → Dashboard with aggregated stats
/province/analytics → Charts/trends
/province/districts → District list & management
/province/submissions → Aggregate district submissions
/province/announcements → Create/push announcements
/province/documents → Upload/manage documents
/province/deadlines → Create/manage deadlines
```

---

### **Tier 4: Ministry Dashboard**
Most comprehensive, needs full implementation:
- 📍 Dashboard with national overview
- 📍 National analytics (all provinces, all schools)
- 📍 Province & district management
- 📍 User account creation/management
- 📍 School registration & management
- 📍 Excel/PDF report export
- 📍 Announcements/documents/deadlines broadcast nationwide

**Required Pages:**
```
/ministry → Dashboard with national stats
/ministry/analytics → National analytics & charts
/ministry/provinces → Manage all provinces
/ministry/districts → View/manage all districts
/ministry/schools → School registration & management
/ministry/users → Create/manage user accounts
/ministry/submissions → View all submissions
/ministry/announcements → Create/broadcast announcements
/ministry/documents → Upload/manage national documents
/ministry/deadlines → Create national deadlines
/ministry/export → Generate reports (Excel/PDF)
```

---

## 📋 **Implementation Checklist**

### **School Dashboard (IMMEDIATE)**
- [ ] Complete SubmitReports.tsx (file upload for PDF/Word)
- [ ] Complete SubmitForms.tsx (multi-form submission)
- [ ] Add School Profile page
- [ ] Add submission history/tracking
- [ ] Display user's school info in dashboard

### **District Dashboard (PHASE 2)**
- [ ] Add real submission counts from Supabase
- [ ] Build submissions viewer component
- [ ] Build approval/rejection interface with feedback
- [ ] Add school management UI
- [ ] Financial/performance metrics display

### **Province & Ministry (PHASE 3)**
- [ ] Build analytics charts (Chart.js or similar)
- [ ] Aggregate data queries to Supabase
- [ ] Build permission matrix for content broadcast
- [ ] User management UI
- [ ] Export report functionality

---

## 🔧 **Technical Requirements**

### **Components Needed**
```
SubmissionCard - display submission with status
ApprovalForm - feedback/approval interface
AnalyticsChart - data visualization
FileUploader - drag-drop file upload
DataTable - sortable/filterable tables
StatCard - metric display
SearchFilter - search + filtering UI
```

### **Supabase Queries**
```
- Get school's submissions (status, date)
- Get submission count by status (for district)
- Aggregate school data to district level
- Aggregate district data to province level
- Broadcast announcements/documents
- Get user's school/district/province info
```

### **Data Models for Tracking**
```
submissions {
  id, user_id, school_id, type (stats|report|form)
  data (JSONB), status (pending|approved|rejected)
  feedback_text, submitted_at, reviewed_at, reviewed_by
}

school_hierarchy {
  school_id → district_id → province_id
  (for efficient aggregation queries)
}
```

---

## 🎯 **Next Steps (RECOMMEND STARTING WITH TIER 1)**

**Phase 1 (This Week): School Dashboard**
1. Complete file upload for reports
2. Multi-form submission interface
3. Add profile page with school info
4. Submission history/tracking

**Phase 2 (Next Week): District Dashboard**
1. Metrics integration (Supabase queries)
2. Submissions viewer & approval interface
3. School management

**Phase 3 (Later): Province/Ministry**
1. Analytics implementation
2. User management
3. Export reports

---

## 💡 **Key Notes**

- All dashboards have navigation set up in layouts
- RLS policies ensure users see only their role's data
- PlaceholderPage component available for WIP pages
- Supabase has profiles, schools, user_roles, submissions tables ready
- Mobile-responsive via existing layout system
- Toast notifications configured for feedback

---

## **Quick Test Accounts**

When testing, create accounts with these roles:
- teacher@test.com → role: 'school'
- principal@test.com → role: 'principal' (also 'school')
- district@test.com → role: 'district_admin'
- province@test.com → role: 'province_admin'
- ministry@test.com → role: 'ministry_admin'

Each should redirect to appropriate dashboard on login.
