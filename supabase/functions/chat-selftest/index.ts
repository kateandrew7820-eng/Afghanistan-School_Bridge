// TEMPORARY: Phase 2.5A verification harness. Delete after use.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const url = Deno.env.get('SUPABASE_URL')!;
const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const admin = createClient(url, service, { auth: { persistSession: false } });

async function sessionFor(email: string) {
  const pw = `Tmp!${crypto.randomUUID()}`;
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const u = list?.users?.find((x) => x.email?.toLowerCase() === email.toLowerCase());
  if (!u) throw new Error(`no user ${email}`);
  await admin.auth.admin.updateUserById(u.id, { password: pw, email_confirm: true });
  const c = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await c.auth.signInWithPassword({ email, password: pw });
  if (error) throw new Error(`signin ${email}: ${error.message}`);
  return { id: data.user!.id, client: c };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok');
  const results: Array<{ step: string; ok: boolean; detail?: string }> = [];
  const rec = (step: string, ok: boolean, detail?: string) => results.push({ step, ok, detail });
  const created: string[] = [];
  try {
    const body = await req.json().catch(() => ({}));
    if (body.token !== Deno.env.get('DEMO_SEED_TOKEN')) return new Response('forbidden', { status: 403 });

    const A = await sessionFor('salikmasoud1@gmail.com'); // teacher
    const B = await sessionFor('salikmasoud621@gmail.com'); // district admin
    const C = await sessionFor('zahrasalik87@gmail.com'); // province admin
    await admin.from('profiles').update({ status: 'verified' }).in('user_id', [A.id, B.id, C.id]);

    // create group
    const { data: conv, error: convErr } = await A.client
      .from('conversations').insert({ type: 'group', title: 'SelfTest', created_by: A.id }).select().single();
    rec('create group conversation', !convErr, convErr?.message);
    if (!conv) throw new Error('cannot continue');
    created.push(conv.id);

    // creator bootstrap membership
    const { error: bootErr } = await A.client
      .from('conversation_members').insert({ conversation_id: conv.id, user_id: A.id, role: 'admin' });
    rec('creator bootstraps self as admin', !bootErr, bootErr?.message);

    // admin adds member
    const { error: addErr } = await A.client
      .from('conversation_members').insert({ conversation_id: conv.id, user_id: B.id, role: 'member' });
    rec('admin adds member', !addErr, addErr?.message);

    // member cannot add member
    const { error: badAdd } = await B.client
      .from('conversation_members').insert({ conversation_id: conv.id, user_id: C.id, role: 'member' });
    rec('member CANNOT add member', !!badAdd, badAdd?.message ?? 'insert unexpectedly succeeded');

    // admin renames + type flip attempt
    const { error: renErr } = await A.client
      .from('conversations').update({ title: 'Renamed', type: 'direct' }).eq('id', conv.id);
    const { data: afterRen } = await admin.from('conversations').select('*').eq('id', conv.id).single();
    rec('admin renames group', !renErr && afterRen?.title === 'Renamed', renErr?.message);
    rec('type change blocked', afterRen?.type === 'group', `type=${afterRen?.type}`);
    rec('creator immutable', afterRen?.created_by === A.id);

    // member cannot rename
    await B.client.from('conversations').update({ title: 'HACKED' }).eq('id', conv.id);
    const { data: afterHack } = await admin.from('conversations').select('title').eq('id', conv.id).single();
    rec('member CANNOT rename', afterHack?.title === 'Renamed', `title=${afterHack?.title}`);

    // send message (as non-admin member B → tests last_message_at bump)
    const cid = crypto.randomUUID();
    const { data: msg, error: sendErr } = await B.client.from('messages')
      .insert({ conversation_id: conv.id, sender_id: B.id, body: 'hello', client_id: cid }).select().single();
    rec('member sends message', !sendErr, sendErr?.message);
    const { data: afterMsg } = await admin.from('conversations').select('last_message_at, created_at').eq('id', conv.id).single();
    rec('last_message_at bumped by non-admin send',
      !!afterMsg && new Date(afterMsg.last_message_at) > new Date(afterMsg.created_at));

    // duplicate client_id rejected
    const { error: dupErr } = await B.client.from('messages')
      .insert({ conversation_id: conv.id, sender_id: B.id, body: 'hello', client_id: cid });
    rec('duplicate client_id rejected', (dupErr as { code?: string })?.code === '23505', dupErr?.message ?? 'no error');

    // reply
    const { error: repErr } = await A.client.from('messages')
      .insert({ conversation_id: conv.id, sender_id: A.id, body: 're', reply_to_id: msg!.id, client_id: crypto.randomUUID() });
    rec('reply', !repErr, repErr?.message);

    // edit own message + tamper attempt
    await B.client.from('messages')
      .update({ body: 'edited', conversation_id: crypto.randomUUID(), created_at: '2000-01-01T00:00:00Z' })
      .eq('id', msg!.id);
    const { data: afterEdit } = await admin.from('messages').select('*').eq('id', msg!.id).single();
    rec('edit body works', afterEdit?.body === 'edited', `body=${afterEdit?.body}`);
    rec('edited_at stamped', !!afterEdit?.edited_at);
    rec('conversation_id immutable', afterEdit?.conversation_id === conv.id);
    rec('created_at immutable', new Date(afterEdit!.created_at).getUTCFullYear() > 2020);

    // read receipt in-conversation, then outsider attempt
    const { error: readErr } = await A.client.from('message_reads').insert({ message_id: msg!.id, user_id: A.id });
    rec('member marks read', !readErr, readErr?.message);
    const { error: outErr } = await C.client.from('message_reads').insert({ message_id: msg!.id, user_id: C.id });
    rec('outsider CANNOT mark read', !!outErr, outErr?.message ?? 'insert unexpectedly succeeded');

    // reaction + pin
    const { error: reactErr } = await A.client.from('message_reactions')
      .insert({ message_id: msg!.id, conversation_id: conv.id, user_id: A.id, emoji: '👍' });
    rec('react', !reactErr, reactErr?.message);
    const { error: pinErr } = await A.client.from('pinned_messages')
      .insert({ conversation_id: conv.id, message_id: msg!.id, pinned_by: A.id });
    rec('pin', !pinErr, pinErr?.message);

    // soft delete own message
    const { error: delErr } = await B.client.from('messages')
      .update({ deleted_at: new Date().toISOString(), body: null }).eq('id', msg!.id);
    const { data: afterDel } = await admin.from('messages').select('deleted_at, body').eq('id', msg!.id).single();
    rec('soft delete own message', !delErr && !!afterDel?.deleted_at && afterDel?.body === null, delErr?.message);

    // direct conversation
    const { data: dm, error: dmErr } = await A.client
      .from('conversations').insert({ type: 'direct', created_by: A.id }).select().single();
    rec('create direct conversation', !dmErr, dmErr?.message);
    if (dm) {
      created.push(dm.id);
      const { error: m1 } = await A.client.from('conversation_members').insert({ conversation_id: dm.id, user_id: A.id, role: 'admin' });
      const { error: m2 } = await A.client.from('conversation_members').insert({ conversation_id: dm.id, user_id: B.id, role: 'member' });
      rec('direct members added', !m1 && !m2, m1?.message ?? m2?.message);
    }
  } catch (e) {
    rec('fatal', false, (e as Error).message);
  } finally {
    for (const id of created) await admin.from('conversations').delete().eq('id', id);
  }
  const failed = results.filter((r) => !r.ok);
  return new Response(JSON.stringify({ passed: results.length - failed.length, failed: failed.length, results }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
});
