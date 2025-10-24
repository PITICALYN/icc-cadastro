import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate() {
    if (!email || !email.includes('@')) return 'Informe um e-mail válido.';
    if (!pass || pass.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.';
    return null;
  }

  async function signUp() {
    const v = validate();
    if (v) return setMsg(v);
    try {
      setLoading(true); setMsg(null);
      const { error } = await supabase.auth.signUp({ email, password: pass });
      if (error) throw error;
      setMsg('Conta criada! Agora clique em Entrar.');
    } catch (e: any) {
      setMsg(e.message || 'Erro ao criar conta.');
    } finally { setLoading(false); }
  }

  async function signIn() {
    const v = validate();
    if (v) return setMsg(v);
    try {
      setLoading(true); setMsg(null);
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      router.push('/');
    } catch (e: any) {
      setMsg(e.message || 'Erro ao entrar.');
    } finally { setLoading(false); }
  }

  return (
    <div style={{maxWidth: 420, margin: '40px auto', fontFamily: 'sans-serif'}}>
      <h1>Login</h1>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}
             style={{width:'100%', padding:8, margin:'8px 0'}} />
      <input placeholder="Senha" type="password" value={pass} onChange={e=>setPass(e.target.value)}
             style={{width:'100%', padding:8, margin:'8px 0'}} />
      <div style={{display:'flex', gap:8}}>
        <button onClick={signIn} disabled={loading}>Entrar</button>
        <button onClick={signUp} disabled={loading}>Criar conta</button>
      </div>
      {msg && <p style={{color:'crimson'}}>{msg}</p>}
    </div>
  );
}
