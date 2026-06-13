import { Check, Loader2, AlertCircle } from 'lucide-react';

interface SignupStep {
  title: string;
  description: string;
  status: 'pending' | 'loading' | 'complete' | 'error';
}

interface SignupProgressProps {
  steps: SignupStep[];
  currentStep: number;
  errorMessage?: string;
}

/**
 * Visual progress indicator for signup flow
 * Shows users exactly where they are in the signup process
 */
export default function SignupProgress({ steps, currentStep, errorMessage }: SignupProgressProps) {
  return (
    <div className="space-y-6 py-4">
      {/* Progress Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCurrentStep = stepNumber === currentStep;
          const isComplete = step.status === 'complete';
          const isError = step.status === 'error';

          return (
            <div key={index} className="flex gap-4">
              {/* Step Number Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                    transition-all duration-300
                    ${isError ? 'bg-destructive/20 text-destructive border-2 border-destructive' : ''}
                    ${isComplete ? 'bg-success/20 text-success border-2 border-success' : ''}
                    ${isCurrentStep && !isError && !isComplete ? 'bg-primary/20 text-primary border-2 border-primary animate-pulse' : ''}
                    ${!isCurrentStep && !isComplete && !isError ? 'bg-muted text-muted-foreground border-2 border-muted-foreground/50' : ''}
                  `}
                >
                  {isComplete && <Check className="h-5 w-5" />}
                  {isError && <AlertCircle className="h-5 w-5" />}
                  {isCurrentStep && !isError && !isComplete && (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  )}
                  {!isCurrentStep && !isComplete && !isError && stepNumber}
                </div>

                {/* Connector Line (except last step) */}
                {index < steps.length - 1 && (
                  <div
                    className={`
                      w-0.5 my-2 h-8
                      transition-all duration-300
                      ${isComplete ? 'bg-success' : 'bg-muted-foreground/30'}
                    `}
                  />
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 pt-1">
                <h4
                  className={`
                    font-semibold text-sm transition-colors duration-300
                    ${isError ? 'text-destructive' : ''}
                    ${isComplete ? 'text-success' : ''}
                    ${isCurrentStep && !isError && !isComplete ? 'text-primary' : ''}
                    ${!isCurrentStep && !isComplete && !isError ? 'text-muted-foreground' : ''}
                  `}
                >
                  {step.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex gap-2">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="text-sm text-destructive">{errorMessage}</div>
        </div>
      )}

      {/* Completion Message */}
      {currentStep > steps.length && (
        <div className="p-3 rounded-lg bg-success/10 border border-success/30 flex gap-2 animate-fade-in">
          <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
          <div className="text-sm text-success font-medium">
            ✓ All done! Redirecting to your profile...
          </div>
        </div>
      )}
    </div>
  );
}
