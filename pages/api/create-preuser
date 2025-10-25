import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE!;
const admin = createClient(url, service);

function slugify(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    if (req.method !== 'POST') return res.status(405).end(JSON.stringify({ error: 'Method not allowed' }));

    const { full_name, phone, document_number, turma_category = '', turma_name = '', email, password } = req.body || {};
    if (!full_name || !phone || !email || !password) {
      return res.status(400).end(JSON.stringify({ error: 'Campos obrigatórios faltando' }));
    }

    // cria usuário confirmado (sem precisar de confirmação por e-mail)
    const { data: createData, error: createErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true
    });
    if (createErr) return res.status(400).end(JSON.stringify({ error: createErr.message }));
    const user = createData.user;
    if (!user) return res.status(500).end(JSON.stringify({ error: 'Falha ao criar usuário' }));

    // garante profile como 'member'
    await admin.from('icc_profiles').upsert({
      user_id: user.id, full_name, phone, role: 'member'
    }, { onConflict: 'user_id' });

    // salva pré-cadastro
    await admin.from('pre_registrations').insert({
      full_name, phone, document_number,
      turma: turma_category ? `${turma_category}:${turma_name || ''}` : null,
      answers: { full_name, phone, document_number, turma_category, turma_name }
    });

    // cria/garante álbum quando for bate_bolas/quadrilha
    if (turma_category === 'bate_bolas' || turma_category === 'quadrilha') {
      const slug = `${turma_category}__${slugify(turma_name || 'geral')}`;
      await admin.from('albums').upsert({
        slug,
        title: turma_name || (turma_category === 'bate_bolas' ? 'Bate-Bolas' : 'Quadrilha'),
        created_by: user.id
      }, { onConflict: 'slug' });
    }

    return res.status(200).end(JSON.stringify({ ok: true, user_id: user.id }));
  } catch (e: any) {
    return res.status(500).end(JSON.stringify({ error: e?.message || 'error' }));
  }
}
