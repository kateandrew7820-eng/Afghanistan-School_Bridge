import { useConfirmation } from '@/contexts/ConfirmationContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

/**
 * Smart Confirmation Dialog Component
 * Displays context-aware confirmation dialogs for critical actions
 * Integrated with the confirmation context system
 */
export function SmartConfirmationDialog() {
  const { showConfirmation, hideConfirmation, isOpen, currentConfig } = useConfirmation();
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!currentConfig) return;

    setIsLoading(true);
    try {
      await Promise.resolve(currentConfig.onConfirm());
      hideConfirmation();
    } catch (error) {
      console.error('Confirmation action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    currentConfig?.onCancel?.();
    hideConfirmation();
  };

  if (!currentConfig) return null;

  const isDangerous = currentConfig.isDangerous || false;
  const confirmLabel = currentConfig.confirmLabel || 'Confirm';
  const cancelLabel = currentConfig.cancelLabel || 'Cancel';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {isDangerous ? (
              <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0" />
            ) : (
              <AlertCircle className="h-6 w-6 text-primary flex-shrink-0" />
            )}
            <DialogTitle>{currentConfig.title}</DialogTitle>
          </div>
        </DialogHeader>

        <DialogDescription className="text-base py-4">
          {currentConfig.description}
        </DialogDescription>

        <DialogFooter className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            variant={isDangerous ? 'destructive' : 'default'}
          >
            {isLoading ? '...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
