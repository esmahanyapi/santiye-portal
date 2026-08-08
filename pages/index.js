import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Dashboard() {
  const [isClient, setIsClient] = useState(false);
  const [harcamalar, setHarcamalar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  
  // Excel'deki sütunlara göre form yapısı
  const [form, setForm] = useState({
    oge: '', makbuz_no: '', fatura_no: '', tarih: '', kategori: '', aciklama: '', tutar: ''
  });

  useEffect(() => {
    setIsClient(true);
    verileriGetir();
  }, []);

  async function verileriGetir() {
    const { data } = await supabase.from('harcamalar').select('*').order('tarih', { ascending: false });
    if (data) setHarcamalar(data);
  }

  // Yeni form gönderme işlemi
  async function kaydet(e) {
    e.preventDefault();
    setYukleniyor(true);
    
    const { error } = await supabase.from('harcamalar').insert([{
      oge: form.oge,
      makbuz_no: form.makbuz_no,
      fatura_no: form.fatura_no,
      tarih: form.tarih,
      kategori: form.kategori,
      aciklama: form.aciklama,
      tutar: Number(form.tutar)
    }]);
    
    if(!error) {
      // Başarılıysa formu temizle ve listeyi yenile
      setForm({ oge: '', makbuz_no: '', fatura_no: '', tarih: '', kategori: '', aciklama: '', tutar: '' });
      await verileriGetir();
    } else {
      alert("Kayıt eklenirken hata oluştu! Supabase sütunlarını kontrol edin.");
    }
    setYukleniyor(false);
  }

  if (!isClient) return null;

  const toplamHarcama = harcamalar.reduce((toplam, item) => toplam + Number(item.tutar), 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sol Menü */}
      <div style={{ width: '250px', backgroundColor: '#111827', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '20px', borderBottom: '1px solid #374151', paddingBottom: '15px', marginTop: 0 }}>Esmahan Yapı</h2>
        <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '-5px', marginBottom: '30px' }}>4129 Ada 1 Parsel - Silivri</p>
        
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <li style={{ padding: '12px 15px', backgroundColor: '#2563eb', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>📊 Bütçe & Giderler</li>
          <li style={{ padding: '12px 15px', cursor: 'pointer', color: '#d1d5db' }}>📈 Gelirler</li>
          <li style={{ padding: '12px 15px', cursor: 'pointer', color: '#d1d5db' }}>👷‍♂️ Puantaj</li>
        </ul>
      </div>

      {/* Ana İçerik */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        
        {/* Üst Özet Kartları */}
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

        {/* Veri Giriş Formu */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
          <h2 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#111827' }}>Yeni Gider Ekle</h2>
          <form onSubmit={kaydet} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input required type="date" value={form.tarih} onChange={e => setForm({...form, tarih: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', flex: 1, minWidth: '120px' }} />
            <input required placeholder="Öğe (Firma/Kişi)" value={form.oge} onChange={e => setForm({...form, oge: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', flex: 1, minWidth: '150px' }} />
            <input placeholder="Makbuz No" value={form.makbuz_no} onChange={e => setForm({...form, makbuz_no: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', flex: 1, minWidth: '100px' }} />
            <input placeholder="Fatura No" value={form.fatura_no} onChange={e => setForm({...form, fatura_no: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', flex: 1, minWidth: '100px' }} />
            <input required placeholder="Kategori" value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', flex: 1, minWidth: '120px' }} />
            <input placeholder="Açıklama" value={form.aciklama} onChange={e => setForm({...form, aciklama: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', flex: 2, minWidth: '200px' }} />
            <input required type="number" placeholder="Tutar (₺)" value={form.tutar} onChange={e => setForm({...form, tutar: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', flex: 1, minWidth: '100px' }} />
            <button type="submit" disabled={yukleniyor} style={{ padding: '8px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              {yukleniyor ? '...' : 'Ekle'}
            </button>
          </form>
        </div>

        {/* Excel Tipi Tablo */}
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
              </tr>
            </thead>
            <tbody>
              {harcamalar.map((islem) => (
                <tr key={islem.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 15px', whiteSpace: 'nowrap' }}>{islem.tarih}</td>
                  <td style={{ padding: '12px 15px', fontWeight: '500', color: '#111827' }}>{islem.oge || '-'}</td>
                  <td style={{ padding: '12px 15px', color: '#6b7280' }}>{islem.makbuz_no || '-'}</td>
                  <td style={{ padding: '12px 15px', color: '#6b7280' }}>{islem.fatura_no || '-'}</td>
                  <td style={{ padding: '12px 15px' }}><span style={{ backgroundColor: '#e5e7eb', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>{islem.kategori}</span></td>
                  <td style={{ padding: '12px 15px', color: '#4b5563' }}>{islem.aciklama || '-'}</td>
                  <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#dc2626', textAlign: 'right' }}>₺{Number(islem.tutar).toLocaleString('tr-TR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
