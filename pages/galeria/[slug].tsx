import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';

type Photo = { id: number; storage_path: string; caption: string; created_at: string };

export default function GaleriaPorSlug() {
  const router = useRouter();
  const { slug } = router.query as { slug?: string };
  const [title, setTitle] = useState<string>('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        setMsg(null);
        const { data: album, error: albErr } = await supabase
          .from('albums').select('id, title').eq('slug', slug).maybeSingle();
        if (albErr || !album) { setMsg('Turma não encontrada.'); return; }
        setTitle(album.title);

        const { data, error } = await supabase
          .from('photos')
          .select('id, storage_path, caption, created_at')
          .eq('album_id', album.id)
          .order('created_at', { ascending: false });
        if (error) throw error;

        setPhotos(data as Photo[]);
      } catch (e: any) {
        setMsg(e.message || 'Erro ao carregar galeria.');
      }
    })();
  }, [slug]);

  return (
    <div style={{maxWidth:1080, margin:'20px auto', padding:'0 16px', fontFamily:'system-ui, Arial, sans-serif'}}>
      <h1 style={{marginBottom:8}}>Galeria • {title || slug}</h1>
      <p style={{marginTop:0, color:'#666'}}>Veja todas as fotos desta turma.</p>
      {msg && <p style={{color:'crimson'}}>{msg}</p>}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:12}}>
        {photos.map(p => {
          const url = supabase.storage.from('event_photos').getPublicUrl(p.storage_path).data.publicUrl;
          return (
            <figure key={p.id} style={{margin:0, border:'1px solid #eee', borderRadius:10, overflow:'hidden'}}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={p.caption || ''} style={{display:'block', width:'100%', height:200, objectFit:'cover'}}/>
              <figcaption style={{padding:'8px 10px', fontSize:12, color:'#555'}}>
                {new Date(p.created_at).toLocaleString()} — {p.caption}
              </figcaption>
            </figure>
          );
        })}
      </div>
      {photos.length === 0 && !msg && <p>Nenhuma foto ainda.</p>}
    </div>
  );
}
