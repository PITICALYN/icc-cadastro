import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE!;

const admin = createClient(url, service);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { user_id, document_number, birth_date, address, emergency_contact, extra } = req.body || {};

    if (!user_id) return res.status(401).json({ error: 'user_id required' });

    const { error } = await admin.from('registrations').insert({
      user_id, document_number, birth_date, address, emergency_contact, extra
    });

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
