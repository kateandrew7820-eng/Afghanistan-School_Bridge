/**
 * Enhanced SetupProfile Form Example
 * 
 * This demonstrates how to upgrade the setup form with:
 * - Real-time form validation
 * - Contextual confirmations
 * - Smart guidance
 * - Professional animations
 * - Instant feedback
 * 
 * Copy this pattern to update SetupProfile.tsx, SetupSchool.tsx, etc.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { useSmartValidation, CommonValidators } from '@/hooks/useSmartValidation';
import { useSmartNotifications } from '@/hooks/useSmartNotifications';
import { useConfirmation, ConfirmationTemplates } from '@/contexts/ConfirmationContext';
import { SmartFormField, SmartTextarea } from '@/components/SmartFormField';
import { SmartGuidance, SmartTip } from '@/components/SmartGuidance';
import { AnimationClasses } from '@/lib/animations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface SetupFormData {
  schoolName: string;
  email: string;
  phone: string;
  province: string;
  district: string;
  description: string;
}

/**
 * EXAMPLE: Enhanced Setup Profile with Smart Validation
 * 
 * Key improvements:
 * 1. Real-time field-level validation
 * 2. Touch tracking to avoid overwhelming new users
 * 3. Visual feedback for valid/invalid fields
 * 4. Smart next steps guidance
 * 5. Confirmation before submission
 */
