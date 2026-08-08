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
      if (data.length > 0 && !seciliProje) {
        setSeciliProje(data[0]);
      }
    }
  }

  async function projeEkle(e) {
    e.preventDefault();
    if (!yeniProjeAdi.trim()) return;
    const { data, error } = await supabase.from('projeler').insert([{ ad: yeniProjeAdi }]).select();
    if (!error && data) {
      setYeniProjeAdi('');
      await projeleriGetir();
      setSeciliProje(data[0]);
    } else {
      alert("Proje eklenirken hata oluştu! Supabase 'projeler' tablosunda 'ad' sütunu olduğundan emin olun.");
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
      const { error } = await supabase.from('harcamalar').update({
        oge: form.oge, makbuz_no: form.makbuz_no, fatura_no: form.fatura_no,
        tarih: form.tarih, kategori: form.kategori, aciklama: form.aciklama, tutar: Number(form.tutar)
      }).eq('id', duzenlenenId);
      
      if(!error) { setForm(formBaslangic); setDuzenlenenId(null); await verileriGetir(); }
    } else {
      const { error } = await supabase.from('harcamalar').insert([{
        proje_id: seciliProje.id,
        oge: form.oge, makbuz_no: form.makbuz_no, fatura_no: form.fatura_no,
        tarih: form.tarih, kategori: form.kategori, aciklama: form.aciklama, tutar: Number(form.tutar)
      }]);
      
      if(!error) { setForm(formBaslangic); await verileriGetir(); }
    }
    setYukleniyor(false);
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

  function iptalEt() { setForm(formBaslangic); setDuzenlenenId(null); }

  if (!isClient) return null;

  const toplamHarcama = harcamalar.reduce((toplam, item) => toplam + Number(item.tutar), 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* SOL MENÜ (Projeler) */}
      <div style={{ width: '280px', backgroundColor: '#111827', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '20px', borderBottom: '1px solid #374151', paddingBottom: '15px', marginTop: 0 }}>Esmahan Yapı</h2>
        <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '-5px', marginBottom: '20px', fontWeight: 'bold' }}>PROJELERİMİZ</p>
        
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
          {projeler.map(proje => (
            <li 
              key={proje.id} 
              onClick={() => setSeciliProje(proje)}
              style={{ 
                padding: '12px 15px', 
                backgroundColor: seciliProje?.id === proje.id ? '#2563eb' : 'transparent', 
                borderRadius: '6px', cursor: 'pointer', fontWeight: seciliProje?.id === proje.id ? 'bold' : 'normal',
                border: seciliProje?.id === proje.id ? 'none' : '1px solid #374151'
              }}>
              🏢 {proje.ad}
            </li>
          ))}
        </ul>

        <div style={{ marginTop: '20px', borderTop: '1px solid #374151', paddingTop: '20px' }}>
          <form onSubmit={projeEkle} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input 
              required placeholder="Yeni Proje Adı" value={yeniProjeAdi} onChange={e => setYeniProjeAdi(e.target.value)}
              style={{ padding: '10px', borderRadius: '4px', border: 'none', backgroundColor: '#374151', color: 'white', fontSize: '14px' }} 
            />
            <button type="submit" style={{ padding: '10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              + Proje Ekle
            </button>
          </form>
        </div>
      </div>

      {/* ANA İÇERİK */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        
        {!seciliProje ? (
          <div style={{ textAlign: 'center', marginTop: '100px', color: '#6b7280' }}>
            <h2>Lütfen sol taraftan bir proje seçin veya yeni proje ekleyin.</h2>
          </div>
        ) : (
          <>
            <h1 style={{ margin: '0 0 20px 0', color: '#111827', fontSize: '24px' }}>{seciliProje.ad} - Bütçe ve Giderler</h1>
            
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
              <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 5px 0', color: '#6b7280', fontSize: '13px' }}>TOPLAM HARCAMA</h3>
                <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#dc2626' }}>₺{toplamHarcama.toLocaleString('tr-TR')}</p>
              </div>
              <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 5px 0', color: '#6b7280', fontSize: '13px' }}>KAYITLI İŞLEM SAYISI</h3>
                <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>{harcamalar.length}</p>
              </div>
            </div>

            <div style={{ backgroundColor: duzenlenenId ? '#fef2f2' : 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '30px', border: duzenlenenId ? '1px solid #fca5a5' : 'none' }}>
              <h2 style={{ margin: '0 0 15px 0', fontSize: '16px', color: duzenlenenId ? '#dc2626' : '#111827' }}>
                {duzenlenenId ? 'Kayıt Düzenleniyor...' : 'Yeni Gider Ekle'}
              </h2>
              <form onSubmit={kaydet} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input required type="date" value={form.tarih} onChange={e => setForm({...form, tarih: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', flex: 1, minWidth: '120px' }} />
                <input required placeholder="Öğe (Firma/Kişi)" value={form.oge} onChange={e => setForm({...form, oge: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', flex: 1, minWidth: '150px' }} />
                <input placeholder="Makbuz No" value={form.makbuz_no} onChange={e => setForm({...form, makbuz_no: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', flex: 1, minWidth: '100px' }} />
                <input placeholder="Fatura No" value={form.fatura_no} onChange={e => setForm({...form, fatura_no: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', flex: 1, minWidth: '100px' }} />
                <input required placeholder="Kategori" value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', flex: 1, minWidth: '120px' }} />
                <input placeholder="Açıklama" value={form.aciklama} onChange={e => setForm({...form, aciklama: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', flex: 2, minWidth: '200px' }} />
                <input required type="number" placeholder="Tutar (₺)" value={form.tutar} onChange={e => setForm({...form, tutar: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', flex: 1, minWidth: '100px' }} />
                
                <button type="submit" disabled={yukleniyor} style={{ padding: '8px 20px', backgroundColor: duzenlenenId ? '#ea580c' : '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {yukleniyor ? '...' : (duzenlenenId ? 'Güncelle' : 'Ekle')}
                </button>
                {duzenlenenId && (
                  <button type="button" onClick={iptalEt} style={{ padding: '8px 15px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>İptal</button>
                )}
              </form>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <tr>
                    <th style={{ padding: '12px 15px', color: '#4b5563' }}>Tarih</th>
                    <th style={{ padding: '12px 15px', color: '#4b5563' }}>Öğe</th>
                    <th style={{ padding: '12px 15px', color: '#4b5563' }}>Makbuz No</th>
                    <th style={{ padding: '12px 15px', color: '#4b5563' }}>Fatura No</th>
                    <th style={{ padding: '12px 15px', color: '#4b5563' }}>Kategori</th>
                    <th style={{ padding: '12px 15px', color: '#4b5563' }}>Açıklama</th>
                    <th style={{ padding: '12px 15px', color: '#4b5563', textAlign: 'right' }}>Tutar</th>
                    <th style={{ padding: '12px 15px', color: '#4b5563', textAlign: 'center' }}>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {harcamalar.map((islem) => (
                    <tr key={islem.id} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: duzenlenenId === islem.id ? '#fef2f2' : 'transparent' }}>
                      <td style={{ padding: '12px 15px', whiteSpace: 'nowrap' }}>{islem.tarih}</td>
                      <td style={{ padding: '12px 15px', fontWeight: '500', color: '#111827' }}>{islem.oge || '-'}</td>
                      <td style={{ padding: '12px 15px', color: '#6b7280' }}>{islem.makbuz_no || '-'}</td>
                      <td style={{ padding: '12px 15px', color: '#6b7280' }}>{islem.fatura_no || '-'}</td>
                      <td style={{ padding: '12px 15px' }}><span style={{ backgroundColor: '#e5e7eb', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>{islem.kategori}</span></td>
                      <td style={{ padding: '12px 15px', color: '#4b5563' }}>{islem.aciklama || '-'}</td>
                      <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#dc2626', textAlign: 'right' }}>₺{Number(islem.tutar).toLocaleString('tr-TR')}</td>
                      <td style={{ padding: '12px 15px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button onClick={() => duzenlemeyeBasla(islem)} style={{ padding: '4px 8px', marginRight: '5px', backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Düzenle</button>
                        <button onClick={() => sil(islem.id)} style={{ padding: '4px 8px', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Sil</button>
                      </td>
                    </tr>
                  ))}
                  {harcamalar.length === 0 && (
                    <tr><td colSpan="8" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Bu projeye ait henüz harcama kaydı bulunmuyor.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
