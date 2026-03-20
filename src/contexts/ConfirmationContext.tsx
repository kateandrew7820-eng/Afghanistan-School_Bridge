import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface ConfirmationConfig {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean; // Changes button color to red
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

interface ConfirmationContextType {
  showConfirmation: (config: ConfirmationConfig) => void;
  hideConfirmation: () => void;
  isOpen: boolean;
  currentConfig: ConfirmationConfig | null;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<ConfirmationConfig | null>(null);

  const showConfirmation = useCallback((config: ConfirmationConfig) => {
    setCurrentConfig(config);
    setIsOpen(true);
  }, []);

  const hideConfirmation = useCallback(() => {
    setIsOpen(false);
    setCurrentConfig(null);
  }, []);

  return (
    <ConfirmationContext.Provider value={{ showConfirmation, hideConfirmation, isOpen, currentConfig }}>
      {children}
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within ConfirmationProvider');
  }
  return context;
}

/**
 * Preset confirmation templates for common actions
 */
export const ConfirmationTemplates = {
  submitReport: (onConfirm: () => void | Promise<void>) => ({
    title: 'Submit Report?',
    description: 'Once submitted, this report cannot be edited. Please review all information before confirming.',
    confirmLabel: 'Submit',
    isDangerous: false,
    onConfirm,
  }),

  deleteData: (itemName: string, onConfirm: () => void | Promise<void>) => ({
    title: 'Delete Permanently?',
    description: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    isDangerous: true,
    onConfirm,
  }),

  publishAnnouncement: (onConfirm: () => void | Promise<void>) => ({
    title: 'Publish Announcement?',
    description: 'This announcement will be visible to all users immediately.',
    confirmLabel: 'Publish',
    isDangerous: false,
    onConfirm,
  }),

  submitForm: (formName: string, onConfirm: () => void | Promise<void>) => ({
    title: `Submit ${formName}?`,
    description: 'Please ensure all required fields are filled correctly. Review your information before submitting.',
    confirmLabel: 'Submit',
    isDangerous: false,
    onConfirm,
  }),

  approveUser: (userName: string, onConfirm: () => void | Promise<void>) => ({
    title: 'Approve User?',
    description: `This will grant access to ${userName}. They will receive a verification email.`,
    confirmLabel: 'Approve',
    isDangerous: false,
    onConfirm,
  }),

  rejectUser: (userName: string, onConfirm: () => void | Promise<void>) => ({
    title: 'Reject User?',
    description: `${userName} will be notified of the rejection. They can resubmit after revision.`,
    confirmLabel: 'Reject',
    cancelLabel: 'Cancel',
    isDangerous: true,
    onConfirm,
  }),

  changeRole: (newRole: string, onConfirm: () => void | Promise<void>) => ({
    title: 'Change User Role?',
    description: `This will change the user's access permissions to ${newRole}. They will need to re-login.`,
    confirmLabel: 'Change Role',
    isDangerous: false,
    onConfirm,
  }),

  logOut: (onConfirm: () => void | Promise<void>) => ({
    title: 'Log Out?',
    description: 'You will be logged out of the system. Any unsaved changes will be lost.',
    confirmLabel: 'Log Out',
    cancelLabel: 'Cancel',
    isDangerous: true,
    onConfirm,
  }),
};
