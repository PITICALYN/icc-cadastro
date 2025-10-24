// pages/api/admin/registrations.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE!;
const admin = createClient(url, service);

async function assertIsAdmin(req: NextApiRequest) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : null;
  if (!token) throw new Error('missing token');

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData.user) throw new Error('invalid token');

  const uid = userData.user.id;
  const { data: prof } = await admin.from('icc_profiles').select('role').eq('user_id', uid).maybeSingle();
  if (!prof || !['admin','moderator'].includes(prof.role ?? '')) throw new Error('forbidden');
  return uid;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');

  try {
    await assertIsAdmin(req);

    const { status = 'all', q = '', limit = '100' } = req.query as Record<string,string>;
    let query = admin.from('registrations')
      .select('id, user_id, document_number, birth_date, status, created_at, extra')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit || '100'));

    if (status !== 'all') query = query.eq('status', status);
    if (q) query = query.ilike('document_number', `%${q}%`);

    const { data, error } = await query;
    if (error) return res.status(400).end(JSON.stringify({ error: error.message }));
    return res.status(200).end(JSON.stringify({ rows: data }));
  } catch (e: any) {
    const msg = e?.message || 'error';
    const code = msg === 'forbidden' ? 403 : (msg === 'missing token' || msg === 'invalid token') ? 401 : 500;
    return res.status(code).end(JSON.stringify({ error: msg }));
  }
}
