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

  const aktifListe = aktifSekme === 'gelirler' ? gelirler : harcamalar;
  const gorunenListe = aktifListe.filter(item => 
    (filtreKategori === '' || item.kategori?.toLowerCase().includes(filtreKategori.toLowerCase())) &&
    (filtreAciklama === '' || item.aciklama?.toLowerCase().includes(filtreAciklama.toLowerCase()))
  );
  const gorunenToplam = gorunenListe.reduce((t, i) => t + Number(i.tutar), 0);

  if (!isClient) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* SOL MENÜ - PROJELER */}
      <div style={{ width: '300px', backgroundColor: '#0f172a', color: 'white', padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 10px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', borderBottom: '1px solid #1e293b', paddingBottom: '15px' }}>
          <span style={{ fontSize: '24px' }}>🏗️</span>
          <div>
            <h2 style={{ fontSize: '18px', margin: 0, fontWeight: '700', color: '#f8fafc' }}>Esmahan Yapı</h2>
            <p style={{ fontSize: '12px', margin: 0, color: '#94a3b8' }}>Şantiye Yönetim Portalı</p>
          </div>
        </div>

        <p style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', fontWeight: 'bold' }}>Projelerim</p>
        
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto' }}>
          {projeler.map(p => (
            <li key={p.id} onClick={() => setSeciliProje(p)} style={{ 
              padding: '12px 16px', 
              background: seciliProje?.id === p.id ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'transparent', 
              color: seciliProje?.id === p.id ? '#fff' : '#cbd5e1',
              cursor: 'pointer', borderRadius: '10px', fontWeight: seciliProje?.id === p.id ? '600' : '400',
              boxShadow: seciliProje?.id === p.id ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
              transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <span>🏢</span> {p.ad}
            </li>
          ))}
        </ul>

        <form onSubmit={e => { e.preventDefault(); if(!yeniProjeAdi.trim()) return; supabase.from('projeler').insert([{ad: yeniProjeAdi}]).then(projeleriGetir); setYeniProjeAdi(''); }} style={{ marginTop: '20px', borderTop: '1px solid #1e293b', paddingTop: '20px' }}>
          <input value={yeniProjeAdi} onChange={e => setYeniProjeAdi(e.target.value)} placeholder="Yeni Proje Adı..." style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', marginBottom: '10px', backgroundColor: '#1e293b', color: 'white', fontSize: '13px', outline: 'none' }} />
          <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)' }}>+ Yeni Proje Ekle</button>
        </form>
      </div>

      {/* ANA İÇERİK ALANI */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto', maxWidth: '1400px' }}>
        {!seciliProje ? (
          <div style={{ textAlign: 'center', marginTop: '150px', color: '#64748b' }}>
            <span style={{ fontSize: '48px' }}>👈</span>
            <h2>Lütfen sol menüden yönetmek istediğiniz projeyi seçin.</h2>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0 0 5px 0' }}>{seciliProje.ad}</h1>
                <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Finansal Akış ve Gider/Gelir Takip Paneli</p>
              </div>
            </div>

            {/* SEKMELER */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '30px' }}>
              {[
                { id: 'ozet', label: '📊 Genel Özet', color: '#6366f1' },
                { id: 'gelirler', label: '📈 Gelir Kalemleri', color: '#059669' },
                { id: 'giderler', label: '📉 Gider Kalemleri', color: '#dc2626' }
              ].map(s => (
                <button key={s.id} onClick={() => { setAktifSekme(s.id); setFiltreKategori(''); setFiltreAciklama(''); }} style={{ 
                  padding: '12px 24px', 
                  backgroundColor: aktifSekme === s.id ? s.color : '#ffffff', 
                  color: aktifSekme === s.id ? '#ffffff' : '#475569', 
                  border: aktifSekme === s.id ? 'none' : '1px solid #e2e8f0', 
                  borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
                  boxShadow: aktifSekme === s.id ? '0 4px 12px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s'
                }}>
                  {s.label}
                </button>
              ))}
            </div>

            {/* ÖZET EKRANI */}
            {aktifSekme === 'ozet' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)', padding: '25px', borderRadius: '16px', border: '1px solid #dcfce7', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <span style={{ color: '#166534', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase' }}>Toplam Gelir</span>
                    <span style={{ fontSize: '20px' }}>📈</span>
                  </div>
                  <p style={{ fontSize: '32px', fontWeight: '800', color: '#059669', margin: 0 }}>₺{gelirler.reduce((t,i)=>t+Number(i.tutar),0).toLocaleString('tr-TR')}</p>
                </div>

                <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)', padding: '25px', borderRadius: '16px', border: '1px solid #fee2e2', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <span style={{ color: '#991b1b', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase' }}>Toplam Gider</span>
                    <span style={{ fontSize: '20px' }}>📉</span>
                  </div>
                  <p style={{ fontSize: '32px', fontWeight: '800', color: '#dc2626', margin: 0 }}>₺{harcamalar.reduce((t,i)=>t+Number(i.tutar),0).toLocaleString('tr-TR')}</p>
                </div>

                <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)', padding: '25px', borderRadius: '16px', border: '1px solid #dbeafe', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <span style={{ color: '#1e40af', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase' }}>Net Kasa / Bakiye</span>
                    <span style={{ fontSize: '20px' }}>💰</span>
                  </div>
                  <p style={{ fontSize: '32px', fontWeight: '800', color: (gelirler.reduce((t,i)=>t+Number(i.tutar),0) - harcamalar.reduce((t,i)=>t+Number(i.tutar),0)) >= 0 ? '#2563eb' : '#dc2626', margin: 0 }}>
                    ₺{(gelirler.reduce((t,i)=>t+Number(i.tutar),0) - harcamalar.reduce((t,i)=>t+Number(i.tutar),0)).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>
            ) : (
              /* GELİR / GİDER LİSTESİ VE FORMU */
              <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#0f172a', fontSize: '18px', fontWeight: '700' }}>
                  {aktifSekme === 'gelirler' ? '➕ Yeni Gelir Kalemi Ekle' : '➕ Yeni Gider Kalemi Ekle'}
                </h3>
                
                {/* FORM */}
                <form onSubmit={kaydet} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '35px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ flex: 1, minWidth: '140px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>TARİH</label>
                    <input required type="date" value={form.tarih} onChange={e => setForm({...form, tarih: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', background: '#fff' }} />
                  </div>
                  <div style={{ flex: 1.2, minWidth: '160px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>ÖĞE (FİRMA/KİŞİ)</label>
                    <input required placeholder="Örn: Beton A.Ş." value={form.oge} onChange={e => setForm({...form, oge: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', background: '#fff' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '110px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>MAKBUZ NO</label>
                    <input placeholder="Makbuz No" value={form.makbuz_no} onChange={e => setForm({...form, makbuz_no: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', background: '#fff' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '110px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>FATURA NO</label>
                    <input placeholder="Fatura No" value={form.fatura_no} onChange={e => setForm({...form, fatura_no: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', background: '#fff' }} />
                  </div>
                  <div style={{ flex: 1.2, minWidth: '130px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>KATEGORİ</label>
                    <input required placeholder="Örn: Hafriyat" value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', background: '#fff' }} />
                  </div>
                  <div style={{ flex: 1.8, minWidth: '200px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>AÇIKLAMA / TAŞERON</label>
                    <input placeholder="Detay girin..." value={form.aciklama} onChange={e => setForm({...form, aciklama: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', background: '#fff' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>TUTAR (₺)</label>
                    <input required type="number" placeholder="0.00" value={form.tutar} onChange={e => setForm({...form, tutar: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', background: '#fff', fontWeight: 'bold', color: '#0f172a' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                    <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)' }}>
                      Sisteme Kaydet
                    </button>
                  </div>
                </form>

                {/* FİLTRELEME & CANLI TOPLAM KARTI */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: '#eff6ff', padding: '15px 20px', borderRadius: '12px', border: '1px solid #bfdbfe', flexWrap: 'wrap', gap: '15px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                    <span style={{ fontWeight: '700', color: '#1e40af', fontSize: '14px' }}>🔍 Filtrele:</span>
                    <input placeholder="Kategoriye göre ara..." value={filtreKategori} onChange={e => setFiltreKategori(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #93c5fd', outline: 'none', fontSize: '13px', background: '#fff' }} />
                    <input placeholder="Açıklama / Taşeron ara..." value={filtreAciklama} onChange={e => setFiltreAciklama(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #93c5fd', outline: 'none', fontSize: '13px', background: '#fff', minWidth: '180px' }} />
                  </div>
                  <div style={{ background: '#1e40af', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                    Filtrelenen Toplam: ₺{gorunenToplam.toLocaleString('tr-TR')}
                  </div>
                </div>

                {/* TABLO (SAĞA YASLI YAZILAR) */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', backgroundColor: '#f8fafc' }}>
                        <th style={{ padding: '14px 12px', textAlign: 'right' }}>Tarih</th>
                        <th style={{ padding: '14px 12px', textAlign: 'right' }}>Öğe</th>
                        <th style={{ padding: '14px 12px', textAlign: 'right' }}>Makbuz No</th>
                        <th style={{ padding: '14px 12px', textAlign: 'right' }}>Fatura No</th>
                        <th style={{ padding: '14px 12px', textAlign: 'right' }}>Kategori</th>
                        <th style={{ padding: '14px 12px', textAlign: 'right' }}>Açıklama</th>
                        <th style={{ padding: '14px 12px', textAlign: 'right' }}>Tutar</th>
                        <th style={{ padding: '14px 12px', textAlign: 'center' }}>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gorunenListe.map(i => (
                        <tr key={i.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '14px 12px', whiteSpace: 'nowrap', color: '#334155' }}>{i.tarih}</td>
                          <td style={{ padding: '14px 12px', fontWeight: '600', color: '#0f172a' }}>{i.oge || '-'}</td>
                          <td style={{ padding: '14px 12px', color: '#64748b' }}>{i.makbuz_no || '-'}</td>
                          <td style={{ padding: '14px 12px', color: '#64748b' }}>{i.fatura_no || '-'}</td>
                          <td style={{ padding: '14px 12px' }}><span style={{ backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', color: '#475569', border: '1px solid #e2e8f0' }}>{i.kategori || '-'}</span></td>
                          <td style={{ padding: '14px 12px', color: '#64748b' }}>{i.aciklama || '-'}</td>
                          <td style={{ padding: '14px 12px', fontWeight: 'bold', color: aktifSekme === 'gelirler' ? '#059669' : '#dc2626' }}>₺{Number(i.tutar).toLocaleString('tr-TR')}</td>
                          <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                            <button onClick={() => sil(i.id)} style={{ padding: '6px 12px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>Sil</button>
                          </td>
                        </tr>
                      ))}
                      {gorunenListe.length === 0 && (
                        <tr><td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Kayıt bulunamadı.</td></tr>
                      )}
                    </tbody>
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
