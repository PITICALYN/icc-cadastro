// pages/api/admin/update-registration.ts
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
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  try {
    await assertIsAdmin(req);
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { id, status } = req.body || {};
    if (!id || !['approved','rejected','pending'].includes(status)) {
      return res.status(400).json({ error: 'invalid payload' });
    }

    const { error } = await admin.from('registrations').update({ status }).eq('id', id);
    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    const msg = e?.message || 'error';
    const code = msg === 'forbidden' ? 403 : (msg === 'missing token' || msg === 'invalid token') ? 401 : 500;
    return res.status(code).json({ error: msg });
  }
}
