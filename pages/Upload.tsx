import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type Album = { id: number; slug: string; title: string };

export default function UploadPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [slug, setSlug] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const s = await supabase.auth.getSession();
      const uid = s.data.session?.user?.id ?? null;
      setSessionUserId(uid);
      if (!uid) { setMsg('Faça login para enviar fotos.'); return; }
      const { data } = await supabase.from('albums').select('id, slug, title').order('title');
      setAlbums((data as Album[]) || []);
    })();
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionUserId) { setMsg('Você precisa estar logado.'); return; }
    if (!slug) { setMsg('Selecione uma turma (álbum).'); return; }
    if (!files || !files.length) { setMsg('Selecione pelo menos 1 arquivo.'); return; }

    setMsg(null); setLoading(true);
    try {
      const { data: album, error: albErr } = await supabase
        .from('albums').select('id, slug').eq('slug', slug).maybeSingle();
      if (albErr || !album) throw new Error('Álbum não encontrado.');

      for (const file of Array.from(files)) {
        const path = `${slug}/${sessionUserId}/${Date.now()}-${file.name}`;
        const up = await supabase.storage.from('event_photos').upload(path, file, { upsert: false });
        if (up.error) throw up.error;

        const ins = await supabase.from('photos').insert({
          album_id: album.id, user_id: sessionUserId, storage_path: path, caption: file.name
        });
        if (ins.error) throw ins.error;
      }

      setFiles(null);
      (document.getElementById('fileInput') as HTMLInputElement)?.value = '';
      setMsg('Upload concluído! ✅');
    } catch (e: any) {
      setMsg(e.message || 'Falha no upload.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <h1>Enviar fotos</h1>
        <p style={{margin:'6px 0 16px'}}>Escolha a <b>turma (álbum)</b> e envie suas imagens.</p>

        {!sessionUserId && <p style={{color:'crimson'}}>Você precisa <a href="/login">entrar</a>.</p>}

        <form onSubmit={handleUpload} style={{display:'grid', gap:10}}>
          <select value={slug} onChange={e=>setSlug(e.target.value)} disabled={!albums.length}>
            <option value="">— Selecionar turma —</option>
            {albums.map(a => <option key={a.id} value={a.slug}>{a.title} ({a.slug})</option>)}
          </select>

          <input id="fileInput" type="file" multiple accept="image/*" onChange={e=>setFiles(e.target.files)} />
          {msg && <p style={{color: msg.includes('✅') ? 'green' : 'crimson'}}>{msg}</p>}
          <div style={{display:'flex', gap:8}}>
            <button type="submit" disabled={loading || !sessionUserId}>{loading ? 'Enviando…' : 'Enviar'}</button>
            {slug && <a href={`/galeria/${slug}`} target="_blank" rel="noreferrer">Abrir galeria da turma</a>}
          </div>
        </form>
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { minHeight:'100vh', display:'grid', placeItems:'center', background:'#f6f7fb', padding:16, fontFamily:'system-ui, Arial, sans-serif' };
const card: React.CSSProperties = { width:'100%', maxWidth:640, background:'#fff', borderRadius:12, boxShadow:'0 10px 30px rgba(0,0,0,.06)', padding:24 };
