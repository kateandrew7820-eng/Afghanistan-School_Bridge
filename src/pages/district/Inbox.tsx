import { useAuth } from '@/contexts/AuthContext';
import { VerificationInbox } from '@/components/VerificationInbox';

/**
 * District-scoped verification inbox.
 * Replaces /district/verify and /district/submissions.
 */
export default function DistrictInbox() {
  const { profile } = useAuth();
  return (
    <VerificationInbox
      title="صندوق تأیید ولسوالی"
      subtitle={`تمام ارسال‌های مکاتب ولسوالی ${profile?.district ?? ''} — مرور، فیلتر و تأیید`}
      scope={{ district: profile?.district }}
    />
  );
}
