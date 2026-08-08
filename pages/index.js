import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function Dashboard() {
  const [isClient, setIsClient] = useState(false);
  const [projeler, setProjeler] = useState([]);
  const [seciliProje, setSeciliProje] = useState(null);
  const [yeniProjeAdi, setYeniProjeAdi] = useState('');
  
  const [harcamalar, setHarcamalar] = useState([]);
  const [gelirler, setGelirler] = useState([]);
  const [aktifSekme, setAktifSekme] = useState('ozet'); // ozet, gelirler, giderler

  const formBaslangic = { oge: '', makbuz_no: '', fatura_no: '', tarih: new Date().toISOString().split('T')[0], kategori: '', aciklama: '', tutar: '' };
  const [form, setForm] = useState(formBaslangic);

  useEffect(() => { setIsClient(true); projeleriGetir(); }, []);
  useEffect(() => { if (seciliProje) verileriGetir(); }, [seciliProje]);

  async function projeleriGetir() {
    const { data } = await supabase.from('projeler').select('*').order('created_at', { ascending: true });
    if (data) { setProjeler(data); if (data.length > 0 && !seciliProje) setSeciliProje(data[0]); }
  }

  async function verileriGetir() {
    if (!seciliProje) return;
    const { data: h } = await supabase.from('harcamalar').select('*').eq('proje_id', seciliProje.id);
    const { data: g } = await supabase.from('gelirler').select('*').eq('proje_id', seciliProje.id);
    setHarcamalar(h || []); setGelirler(g || []);
  }

  async function kaydet(e) {
    e.preventDefault();
    const tablo = aktifSekme === 'gelirler' ? 'gelirler' : 'harcamalar';
    await supabase.from(tablo).insert([{ ...form, proje_id: seciliProje.id, tutar: Number(form.tutar) }]);
    setForm(formBaslangic);
    await verileriGetir();
  }

  async function sil(id, tablo) {
    if (window.confirm("Silmek istediğinize emin misiniz?")) {
      await supabase.from(tablo).delete().eq('id', id);
      await verileriGetir();
    }
  }

  if (!isClient) return null;

  const toplamGider = harcamalar.reduce((t, i) => t + Number(i.tutar), 0);
  const toplamGelir = gelirler.reduce((t, i) => t + Number(i.tutar), 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' }}>
      <div style={{ width: '280px', backgroundColor: '#111827', color: 'white', padding: '20px' }}>
        <h2>Esmahan Yapı</h2>
        {projeler.map(p => <div key={p.id} onClick={() => setSeciliProje(p)} style={{ padding: '10px', background: seciliProje?.id === p.id ? '#2563eb' : 'transparent', cursor: 'pointer', borderRadius: '5px' }}>🏢 {p.ad}</div>)}
        <form onSubmit={e => { e.preventDefault(); supabase.from('projeler').insert([{ad: yeniProjeAdi}]).then(projeleriGetir); setYeniProjeAdi('') }} style={{ marginTop: '20px' }}>
          <input value={yeniProjeAdi} onChange={e => setYeniProjeAdi(e.target.value)} placeholder="Yeni Proje" style={{ width: '100%', padding: '5px' }} />
        </form>
      </div>

      <div style={{ flex: 1, padding: '30px' }}>
        {!seciliProje ? <h2>Proje seçin</h2> : (
          <>
            <h1>{seciliProje.ad}</h1>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              {['ozet', 'gelirler', 'giderler'].map(s => <button key={s} onClick={() => setAktifSekme(s)} style={{ padding: '10px 20px', backgroundColor: aktifSekme === s ? '#2563eb' : '#fff', color: aktifSekme === s ? '#fff' : '#000', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>{s.toUpperCase()}</button>)}
            </div>

            {aktifSekme === 'ozet' && (
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', flex: 1 }}><h3>Toplam Gelir</h3><p style={{ fontSize: '24px', color: 'green' }}>₺{toplamGelir.toLocaleString()}</p></div>
                <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', flex: 1 }}><h3>Toplam Gider</h3><p style={{ fontSize: '24px', color: 'red' }}>₺{toplamGider.toLocaleString()}</p></div>
                <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', flex: 1 }}><h3>Bakiye</h3><p style={{ fontSize: '24px', color: '#000' }}>₺{(toplamGelir - toplamGider).toLocaleString()}</p></div>
              </div>
            )}

            {aktifSekme !== 'ozet' && (
              <div style={{ background: 'white', padding: '20px', borderRadius: '10px' }}>
                <form onSubmit={kaydet} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <input type="date" value={form.tarih} onChange={e => setForm({...form, tarih: e.target.value})} />
                  <input placeholder="Öğe" value={form.oge} onChange={e => setForm({...form, oge: e.target.value})} />
                  <input placeholder="Tutar" type="number" value={form.tutar} onChange={e => setForm({...form, tutar: e.target.value})} />
                  <button type="submit">Ekle</button>
                </form>
                <table style={{ width: '100%' }}>
                  <thead><tr><th>Tarih</th><th>Öğe</th><th>Tutar</th><th>İşlem</th></tr></thead>
                  <tbody>{(aktifSekme === 'gelirler' ? gelirler : harcamalar).map(i => (
                    <tr key={i.id}><td>{i.tarih}</td><td>{i.oge}</td><td>{i.tutar}</td><td><button onClick={() => sil(i.id, aktifSekme)} style={{ color: 'red' }}>Sil</button></td></tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
