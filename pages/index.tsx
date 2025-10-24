import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const RegistrationForm = dynamic(() => import('../components/RegistrationForm'), { ssr: false });

export default function Home() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    location.href = '/login';
  }

  return (
    <div style={{padding:20, fontFamily:'sans-serif'}}>
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h1>ICC Cadastro</h1>
        <nav>
          {email ? (
            <>
              <span style={{marginRight:12}}>Logado: {email}</span>
              <button onClick={signOut}>Sair</button>
            </>
          ) : (
            <Link href="/login">Login</Link>
          )}
        </nav>
      </header>
      <main>
        <RegistrationForm />
      </main>
    </div>
  );
}
