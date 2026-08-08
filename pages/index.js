import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

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
          <button style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', boxShadow: '0 4px 6px rgba(37,99,235,0.2)' }}>
            + Yeni Fiş / Fatura Okut (Yapay Zeka)
          </button>
        </div>

        {/* Özet Kartları */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
          <div style={{ flex: 1, backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '14px', textTransform: 'uppercase' }}>Aktif Projeler</h3>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#0f172a' }}>2</p>
          </div>
          <div style={{ flex: 1, backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '14px', textTransform: 'uppercase' }}>Onay Bekleyen Fiş</h3>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#eab308' }}>0</p>
          </div>
          <div style={{ flex: 1, backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '14px', textTransform: 'uppercase' }}>Toplam Harcama (Bu Ay)</h3>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>₺0,00</p>
          </div>
        </div>

        {/* Veritabanı Tablo Alanı */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '18px' }}>Son Yüklenen Harcama Belgeleri</h2>
          <div style={{ textAlign: 'center', padding: '60px 20px', border: '2px dashed #e2e8f0', borderRadius: '8px', color: '#94a3b8' }}>
            <p style={{ fontSize: '16px' }}>Sistemde henüz veri bulunmuyor.</p>
            <p style={{ fontSize: '14px' }}>Supabase veritabanı bağlantısı aktif. Yapay zeka ile ilk fişinizi okutmak için sağ üstteki butonu kullanın.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
