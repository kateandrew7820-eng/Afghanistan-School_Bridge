import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';

interface PendingUser {
  id: string;
  user_id: string;
  full_name: string | null;
  role: string | null;
  school_name: string | null;
  district: string | null;
  province: string | null;
  phone_number: string | null;
  status: string;
  created_at: string;
}

export interface VerificationPanelProps {
  /**
   * Filter by role - only show users with this role
   * e.g., 'student' (verified by teacher), 'teacher' (verified by principal)
   */
  filterRole?: string;
  /**
   * Filter by district - only show users from this district
   */
  filterDistrict?: string;
  /**
   * Filter by province - only show users from this province
   */
  filterProvince?: string;
  /**
   * Max results to display
   */
  limit?: number;
}

export function VerificationPanel({
  filterRole,
  filterDistrict,
  filterProvince,
  limit = 10,
}: VerificationPanelProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [rejectionMode, setRejectionMode] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchPendingUsers();
  }, [filterRole, filterDistrict, filterProvince]);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch with all fields including new ones from migration
      let query: any = supabase
        .from('profiles')
        .select('id, user_id, full_name, role, school_name, district, province, phone_number, status, created_at')
        .eq('status', 'pending_verification');

      if (filterRole) {
        query = query.eq('role', filterRole);
      }
      if (filterDistrict) {
        query = query.eq('district', filterDistrict);
      }
      if (filterProvince) {
        query = query.eq('province', filterProvince);
      }

      const { data, error: fetchError } = await query
        .order('created_at', { ascending: true })
        .limit(limit) as any;

      if (fetchError) {
        // If columns don't exist yet, fetch with basic fields
        if (fetchError.message?.includes("column") && fetchError.message?.includes("does not exist")) {
          const { data: basicData, error: basicError } = await supabase
            .from('profiles')
            .select('id, user_id, full_name, district, province, created_at')
            .limit(limit)
            .order('created_at', { ascending: true }) as any;
          
          if (basicError) throw basicError;
          
          // Map to PendingUser with defaults
          const mappedUsers = ((basicData || []) as any[]).map(user => ({
            ...user,
            role: null,
            school_name: null,
            phone_number: null,
            status: 'pending_verification',
          })) as PendingUser[];
          
          setPendingUsers(mappedUsers);
          return;
        }
        throw fetchError;
      }

      setPendingUsers((data || []) as unknown as PendingUser[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطا در بارگذاری کاربران';
      console.error('Fetch error:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string, profileId: string) => {
    if (!user) return;

    setProcessingId(userId);
    try {
      // Update profile status
      const updateData: any = {
        verified_by_user_id: user.id,
        verified_at: new Date().toISOString(),
      };
      
      // Only add 'status' if migration has been deployed
      // This prevents errors when new columns don't exist yet
      updateData.status = 'verified';
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData as any)
        .eq('id', profileId);

      if (updateError) {
        throw updateError;
      }

      // Also update user_roles if not already set
      const roleToSet = pendingUsers.find(u => u.user_id === userId)?.role;
      if (roleToSet) {
        const validRoles = ['teacher', 'school', 'principal', 'district_admin', 'province_admin', 'ministry_admin', 'admin'];
        const isValidRole = validRoles.includes(roleToSet as string);
        
        if (isValidRole) {
          const { error: roleError } = await supabase
            .from('user_roles')
            .upsert(
              {
                user_id: userId,
                role: roleToSet as any,
              } as any,
              { onConflict: 'user_id' }
            );

          if (roleError) {
            console.warn('Role update warning:', roleError);
          }
        }
      }

      toast({
        title: 'موفقیت',
        description: 'کاربر تایید شد',
      });

      // Remove from pending list
      setPendingUsers(prev => prev.filter(u => u.user_id !== userId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطا در تایید کاربر';
      console.error('Approval error:', err);
      toast({
        title: 'خطا',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId: string, profileId: string) => {
    if (!user) return;

    const reason = rejectionReasons[userId];
    if (!reason?.trim()) {
      toast({
        title: 'خطا',
        description: 'لطفاً دلیل رد را وارد کنید',
        variant: 'destructive',
      });
      return;
    }

    setProcessingId(userId);
    try {
      const updateData: any = {
        verified_by_user_id: user.id,
        verified_at: new Date().toISOString(),
        rejection_reason: reason,
      };
      
      // Only add 'status' if migration has been deployed
      updateData.status = 'rejected';
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData as any)
        .eq('id', profileId);

      if (error) {
        throw error;
      }

      toast({
        title: 'موفقیت',
        description: 'درخواست رد شد',
      });

      // Remove from pending list
      setPendingUsers(prev => prev.filter(u => u.user_id !== userId));
      setRejectionReasons(prev => {
        const { [userId]: _, ...rest } = prev;
        return rest;
      });
      setRejectionMode(prev => {
        const { [userId]: _, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطا در رد کردن درخواست';
      console.error('Rejection error:', err);
      toast({
        title: 'خطا',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>تایید کاربران</CardTitle>
          <CardDescription>در حال بارگذاری...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">خطا</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchPendingUsers} className="mt-4" variant="outline">
            تلاش دوباره
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (pendingUsers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>تایید کاربران</CardTitle>
          <CardDescription>
            {filterRole || filterDistrict || filterProvince
              ? 'کاربری برای تایید وجود ندارد'
              : 'هیچ کاربر در حال انتظار تایید وجود ندارد'}
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          ✓ همه کاربران تایید شده‌اند
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>تایید کاربران</CardTitle>
        <CardDescription>
          {pendingUsers.length} کاربر در انتظار تایید
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingUsers.map(pendingUser => (
          <div key={pendingUser.id} className="border rounded-lg p-4 space-y-3">
            {/* User Info */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-lg">{pendingUser.full_name || 'نام نامشخص'}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">نقش:</span>
                    <p className="font-medium">{pendingUser.role}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">مدرسه:</span>
                    <p className="font-medium">{pendingUser.school_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">منطقه:</span>
                    <p className="font-medium">{pendingUser.district}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">استان:</span>
                    <p className="font-medium">{pendingUser.province}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">تلفن:</span>
                    <p className="font-medium">{pendingUser.phone_number || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">تاریخ درخواست:</span>
                    <p className="font-medium text-xs">
                      {new Date(pendingUser.created_at).toLocaleDateString('fa-AF')}
                    </p>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="ml-4 h-fit">
                در انتظار
              </Badge>
            </div>

            {/* Rejection Mode - Text Input for Reason */}
            {rejectionMode[pendingUser.user_id] && (
              <div className="bg-red-50 border border-red-200 rounded p-3 space-y-2">
                <Label htmlFor={`reason-${pendingUser.id}`} className="text-sm">
                  دلیل رد (الزامی)
                </Label>
                <textarea
                  id={`reason-${pendingUser.id}`}
                  value={rejectionReasons[pendingUser.user_id] || ''}
                  onChange={(e) => {
                    setRejectionReasons(prev => ({
                      ...prev,
                      [pendingUser.user_id]: e.target.value,
                    }));
                  }}
                  placeholder="مثال: اطلاعات ناقص است..."
                  className="w-full px-3 py-2 border border-input rounded-md text-sm"
                  rows={3}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end pt-2">
              {rejectionMode[pendingUser.user_id] ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRejectionMode(prev => ({
                        ...prev,
                        [pendingUser.user_id]: false,
                      }));
                    }}
                    disabled={processingId === pendingUser.user_id}
                  >
                    لغو
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleReject(pendingUser.user_id, pendingUser.id)}
                    disabled={processingId === pendingUser.user_id}
                  >
                    {processingId === pendingUser.user_id ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        در حال پردازش...
                      </>
                    ) : (
                      <>
                        <X className="ml-2 h-4 w-4" />
                        رد کردن
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRejectionMode(prev => ({
                        ...prev,
                        [pendingUser.user_id]: true,
                      }));
                    }}
                    disabled={processingId === pendingUser.user_id}
                  >
                    رد کردن
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleApprove(pendingUser.user_id, pendingUser.id)}
                    disabled={processingId === pendingUser.user_id}
                  >
                    {processingId === pendingUser.user_id ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        در حال پردازش...
                      </>
                    ) : (
                      <>
                        <Check className="ml-2 h-4 w-4" />
                        تایید کردن
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
