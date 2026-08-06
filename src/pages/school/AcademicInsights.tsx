import React from 'react';
import PageHeader from '@/components/PageHeader';
import AttendanceAnalytics from '@/components/academic/AttendanceAnalytics';
import AssessmentAnalytics from '@/components/academic/AssessmentAnalytics';
import TopStudentsCard from '@/components/academic/TopStudentsCard';
import StudentsNeedingAttention from '@/components/academic/StudentsNeedingAttention';
import RecentAssessments from '@/components/academic/RecentAssessments';

export default function AcademicInsights() {
  return (
    <div className="space-y-6">
      <PageHeader title="Academic Insights" description="Overview of attendance and assessment performance." />
      <AttendanceAnalytics />
      <AssessmentAnalytics />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <TopStudentsCard />
        </div>
        <div>
          <StudentsNeedingAttention />
          <div className="mt-4">
            <RecentAssessments />
          </div>
        </div>
      </div>
    </div>
  );
}
