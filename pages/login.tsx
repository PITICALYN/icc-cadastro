import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signUp() {
    try {
      setLoading(true);
      setMsg(null);
      const { error } = await supabase.auth.signUp({ email, password: pass });
      if (error) throw error;
      setMsg('Conta criada! Faça login.');
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function signIn() {
    try {
      setLoading(true);
      setMsg(null);
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      router.push('/');
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{maxWidth: 420, margin: '40px auto', fontFamily: 'sans-serif'}}>
      <h1>Login</h1>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:'100%', padding:8, margin:'8px 0'}} />
      <input placeholder="Senha" type="password" value={pass} onChange={e=>setPass(e.target.value)} style={{width:'100%', padding:8, margin:'8px 0'}} />
      <div style={{display:'flex', gap:8}}>
        <button onClick={signIn} disabled={loading}>Entrar</button>
        <button onClick={signUp} disabled={loading}>Criar conta</button>
      </div>
      {msg && <p style={{color:'crimson'}}>{msg}</p>}
    </div>
  );
}
