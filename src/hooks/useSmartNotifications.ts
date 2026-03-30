import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { useToast } from './use-toast';
import { UserRole } from '@/lib/supabase';

export interface SmartNotification {
  type: 'info' | 'success' | 'warning' | 'error' | 'tip';
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  duration?: number; // in milliseconds, 0 = persistent
}

/**
 * Smart notification system for contextual feedback
 * Provides role-based, context-aware notifications
 */
export function useSmartNotifications() {
  const { profile, role } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();

  const notifySuccess = (title: string, description: string, duration = 3000) => {
    toast({
      title,
      description,
    });
  };

  const notifyError = (title: string, description: string) => {
    toast({
      title,
      description,
      variant: 'destructive',
    });
  };

  const notifyWarning = (title: string, description: string) => {
    toast({
      title,
      description,
    });
  };

  // Context-aware deadline notifications
  const notifyDeadlineApproaching = (deadline: { title: string; due_date: string }) => {
    const daysUntil = Math.ceil(
      (new Date(deadline.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil <= 0) {
      notifyError('Deadline Passed', `${deadline.title} deadline has passed`);
    } else if (daysUntil <= 1) {
      notifyWarning('Urgent Deadline', `${deadline.title} is due today!`);
    } else if (daysUntil <= 3) {
      notifyWarning('Upcoming Deadline', `${deadline.title} is due in ${daysUntil} days`);
    }
  };

  // Missing field notifications
  const notifyMissingFields = (fields: string[]) => {
    notifyWarning(
      'Incomplete Form',
      `Please fill in: ${fields.join(', ')}`
    );
  };

  // Action feedback
  const notifyAction = (action: 'submit' | 'save' | 'delete' | 'approve' | 'reject', state: 'pending' | 'success' | 'error', message?: string) => {
    const messages = {
      submit: {
        pending: 'Submitting...',
        success: 'Submitted successfully',
        error: 'Failed to submit',
      },
      save: {
        pending: 'Saving...',
        success: 'Saved successfully',
        error: 'Failed to save',
      },
      delete: {
        pending: 'Deleting...',
        success: 'Deleted successfully',
        error: 'Failed to delete',
      },
      approve: {
        pending: 'Approving...',
        success: 'User approved',
        error: 'Failed to approve',
      },
      reject: {
        pending: 'Rejecting...',
        success: 'User rejected',
        error: 'Failed to reject',
      },
    };

    const msgConfig = messages[action] || messages.submit;
    const finalMessage = message || msgConfig[state];

    if (state === 'success') {
      notifySuccess(action.charAt(0).toUpperCase() + action.slice(1), finalMessage);
    } else if (state === 'error') {
      notifyError('Error', finalMessage);
    }
  };

  // Role-specific guidance
  const getNextStepsGuidance = (): string[] => {
    const steps: { [key: string]: string[] } = {
      'student': [
        'Complete your profile information',
        'Join your school as a student',
        'Build your portfolio',
        'Connect with teachers and peers',
      ],
      'teacher': [
        'Update your qualifications',
        'Create your classroom profile',
        'Start recording student progress',
        'Engage with students and parents',
      ],
      'principal': [
        'Complete school profile',
        'Invite teachers to the platform',
        'Set up school announcements',
        'Monitor student statistics',
      ],
      'district_admin': [
        'Add schools to your district',
        'Monitor school submissions',
        'Review announcements from Ministry',
        'Generate district reports',
      ],
      'province_admin': [
        'Monitor all districts',
        'Review provincial statistics',
        'Share resources with districts',
        'Generate provincial reports',
      ],
      'ministry_admin': [
        'Monitor all provinces',
        'Create policy announcements',
        'Review system-wide statistics',
        'Manage system users',
      ],
    };

    return steps[role || 'student'] || steps.student;
  };

  // Contextual tips
  const getTip = (context: 'form' | 'dashboard' | 'submission' | 'verification'): string => {
    const tips = {
      form: 'Fill in all required fields marked with *. You can save your progress and return later.',
      dashboard: 'Click on any card to expand and see more details. Use filters to find what you need.',
      submission: 'Make sure all اسناد are properly named and formatted before submission.',
      verification: 'Your account will be verified within 24-48 hours. Check back for updates.',
    };

    return tips[context] || tips.form;
  };

  return {
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyDeadlineApproaching,
    notifyMissingFields,
    notifyAction,
    getNextStepsGuidance,
    getTip,
  };
}
