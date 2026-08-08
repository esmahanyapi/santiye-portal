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
  
  // Proje düzenleme için state'ler
  const [duzenlenenProjeId, setDuzenlenenProjeId] = useState(null);
  const [duzenlenenProjeAdi, setDuzenlenenProjeAdi] = useState('');

  const [harcamalar, setHarcamalar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [duzenlenenId, setDuzenlenenId] = useState(null);
  const formBaslangic = { oge: '', makbuz_no: '', fatura_no: '', tarih: '', kategori: '', aciklama: '', tutar: '' };
  const [form, setForm] = useState(formBaslangic);

  useEffect(() => {
    setIsClient(true);
    projeleriGetir();
  }, []);

  useEffect(() => {
    if (seciliProje) {
      verileriGetir();
      setForm(formBaslangic);
      setDuzenlenenId(null);
    }
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
    if (!yeniProjeAdi.trim()) return;
    const { data, error } = await supabase.from('projeler').insert([{ ad: yeniProjeAdi }]).select();
    if (!error && data) {
      setYeniProjeAdi('');
      await projeleriGetir();
    }
  }

  // PROJE YÖNETİMİ
  async function projeSil(id, ad) {
    if (window.confirm(`"${ad}" projesini ve içindeki TÜM harcamaları silmek istediğinize emin misiniz?`)) {
      await supabase.from('harcamalar').delete().eq('proje_id', id); // Önce harcamaları sil
      await supabase.from('projeler').delete().eq('id', id); // Sonra projeyi sil
      setSeciliProje(null);
      await projeleriGetir();
    }
  }

  async function projeGuncelle(id) {
    await supabase.from('projeler').update({ ad: duzenlenenProjeAdi }).eq('id', id);
    setDuzenlenenProjeId(null);
    await projeleriGetir();
  }

  // HARCAMA İŞLEMLERİ
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
    setForm(formBaslangic);
    setYukleniyor(false);
    await verileriGetir();
  }

  async function sil(id) {
    if (window.confirm("Bu kaydı silmek istediğinize emin misiniz?")) {
      await supabase.from('harcamalar').delete().eq('id', id);
      await verileriGetir();
    }
  }

  function duzenlemeyeBasla(islem) {
    setForm({ oge: islem.oge || '', makbuz_no: islem.makbuz_no || '', fatura_no: islem.fatura_no || '', tarih: islem.tarih || '', kategori: islem.kategori || '', aciklama: islem.aciklama || '', tutar: islem.tutar || '' });
    setDuzenlenenId(islem.id);
  }

  if (!isClient) return null;

  const toplamHarcama = harcamalar.reduce((toplam, item) => toplam + Number(item.tutar), 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: '280px', backgroundColor: '#111827', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '20px', borderBottom: '1px solid #374151', paddingBottom: '15px', marginTop: 0 }}>Esmahan Yapı</h2>
        <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '-5px', marginBottom: '20px', fontWeight: 'bold' }}>PROJELERİMİZ</p>
        
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {projeler.map(proje => (
            <li key={proje.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', backgroundColor: seciliProje?.id === proje.id ? '#2563eb' : 'transparent', borderRadius: '4px' }}>
              {duzenlenenProjeId === proje.id ? (
                <input value={duzenlenenProjeAdi} onChange={e => setDuzenlenenProjeAdi(e.target.value)} style={{ width: '100%', padding: '4px', borderRadius: '4px', border: 'none' }} />
              ) : (
                <span onClick={() => setSeciliProje(proje)} style={{ cursor: 'pointer', flex: 1 }}>🏢 {proje.ad}</span>
              )}
              
              <div style={{ display: 'flex', gap: '5px' }}>
                {duzenlenenProjeId === proje.id ? (
                  <button onClick={() => projeGuncelle(proje.id)} style={{ fontSize: '10px', padding: '2px 5px', cursor: 'pointer' }}>OK</button>
                ) : (
                  <>
                    <button onClick={() => { setDuzenlenenProjeId(proje.id); setDuzenlenenProjeAdi(proje.ad); }} style={{ fontSize: '10px', padding: '2px 5px', cursor: 'pointer' }}>✎</button>
                    <button onClick={() => projeSil(proje.id, proje.ad)} style={{ fontSize: '10px', padding: '2px 5px', cursor: 'pointer', color: 'red' }}>✕</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>

        <form onSubmit={projeEkle} style={{ marginTop: '20px', display: 'flex', gap: '5px' }}>
          <input required placeholder="Yeni Proje..." value={yeniProjeAdi} onChange={e => setYeniProjeAdi(e.target.value)} style={{ flex: 1, padding: '5px', borderRadius: '4px', border: 'none' }} />
          <button type="submit" style={{ padding: '5px 10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+</button>
        </form>
      </div>

      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        {!seciliProje ? <h2>Lütfen bir proje seçin.</h2> : (
          <>
            <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>{seciliProje.ad}</h1>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <form onSubmit={kaydet} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input required type="date" value={form.tarih} onChange={e => setForm({...form, tarih: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                <input required placeholder="Öğe" value={form.oge} onChange={e => setForm({...form, oge: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                <input required type="number" placeholder="Tutar" value={form.tutar} onChange={e => setForm({...form, tutar: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                <button type="submit" style={{ padding: '8px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{duzenlenenId ? 'Güncelle' : 'Ekle'}</button>
              </form>
            </div>
            <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                  <th>Tarih</th><th>Öğe</th><th>Tutar</th><th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {harcamalar.map(h => (
                  <tr key={h.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td>{h.tarih}</td><td>{h.oge}</td><td>₺{Number(h.tutar).toLocaleString('tr-TR')}</td>
                    <td>
                      <button onClick={() => duzenlemeyeBasla(h)}>✎</button>
                      <button onClick={() => sil(h.id)} style={{ color: 'red' }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
