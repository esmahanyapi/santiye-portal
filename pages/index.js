import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Dashboard() {
  const [isClient, setIsClient] = useState(false);
  const [projeler, setProjeler] = useState([]);
  const [seciliProje, setSeciliProje] = useState(null);
  const [yeniProjeAdi, setYeniProjeAdi] = useState('');
  const [harcamalar, setHarcamalar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [duzenlenenId, setDuzenlenenId] = useState(null);
  const [form, setForm] = useState({ oge: '', makbuz_no: '', fatura_no: '', tarih: '', kategori: '', aciklama: '', tutar: '' });

  useEffect(() => {
    setIsClient(true);
    projeleriGetir();
  }, []);

  useEffect(() => {
    if (seciliProje) verileriGetir();
  }, [seciliProje]);

  async function projeleriGetir() {
    const { data } = await supabase.from('projeler').select('*').order('created_at', { ascending: true });
    if (data) {
      setProjeler(data);
      if (data.length > 0 && !seciliProje) setSeciliProje(data[0]);
    }
  }

  async function projeEkle(e) {
    e.preventDefault();
    if (!yeniProjeAdi) return;
    const { data, error } = await supabase.from('projeler').insert([{ ad: yeniProjeAdi }]).select();
    if (!error && data) {
      setYeniProjeAdi('');
      await projeleriGetir();
    }
  }

  async function verileriGetir() {
    if (!seciliProje) return;
    const { data } = await supabase.from('harcamalar').select('*').eq('proje_id', seciliProje.id).order('tarih', { ascending: false });
    if (data) setHarcamalar(data);
  }

  async function kaydet(e) {
    e.preventDefault();
    setYukleniyor(true);
    if (duzenlenenId) {
      await supabase.from('harcamalar').update({ ...form, tutar: Number(form.tutar) }).eq('id', duzenlenenId);
      setDuzenlenenId(null);
    } else {
      await supabase.from('harcamalar').insert([{ ...form, proje_id: seciliProje.id, tutar: Number(form.tutar) }]);
    }
    setForm({ oge: '', makbuz_no: '', fatura_no: '', tarih: '', kategori: '', aciklama: '', tutar: '' });
    setYukleniyor(false);
    await verileriGetir();
  }

  if (!isClient) return null;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Esmahan Yapı Yönetim</h1>
      <form onSubmit={projeEkle}>
        <input value={yeniProjeAdi} onChange={e => setYeniProjeAdi(e.target.value)} placeholder="Proje Adı" />
        <button type="submit">Proje Ekle</button>
      </form>
      <div style={{ marginTop: '20px' }}>
        {projeler.map(p => <button key={p.id} onClick={() => setSeciliProje(p)}>{p.ad}</button>)}
      </div>
      {seciliProje && (
        <div style={{ marginTop: '20px' }}>
          <h2>{seciliProje.ad}</h2>
          <form onSubmit={kaydet}>
            <input placeholder="Öğe" value={form.oge} onChange={e => setForm({...form, oge: e.target.value})} />
            <input placeholder="Tutar" type="number" value={form.tutar} onChange={e => setForm({...form, tutar: e.target.value})} />
            <button type="submit">Kaydet</button>
          </form>
        </div>
      )}
    </div>
  );
}
