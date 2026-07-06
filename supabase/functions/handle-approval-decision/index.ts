import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const DASHBOARD_ROUTES: Record<string, string> = {
  student: '/school',
  teacher: '/school',
  principal: '/school',
  district_admin: '/district',
  province_admin: '/province',
  admin: '/ministry',
  ministry_admin: '/ministry',
};

function htmlPage(opts: { title: string; message: string; color: string; icon: string }): Response {
  const html = `<!doctype html>
<html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${opts.title}</title>
<style>
body{margin:0;font-family:Tahoma,Arial,sans-serif;background:linear-gradient(135deg,#eff6ff,#f0fdf4);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;}
.card{background:#fff;border-radius:20px;padding:40px 32px;text-align:center;max-width:420px;width:100%;box-shadow:0 10px 40px rgba(15,23,42,0.08);}
.icon{width:80px;height:80px;border-radius:50%;background:${opts.color}22;color:${opts.color};display:inline-flex;align-items:center;justify-content:center;font-size:44px;margin-bottom:18px;}
h1{margin:0 0 12px;font-size:22px;color:#0f172a;}
p{margin:0;color:#475569;line-height:1.9;font-size:14px;}
.brand{margin-top:24px;font-size:12px;color:#94a3b8;}
</style></head>
<body><div class="card"><div class="icon">${opts.icon}</div><h1>${opts.title}</h1><p>${opts.message}</p><div class="brand">پل آموزش افغانستان</div></div></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const action = url.searchParams.get('action');

    if (!token || !action || !['accept', 'deny', 'delay'].includes(action)) {
      return htmlPage({
        title: 'لینک نامعتبر',
        message: 'این لینک معتبر نیست یا منقضی شده است.',
        color: '#dc2626',
        icon: '✗',
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: reqRow, error: reqErr } = await admin
      .from('approval_requests')
      .select('*')
      .eq('action_token', token)
      .maybeSingle();

    if (reqErr || !reqRow) {
      return htmlPage({
        title: 'درخواست پیدا نشد',
        message: 'این درخواست تأیید در سیستم موجود نیست.',
        color: '#dc2626',
        icon: '✗',
      });
    }

    if (reqRow.status !== 'pending') {
      const statusLabel =
        reqRow.status === 'approved'
          ? 'قبلاً تأیید شده است'
          : reqRow.status === 'denied'
          ? 'قبلاً رد شده است'
          : 'قبلاً به تأخیر افتاده است';
      return htmlPage({
        title: 'قبلاً پاسخ داده شده',
        message: `این درخواست ${statusLabel}. نیازی به اقدام جدید نیست.`,
        color: '#f59e0b',
        icon: 'ℹ',
      });
    }

    const dashboardRoute = DASHBOARD_ROUTES[reqRow.applicant_role] ?? '/school';
    const newStatus = action === 'accept' ? 'approved' : action === 'deny' ? 'denied' : 'delayed';

    // Update approval request
    await admin
      .from('approval_requests')
      .update({
        status: newStatus,
        decided_at: new Date().toISOString(),
        decided_by_email: reqRow.approver_email,
      })
      .eq('id', reqRow.id);

    // Update applicant profile status accordingly
    if (action === 'accept') {
      await admin
        .from('profiles')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', reqRow.applicant_user_id);
    } else if (action === 'deny') {
      await admin
        .from('profiles')
        .update({
          status: 'rejected',
          rejection_reason: `توسط ${reqRow.approver_label} رد شد`,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', reqRow.applicant_user_id);
    }

    // Create in-app notification for the applicant
    const notif =
      action === 'accept'
        ? {
            title: '✅ حساب شما تأیید شد',
            body: `تبریک ${reqRow.applicant_full_name ?? ''}! حساب شما توسط ${reqRow.approver_label} تأیید شد. برای ورود به دشبورد کلیک کنید.`,
            type: 'approval_approved',
            link: dashboardRoute,
          }
        : action === 'deny'
        ? {
            title: '❌ حساب شما تأیید نشد',
            body: `متأسفانه توسط ${reqRow.approver_label} تأیید نشدید. لطفاً با معلومات دقیق دوباره تلاش کنید.`,
            type: 'approval_denied',
            link: '/setup-profile',
          }
        : {
            title: '⏳ بررسی درخواست شما به تأخیر افتاده',
            body: `${reqRow.approver_label} بررسی درخواست شما را به تأخیر انداخته است. لطفاً بعداً دوباره بررسی کنید.`,
            type: 'approval_delayed',
            link: '/pending-verification',
          };

    await admin.from('notifications').insert({
      user_id: reqRow.applicant_user_id,
      ...notif,
    });

    if (action === 'accept') {
      return htmlPage({
        title: 'تأیید انجام شد',
        message: `حساب <strong>${reqRow.applicant_full_name ?? reqRow.applicant_email}</strong> تأیید شد و اعلان برای کاربر ارسال شد.`,
        color: '#16a34a',
        icon: '✓',
      });
    }
    if (action === 'deny') {
      return htmlPage({
        title: 'درخواست رد شد',
        message: `حساب <strong>${reqRow.applicant_full_name ?? reqRow.applicant_email}</strong> رد شد و کاربر مطلع گردید.`,
        color: '#dc2626',
        icon: '✗',
      });
    }
    return htmlPage({
      title: 'به تأخیر افتاد',
      message: `بررسی درخواست <strong>${reqRow.applicant_full_name ?? reqRow.applicant_email}</strong> به تأخیر افتاد.`,
      color: '#f59e0b',
      icon: '⏳',
    });
  } catch (err) {
    console.error('handle-approval-decision error:', err);
    return htmlPage({
      title: 'خطای سیستم',
      message: 'خطایی در پردازش درخواست رخ داد. لطفاً بعداً تلاش کنید.',
      color: '#dc2626',
      icon: '✗',
    });
  }
});
