import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

/**
 * ============================================================
 * 🚧 TEMPORARY TEST MODE: Send Approval Email
 * ============================================================
 * 
 * This edge function sends a confirmation email when a user
 * is approved by the global confirmer (masoudsalik2024@gmail.com).
 * 
 * In production, this should be replaced with proper email
 * infrastructure (Lovable Email or similar).
 * ============================================================
 */

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
    const { userId, userName, userRole, approverLabel } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user email from auth
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !userData?.user?.email) {
      console.error('Failed to get user email:', userError);
      return new Response(
        JSON.stringify({ error: 'Could not find user email', details: userError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userEmail = userData.user.email;
    const dashboardRoute = DASHBOARD_ROUTES[userRole] || '/school';
    
    // Determine the app URL
    const appUrl = Deno.env.get('SUPABASE_URL')?.includes('supabase')
      ? 'https://schoolbridge-afg.lovable.app'
      : 'http://localhost:5173';
    
    const dashboardLink = `${appUrl}${dashboardRoute}`;
    const roleLabel = ROLE_LABELS[userRole] || userRole;

    // Log the approval (since we may not have email infra yet)
    console.log(`[APPROVAL EMAIL] To: ${userEmail}, Name: ${userName}, Role: ${roleLabel}`);

    // For now, log the email content (email sending requires domain setup)
    const emailContent = {
      to: userEmail,
      subject: '✅ حساب شما تأیید شد',
      body: `
سلام ${userName}،

حساب شما با موفقیت توسط ${approverLabel} تأیید شد.

برای ورود به داشبورد ${roleLabel} خود، روی لینک زیر کلیک کنید:
${dashboardLink}

اگر این ایمیل را انتظار نداشتید، لطفاً آن را نادیده بگیرید.

با احترام،
سیستم مدیریت مکاتب افغانستان
      `.trim(),
    };

    console.log('[APPROVAL EMAIL CONTENT]', JSON.stringify(emailContent, null, 2));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Approval notification logged',
        emailTo: userEmail,
        dashboardLink,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error in send-approval-email:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
