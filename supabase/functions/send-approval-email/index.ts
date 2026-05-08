import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const DASHBOARD_ROUTES: Record<string, string> = {
  'student': '/school',
  'teacher': '/school',
  'principal': '/school',
  'district_admin': '/district',
  'province_admin': '/province',
  'ministry_admin': '/ministry',
};

const ROLE_LABELS: Record<string, string> = {
  'student': 'شاگرد',
  'teacher': 'معلم',
  'principal': 'مدیر مکتب',
  'district_admin': 'رئیس معارف ولسوالی',
  'province_admin': 'رئیس معارف',
  'ministry_admin': 'وزارت معارف',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT and check caller is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callerId = userData.user.id;

    // Verify caller is admin/ministry
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)
      .in('role', ['admin', 'ministry_admin']);

    if (!roleData?.length) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId, userName, userRole, approverLabel } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user email from auth
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !userData?.user?.email) {
      console.error('Failed to get user email:', userError);
      return new Response(
        JSON.stringify({ error: 'Could not find user' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userEmail = userData.user.email;
    const dashboardRoute = DASHBOARD_ROUTES[userRole] || '/school';
    const appUrl = 'https://schoolbridge-afg.lovable.app';
    const dashboardLink = `${appUrl}${dashboardRoute}`;
    const roleLabel = ROLE_LABELS[userRole] || userRole;

    console.log(`[APPROVAL EMAIL] To: ${userEmail}, Name: ${userName}, Role: ${roleLabel}`);

    const emailContent = {
      to: userEmail,
      subject: '✅ حساب شما تأیید شد',
      body: `
سلام ${userName}،

حساب شما با موفقیت توسط ${approverLabel} تأیید شد.

برای ورود به دشبورد ${roleLabel} خود، روی لینک زیر کلیک کنید:
${dashboardLink}

با احترام،
سیستم مدیریت مکاتب افغانستان
      `.trim(),
    };

    console.log('[APPROVAL EMAIL CONTENT]', JSON.stringify(emailContent, null, 2));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Approval notification logged',
        dashboardLink,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error in send-approval-email:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
