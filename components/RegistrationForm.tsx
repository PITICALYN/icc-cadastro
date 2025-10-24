'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../lib/supabaseClient';

const schema = z.object({
  full_name: z.string().min(3, 'Informe seu nome'),
  document_number: z.string().min(5, 'Documento inválido'),
  phone: z.string().min(8, 'Telefone inválido'),
  birth_date: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function RegistrationForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema)
  });
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const id = data?.user?.id ?? null;
      setUserId(id);
      if (id) {
        supabase.from('icc_profiles').upsert({ user_id: id, full_name: '', phone: '' }, { onConflict: 'user_id' });
      }
    });
  }, []);

  async function onSubmit(values: FormData) {
    if (!userId) {
      alert('Faça login antes de enviar o cadastro.');
      return;
    }
    const res = await fetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({
        user_id: userId,
        document_number: values.document_number,
        birth_date: values.birth_date,
        address: { street: '', number: '' },
        emergency_contact: {},
        extra: { full_name: values.full_name, phone: values.phone }
      })
    });
    const data = await res.json();
    if (data.error) {
      alert('Erro: ' + data.error);
      return;
    }
    alert('Cadastro enviado com sucesso!');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{maxWidth:520, margin:'20px auto', fontFamily:'sans-serif', display:'grid', gap:10}}>
      <h2>Cadastro ICC</h2>
      <input placeholder="Nome completo" {...register('full_name')} />
      {errors.full_name && <small style={{color:'crimson'}}>{errors.full_name.message}</small>}

      <input placeholder="Documento (CPF/RG)" {...register('document_number')} />
      {errors.document_number && <small style={{color:'crimson'}}>{errors.document_number.message}</small>}

      <input placeholder="Telefone" {...register('phone')} />
      {errors.phone && <small style={{color:'crimson'}}>{errors.phone.message}</small>}

      <input type="date" {...register('birth_date')} />

      <div style={{display:'flex', gap:8}}>
        <button type="submit" disabled={isSubmitting}>Enviar</button>
        <a href="/login" style={{alignSelf:'center'}}>Ir para Login</a>
      </div>
    </form>
  );
}