export default function EnhancedSetupProfile() {
  const { profile, updateProfile } = useAuth();
  const { t, isRTL } = useTranslation();
  const navigate = useNavigate();
  const { showConfirmation } = useConfirmation();
  const { notifySuccess, notifyError, getTip } = useSmartNotifications();

  // Form state
  const [formData, setFormData] = useState<SetupFormData>({
    schoolName: profile?.schools?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    province: profile?.schools?.province || '',
    district: profile?.schools?.district || '',
    description: profile?.schools?.description || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedFields, setCompletedFields] = useState<string[]>([]);

  // Smart validation with custom validators
  const validation = useSmartValidation({
    schoolName: {
      required: true,
      minLength: 3,
      customValidator: (value) => {
        if (value.length < 3) return 'School name must be at least 3 characters';
        if (!/^[a-zA-Z\u0600-\u06FF\s'-]+$/.test(value)) {
          return 'School name can only contain letters, spaces, hyphens, and apostrophes';
        }
        return null;
      },
    },
    email: {
      required: true,
      customValidator: CommonValidators.email,
    },
    phone: {
      required: true,
      customValidator: CommonValidators.phoneAF, // Afghan phone numbers
    },
    province: {
      required: true,
    },
    district: {
      required: true,
    },
    description: {
      maxLength: 500,
      customValidator: (value) => {
        if (value.split('\n').length > 10) {
          return 'Description cannot exceed 10 lines';
        }
        return null;
      },
    },
  });

  // Check form completion
  useEffect(() => {
    const newCompleted = Object.entries(formData)
      .filter(([key, value]) => {
        if (key === 'description') return true; // Optional field
        return value && !validation.errors[key as keyof SetupFormData];
      })
      .map(([key]) => key);
    
    setCompletedFields(newCompleted);
  }, [formData, validation.errors]);

  // Progress tracking
  const completionPercentage = (completedFields.length / 5) * 100;

  /**
   * Handle field change
   * - Updates form state
   * - Validates in real-time (but only after user has changed field)
   * - Shows live feedback
   */
  const handleFieldChange = (fieldName: keyof SetupFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
    }));

    // Validate as user types (but only if they've already interacted)
    if (validation.touched[fieldName]) {
      validation.handleFieldChange(fieldName, value);
    }
  };

  /**
   * Handle field blur
   * - Marks field as touched
   * - Validates the complete value
   * - Shows errors if invalid
   */
  const handleFieldBlur = (fieldName: keyof SetupFormData) => {
    validation.handleFieldBlur(fieldName, formData[fieldName]);
  };

  /**
   * Validate entire form
   * - Check all required fields
   * - Return single validation object with all errors
   */
  const validateForm = (): boolean => {
    const isValid = validation.validateForm(formData);
    
    // Show user-friendly error message
    if (!isValid) {
      const errorCount = Object.keys(validation.errors).length;
      notifyError(`Please fix ${errorCount} error${errorCount > 1 ? 's' : ''} before submitting`);
    }
    
    return isValid;
  };

  /**
   * Handle form submission
   * 1. Validate form
   * 2. Show confirmation dialog
   * 3. Submit to backend
   * 4. Navigate to next step
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Step 1: Validate
    if (!validateForm()) {
      return;
    }

    // Step 2: Show confirmation
    showConfirmation(
      ConfirmationTemplates.submitForm('School Profile', async () => {
        try {
          setIsSubmitting(true);

          // Step 3: Submit to backend
          const result = await updateProfile({
            schools: {
              name: formData.schoolName,
              province: formData.province,
              district: formData.district,
              description: formData.description,
            },
            email: formData.email,
            phone: formData.phone,
          });

          if (!result.success) {
            throw new Error(result.message);
          }

          // Step 4: Success feedback and navigation
          notifySuccess('Profile updated successfully!');
          
          // Small delay for UX (let user see the success message)
          setTimeout(() => {
            navigate('/school/dashboard');
          }, 500);
        } catch (error) {
          setIsSubmitting(false);
          const message = error instanceof Error ? error.message : 'Failed to update profile';
          notifyError(message);
        }
      }, '확인')
    );
  };

  return (
    <div className={`space-y-6 max-w-2xl mx-auto ${AnimationClasses.fadeIn}`}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold">{t('setup.profile')}</h1>
        <p className="text-muted-foreground mt-2">
          Complete your school profile to get started
        </p>
      </div>

      {/* Getting Started Guidance */}
      <SmartGuidance
        title="Setting up your profile"
        description="We need some basic information to configure your school"
        steps={[
          {
            id: 'basic-info',
            title: 'Basic Information',
            description: 'School name, contact details',
            priority: 'high' as const,
            icon: completedFields.includes('schoolName') && completedFields.includes('email') ? 
              <CheckCircle2 className="h-5 w-5 text-green-600" /> :
              <Info className="h-5 w-5 text-blue-600" />,
            completed: completedFields.includes('schoolName') && completedFields.includes('email'),
          },
          {
            id: 'location',
            title: 'Location',
            description: 'Province and district',
            priority: 'high' as const,
            icon: completedFields.includes('province') && completedFields.includes('district') ?
              <CheckCircle2 className="h-5 w-5 text-green-600" /> :
              <Info className="h-5 w-5 text-blue-600" />,
            completed: completedFields.includes('province') && completedFields.includes('district'),
          },
          {
            id: 'description',
            title: 'Description (Optional)',
            description: 'Tell us about your school',
            priority: 'medium' as const,
            icon: <Info className="h-5 w-5 text-blue-600" />,
            completed: false,
          },
        ]}
      />

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Form Completion</CardTitle>
          <CardDescription>Required fields: {completedFields.length} of 5</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{Math.round(completionPercentage)}% complete</span>
              <span className="text-muted-foreground">{completedFields.length} of 5 fields</span>
            </div>
            <div className="w-full bg-muted rounded-full overflow-hidden h-2">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning: Incomplete Form */}
      {completionPercentage < 100 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 animate-in slide-in-from-top">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-amber-900">Almost there!</h4>
              <p className="text-sm text-amber-800 mt-1">
                Complete all required fields to submit your profile
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Basic Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
            <CardDescription>Your school's main details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* School Name Field */}
            <SmartFormField
              label="School Name"
              placeholder="e.g., Kabul High School"
              value={formData.schoolName}
              error={validation.errors.schoolName}
              touched={validation.touched.schoolName}
              required
              hint="Enter the official name of your school"
              onChange={(e) => handleFieldChange('schoolName', e.target.value)}
              onBlur={() => handleFieldBlur('schoolName')}
            />

            {/* Email Field */}
            <SmartFormField
              label="School Email"
              type="email"
              placeholder="school@example.com"
              value={formData.email}
              error={validation.errors.email}
              touched={validation.touched.email}
              required
              hint="A working email address for official communications"
              onChange={(e) => handleFieldChange('email', e.target.value)}
              onBlur={() => handleFieldBlur('email')}
            />

            {/* Phone Field */}
            <SmartFormField
              label="Phone Number"
              type="tel"
              placeholder="+93 (XX) XXX-XXXX"
              value={formData.phone}
              error={validation.errors.phone}
              touched={validation.touched.phone}
              required
              hint="Afghan phone number starting with +93 or 0"
              onChange={(e) => handleFieldChange('phone', e.target.value)}
              onBlur={() => handleFieldBlur('phone')}
            />
          </CardContent>
        </Card>

        {/* Location Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Location</CardTitle>
            <CardDescription>Where is your school located?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Province Field */}
            <SmartFormField
              label="Province"
              placeholder="Select your province"
              value={formData.province}
              error={validation.errors.province}
              touched={validation.touched.province}
              required
              hint="Select the province from the dropdown"
              onChange={(e) => handleFieldChange('province', e.target.value)}
              onBlur={() => handleFieldBlur('province')}
            />

            {/* District Field */}
            <SmartFormField
              label="District"
              placeholder="Select your district"
              value={formData.district}
              error={validation.errors.district}
              touched={validation.touched.district}
              required
              hint="Select the district from the dropdown"
              onChange={(e) => handleFieldChange('district', e.target.value)}
              onBlur={() => handleFieldBlur('district')}
            />
          </CardContent>
        </Card>

        {/* Description Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About Your School</CardTitle>
            <CardDescription>Tell us about your school (optional)</CardDescription>
          </CardHeader>
          <CardContent>
            <SmartTextarea
              label="School Description"
              placeholder="Share information about your school's mission, programs, or anything you'd like to highlight"
              value={formData.description}
              error={validation.errors.description}
              touched={validation.touched.description}
              maxLength={500}
              hint="Your description helps other stakeholders understand your school better"
              onChange={(e) => handleFieldChange('description', e.target.value)}
              onBlur={() => handleFieldBlur('description')}
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          >
            Go Back
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || completionPercentage < 100}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">⧖</span>
                Saving...
              </>
            ) : (
              'Submit Profile'
            )}
          </Button>
        </div>
      </form>

      {/* Helpful Tip */}
      <SmartTip
        title="Pro Tip"
        message={getTip('setup')}
        type="info"
        action={{
          label: 'Learn More',
          onClick: () => window.open('/help/setup', '_blank'),
        }}
      />

      {/* Validation Reference */}
      <Card className="border-muted bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Validation Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li><strong>School Name:</strong> 3+ characters, letters and spaces only</li>
            <li><strong>Email:</strong> Valid email format (example@domain.com)</li>
            <li><strong>Phone:</strong> Afghan number format (+93 or 0 prefix)</li>
            <li><strong>Province & District:</strong> Required selections</li>
            <li><strong>Description:</strong> Optional, max 500 characters</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Key Features Demonstrated:
 * 
 * 1. Real-Time Validation
 *    ✓ Field-level validation as user types
 *    ✓ Touch tracking to avoid early error messages
 *    ✓ Custom validators for domain-specific rules
 *    ✓ Instant visual feedback (icons, colors)
 * 
 * 2. User Guidance
 *    ✓ Step-by-step setup instructions
 *    ✓ Field hints and helper text
 *    ✓ Progress tracking bar
 *    ✓ Context-aware tips
 * 
 * 3. Smart Feedback
 *    ✓ Shows errors only after user interaction
 *    ✓ Clear validation messages
 *    ✓ Success indicators for valid fields
 *    ✓ Disabled submit until form is complete
 * 
 * 4. Professional UX
 *    ✓ Smooth animations
 *    ✓ Loading state during submission
 *    ✓ Confirmation before submitting
 *    ✓ Clear success/error messages
 * 
 * 5. Accessibility
 *    ✓ Proper labels and hints
 *    ✓ Required field indicators
 *    ✓ Error descriptions linked to inputs
 *    ✓ Keyboard navigation support
 * 
 * Integration Pattern:
 * 
 * const validation = useSmartValidation({
 *   fieldName: {
 *     required: true,
 *     minLength: 3,
 *     customValidator: CommonValidators.email,
 *   },
 * });
 * 
 * <SmartFormField
 *   label="Field Label"
 *   error={validation.errors.fieldName}      // Show errors
 *   touched={validation.touched.fieldName}    // Only after interaction
 *   onChange={(e) => handleFieldChange('fieldName', e.target.value)}
 *   onBlur={() => handleFieldBlur('fieldName')}
 * />
 */
