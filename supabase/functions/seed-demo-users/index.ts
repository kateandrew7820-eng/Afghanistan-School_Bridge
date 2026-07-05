// Seeds 6 demo users, verifies them, assigns roles, and creates minimal demo content.
// Idempotent: existing users are updated, existing content skipped.
// POST with header: x-seed-token: <DEMO_SEED_TOKEN>

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SEED_TOKEN = Deno.env.get('DEMO_SEED_TOKEN')!;

interface UserSpec {
  email: string;
  full_name: string;
  role: 'teacher' | 'principal' | 'district_admin' | 'province_admin' | 'admin' | 'ministry_admin';
  province?: string;
  district?: string;
}

const USERS: UserSpec[] = [
  { email: 'salikmasoud1@gmail.com',      full_name: 'مسعود سالک (معلم)',      role: 'teacher',        province: 'کابل', district: 'کابل' },
  { email: 'kateandrew78.20@gmail.com',   full_name: 'کیت اندرو (مدیر مکتب)',  role: 'principal',      province: 'کابل', district: 'کابل' },
  { email: 'salikmasoud621@gmail.com',    full_name: 'مسعود سالک (ولسوالی)',   role: 'district_admin', province: 'کابل', district: 'کابل' },
  { email: 'zahrasalik87@gmail.com',      full_name: 'زهرا سالک (ولایت)',       role: 'province_admin', province: 'کابل' },
  { email: 'manotofaza@gmail.com',        full_name: 'مانو توفضه (کشوری)',      role: 'admin' },
  { email: 'masoudsalik2024@gmail.com',   full_name: 'مسعود سالک (سرپرست کل)', role: 'ministry_admin' },
];

