

# Afghanistan Schools Data Portal - MVP Plan

## Overview
A simple web platform that connects Afghan schools to the central education ministry, eliminating the need for physical paper transfers. Schools can submit data digitally, and the center can broadcast important information to all schools.

---

## Core Features

### 1. Authentication System
- **School Login:** Each school gets a unique account to securely access the portal
- **Center Admin Access:** Ministry staff have admin accounts to manage the system
- **Simple registration:** Schools are registered by the center (no self-signup to maintain control)

### 2. School Portal (What Schools See)
- **Dashboard:** Overview of pending tasks, recent announcements, upcoming deadlines
- **Submit Statistics:** Form to enter student counts, attendance, enrollment numbers
- **Submit Reports:** Upload PDF/Word documents (monthly reports, etc.)
- **Submit Forms:** Fill out structured forms for various data collection needs
- **View Center Updates:** See announcements, download documents, view calendar deadlines

### 3. Center Admin Portal (What Ministry Staff See)
- **Dashboard:** Overview of all school submissions, statistics summary
- **View Submissions:** See all data submitted by schools, filter by school/date/type
- **Post Announcements:** Create news and updates visible to all schools
- **Upload Documents:** Share policies, curricula, guidelines for schools to download
- **Manage Deadlines:** Set important dates and deadlines schools need to follow
- **Manage Schools:** Add new schools, reset passwords, view school activity

---

## User Experience

### For Schools:
1. Log in → See dashboard with tasks and news
2. Click "Submit Data" → Choose type (statistics, document, or form)
3. Fill/upload → Submit → See confirmation
4. View announcements and download center documents anytime

### For Center:
1. Log in → See dashboard with all submissions
2. Review school submissions, mark as reviewed
3. Post new announcements or documents
4. Add deadlines to calendar

---

## Design Approach
- **Clean, simple interface:** Minimal, easy-to-use design suitable for users with varying tech experience
- **Mobile-friendly:** Works on phones for areas with limited computer access
- **Fast-loading:** Optimized for slower internet connections
- **Dari/Pashto ready:** Structure supports future translation

---

## Backend Requirements
- **Database:** Store schools, users, submissions, announcements, documents, deadlines
- **File Storage:** Secure storage for uploaded documents
- **Authentication:** Secure login system with role-based access (school vs admin)

---

## What We'll Build First
1. Login/authentication system
2. School dashboard with submission forms
3. Center admin dashboard
4. Announcement system
5. Document upload/download
6. Basic deadline calendar

This gives you a working system to pilot with a few schools, then expand based on feedback.

