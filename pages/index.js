import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function Dashboard() {
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false); // Mobil kontrolü
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
    // Ekran boyutunu izle
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* SOL MENÜ (MOBİLDE ÜSTE GEÇER) */}
      <div style={{ width: isMobile ? '100%' : '300px', backgroundColor: '#0f172a', color: 'white', padding: '24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', borderBottom: '1px solid #1e293b', paddingBottom: '15px' }}>
          <span style={{ fontSize: '24px' }}>🏗️</span>
          <div>
            <h2 style={{ fontSize: '18px', margin: 0, fontWeight: '700' }}>Esmahan Yapı</h2>
            <p style={{ fontSize: '12px', margin: 0, color: '#94a3b8' }}>Şantiye Yönetim Portalı</p>
          </div>
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {projeler.map(p => (
            <li key={p.id} onClick={() => setSeciliProje(p)} style={{ 
              padding: '12px 16px', 
              background: seciliProje?.id === p.id ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'transparent', 
              color: '#fff', cursor: 'pointer', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px'
            }}>🏢 {p.ad}</li>
          ))}
        </ul>
      </div>

      {/* ANA İÇERİK ALANI */}
      <div style={{ flex: 1, padding: isMobile ? '20px' : '40px', overflowX: 'hidden' }}>
        {!seciliProje ? <h2>Lütfen proje seçin.</h2> : (
          <>
            <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '20px' }}>{seciliProje.ad}</h1>
            
            {/* SEKMELER */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '5px' }}>
              {[
                { id: 'ozet', label: '📊 Genel Özet', color: '#6366f1' },
                { id: 'gelirler', label: '📈 Gelirler', color: '#059669' },
                { id: 'giderler', label: '📉 Giderler', color: '#dc2626' }
              ].map(s => (
                <button key={s.id} onClick={() => setAktifSekme(s.id)} style={{ 
                  padding: '12px 20px', backgroundColor: aktifSekme === s.id ? s.color : '#fff', 
                  color: aktifSekme === s.id ? '#fff' : '#475569', border: '1px solid #e2e8f0', borderRadius: '10px', 
                  cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap'
                }}>
                  {s.label}
                </button>
              ))}
            </div>

            {/* ÖZET EKRANI */}
            {aktifSekme === 'ozet' ? (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '20px' }}>
                <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '16px', border: '1px solid #dcfce7' }}><h3>Gelir</h3><p style={{ fontSize: '24px', color: '#059669', fontWeight: 'bold' }}>₺{gelirler.reduce((t,i)=>t+Number(i.tutar),0).toLocaleString()}</p></div>
                <div style={{ background: '#fef2f2', padding: '20px', borderRadius: '16px', border: '1px solid #fee2e2' }}><h3>Gider</h3><p style={{ fontSize: '24px', color: '#dc2626', fontWeight: 'bold' }}>₺{harcamalar.reduce((t,i)=>t+Number(i.tutar),0).toLocaleString()}</p></div>
                <div style={{ background: '#eff6ff', padding: '20px', borderRadius: '16px', border: '1px solid #dbeafe' }}><h3>Bakiye</h3><p style={{ fontSize: '24px', color: '#2563eb', fontWeight: 'bold' }}>₺{(gelirler.reduce((t,i)=>t+Number(i.tutar),0) - harcamalar.reduce((t,i)=>t+Number(i.tutar),0)).toLocaleString()}</p></div>
              </div>
            ) : (
              <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <form onSubmit={kaydet} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
                  <input type="date" value={form.tarih} onChange={e => setForm({...form, tarih: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                  <input placeholder="Öğe" value={form.oge} onChange={e => setForm({...form, oge: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                  <input type="number" placeholder="Tutar" value={form.tutar} onChange={e => setForm({...form, tutar: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                  <button type="submit" style={{ padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Ekle</button>
                </form>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: '#f8fafc', padding: '15px', borderRadius: '8px', flexWrap: 'wrap' }}>
                  <input placeholder="Kategori Ara..." value={filtreKategori} onChange={e => setFiltreKategori(e.target.value)} style={{ padding: '8px', flex: 1 }} />
                  <strong>Toplam: ₺{gorunenToplam.toLocaleString()}</strong>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '14px' }}>
                    <thead><tr style={{ background: '#f8fafc', borderBottom: '2px solid #ddd' }}>
                      <th style={{ padding: '12px' }}>Tarih</th><th style={{ padding: '12px' }}>Öğe</th><th style={{ padding: '12px' }}>Kategori</th><th style={{ padding: '12px' }}>Açıklama</th><th style={{ padding: '12px' }}>Tutar</th><th style={{ padding: '12px' }}>İşlem</th>
                    </tr></thead>
                    <tbody>{gorunenListe.map(i => (
                      <tr key={i.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px' }}>{i.tarih}</td><td style={{ padding: '12px' }}>{i.oge}</td><td style={{ padding: '12px' }}>{i.kategori}</td><td style={{ padding: '12px' }}>{i.aciklama}</td>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>₺{Number(i.tutar).toLocaleString()}</td>
                        <td style={{ padding: '12px' }}><button onClick={() => sil(i.id)} style={{ color: 'red', cursor: 'pointer' }}>✕</button></td>
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