function randomPassword(len = 16): string {
  const alpha = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const symbols = '!@#$%*';
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < len - 2; i++) out += alpha[bytes[i] % alpha.length];
  out += symbols[bytes[len - 2] % symbols.length];
  out += (bytes[len - 1] % 10).toString();
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const token = req.headers.get('x-seed-token');
  if (!token || token !== SEED_TOKEN) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const results: Array<{ email: string; role: string; password: string; user_id: string; created: boolean }> = [];

  // --- 1) Users
  for (const spec of USERS) {
    let password = randomPassword(16);
    let user_id: string | null = null;
    let created = false;

    // Find existing
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users?.find((u) => u.email?.toLowerCase() === spec.email.toLowerCase());

    if (existing) {
      user_id = existing.id;
      await admin.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
        user_metadata: { full_name: spec.full_name },
      });
    } else {
      const { data: cu, error: ce } = await admin.auth.admin.createUser({
        email: spec.email,
        password,
        email_confirm: true,
        user_metadata: { full_name: spec.full_name },
      });
      if (ce || !cu?.user) {
        return new Response(JSON.stringify({ error: 'createUser failed', email: spec.email, detail: ce?.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      user_id = cu.user.id;
      created = true;
    }

    // Resolve province_id / district_id
    let province_id: string | null = null;
    let district_id: string | null = null;
    if (spec.province) {
      const { data: p } = await admin.from('provinces').select('id').eq('name', spec.province).maybeSingle();
      province_id = p?.id ?? null;
    }
    if (spec.district && province_id) {
      const { data: d } = await admin.from('districts').select('id').eq('name', spec.district).eq('province_id', province_id).maybeSingle();
      district_id = d?.id ?? null;
    }

    // Upsert profile
    await admin.from('profiles').upsert({
      user_id,
      full_name: spec.full_name,
      role: spec.role,
      province: spec.province ?? null,
      district: spec.district ?? null,
      province_id,
      district_id,
      status: 'verified',
      verified_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    // Roles (drop-and-insert to sync)
    await admin.from('user_roles').delete().eq('user_id', user_id);
    await admin.from('user_roles').insert({ user_id, role: spec.role });

    results.push({ email: spec.email, role: spec.role, password, user_id: user_id!, created });
  }

  // --- 2) Demo school (linked to teacher/principal)
  const teacher = results.find((r) => r.role === 'teacher')!;
  const principal = results.find((r) => r.role === 'principal')!;
  const ministry = results.find((r) => r.role === 'ministry_admin')!;

  const { data: kabulProv } = await admin.from('provinces').select('id').eq('name', 'کابل').maybeSingle();
  const { data: kabulDist } = await admin.from('districts').select('id').eq('name', 'کابل').eq('province_id', kabulProv?.id).maybeSingle();

  let schoolId: string;
  const { data: existingSchool } = await admin.from('schools').select('id').eq('code', 'DEMO-KBL-001').maybeSingle();
  if (existingSchool) {
    schoolId = existingSchool.id;
  } else {
    const { data: newSchool } = await admin.from('schools').insert({
      name: 'مکتب نمونه دموی کابل',
      code: 'DEMO-KBL-001',
      province: 'کابل',
      district: 'کابل',
      province_id: kabulProv?.id,
      district_id: kabulDist?.id,
      contact_email: 'demo@schoolbridge.af',
      is_active: true,
    }).select('id').single();
    schoolId = newSchool!.id;
  }

  // Link teacher/principal profiles to this school
  await admin.from('profiles').update({ school_id: schoolId }).in('user_id', [teacher.user_id, principal.user_id]);

  // --- 3) Demo announcement
  const { data: annExists } = await admin.from('announcements').select('id').eq('title', 'به پل آموزش افغانستان خوش آمدید').maybeSingle();
  if (!annExists) {
    await admin.from('announcements').insert({
      title: 'به پل آموزش افغانستان خوش آمدید',
      content: 'این یک اعلان نمایشی است. از این پلتفرم برای ارسال گزارش‌ها و آمار مکتب خود استفاده کنید.',
      priority: 'normal',
      created_by: ministry.user_id,
      is_published: true,
    });
  }

  // --- 4) Demo deadline (30 days out)
  const { data: dlExists } = await admin.from('deadlines').select('id').eq('title', 'ارسال آمار سالانه').maybeSingle();
  if (!dlExists) {
    const due = new Date(); due.setDate(due.getDate() + 30);
    await admin.from('deadlines').insert({
      title: 'ارسال آمار سالانه',
      description: 'لطفاً آمار سالانه مکتب خود را قبل از پایان ماه ارسال کنید.',
      due_date: due.toISOString().slice(0, 10),
      created_by: ministry.user_id,
      is_active: true,
    });
  }

  // --- 5) Demo center document (placeholder path)
  const { data: docExists } = await admin.from('center_documents').select('id').eq('title', 'رهنمای ارسال آمار').maybeSingle();
  if (!docExists) {
    await admin.from('center_documents').insert({
      title: 'رهنمای ارسال آمار',
      description: 'راهنمای گام‌به‌گام برای پر کردن فورم آمار سالانه.',
      file_path: 'center-documents/demo-guide.pdf',
      file_name: 'demo-guide.pdf',
      category: 'guide',
      created_by: ministry.user_id,
    });
  }

  // --- 6) Demo statistics submission (approved)
  const { data: statsExists } = await admin.from('statistics_submissions').select('id').eq('school_id', schoolId).eq('academic_year', '1404').maybeSingle();
  if (!statsExists) {
    await admin.from('statistics_submissions').insert({
      school_id: schoolId,
      submitted_by: teacher.user_id,
      academic_year: '1404',
      total_students: 480,
      male_students: 260,
      female_students: 220,
      total_teachers: 18,
      attendance_rate: 92.5,
      notes: 'داده نمونه دموی',
      status: 'approved',
      current_stage: 'ministry',
      province: 'کابل',
      district: 'کابل',
    });
  }

  // --- 7) Demo report submission (pending) + comment
  const { data: rptExists } = await admin.from('report_submissions').select('id').eq('school_id', schoolId).eq('title', 'گزارش ماهانه نمونه').maybeSingle();
  if (!rptExists) {
    const { data: rpt } = await admin.from('report_submissions').insert({
      school_id: schoolId,
      submitted_by: teacher.user_id,
      title: 'گزارش ماهانه نمونه',
      description: 'گزارش نمونه برای اهداف نمایشی.',
      file_path: 'school-reports/demo-report.pdf',
      file_name: 'demo-report.pdf',
      status: 'pending',
      current_stage: 'district',
      province: 'کابل',
      district: 'کابل',
    }).select('id').single();

    if (rpt) {
      await admin.from('submission_comments').insert({
        submission_id: rpt.id,
        submission_table: 'report_submissions',
        author_user_id: principal.user_id,
        body: 'گزارش تایید شده از سوی مدیر مکتب.',
      });
    }
  }

  return new Response(JSON.stringify({
    ok: true,
    users: results,
    school_id: schoolId,
  }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
