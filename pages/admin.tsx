import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type Row = {
  id: number;
  user_id: string;
  document_number: string | null;
  birth_date: string | null;
  status: 'pending'|'approved'|'rejected';
  created_at: string;
  extra: any;
};

export default function AdminPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all'|'pending'|'approved'|'rejected'>('all');

  async function getToken() {
    const session = await supabase.auth.getSession();
    return session.data.session?.access_token ?? null;
  }

  async function safeJSON(res: Response) {
    const t = await res.text();
    if (!t) return {};
    try { return JSON.parse(t); } catch { return {}; }
  }

  async function load() {
    try {
      setLoading(true); setMsg(null);
      const token = await getToken();
      if (!token) { setMsg('Faça login com um usuário admin.'); return; }

      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (status !== 'all') params.set('status', status);
      params.set('_ts', String(Date.now())); // bust cache

      const res = await fetch('/api/admin/registrations?' + params.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache'
        },
        cache: 'no-store'
      });

      const data: any = await safeJSON(res);
      if (!res.ok) throw new Error(data?.error || `Erro ${res.status}`);

      setRows(data.rows || []);
    } catch (e: any) {
      setMsg(e.message || 'Erro ao carregar');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: number, newStatus: Row['status']) {
    try {
      setLoading(true); setMsg(null);
      const token = await getToken();
      if (!token) { setMsg('Sem token'); return; }

      const res = await fetch('/api/admin/update-registration?_ts=' + Date.now(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache'
        },
        body: JSON.stringify({ id, status: newStatus }),
        cache: 'no-store'
      });

      const data: any = await safeJSON(res);
      if (!res.ok) throw new Error(data?.error || `Erro ${res.status}`);

      await load();
    } catch (e: any) {
      setMsg(e.message || 'Erro ao atualizar');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => rows, [rows]);

  return (
    <div style={{maxWidth: 1100, margin: '20px auto', fontFamily: 'sans-serif'}}>
      <h1>Admin • Cadastros</h1>

      <div style={{display:'flex', gap:8, margin:'12px 0'}}>
        <input placeholder="Buscar por documento..." value={q} onChange={e=>setQ(e.target.value)} />
        <select value={status} onChange={e=>setStatus(e.target.value as any)}>
          <option value="all">Todos</option>
          <option value="pending">Pendentes</option>
          <option value="approved">Aprovados</option>
          <option value="rejected">Reprovados</option>
        </select>
        <button onClick={load} disabled={loading}>Buscar</button>
      </div>

      {msg && <p style={{color:'crimson'}}>{msg}</p>}

      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr>
              <th style={th}>ID</th>
              <th style={th}>Criado em</th>
              <th style={th}>Usuário</th>
              <th style={th}>Nome</th>
              <th style={th}>Documento</th>
              <th style={th}>Telefone</th>
              <th style={th}>Status</th>
              <th style={th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const extra = r.extra || {};
              return (
                <tr key={r.id}>
                  <td style={td}>{r.id}</td>
                  <td style={td}>{new Date(r.created_at).toLocaleString()}</td>
                  <td style={td}><code>{r.user_id.slice(0,8)}…</code></td>
                  <td style={td}>{extra.full_name || '-'}</td>
                  <td style={td}>{r.document_number || '-'}</td>
                  <td style={td}>{extra.phone || '-'}</td>
                  <td style={td}>
                    <span style={{
                      padding:'2px 6px', borderRadius:6,
                      background: r.status==='approved' ? '#c7f9cc'
                        : r.status==='rejected' ? '#ffd6d6'
                        : '#fff3bf'
                    }}>{r.status}</span>
                  </td>
                  <td style={td}>
                    <button onClick={()=>updateStatus(r.id,'approved')} disabled={loading || r.status==='approved'}>Aprovar</button>{' '}
                    <button onClick={()=>updateStatus(r.id,'rejected')} disabled={loading || r.status==='rejected'}>Reprovar</button>{' '}
                    <button onClick={()=>updateStatus(r.id,'pending')} disabled={loading || r.status==='pending'}>Pendente</button>
                  </td>
                </tr>
              );
            })}
            {filtered.length===0 && (
              <tr><td style={td} colSpan={8}>Nenhum cadastro encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { textAlign:'left', borderBottom:'1px solid #ddd', padding:8 };
const td: React.CSSProperties = { borderBottom:'1px solid #eee', padding:8 };
