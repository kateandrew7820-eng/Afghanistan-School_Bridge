import PageHeader from '@/components/PageHeader';
import AttendanceAnalytics from '@/components/academic/AttendanceAnalytics';
import AssessmentAnalytics from '@/components/academic/AssessmentAnalytics';
import TopStudentsCard from '@/components/academic/TopStudentsCard';
import StudentsNeedingAttention from '@/components/academic/StudentsNeedingAttention';
import RecentAssessments from '@/components/academic/RecentAssessments';

export default function AcademicInsights() {
  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader title="Academic Insights" description="نمای کلی عملکرد حضور و ارزیابی‌ها" />
      <AttendanceAnalytics />
      <AssessmentAnalytics />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <TopStudentsCard />
        <div className="space-y-4">
          <StudentsNeedingAttention />
          <RecentAssessments />
        </div>
      </div>
    </div>
  );
}
