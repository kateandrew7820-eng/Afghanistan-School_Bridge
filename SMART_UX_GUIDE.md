# Smart UX Components - Usage Guide

This document provides comprehensive examples of how to use the new smart UX components to make the platform more intelligent, professional, and user-friendly.

## 1. Real-Time Form Validation

### Basic Usage

```typescript
import { useSmartValidation, CommonValidators } from '@/hooks/useSmartValidation';
import { SmartFormField } from '@/components/SmartFormField';

function MyForm() {
  const [formData, setFormData] = useState({
    schoolCode: '',
    email: '',
    phone: '',
  });

  const validation = useSmartValidation({
    schoolCode: {
      required: true,
      pattern: /^[A-Z0-9]{6,}$/,
      message: 'School code must be 6+ alphanumeric characters',
    },
    email: {
      required: true,
      customValidator: CommonValidators.email,
    },
    phone: {
      required: true,
      customValidator: CommonValidators.phoneAF,
      message: 'Enter a valid Afghan phone number',
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validation.validateForm(formData)) {
      // Form is valid - proceed with submission
      console.log('Valid form data:', formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SmartFormField
        label="School Code"
        value={formData.schoolCode}
        error={validation.errors.schoolCode}
        touched={validation.touched.schoolCode}
        hint="e.g., SCH001234"
        required
        onChange={(e) => {
          setFormData({ ...formData, schoolCode: e.target.value });
          validation.handleFieldChange('schoolCode', e.target.value);
        }}
        onBlur={(e) => validation.handleFieldBlur('schoolCode', e.target.value)}
      />

      <SmartFormField
        label="Email Address"
        type="email"
        value={formData.email}
        error={validation.errors.email}
        touched={validation.touched.email}
        hint="We'll never share your email"
        required
        onChange={(e) => {
          setFormData({ ...formData, email: e.target.value });
          validation.handleFieldChange('email', e.target.value);
        }}
        onBlur={(e) => validation.handleFieldBlur('email', e.target.value)}
      />

      <button type="submit" disabled={!validation.isValid}>
        Submit Form
      </button>
    </form>
  );
}
```

## 2. Smart Confirmation Dialogs

### Confirming Critical Actions

```typescript
import { useConfirmation, ConfirmationTemplates } from '@/contexts/ConfirmationContext';

function SchoolDataForm() {
  const { showConfirmation } = useConfirmation();
  const { notifyAction } = useSmartNotifications();

  const handleSubmitReport = async () => {
    showConfirmation(
      ConfirmationTemplates.submitReport(async () => {
        try {
          notifyAction('submit', 'pending');
          // Submit to API
          await submitReportToAPI();
          notifyAction('submit', 'success');
        } catch (error) {
          notifyAction('submit', 'error', error.message);
        }
      })
    );
  };

  const handleDeleteData = async () => {
    showConfirmation(
      ConfirmationTemplates.deleteData('School Statistics Report', async () => {
        try {
          notifyAction('delete', 'pending');
          await deleteReportFromAPI();
          notifyAction('delete', 'success');
        } catch (error) {
          notifyAction('delete', 'error');
        }
      })
    );
  };

  return (
    <div className="space-y-4">
      <button onClick={handleSubmitReport}>Submit Report</button>
      <button onClick={handleDeleteData} className="text-red-600">Delete Report</button>
    </div>
  );
}
```

## 3. Interactive Dashboard Cards

### Creating Smart, Responsive Cards

```typescript
import { InteractiveDashboardCard, SmartStatusCard } from '@/components/InteractiveDashboardCard';
import { Users, TrendingUp } from 'lucide-react';

function SchoolDashboard() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <InteractiveDashboardCard
        title="Student Enrollment"
        description="Total students currently enrolled"
        icon={<Users className="h-5 w-5" />}
        badge={{
          label: 'Updated Today',
          variant: 'secondary',
        }}
        highlight={true}
        onExpand={() => setIsExpanded(true)}
        expandedContent={
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Detailed breakdown of student enrollment by class
            </p>
            <div className="grid gap-2">
              <SmartStatusCard
                label="Grade 1"
                value={45}
                status="success"
                trend="up"
              />
              <SmartStatusCard
                label="Grade 2"
                value={52}
                status="success"
                trend="neutral"
              />
              <SmartStatusCard
                label="Grade 3"
                value={38}
                status="warning"
                trend="down"
              />
            </div>
          </div>
        }
      >
        <div className="text-3xl font-bold">
          245
          <p className="text-sm text-muted-foreground mt-2">students total</p>
        </div>
      </InteractiveDashboardCard>

      <SmartStatusCard
        label="Pass Rate"
        value="87%"
        status="success"
        trend="up"
      />
    </div>
  );
}
```

