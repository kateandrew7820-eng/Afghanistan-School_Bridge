import { useAuth } from '@/contexts/AuthContext';
import { VerificationInbox } from '@/components/VerificationInbox';

/**
 * Province-scoped verification inbox.
 * Replaces /province/submissions with the shared inbox UI.
 */
export default function ProvinceInbox() {
  const { profile } = useAuth();
  return (
    <VerificationInbox
      title="صندوق تأیید ولایت"
      subtitle={`تمام ارسال‌های ولسوالی‌های ولایت ${profile?.province ?? ''}`}
      scope={{ province: profile?.province }}
    />
  );
}
