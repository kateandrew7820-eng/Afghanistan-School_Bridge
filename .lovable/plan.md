

# Afghanistan Schools Data Portal - MVP Plan

## ✅ IMPLEMENTED

## Overview
A simple web platform that connects Afghan schools to the central education ministry, eliminating the need for physical paper transfers. Schools can submit data digitally, and the center can broadcast important information to all schools.

---

## Core Features

### 1. Authentication System ✅
- **School Login:** Each school gets a unique account to securely access the portal
- **Center Admin Access:** Ministry staff have admin accounts to manage the system
- **Simple registration:** Schools are registered by the center (no self-signup to maintain control)

### 2. School Portal (What Schools See) ✅
- **Dashboard:** Overview of pending tasks, recent announcements, upcoming deadlines
- **Submit Statistics:** Form to enter student counts, attendance, enrollment numbers
- **Submit Reports:** Upload PDF/Word documents (monthly reports, etc.)
- **Submit Forms:** Fill out structured forms for various data collection needs
- **View Center Updates:** See announcements, download documents, view calendar deadlines

### 3. Center Admin Portal (What Ministry Staff See) ✅
- **Dashboard:** Overview of all school submissions, statistics summary
- **View Submissions:** See all data submitted by schools, filter by school/date/type
- **Post Announcements:** Create news and updates visible to all schools
- **Upload Documents:** Share policies, curricula, guidelines for schools to download
- **Manage Deadlines:** Set important dates and deadlines schools need to follow
- **Manage Schools:** Add new schools, reset passwords, view school activity

---

## Database Schema ✅
- `profiles` - User profiles linked to auth.users
- `user_roles` - Role-based access (admin/school)
- `schools` - School information
- `statistics_submissions` - Student statistics data
- `report_submissions` - Uploaded report files
- `form_submissions` - Form data submissions
- `announcements` - Center announcements
- `center_documents` - Shared documents
- `deadlines` - Important dates

---

## Next Steps (To Test)
1. Create an admin user via Lovable Cloud
2. Assign admin role to the user
3. Create a school and school user
4. Test the full flow

---

## Design Approach
- **Clean, simple interface:** Minimal, easy-to-use design suitable for users with varying tech experience
- **Mobile-friendly:** Works on phones for areas with limited computer access
- **Fast-loading:** Optimized for slower internet connections
- **Dari/Pashto ready:** Structure supports future translation
