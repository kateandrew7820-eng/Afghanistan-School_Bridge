/**
 * Mock Data for Development/Demo Mode
 * Used when developer needs to test dashboards without authentication
 */

export const mockAnnouncements = [
  {
    id: '1',
    title: 'نتایج امتحانات ترمین منتشر شد',
    content: 'نتایج امتحانات ترمین اول سال تحصیلی در سیستم منتشر گردید. لطفا به پورتال دسترسی یافته و نتایج را بررسی کنید.',
    priority: 'high',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    is_published: true,
  },
  {
    id: '2',
    title: 'تعطیلات پائیزی از فردا آغاز می‌شود',
    content: 'تعطیلات پائیزی از فردا به مدت دو هفته آغاز خواهد شد. مکاتب تا 15 مهرماه تعطیل هستند.',
    priority: 'normal',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    is_published: true,
  },
  {
    id: '3',
    title: 'بهروزرسانی سیستم مدیریت مکتب',
    content: 'نسخه جدید سیستم مدیریت مکتب با امکانات جدید، فردا ساعت 22:00 راه‌اندازی خواهد شد.',
    priority: 'normal',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    is_published: true,
  },
];

export const mockDeadlines = [
  {
    id: '1',
    title: 'تجمیع نتایج ترمین اول',
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: 'تمام معلمین باید نتایج امتحانات خود را به سیستم وارد کنند.',
    is_active: true,
  },
  {
    id: '2',
    title: 'ارسال گزارش حضور و غیاب',
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: 'گزارش ماهانه حضور و غیاب دانش‌آموزان که باید تا پایان ماه ارسال شود.',
    is_active: true,
  },
  {
    id: '3',
    title: 'تکمیل فورم ارزیابی معلمین',
    due_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: 'معاونین تحصیلی باید فورم ارزیابی معلمین را تکمیل کنند.',
    is_active: true,
  },
  {
    id: '4',
    title: 'جمع‌آوری پیشنهادات بهبودی',
    due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: 'همه کارمندان می‌توانند پیشنهادات بهبودی خود را ارائه دهند.',
    is_active: true,
  },
];

export const mockStudentStats = {
  total: 485,
  present: 412,
  absent: 48,
  excused: 25,
};

export const mockSubmissions = [
  {
    id: '1',
    type: 'نتایج امتحانات',
    status: 'تأیید شده',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    submittedBy: 'محمد احمدی',
  },
  {
    id: '2',
    type: 'گزارش فعالیت‌های صنفی',
    status: 'در انتظار تأیید',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    submittedBy: 'فاطمه علوی',
  },
  {
    id: '3',
    type: 'برنامه تدریس سالانه',
    status: 'ارسال شده',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    submittedBy: 'علی حسینی',
  },
];

export const mockReports = [
  {
    id: '1',
    title: 'گزارش آموزشی ماهانه',
    month: 'عقرب',
    status: 'دانلود',
  },
  {
    id: '2',
    title: 'گزارش فعالیت‌های فوق‌برنامه',
    month: 'عقرب',
    status: 'دانلود',
  },
  {
    id: '3',
    title: 'گزارش حضور و غیاب',
    month: 'سپتامبر',
    status: 'دانلود',
  },
];

export const mockDocuments = [
  {
    id: '1',
    title: 'نمونه دستورالعمل تدریس ریاضی',
    type: 'PDF',
    size: '2.4 MB',
    uploadedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    title: 'الگوی برنامه ریزی کلاسی',
    type: 'Word',
    size: '1.8 MB',
    uploadedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: 'ضوابط رفتاری دانش‌آموزان',
    type: 'PDF',
    size: '3.1 MB',
    uploadedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockDistrictStats = {
  schools: 42,
  students: 12485,
  teachers: 385,
  pending_submissions: 8,
};

export const mockProvinceStats = {
  districts: 12,
  schools: 385,
  students: 125000,
  completion_rate: 94.5,
};

export const mockMinistryStats = {
  provinces: 34,
  districts: 400,
  schools: 35000,
  students: 8500000,
};