## 4. Smart Notifications and Guidance

### Showing Contextual Help

```typescript
import { useSmartNotifications } from '@/hooks/useSmartNotifications';
import { SmartGuidance, SmartTip } from '@/components/SmartGuidance';

function DashboardPage() {
  const { getNextStepsGuidance, getTip, notifyDeadlineApproaching } = useSmartNotifications();
  const { role } = useAuth();

  useEffect(() => {
    // Show deadline notifications
    deadlines.forEach(d => notifyDeadlineApproaching(d));
  }, [deadlines]);

  const nextSteps = getNextStepsGuidance();

  return (
    <div className="space-y-6">
      {/* Contextual guidance for user's role */}
      <SmartGuidance
        title="Getting Started"
        description={`Complete these steps to set up your ${role} account`}
        steps={nextSteps.map((step, i) => ({
          id: `step-${i}`,
          title: step,
          description: `Follow the prompts to complete this step`,
          priority: i === 0 ? 'high' : 'medium',
          icon: <CheckCircle2 className="h-5 w-5" />,
          action: {
            label: 'Start',
            onClick: () => navigateToStep(i),
          },
        }))}
      />

      {/* Quick tips */}
      <SmartTip
        title="Pro Tip"
        message={getTip('dashboard')}
        type="info"
        action={{
          label: 'Learn More',
          onClick: () => openHelpCenter(),
        }}
      />

      {/* Main dashboard content */}
      <div className="grid gap-4">
        {/* Other components... */}
      </div>
    </div>
  );
}
```

## 5. Animations for Polish

### Using Subtle, Professional Animations

```typescript
import { AnimationClasses } from '@/lib/animations';

function smooth AnimatedCard() {
  return (
    <div className={AnimationClasses.slideInFromBottom}>
      <Card className={AnimationClasses.scaleUp}>
        <CardHeader>
          <h2 className={AnimationClasses.fadeIn}>Animated Content</h2>
        </CardHeader>
      </Card>
    </div>
  );
}

// In Tailwind classes
<div className="animate-in slide-in-from-right duration-300">
  Slides in from the right smoothly
</div>

<div className="animate-in zoom-in-95 duration-200">
  Zooms in subtly
</div>

<div className="transition-all duration-200 hover:scale-105">
  Scales up on hover smoothly
</div>
```

## 6. Complete Example: Enhanced Form Page

