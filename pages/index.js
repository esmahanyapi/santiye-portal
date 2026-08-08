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
  const [aktifSekme, setAktifSekme] = useState('ozet');
  
  // Filtreleme State'leri
  const [filtreKategori, setFiltreKategori] = useState('');
  const [filtreAciklama, setFiltreAciklama] = useState('');

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

  async function sil(id) {
    if (window.confirm("Bu kaydı silmek istediğinize emin misiniz?")) {
      const tablo = aktifSekme === 'gelirler' ? 'gelirler' : 'harcamalar';
      await supabase.from(tablo).delete().eq('id', id);
      await verileriGetir();
    }
  }

  // Filtreleme mantığı
  const aktifListe = aktifSekme === 'gelirler' ? gelirler : harcamalar;
  const gorunenListe = aktifListe.filter(item => 
    (filtreKategori === '' || item.kategori?.toLowerCase().includes(filtreKategori.toLowerCase())) &&
    (filtreAciklama === '' || item.aciklama?.toLowerCase().includes(filtreAciklama.toLowerCase()))
  );
  const gorunenToplam = gorunenListe.reduce((t, i) => t + Number(i.tutar), 0);

  if (!isClient) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' }}>
      <div style={{ width: '280px', backgroundColor: '#111827', color: 'white', padding: '20px' }}>
        <h2 style={{ fontSize: '20px', borderBottom: '1px solid #374151', paddingBottom: '15px' }}>Esmahan Yapı</h2>
        {projeler.map(p => <div key={p.id} onClick={() => setSeciliProje(p)} style={{ padding: '10px', background: seciliProje?.id === p.id ? '#2563eb' : 'transparent', cursor: 'pointer', borderRadius: '5px' }}>🏢 {p.ad}</div>)}
        <form onSubmit={e => { e.preventDefault(); supabase.from('projeler').insert([{ad: yeniProjeAdi}]).then(projeleriGetir); setYeniProjeAdi(''); }} style={{ marginTop: '20px' }}>
          <input value={yeniProjeAdi} onChange={e => setYeniProjeAdi(e.target.value)} placeholder="Yeni Proje Adı" style={{ width: '100%', padding: '5px' }} />
        </form>
      </div>

      <div style={{ flex: 1, padding: '30px' }}>
        {!seciliProje ? <h2>Proje seçin</h2> : (
          <>
            <h1>{seciliProje.ad}</h1>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              {['ozet', 'gelirler', 'giderler'].map(s => <button key={s} onClick={() => { setAktifSekme(s); setFiltreKategori(''); setFiltreAciklama(''); }} style={{ padding: '10px 20px', background: aktifSekme === s ? '#2563eb' : '#fff', border: '1px solid #ddd', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>{s.toUpperCase()}</button>)}
            </div>

            {aktifSekme === 'ozet' ? (
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', flex: 1 }}><h3>Toplam Gelir</h3><p style={{ fontSize: '24px', color: 'green' }}>₺{gelirler.reduce((t,i)=>t+Number(i.tutar),0).toLocaleString()}</p></div>
                <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', flex: 1 }}><h3>Toplam Gider</h3><p style={{ fontSize: '24px', color: 'red' }}>₺{harcamalar.reduce((t,i)=>t+Number(i.tutar),0).toLocaleString()}</p></div>
              </div>
            ) : (
              <div style={{ background: 'white', padding: '20px', borderRadius: '10px' }}>
                <form onSubmit={kaydet} style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <input type="date" value={form.tarih} onChange={e => setForm({...form, tarih: e.target.value})} />
                  <input placeholder="Öğe" value={form.oge} onChange={e => setForm({...form, oge: e.target.value})} />
                  <input placeholder="Kategori" value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})} />
                  <input placeholder="Açıklama" value={form.aciklama} onChange={e => setForm({...form, aciklama: e.target.value})} />
                  <input type="number" placeholder="Tutar" value={form.tutar} onChange={e => setForm({...form, tutar: e.target.value})} />
                  <button type="submit">Ekle</button>
                </form>

                <div style={{ marginBottom: '20px', padding: '15px', background: '#f9fafb', borderRadius: '8px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <strong>Filtrele:</strong>
                  <input placeholder="Kategori Ara..." value={filtreKategori} onChange={e => setFiltreKategori(e.target.value)} />
                  <input placeholder="Açıklama/Taşeron Ara..." value={filtreAciklama} onChange={e => setFiltreAciklama(e.target.value)} />
                  <strong style={{ marginLeft: 'auto', fontSize: '18px' }}>Filtrelenen Toplam: ₺{gorunenToplam.toLocaleString()}</strong>
                </div>

                <table style={{ width: '100%' }}>
                  <thead><tr><th>Tarih</th><th>Öğe</th><th>Kategori</th><th>Açıklama</th><th>Tutar</th><th>İşlem</th></tr></thead>
                  <tbody>{gorunenListe.map(i => (
                    <tr key={i.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td>{i.tarih}</td><td>{i.oge}</td><td>{i.kategori}</td><td>{i.aciklama}</td>
                      <td>₺{Number(i.tutar).toLocaleString()}</td>
                      <td><button onClick={() => sil(i.id)} style={{ color: 'red' }}>Sil</button></td>
                    </tr>
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
