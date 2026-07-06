import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APPROVER_ROUTING: Record<string, { email: string; label: string }> = {
  student: { email: 'kateandrew78.20@gmail.com', label: 'مدیر مکتب' },
  teacher: { email: 'kateandrew78.20@gmail.com', label: 'مدیر مکتب' },
  principal: { email: 'salikmasoud621@gmail.com', label: 'رئیس معارف ولسوالی' },
  district_admin: { email: 'zahrasalik87@gmail.com', label: 'رئیس معارف ولایت' },
  province_admin: { email: 'manotofaza@gmail.com', label: 'مدیر ملی' },
  admin: { email: 'masoudsalik2024@gmail.com', label: 'وزیر معارف' },
  ministry_admin: { email: 'masoudsalik2024@gmail.com', label: 'مالک پلتفرم' },
};

const APP_URL = 'https://schoolbridge-afg.lovable.app';

function faDate(d: Date): string {
  try {
    return new Intl.DateTimeFormat('fa-AF', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

function roleLabel(role: string): string {
  return (
    {
      student: 'شاگرد',
      teacher: 'معلم',
      principal: 'مدیر مکتب',
      district_admin: 'رئیس معارف ولسوالی',
      province_admin: 'رئیس معارف ولایت',
      admin: 'مدیر ملی',
      ministry_admin: 'وزیر معارف',
    }[role] ?? role
  );
}

function buildEmailHtml(params: {
  fullName: string;
  role: string;
  school: string;
  district: string;
  province: string;
  phone: string;
  submittedAt: string;
  approverLabel: string;
  token: string;
  functionsBase: string;
}): string {
  const { fullName, role, school, district, province, phone, submittedAt, approverLabel, token, functionsBase } = params;
  const link = (action: string) => `${functionsBase}/handle-approval-decision?token=${token}&action=${action}`;
  return `<!doctype html>
<html lang="fa" dir="rtl">
<head><meta charset="utf-8"><title>درخواست تأیید حساب</title></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:Tahoma,Arial,sans-serif;color:#111;">
  <div style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 18px rgba(15,23,42,0.06);">
    <div style="background:linear-gradient(135deg,#0ea5e9,#2563eb);padding:20px 24px;color:#fff;">
      <h1 style="margin:0;font-size:20px;">درخواست تأیید حساب کاربری جدید</h1>
      <p style="margin:6px 0 0;font-size:13px;opacity:.9;">پل آموزش افغانستان — پورتال داده‌های مکاتب</p>
    </div>
    <div style="padding:24px;">
      <p style="margin:0 0 14px;font-size:14px;line-height:1.9;">
        سلام <strong>${approverLabel}</strong>،<br/>
        یک کاربر جدید در پلتفرم ثبت‌نام کرده است و منتظر تأیید شما می‌باشد.
      </p>

      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:14px 0;font-size:14px;">
        <tr><td style="padding:8px 0;color:#64748b;width:120px;">نام مکمل:</td><td style="padding:8px 0;font-weight:600;">${fullName}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">مقام:</td><td style="padding:8px 0;font-weight:600;">${roleLabel(role)}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">نام مکتب:</td><td style="padding:8px 0;">${school}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">ولسوالی:</td><td style="padding:8px 0;">${district}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">ولایت:</td><td style="padding:8px 0;">${province}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">شماره تماس:</td><td style="padding:8px 0;">${phone}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">زمان درخواست:</td><td style="padding:8px 0;">${submittedAt}</td></tr>
      </table>

      <p style="margin:18px 0 10px;font-size:14px;">لطفاً یکی از گزینه‌های زیر را انتخاب کنید:</p>

      <table cellpadding="0" cellspacing="0" style="width:100%;margin:8px 0 4px;">
        <tr>
          <td align="center" style="padding:6px;">
            <a href="${link('accept')}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;font-size:14px;min-width:120px;">✓ تأیید</a>
          </td>
          <td align="center" style="padding:6px;">
            <a href="${link('deny')}" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;font-size:14px;min-width:120px;">✗ رد</a>
          </td>
          <td align="center" style="padding:6px;">
            <a href="${link('delay')}" style="display:inline-block;background:#f59e0b;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;font-size:14px;min-width:120px;">⏳ تأخیر</a>
          </td>
        </tr>
      </table>

      <p style="margin:22px 0 0;font-size:11px;color:#94a3b8;line-height:1.7;">
        این ایمیل به صورت خودکار توسط سیستم پل آموزش افغانستان ارسال شده است. لطفاً به آن پاسخ ندهید.
      </p>
    </div>
  </div>
</body>
</html>`;
}

async function trySendEmail(to: string, subject: string, html: string): Promise<{ sent: boolean; via?: string; error?: string }> {
  // Try Lovable Emails (send-transactional-email) first if scaffolded
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  // Attempt 1: Resend via connector gateway if key exists
  const lovableKey = Deno.env.get('LOVABLE_API_KEY');
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (lovableKey && resendKey) {
    try {
      const r = await fetch('https://connector-gateway.lovable.dev/resend/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lovableKey}`,
          'X-Connection-Api-Key': resendKey,
        },
        body: JSON.stringify({
          from: 'SchoolBridge <onboarding@resend.dev>',
          to: [to],
          subject,
          html,
        }),
      });
      if (r.ok) return { sent: true, via: 'resend' };
      const t = await r.text();
      console.warn('resend send failed:', r.status, t);
    } catch (e) {
      console.warn('resend error:', e);
    }
  }

  // Attempt 2: send-transactional-email edge function (Lovable Emails)
  try {
    const r = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        templateName: 'approval-request',
        recipientEmail: to,
        subject,
        htmlContent: html,
      }),
    });
    if (r.ok) return { sent: true, via: 'lovable-emails' };
    const t = await r.text();
    return { sent: false, error: `send-transactional-email: ${r.status} ${t}` };
  } catch (e) {
    return { sent: false, error: `send-transactional-email error: ${String(e)}` };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const user = userData.user;

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Load profile
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, role, school_name, district, province, phone_number')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile?.role) {
      return new Response(JSON.stringify({ error: 'Profile not set up' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Idempotency: reuse existing pending approval request
    const { data: existing } = await admin
      .from('approval_requests')
      .select('*')
      .eq('applicant_user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const approver = APPROVER_ROUTING[profile.role] ?? APPROVER_ROUTING.teacher;

    let record = existing;
    if (!record) {
      const { data: inserted, error: insErr } = await admin
        .from('approval_requests')
        .insert({
          applicant_user_id: user.id,
          applicant_email: user.email ?? '',
          applicant_full_name: profile.full_name,
          applicant_role: profile.role,
          school_name: profile.school_name,
          district: profile.district,
          province: profile.province,
          phone_number: profile.phone_number,
          approver_email: approver.email,
          approver_label: approver.label,
        })
        .select('*')
        .single();
      if (insErr) {
        return new Response(JSON.stringify({ error: insErr.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      record = inserted;
    }

    // Send the email
    const functionsBase = `${Deno.env.get('SUPABASE_URL')}/functions/v1`;
    const html = buildEmailHtml({
      fullName: profile.full_name ?? user.email ?? 'کاربر',
      role: profile.role,
      school: profile.school_name ?? 'ثبت نشده',
      district: profile.district ?? 'ثبت نشده',
      province: profile.province ?? 'ثبت نشده',
      phone: profile.phone_number ?? 'ثبت نشده',
      submittedAt: faDate(new Date(record!.created_at)),
      approverLabel: approver.label,
      token: record!.action_token,
      functionsBase,
    });

    const sendResult = await trySendEmail(
      approver.email,
      `درخواست تأیید حساب — ${profile.full_name ?? user.email}`,
      html
    );

    if (sendResult.sent) {
      await admin
        .from('approval_requests')
        .update({ email_sent_at: new Date().toISOString() })
        .eq('id', record!.id);
    } else {
      console.warn('[request-approval] email not sent:', sendResult.error);
    }

    return new Response(
      JSON.stringify({
        success: true,
        approver_label: approver.label,
        approver_email: approver.email,
        request_id: record!.id,
        email_sent: sendResult.sent,
        email_error: sendResult.error,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('request-approval error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