```typescript
import { useState } from 'react';
import { useSmartValidation, CommonValidators } from '@/hooks/useSmartValidation';
import { useSmartNotifications } from '@/hooks/useSmartNotifications';
import { useConfirmation, ConfirmationTemplates } from '@/contexts/ConfirmationContext';
import { SmartFormField, SmartTextarea } from '@/components/SmartFormField';
import { SmartTip } from '@/components/SmartGuidance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SchoolReportForm() {
  const [formData, setFormData] = useState({
    schoolCode: '',
    reportTitle: '',
    summary: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const validation = useSmartValidation({
    schoolCode: {
      required: true,
      pattern: /^[A-Z0-9]{6,}$/,
      message: 'School code must contain 6+ alphanumeric characters',
    },
    reportTitle: {
      required: true,
      minLength: 5,
      maxLength: 100,
      message: 'Title must be between 5-100 characters',
    },
    summary: {
      required: true,
      minLength: 20,
      maxLength: 500,
    },
  });

  const { showConfirmation } = useConfirmation();
  const { notifyAction, notifyMissingFields, getTip } = useSmartNotifications();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validation.validateForm(formData)) {
      const missingFields = Object.keys(validation.errors);
      notifyMissingFields(missingFields);
      return;
    }

    // Show confirmation before submitting
    showConfirmation(
      ConfirmationTemplates.submitForm('School Report', async () => {
        setIsSubmitting(true);
        try {
          notifyAction('submit', 'pending');
          
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Simulate submission
          const response = await fetch('/api/reports', {
            method: 'POST',
            body: JSON.stringify(formData),
          });

          if (!response.ok) throw new Error('Submission failed');

          notifyAction('submit', 'success', 'Report submitted successfully');
          
          // Reset form
          setFormData({
            schoolCode: '',
            reportTitle: '',
            summary: '',
          });
          validation.clearAllErrors();
        } catch (error) {
          notifyAction('submit', 'error', error instanceof Error ? error.message : 'Unexpected error');
        } finally {
          setIsSubmitting(false);
        }
      })
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Helpful tip */}
      <SmartTip
        title="Before You Start"
        message={getTip('form')}
        type="info"
      />

      {/* Form card */}
      <Card>
        <CardHeader>
          <CardTitle>Submit School Report</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <SmartFormField
              label="School Code"
              value={formData.schoolCode}
              error={validation.errors.schoolCode}
              touched={validation.touched.schoolCode}
              hint="e.g., SCH001234"
              required
              placeholder="Enter your school code"
              onChange={(e) => {
                setFormData({ ...formData, schoolCode: e.target.value });
                validation.handleFieldChange('schoolCode', e.target.value);
              }}
              onBlur={(e) => validation.handleFieldBlur('schoolCode', e.target.value)}
            />

            <SmartFormField
              label="Report Title"
              value={formData.reportTitle}
              error={validation.errors.reportTitle}
              touched={validation.touched.reportTitle}
              hint="Brief title of your report"
              required
              placeholder="What is this report about?"
              onChange={(e) => {
                setFormData({ ...formData, reportTitle: e.target.value });
                validation.handleFieldChange('reportTitle', e.target.value);
              }}
              onBlur={(e) => validation.handleFieldBlur('reportTitle', e.target.value)}
            />

            <SmartTextarea
              label="Report Summary"
              value={formData.summary}
              error={validation.errors.summary}
              touched={validation.touched.summary}
              hint="Detailed summary of the report (20-500 characters)"
              required
              maxLength={500}
              rows={5}
              placeholder="Provide details about your report..."
              onChange={(e) => {
                setFormData({ ...formData, summary: e.target.value });
                validation.handleFieldChange('summary', e.target.value);
              }}
              onBlur={(e) => validation.handleFieldBlur('summary', e.target.value)}
            />

            <Button
              type="submit"
              disabled={isSubmitting || !validation.isValid}
              className="w-full"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

## 7. Development & Testing with Mock Data

### Using Smart Features in Dev Mode

```typescript
// In your mock data or dev mode
if (isDemoMode || isDevMode) {
  // Mock deadline notifications
  useEffect(() => {
    const mockDeadlines = [
      { title: 'First Quarter Report', due_date: new Date(Date.now() + 2*24*60*60*1000).toISOString() },
      { title: 'Student Enrollment Update', due_date: new Date(Date.now() + 5*24*60*60*1000).toISOString() },
    ];

    mockDeadlines.forEach(d => notifyDeadlineApproaching(d));
  }, [isDemoMode]);

  // Show smart tips
  console.log('Next Steps:', getNextStepsGuidance());
  console.log('Dashboard Tip:', getTip('dashboard'));
}
```

## Best Practices

1. **Always validate before submission** - Use `useSmartValidation` for real-time feedback
2. **Confirm destructive actions** - Use confirmation templates for delete/reject
3. **Provide context-aware guidance** - Use `SmartGuidance` to help users understand next steps
4. **Show instant feedback** - Use notifications for all user actions
5. **Keep animations subtle** - Use professional, smooth transitions
6. **Make cards interactive** - Expand cards to show more details on click
7. **Highlight important data** - Use `highlight` prop and status cards
8. **Test in dev mode** - Use mock data to test realistic scenarios
