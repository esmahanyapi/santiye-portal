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
    const { data: h } = await supabase.from('harcamalar').select('*').eq('proje_id', seciliProje.id).order('tarih', { ascending: false });
    const { data: g } = await supabase.from('gelirler').select('*').eq('proje_id', seciliProje.id).order('tarih', { ascending: false });
    setHarcamalar(h || []); setGelirler(g || []);
  }

  async function kaydet(e) {
    e.preventDefault();
    const tablo = aktifSekme === 'gelirler' ? 'gelirler' : 'harcamalar';
    const { error } = await supabase.from(tablo).insert([{ ...form, proje_id: seciliProje.id, tutar: Number(form.tutar) }]);
    if(!error) {
      setForm(formBaslangic);
      await verileriGetir();
    } else {
      alert("Kayıt eklenirken hata oluştu! Tablo sütunlarını kontrol edin.");
    }
  }

  async function sil(id, tablo) {
    if (window.confirm("Bu kaydı silmek istediğinize emin misiniz?")) {
      await supabase.from(tablo).delete().eq('id', id);
      await verileriGetir();
    }
  }

  if (!isClient) return null;

  const toplamGider = harcamalar.reduce((t, i) => t + Number(i.tutar), 0);
  const toplamGelir = gelirler.reduce((t, i) => t + Number(i.tutar), 0);
  const aktifListe = aktifSekme === 'gelirler' ? gelirler : harcamalar;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' }}>
      
      {/* SOL MENÜ - PROJELER */}
      <div style={{ width: '280px', backgroundColor: '#111827', color: 'white', padding: '20px' }}>
        <h2 style={{ fontSize: '20px', borderBottom: '1px solid #374151', paddingBottom: '15px' }}>Esmahan Yapı</h2>
        <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '20px', fontWeight: 'bold' }}>PROJELER</p>
        
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {projeler.map(p => (
            <li key={p.id} onClick={() => setSeciliProje(p)} style={{ padding: '10px 15px', background: seciliProje?.id === p.id ? '#2563eb' : 'transparent', cursor: 'pointer', borderRadius: '6px', fontWeight: seciliProje?.id === p.id ? 'bold' : 'normal' }}>
              🏢 {p.ad}
            </li>
          ))}
        </ul>

        <form onSubmit={e => { e.preventDefault(); if(!yeniProjeAdi.trim()) return; supabase.from('projeler').insert([{ad: yeniProjeAdi}]).then(projeleriGetir); setYeniProjeAdi(''); }} style={{ marginTop: '20px', borderTop: '1px solid #374151', paddingTop: '15px' }}>
          <input value={yeniProjeAdi} onChange={e => setYeniProjeAdi(e.target.value)} placeholder="Yeni Proje Adı" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: 'none', marginBottom: '8px', backgroundColor: '#374151', color: 'white' }} />
          <button type="submit" style={{ width: '100%', padding: '8px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>+ Proje Ekle</button>
        </form>
      </div>

      {/* ANA İÇERİK */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        {!seciliProje ? <h2>Lütfen sol taraftan bir proje seçin.</h2> : (
          <>
            <h1 style={{ fontSize: '24px', marginBottom: '20px', color: '#111827' }}>{seciliProje.ad}</h1>
            
            {/* SEKME BUTONLARI */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
              {['ozet', 'gelirler', 'giderler'].map(s => (
                <button key={s} onClick={() => setAktifSekme(s)} style={{ padding: '10px 25px', backgroundColor: aktifSekme === s ? '#2563eb' : '#fff', color: aktifSekme === s ? '#fff' : '#374151', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {s === 'ozet' ? '📊 ÖZET' : s === 'gelirler' ? '📈 GELİRLER' : '📉 GİDERLER'}
                </button>
              ))}
            </div>

            {/* ÖZET EKRANI */}
            {aktifSekme === 'ozet' && (
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', flex: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 10px 0' }}>TOPLAM GELİR</h3>
                  <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#059669', margin: 0 }}>₺{toplamGelir.toLocaleString('tr-TR')}</p>
                </div>
                <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', flex: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 10px 0' }}>TOPLAM GİDER</h3>
                  <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc2626', margin: 0 }}>₺{toplamGider.toLocaleString('tr-TR')}</p>
                </div>
                <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', flex: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 10px 0' }}>NET DURUM (BAKİYE)</h3>
                  <p style={{ fontSize: '28px', fontWeight: 'bold', color: (toplamGelir - toplamGider) >= 0 ? '#2563eb' : '#dc2626', margin: 0 }}>₺{(toplamGelir - toplamGider).toLocaleString('tr-TR')}</p>
                </div>
              </div>
            )}

            {/* GELİRLER VEYA GİDERLER EKRANI */}
            {aktifSekme !== 'ozet' && (
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#111827', fontSize: '16px' }}>
                  {aktifSekme === 'gelirler' ? 'Yeni Gelir Ekle' : 'Yeni Gider Ekle'}
                </h3>
                
                {/* FORM */}
                <form onSubmit={kaydet} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '30px' }}>
                  <input required type="date" value={form.tarih} onChange={e => setForm({...form, tarih: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', flex: 1, minWidth: '130px' }} />
                  <input required placeholder="Öğe (Firma/Kişi)" value={form.oge} onChange={e => setForm({...form, oge: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', flex: 1, minWidth: '150px' }} />
                  <input placeholder="Makbuz No" value={form.makbuz_no} onChange={e => setForm({...form, makbuz_no: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', flex: 1, minWidth: '100px' }} />
                  <input placeholder="Fatura No" value={form.fatura_no} onChange={e => setForm({...form, fatura_no: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', flex: 1, minWidth: '100px' }} />
                  <input required placeholder="Kategori" value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', flex: 1, minWidth: '120px' }} />
                  <input placeholder="Açıklama" value={form.aciklama} onChange={e => setForm({...form, aciklama: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', flex: 2, minWidth: '180px' }} />
                  <input required type="number" placeholder="Tutar (₺)" value={form.tutar} onChange={e => setForm({...form, tutar: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', flex: 1, minWidth: '100px' }} />
                  <button type="submit" style={{ padding: '8px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Ekle</button>
                </form>

                {/* TABLO */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#4b5563' }}>
                        <th style={{ padding: '12px 10px' }}>Tarih</th>
                        <th style={{ padding: '12px 10px' }}>Öğe</th>
                        <th style={{ padding: '12px 10px' }}>Makbuz No</th>
                        <th style={{ padding: '12px 10px' }}>Fatura No</th>
                        <th style={{ padding: '12px 10px' }}>Kategori</th>
                        <th style={{ padding: '12px 10px' }}>Açıklama</th>
                        <th style={{ padding: '12px 10px', textAlign: 'right' }}>Tutar</th>
                        <th style={{ padding: '12px 10px', textAlign: 'center' }}>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aktifListe.map(i => (
                        <tr key={i.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>{i.tarih}</td>
                          <td style={{ padding: '12px 10px', fontWeight: '500' }}>{i.oge || '-'}</td>
                          <td style={{ padding: '12px 10px', color: '#6b7280' }}>{i.makbuz_no || '-'}</td>
                          <td style={{ padding: '12px 10px', color: '#6b7280' }}>{i.fatura_no || '-'}</td>
                          <td style={{ padding: '12px 10px' }}><span style={{ backgroundColor: '#e5e7eb', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>{i.kategori || '-'}</span></td>
                          <td style={{ padding: '12px 10px', color: '#6b7280' }}>{i.aciklama || '-'}</td>
                          <td style={{ padding: '12px 10px', fontWeight: 'bold', color: aktifSekme === 'gelirler' ? '#059669' : '#dc2626', textAlign: 'right' }}>₺{Number(i.tutar).toLocaleString('tr-TR')}</td>
                          <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                            <button onClick={() => sil(i.id, aktifSekme)} style={{ padding: '4px 8px', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Sil</button>
                          </td>
                        </tr>
                      ))}
                      {aktifListe.length === 0 && (
                        <tr><td colSpan="8" style={{ padding: '30px', textAlign: 'center', color: '#6b7280' }}>Bu kategoride henüz kayıt bulunmuyor.</td></tr>
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
