import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function Dashboard() {
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false); // Ekran boyutu takibi
  const [projeler, setProjeler] = useState([]);
  const [seciliProje, setSeciliProje] = useState(null);
  const [yeniProjeAdi, setYeniProjeAdi] = useState('');
  
  const [harcamalar, setHarcamalar] = useState([]);
  const [gelirler, setGelirler] = useState([]);
  const [aktifSekme, setAktifSekme] = useState('ozet');
  const [filtreKategori, setFiltreKategori] = useState('');
  const [filtreAciklama, setFiltreAciklama] = useState('');

  const formBaslangic = { oge: '', makbuz_no: '', fatura_no: '', tarih: new Date().toISOString().split('T')[0], kategori: '', aciklama: '', tutar: '' };
  const [form, setForm] = useState(formBaslangic);

  useEffect(() => { 
    setIsClient(true); 
    projeleriGetir();
    
    // Mobil kontrolü
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const aktifListe = aktifSekme === 'gelirler' ? gelirler : harcamalar;
  const gorunenListe = aktifListe.filter(item => 
    (filtreKategori === '' || item.kategori?.toLowerCase().includes(filtreKategori.toLowerCase())) &&
    (filtreAciklama === '' || item.aciklama?.toLowerCase().includes(filtreAciklama.toLowerCase()))
  );
  const gorunenToplam = gorunenListe.reduce((t, i) => t + Number(i.tutar), 0);

  if (!isClient) return null;

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* SOL MENÜ */}
      <div style={{ width: isMobile ? '100%' : '280px', backgroundColor: '#0f172a', color: 'white', padding: '20px' }}>
        <h2 style={{ fontSize: '18px', borderBottom: '1px solid #1e293b', paddingBottom: '15px' }}>Esmahan Yapı</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: '15px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {projeler.map(p => (
            <li key={p.id} onClick={() => setSeciliProje(p)} style={{ padding: '10px', background: seciliProje?.id === p.id ? '#2563eb' : 'transparent', cursor: 'pointer', borderRadius: '6px' }}>🏢 {p.ad}</li>
          ))}
        </ul>
        <form onSubmit={e => { e.preventDefault(); supabase.from('projeler').insert([{ad: yeniProjeAdi}]).then(projeleriGetir); setYeniProjeAdi(''); }} style={{ marginTop: '20px' }}>
          <input value={yeniProjeAdi} onChange={e => setYeniProjeAdi(e.target.value)} placeholder="Yeni Proje Adı" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: 'none' }} />
        </form>
      </div>

      {/* ANA İÇERİK */}
      <div style={{ flex: 1, padding: isMobile ? '15px' : '30px' }}>
        {!seciliProje ? <h2>Lütfen proje seçin.</h2> : (
          <>
            <h1 style={{ fontSize: '22px', marginBottom: '20px' }}>{seciliProje.ad}</h1>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {['ozet', 'gelirler', 'giderler'].map(s => (
                <button key={s} onClick={() => setAktifSekme(s)} style={{ padding: '10px 15px', background: aktifSekme === s ? '#2563eb' : '#fff', border: '1px solid #ddd', borderRadius: '5px', cursor: 'pointer', flex: 1 }}>{s.toUpperCase()}</button>
              ))}
            </div>

            {aktifSekme === 'ozet' ? (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '15px' }}>
                <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}><h3>Gelir</h3><p style={{ fontSize: '20px', color: 'green' }}>₺{gelirler.reduce((t,i)=>t+Number(i.tutar),0).toLocaleString()}</p></div>
                <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}><h3>Gider</h3><p style={{ fontSize: '20px', color: 'red' }}>₺{harcamalar.reduce((t,i)=>t+Number(i.tutar),0).toLocaleString()}</p></div>
                <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}><h3>Bakiye</h3><p style={{ fontSize: '20px' }}>₺{(gelirler.reduce((t,i)=>t+Number(i.tutar),0) - harcamalar.reduce((t,i)=>t+Number(i.tutar),0)).toLocaleString()}</p></div>
              </div>
            ) : (
              <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
                <form onSubmit={kaydet} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px', marginBottom: '20px' }}>
                  <input type="date" value={form.tarih} onChange={e => setForm({...form, tarih: e.target.value})} />
                  <input placeholder="Öğe" value={form.oge} onChange={e => setForm({...form, oge: e.target.value})} />
                  <input type="number" placeholder="Tutar" value={form.tutar} onChange={e => setForm({...form, tutar: e.target.value})} />
                  <button type="submit">Ekle</button>
                </form>

                <div style={{ padding: '10px', background: '#f0f9ff', borderRadius: '5px', marginBottom: '10px' }}>
                  <input placeholder="Filtrele..." value={filtreKategori} onChange={e => setFiltreKategori(e.target.value)} />
                  <strong style={{ marginLeft: '10px' }}>Toplam: ₺{gorunenToplam.toLocaleString()}</strong>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'right' }}>
                    <thead><tr style={{ background: '#eee' }}><th>Tarih</th><th>Öğe</th><th>Kategori</th><th>Açıklama</th><th>Tutar</th><th>İşlem</th></tr></thead>
                    <tbody>{gorunenListe.map(i => (
                      <tr key={i.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td>{i.tarih}</td><td>{i.oge}</td><td>{i.kategori}</td><td>{i.aciklama}</td>
                        <td>₺{Number(i.tutar).toLocaleString()}</td>
                        <td><button onClick={() => sil(i.id)} style={{ color: 'red' }}>Sil</button></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
