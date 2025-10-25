import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type Payload = {
  full_name: string;
  phone: string;
  turma_category?: 'bate_bolas' | 'quadrilha' | 'outra' | '';
  turma_name?: string;
  email: string;
  password: string;
};

export default function CadastroRapidoPage() {
  const [form, setForm] = useState<Payload>({
    full_name: '',
    phone: '',
    turma_category: '',
    turma_name: '',
    email: '',
    password: ''
  });
  const [msg, setMsg] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  function onChange<K extends keyof Payload>(key: K, val: Payload[K]) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  function validate(): string | null {
    if (!form.full_name.trim()) return 'Informe seu nome completo.';
    if (!form.phone.trim()) return 'Informe seu telefone.';
    if (!form.email.trim() || !form.email.includes('@')) return 'Informe um e-mail válido.';
    if ((form.password || '').length < 6) return 'Senha precisa ter 6+ caracteres.';
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) return setMsg(v);
    try {
      setLoading(true); setMsg(null);
      const res = await fetch('/api/create-preuser?_ts=' + Date.now(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const txt = await res.text();
      const data = txt ? JSON.parse(txt) : {};
      if (!res.ok) throw new Error(data.error || 'Falha ao salvar');

      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password
      });
      if (signErr) throw signErr;
      location.href = '/';
    } catch (e: any) {
      setMsg(e.message || 'Erro ao enviar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <h1 style={title}>Cadastro Rápido</h1>
        <form onSubmit={onSubmit} style={{display:'grid', gap:10}}>
          <input placeholder="Nome completo *" value={form.full_name} onChange={e=>onChange('full_name', e.target.value)} style={input}/>
          <input placeholder="Telefone *" value={form.phone} onChange={e=>onChange('phone', e.target.value)} style={input}/>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
            <select value={form.turma_category} onChange={e=>onChange('turma_category', e.target.value as any)} style={input}>
              <option value="">— Categoria (opcional) —</option>
              <option value="bate_bolas">Turma de Bate-Bolas</option>
              <option value="quadrilha">Quadrilha Junina</option>
              <option value="outra">Outra</option>
            </select>
            <input placeholder="Nome da turma (opcional)" value={form.turma_name} onChange={e=>onChange('turma_name', e.target.value)} style={input}/>
          </div>
          <input placeholder="E-mail *" value={form.email} onChange={e=>onChange('email', e.target.value)} style={input}/>
          <input placeholder="Senha (6+) *" type="password" value={form.password} onChange={e=>onChange('password', e.target.value)} style={input}/>
          {msg && <p style={{color:'crimson', margin:'6px 0'}}>{msg}</p>}
          <button type="submit" disabled={loading} style={btn}>{loading ? 'Enviando…' : 'Criar conta e continuar'}</button>
          <a href="/login" style={{textAlign:'center', color:'#444'}}>Já tenho conta</a>
        </form>
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { minHeight:'100vh', display:'grid', placeItems:'center', background:'#f6f7fb', padding:16, fontFamily:'system-ui, Arial, sans-serif' };
const card: React.CSSProperties = { width:'100%', maxWidth:540, background:'#fff', borderRadius:12, boxShadow:'0 10px 30px rgba(0,0,0,.06)', padding:24 };
const title: React.CSSProperties = { margin:'0 0 12px 0' };
const input: React.CSSProperties = { width:'100%', padding:'10px 12px', border:'1px solid #ddd', borderRadius:8 };
const btn: React.CSSProperties = { padding:'10px 14px', border:'none', borderRadius:8, background:'#111827', color:'#fff', cursor:'pointer' };
