export default function Home() {
  return (
    <div style={{ padding: '50px', fontFamily: 'sans-serif', textAlign: 'center', backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
      <h1 style={{ color: '#1a365d', fontSize: '32px' }}>Esmahan Yapı İnşaat</h1>
      <h2 style={{ color: '#4a5568' }}>Şantiye Finans ve Yönetim Portalı</h2>
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: 'white', borderRadius: '10px', display: 'inline-block', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <p style={{ color: '#2b6cb0', fontWeight: 'bold' }}>Sistem Altyapısı Başarıyla Kuruldu!</p>
        <p>Veritabanı bağlantıları test ediliyor...</p>
      </div>
    </div>
  );
}
