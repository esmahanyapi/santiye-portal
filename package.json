import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Vercel kasasındaki şifreleri alıp Supabase'e bağlanıyoruz
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Dashboard() {
  const [isClient, setIsClient] = useState(false);
  const [harcamalar, setHarcamalar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);

  // Sayfa açıldığında verileri getir
  useEffect(() => {
    setIsClient(true);
    verileriGetir();
  }, []);

  // Supabase'den tabloyu okuyan fonksiyon
  async function verileriGetir() {
    const { data } = await supabase.from('harcamalar').select('*').order('created_at', { ascending: false });
    if (data) setHarcamalar(data);
  }

  // Butona basıldığında test verisi gönderen fonksiyon
  async function fisOkut() {
    setYukleniyor(true);
    // Veritabanına test harcaması ekliyoruz
    const { error } = await supabase.from('harcamalar').insert([{
      tarih: new Date().toISOString().split('T')[0],
      kategori: 'Malzeme',
      tutar: Math.floor(Math.random() * 5000) + 500, // Rastgele bir tutar
      aciklama: 'Nalbur - Test Fişi (Sistem Bağlantı Kontrolü)'
    }]);
    
    await verileriGetir(); // Ekledikten sonra listeyi yenile
    setYukleniyor(false);
  }

  if (!isClient) return null;

  // Toplam harcamayı otomatik hesapla
  const toplamHarcama = harcamalar.reduce((toplam, item) => toplam + Number(item.tutar), 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sol Menü */}
      <div style={{ width: '250px', backgroundColor: '#1e293b', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '22px', borderBottom: '1px solid #334155', paddingBottom: '15px', marginTop: 0 }}>Esmahan Yapı</h2>
        <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '-5px', marginBottom: '30px' }}>Şantiye Yönetim Sistemi</p>
        
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <li style={{ padding: '10px 15px', backgroundColor: '#3b82f6', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>📊 Ana Ekran</li>
          <li style={{ padding: '10px 15px', cursor: 'pointer', color: '#cbd5e1' }}>🧾 Giderler & Fişler</li>
          <li style={{ padding: '10px 15px', cursor: 'pointer', color: '#cbd5e1' }}>👷‍♂️ Puantaj (Yoklama)</li>
          <li style={{ padding: '10px 15px', cursor: 'pointer', color: '#cbd5e1' }}>🏢 Projeler</li>
        </ul>
      </div>

      {/* Ana İçerik */}
      <div style={{ flex: 1, padding: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#0f172a', margin: 0, fontSize: '28px' }}>Genel Durum Özeti</h1>
          <button 
            onClick={fisOkut}
            disabled={yukleniyor}
            style={{ backgroundColor: yukleniyor ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: yukleniyor ? 'wait' : 'pointer', fontWeight: 'bold', fontSize: '15px', boxShadow: '0 4px 6px rgba(37,99,235,0.2)' }}>
            {yukleniyor ? 'İşleniyor...' : '+ Yeni Fiş / Fatura Okut (Test)'}
          </button>
        </div>

        {/* Özet Kartları */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
          <div style={{ flex: 1, backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '14px', textTransform: 'uppercase' }}>Aktif Projeler</h3>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#0f172a' }}>2</p>
          </div>
          <div style={{ flex: 1, backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '14px', textTransform: 'uppercase' }}>İşlenen Fiş Sayısı</h3>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#eab308' }}>{harcamalar.length}</p>
          </div>
          <div style={{ flex: 1, backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '14px', textTransform: 'uppercase' }}>Toplam Harcama</h3>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>₺{toplamHarcama.toLocaleString('tr-TR')}</p>
          </div>
        </div>

        {/* Veritabanı Tablo Alanı */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '18px' }}>Son Yüklenen Harcama Belgeleri</h2>
          
          {harcamalar.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', border: '2px dashed #e2e8f0', borderRadius: '8px', color: '#94a3b8' }}>
              <p style={{ fontSize: '16px' }}>Sistemde henüz veri bulunmuyor.</p>
              <p style={{ fontSize: '14px' }}>Yukarıdaki butona basarak ilk test fişinizi sisteme ekleyin.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '12px 8px' }}>Tarih</th>
                  <th style={{ padding: '12px 8px' }}>Kategori</th>
                  <th style={{ padding: '12px 8px' }}>Açıklama</th>
                  <th style={{ padding: '12px 8px' }}>Tutar</th>
                </tr>
              </thead>
              <tbody>
                {harcamalar.map((islem) => (
                  <tr key={islem.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 8px' }}>{islem.tarih}</td>
                    <td style={{ padding: '12px 8px' }}><span style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '13px' }}>{islem.kategori}</span></td>
                    <td style={{ padding: '12px 8px' }}>{islem.aciklama}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 'bold', color: '#0f172a' }}>₺{Number(islem.tutar).toLocaleString('tr-TR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
