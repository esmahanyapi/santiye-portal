import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const router = useRouter();

  const [isClient, setIsClient] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [kullanici, setKullanici] = useState(null);

  const [projeler, setProjeler] = useState([]);
  const [seciliProje, setSeciliProje] = useState(null);
  const [yeniProjeAdi, setYeniProjeAdi] = useState('');

  const [harcamalar, setHarcamalar] = useState([]);
  const [gelirler, setGelirler] = useState([]);
  const [aktifSekme, setAktifSekme] = useState('ozet');

  const [filtreKategori, setFiltreKategori] = useState('');
  const [filtreAciklama, setFiltreAciklama] = useState('');

  const [mesaj, setMesaj] = useState('');
  const [hata, setHata] = useState('');
  const [projeEkleniyor, setProjeEkleniyor] = useState(false);

 const formBaslangic = {
  oge: '',
  makbuz_no: '',
  fatura_no: '',
  tarih: new Date().toISOString().split('T')[0],
  kategori: '',
  aciklama: '',
  tutar: '',
  odeme_kaynagi: 'Kasa'
};

  const [form, setForm] = useState(formBaslangic);

  // ---------------------------------------------------------
  // SAYFA AÇILDIĞINDA KULLANICIYI KONTROL ET
  // ---------------------------------------------------------

  useEffect(() => {
    setIsClient(true);
    oturumKontrol();
  }, []);

  async function oturumKontrol() {
    setLoadingSession(true);

    const {
      data: { session },
      error
    } = await supabase.auth.getSession();

    if (error) {
      console.error('Oturum kontrol hatası:', error);
      setHata('Oturum kontrol edilirken bir hata oluştu.');
      setLoadingSession(false);
      return;
    }

    if (!session) {
      console.log('Aktif kullanıcı yok. Login sayfasına gönderiliyor.');
      router.replace('/login');
      return;
    }

    console.log('Aktif kullanıcı:', session.user.email);

    setKullanici(session.user);
    setLoadingSession(false);

    await projeleriGetir();
  }

  // ---------------------------------------------------------
  // OTURUM DEĞİŞİKLİĞİNİ DİNLE
  // ---------------------------------------------------------

  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth değişikliği:', event);

      if (!session) {
        setKullanici(null);
        router.replace('/login');
      } else {
        setKullanici(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // ---------------------------------------------------------
  // PROJELERİ GETİR
  // ---------------------------------------------------------

  async function projeleriGetir() {
    setHata('');

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
      router.replace('/login');
      return;
    }

    const { data, error } = await supabase
      .from('projeler')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Projeler alınamadı:', error);
      setHata('Projeler alınamadı: ' + error.message);
      return;
    }

    setProjeler(data || []);

    if (data && data.length > 0 && !seciliProje) {
      setSeciliProje(data[0]);
    }
  }

  // ---------------------------------------------------------
  // PROJE SEÇİLİNCE GELİR/GİDERLERİ GETİR
  // ---------------------------------------------------------

  useEffect(() => {
    if (seciliProje) {
      verileriGetir();
    }
  }, [seciliProje]);

  async function verileriGetir() {
    if (!seciliProje) return;

    const { data: h, error: hError } = await supabase
      .from('harcamalar')
      .select('*')
      .eq('proje_id', seciliProje.id);

    const { data: g, error: gError } = await supabase
      .from('gelirler')
      .select('*')
      .eq('proje_id', seciliProje.id);

    if (hError) {
      console.error('Harcamalar alınamadı:', hError);
    }

    if (gError) {
      console.error('Gelirler alınamadı:', gError);
    }

    setHarcamalar(h || []);
    setGelirler(g || []);
  }

  // ---------------------------------------------------------
  // YENİ PROJE EKLE
  // ---------------------------------------------------------

  async function yeniProjeEkle(event) {
    event.preventDefault();

    setHata('');
    setMesaj('');

    const projeAdi = yeniProjeAdi.trim();

    if (!projeAdi) {
      setHata('Lütfen proje adı yazın.');
      return;
    }

    setProjeEkleniyor(true);

    try {
      // Önce aktif oturumu kontrol et
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error('Oturum kontrol edilemedi: ' + sessionError.message);
      }

      if (!session) {
        setHata('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
        router.replace('/login');
        return;
      }

      console.log('Proje ekleyen kullanıcı:', session.user.email);
      console.log('Kullanıcı ID:', session.user.id);

      // PROJE EKLE
      const { data, error } = await supabase
        .from('projeler')
        .insert([
          {
            ad: projeAdi
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase proje ekleme hatası:', error);
        throw new Error(error.message);
      }

      console.log('Eklenen proje:', data);

      setYeniProjeAdi('');
      setMesaj('Proje başarıyla eklendi.');

      // Listeyi yenile
      await projeleriGetir();

      // Eklenen projeyi seç
      if (data) {
        setSeciliProje(data);
      }

    } catch (error) {
      console.error(error);
      setHata('Proje eklenemedi: ' + error.message);
    } finally {
      setProjeEkleniyor(false);
    }
  }

  // ---------------------------------------------------------
  // GELİR / GİDER KAYDET
  // ---------------------------------------------------------

  async function kaydet(event) {
    event.preventDefault();

    setHata('');
    setMesaj('');

    if (!seciliProje) {
      setHata('Önce bir proje seçmelisiniz.');
      return;
    }

    const tablo =
      aktifSekme === 'gelirler'
        ? 'gelirler'
        : 'harcamalar';

    const { error } = await supabase
      .from(tablo)
      .insert([
        {
          ...form,
          proje_id: seciliProje.id,
          tutar: Number(form.tutar)
        }
      ]);

    if (error) {
      console.error('Kayıt hatası:', error);
      setHata('Kayıt eklenemedi: ' + error.message);
      return;
    }

    setForm(formBaslangic);
    setMesaj('Kayıt başarıyla eklendi.');

    await verileriGetir();
  }

  // ---------------------------------------------------------
  // KAYIT SİL
  // ---------------------------------------------------------

  async function sil(id) {
    if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
      return;
    }

    const tablo =
      aktifSekme === 'gelirler'
        ? 'gelirler'
        : 'harcamalar';

    const { error } = await supabase
      .from(tablo)
      .delete()
      .eq('id', id);

    if (error) {
      setHata('Kayıt silinemedi: ' + error.message);
      return;
    }

    await verileriGetir();
  }

  // ---------------------------------------------------------
  // ÇIKIŞ
  // ---------------------------------------------------------

  async function cikisYap() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  // ---------------------------------------------------------
  // FİLTRELER
  // ---------------------------------------------------------

  const aktifListe =
    aktifSekme === 'gelirler'
      ? gelirler
      : harcamalar;

  const gorunenListe = aktifListe.filter(item =>
    (filtreKategori === '' ||
      item.kategori
        ?.toLowerCase()
        .includes(filtreKategori.toLowerCase())) &&
    (filtreAciklama === '' ||
      item.aciklama
        ?.toLowerCase()
        .includes(filtreAciklama.toLowerCase()))
  );

  const gorunenToplam = gorunenListe.reduce(
    (t, i) => t + Number(i.tutar),
    0
  );

  const toplamGelir = gelirler.reduce(
    (t, i) => t + Number(i.tutar),
    0
  );

  const toplamGider = harcamalar.reduce(
    (t, i) => t + Number(i.tutar),
    0
  );

  const netBakiye = toplamGelir - toplamGider;

  // ---------------------------------------------------------
  // YÜKLENİYOR
  // ---------------------------------------------------------

  if (!isClient || loadingSession) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#f8fafc',
          fontFamily: 'system-ui, sans-serif',
          color: '#475569'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '42px', marginBottom: '15px' }}>
            🏗️
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>
            Portal hazırlanıyor...
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // ANA EKRAN
  // ---------------------------------------------------------

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        fontFamily:
          'system-ui, -apple-system, sans-serif'
      }}
    >

      {/* SOL MENÜ */}

      <div
        style={{
          width: '300px',
          backgroundColor: '#0f172a',
          color: 'white',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow:
            '4px 0 10px rgba(0,0,0,0.05)'
        }}
      >

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '25px',
            borderBottom:
              '1px solid #1e293b',
            paddingBottom: '15px'
          }}
        >
          <span style={{ fontSize: '24px' }}>
            🏗️
          </span>

          <div>
            <h2
              style={{
                fontSize: '18px',
                margin: 0,
                fontWeight: '700',
                color: '#f8fafc'
              }}
            >
              Esmahan Yapı
            </h2>

            <p
              style={{
                fontSize: '12px',
                margin: 0,
                color: '#94a3b8'
              }}
            >
              Şantiye Yönetim Portalı
            </p>
          </div>
        </div>

        {/* KULLANICI */}

        {kullanici && (
          <div
            style={{
              background: '#1e293b',
              borderRadius: '8px',
              padding: '10px 12px',
              marginBottom: '20px',
              fontSize: '12px',
              color: '#cbd5e1'
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: '#fff',
                marginBottom: '3px'
              }}
            >
              Giriş yapıldı
            </div>

            <div
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {kullanici.email}
            </div>
          </div>
        )}

        <p
          style={{
            color: '#64748b',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '12px',
            fontWeight: 'bold'
          }}
        >
          Projelerim
        </p>

        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            flex: 1,
            overflowY: 'auto'
          }}
        >

          {projeler.map(p => (
            <li
              key={p.id}
              onClick={() =>
                setSeciliProje(p)
              }
              style={{
                padding: '12px 16px',
                background:
                  seciliProje?.id === p.id
                    ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                    : 'transparent',
                color:
                  seciliProje?.id === p.id
                    ? '#fff'
                    : '#cbd5e1',
                cursor: 'pointer',
                borderRadius: '10px',
                fontWeight:
                  seciliProje?.id === p.id
                    ? '600'
                    : '400',
                boxShadow:
                  seciliProje?.id === p.id
                    ? '0 4px 12px rgba(59,130,246,0.3)'
                    : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <span>🏢</span>
              {p.ad}
            </li>
          ))}

          {projeler.length === 0 && (
            <li
              style={{
                padding: '10px 12px',
                color: '#64748b',
                fontSize: '13px'
              }}
            >
              Henüz proje bulunmuyor.
            </li>
          )}

        </ul>

        {/* YENİ PROJE */}

        <form
          onSubmit={yeniProjeEkle}
          style={{
            marginTop: '20px',
            borderTop:
              '1px solid #1e293b',
            paddingTop: '20px'
          }}
        >

          <input
            value={yeniProjeAdi}
            onChange={e =>
              setYeniProjeAdi(e.target.value)
            }
            placeholder="Yeni Proje Adı..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 14px',
              borderRadius: '8px',
              border:
                '1px solid #334155',
              marginBottom: '10px',
              backgroundColor: '#1e293b',
              color: 'white',
              fontSize: '13px',
              outline: 'none'
            }}
          />

          <button
            type="submit"
            disabled={projeEkleniyor}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor:
                projeEkleniyor
                  ? '#64748b'
                  : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor:
                projeEkleniyor
                  ? 'wait'
                  : 'pointer',
              fontWeight: '600',
              boxShadow:
                '0 4px 10px rgba(16,185,129,0.2)'
            }}
          >
            {projeEkleniyor
              ? 'Ekleniyor...'
              : '+ Yeni Proje Ekle'}
          </button>

        </form>

        {/* ÇIKIŞ */}

        <button
          onClick={cikisYap}
          style={{
            width: '100%',
            marginTop: '10px',
            padding: '9px',
            background: 'transparent',
            color: '#94a3b8',
            border:
              '1px solid #334155',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Çıkış Yap
        </button>

      </div>

      {/* ANA ALAN */}

      <div
        style={{
          flex: 1,
          padding: '40px',
          overflowY: 'auto',
          maxWidth: '1400px'
        }}
      >

        {/* HATA */}

        {hata && (
          <div
            style={{
              marginBottom: '20px',
              padding: '14px 18px',
              background: '#fee2e2',
              border:
                '1px solid #fecaca',
              color: '#991b1b',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            {hata}
          </div>
        )}

        {/* BAŞARI */}

        {mesaj && (
          <div
            style={{
              marginBottom: '20px',
              padding: '14px 18px',
              background: '#dcfce7',
              border:
                '1px solid #bbf7d0',
              color: '#166534',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            {mesaj}
          </div>
        )}

        {!seciliProje ? (

          <div
            style={{
              textAlign: 'center',
              marginTop: '150px',
              color: '#64748b'
            }}
          >
            <span
              style={{ fontSize: '48px' }}
            >
              👈
            </span>

            <h2>
              Lütfen sol menüden yönetmek
              istediğiniz projeyi seçin.
            </h2>

            <p>
              Başlamak için sol alttan yeni
              bir proje ekleyebilirsiniz.
            </p>
          </div>

        ) : (

          <>
            {/* BAŞLIK */}

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                marginBottom: '30px'
              }}
            >
              <div>

                <h1
                  style={{
                    fontSize: '28px',
                    fontWeight: '800',
                    color: '#0f172a',
                    margin:
                      '0 0 5px 0'
                  }}
                >
                  {seciliProje.ad}
                </h1>

                <p
                  style={{
                    color: '#64748b',
                    margin: 0,
                    fontSize: '14px'
                  }}
                >
                  Finansal Akış ve
                  Gider/Gelir Takip Paneli
                </p>

              </div>
            </div>

            {/* SEKME */}

            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '30px'
              }}
            >

              {[
                {
                  id: 'ozet',
                  label: '📊 Genel Özet',
                  color: '#6366f1'
                },
                {
                  id: 'gelirler',
                  label: '📈 Gelir Kalemleri',
                  color: '#059669'
                },
                {
                  id: 'giderler',
                  label: '📉 Gider Kalemleri',
                  color: '#dc2626'
                }
              ].map(s => (

                <button
                  key={s.id}
                  onClick={() => {
                    setAktifSekme(s.id);
                    setFiltreKategori('');
                    setFiltreAciklama('');
                    setHata('');
                    setMesaj('');
                  }}
                  style={{
                    padding:
                      '12px 24px',
                    backgroundColor:
                      aktifSekme === s.id
                        ? s.color
                        : '#ffffff',
                    color:
                      aktifSekme === s.id
                        ? '#ffffff'
                        : '#475569',
                    border:
                      aktifSekme === s.id
                        ? 'none'
                        : '1px solid #e2e8f0',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    boxShadow:
                      aktifSekme === s.id
                        ? '0 4px 12px rgba(0,0,0,0.15)'
                        : '0 1px 3px rgba(0,0,0,0.02)'
                  }}
                >
                  {s.label}
                </button>

              ))}

            </div>

            {/* ÖZET */}

            {aktifSekme === 'ozet' ? (

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '24px'
                }}
              >

                <div
                  style={{
                    background:
                      'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                    padding: '25px',
                    borderRadius: '16px',
                    border:
                      '1px solid #dcfce7'
                  }}
                >
                  <span
                    style={{
                      color: '#166534',
                      fontSize: '13px',
                      fontWeight: '700'
                    }}
                  >
                    TOPLAM GELİR
                  </span>

                  <p
                    style={{
                      fontSize: '32px',
                      fontWeight: '800',
                      color: '#059669',
                      margin: '15px 0 0'
                    }}
                  >
                    ₺
                    {toplamGelir.toLocaleString(
                      'tr-TR'
                    )}
                  </p>
                </div>

                <div
                  style={{
                    background:
                      'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)',
                    padding: '25px',
                    borderRadius: '16px',
                    border:
                      '1px solid #fee2e2'
                  }}
                >
                  <span
                    style={{
                      color: '#991b1b',
                      fontSize: '13px',
                      fontWeight: '700'
                    }}
                  >
                    TOPLAM GİDER
                  </span>

                  <p
                    style={{
                      fontSize: '32px',
                      fontWeight: '800',
                      color: '#dc2626',
                      margin: '15px 0 0'
                    }}
                  >
                    ₺
                    {toplamGider.toLocaleString(
                      'tr-TR'
                    )}
                  </p>
                </div>

                <div
                  style={{
                    background:
                      'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
                    padding: '25px',
                    borderRadius: '16px',
                    border:
                      '1px solid #dbeafe'
                  }}
                >
                  <span
                    style={{
                      color: '#1e40af',
                      fontSize: '13px',
                      fontWeight: '700'
                    }}
                  >
                    NET KASA / BAKİYE
                  </span>

                  <p
                    style={{
                      fontSize: '32px',
                      fontWeight: '800',
                      color:
                        netBakiye >= 0
                          ? '#2563eb'
                          : '#dc2626',
                      margin: '15px 0 0'
                    }}
                  >
                    ₺
                    {netBakiye.toLocaleString(
                      'tr-TR'
                    )}
                  </p>
                </div>

              </div>

            ) : (

              /* GELİR / GİDER */

              <div
                style={{
                  background: 'white',
                  padding: '30px',
                  borderRadius: '16px',
                  boxShadow:
                    '0 4px 6px -1px rgba(0,0,0,0.05)',
                  border:
                    '1px solid #e2e8f0'
                }}
              >

                <h3
                  style={{
                    marginTop: 0,
                    marginBottom: '20px',
                    color: '#0f172a'
                  }}
                >
                  {aktifSekme === 'gelirler'
                    ? '➕ Yeni Gelir Kalemi Ekle'
                    : '➕ Yeni Gider Kalemi Ekle'}
                </h3>

                <form
                  onSubmit={kaydet}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                    marginBottom: '35px',
                    background: '#f8fafc',
                    padding: '20px',
                    borderRadius: '12px'
                  }}
                >

                  <input
                    required
                    type="date"
                    value={form.tarih}
                    onChange={e =>
                      setForm({
                        ...form,
                        tarih:
                          e.target.value
                      })
                    }
                    style={{
                      padding: '10px',
                      border:
                        '1px solid #cbd5e1',
                      borderRadius: '8px'
                    }}
                  />

                  <input
                    required
                    placeholder="Öğe / Firma / Kişi"
                    value={form.oge}
                    onChange={e =>
                      setForm({
                        ...form,
                        oge:
                          e.target.value
                      })
                    }
                    style={{
                      padding: '10px',
                      border:
                        '1px solid #cbd5e1',
                      borderRadius: '8px',
                      flex: 1
                    }}
                  />

                  <input
                    placeholder="Makbuz No"
                    value={form.makbuz_no}
                    onChange={e =>
                      setForm({
                        ...form,
                        makbuz_no:
                          e.target.value
                      })
                    }
                    style={{
                      padding: '10px',
                      border:
                        '1px solid #cbd5e1',
                      borderRadius: '8px'
                    }}
                  />

                  <input
                    placeholder="Fatura No"
                    value={form.fatura_no}
                    onChange={e =>
                      setForm({
                        ...form,
                        fatura_no:
                          e.target.value
                      })
                    }
                    style={{
                      padding: '10px',
                      border:
                        '1px solid #cbd5e1',
                      borderRadius: '8px'
                    }}
                  />

                  <input
                    required
                    placeholder="Kategori"
                    value={form.kategori}
                    onChange={e =>
                      setForm({
                        ...form,
                        kategori:
                          e.target.value
                      })
                    }
                    style={{
                      padding: '10px',
                      border:
                        '1px solid #cbd5e1',
                      borderRadius: '8px'
                    }}
                  />

                  <input
                    placeholder="Açıklama / Taşeron"
                    value={form.aciklama}
                    onChange={e =>
                      setForm({
                        ...form,
                        aciklama:
                          e.target.value
                      })
                    }
                    style={{
                      padding: '10px',
                      border:
                        '1px solid #cbd5e1',
                      borderRadius: '8px',
                      flex: 2
                    }}
                  />

                  <input
                    required
                    type="number"
                    placeholder="Tutar"
                    value={form.tutar}
                    onChange={e =>
                      setForm({
                        ...form,
                        tutar:
                          e.target.value
                      })
                    }
                    style={{
                      padding: '10px',
                      border:
                        '1px solid #cbd5e1',
                      borderRadius: '8px'
                    }}
                  />

                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#2563eb',
                      color: 'white',
                      border: 0,
                      borderRadius: '8px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Sisteme Kaydet
                  </button>

                </form>

                {/* FİLTRE */}

                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    background: '#eff6ff',
                    padding: '15px 20px',
                    borderRadius: '12px',
                    flexWrap: 'wrap',
                    gap: '15px'
                  }}
                >

                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      flexWrap: 'wrap'
                    }}
                  >

                    <input
                      placeholder="Kategoriye göre ara..."
                      value={
                        filtreKategori
                      }
                      onChange={e =>
                        setFiltreKategori(
                          e.target.value
                        )
                      }
                      style={{
                        padding:
                          '8px 12px',
                        border:
                          '1px solid #93c5fd',
                        borderRadius: '6px'
                      }}
                    />

                    <input
                      placeholder="Açıklama / Taşeron ara..."
                      value={
                        filtreAciklama
                      }
                      onChange={e =>
                        setFiltreAciklama(
                          e.target.value
                        )
                      }
                      style={{
                        padding:
                          '8px 12px',
                        border:
                          '1px solid #93c5fd',
                        borderRadius: '6px'
                      }}
                    />

                  </div>

                  <div
                    style={{
                      background: '#1e40af',
                      color: '#fff',
                      padding:
                        '8px 16px',
                      borderRadius: '8px',
                      fontWeight: '700'
                    }}
                  >
                    Filtrelenen Toplam:
                    {' '}
                    ₺
                    {gorunenToplam.toLocaleString(
                      'tr-TR'
                    )}
                  </div>

                </div>

                {/* TABLO */}

                <div
                  style={{
                    overflowX: 'auto'
                  }}
                >

                  <table
                    style={{
                      width: '100%',
                      borderCollapse:
                        'collapse',
                      fontSize: '14px'
                    }}
                  >

                    <thead>
                      <tr
                        style={{
                          borderBottom:
                            '2px solid #e2e8f0',
                          background:
                            '#f8fafc'
                        }}
                      >
                        <th>Tarih</th>
                        <th>Öğe</th>
                        <th>Makbuz No</th>
                        <th>Fatura No</th>
                        <th>Kategori</th>
                        <th>Açıklama</th>
                        <th>Tutar</th>
                        <th>İşlem</th>
                      </tr>
                    </thead>

                    <tbody>

                      {gorunenListe.map(i => (

                        <tr
                          key={i.id}
                          style={{
                            borderBottom:
                              '1px solid #f1f5f9'
                          }}
                        >

                          <td>
                            {i.tarih}
                          </td>

                          <td
                            style={{
                              fontWeight: 600
                            }}
                          >
                            {i.oge || '-'}
                          </td>

                          <td>
                            {i.makbuz_no ||
                              '-'}
                          </td>

                          <td>
                            {i.fatura_no ||
                              '-'}
                          </td>

                          <td>
                            {i.kategori ||
                              '-'}
                          </td>

                          <td>
                            {i.aciklama ||
                              '-'}
                          </td>

                          <td
                            style={{
                              fontWeight:
                                'bold',
                              color:
                                aktifSekme ===
                                'gelirler'
                                  ? '#059669'
                                  : '#dc2626'
                            }}
                          >
                            ₺
                            {Number(
                              i.tutar
                            ).toLocaleString(
                              'tr-TR'
                            )}
                          </td>

                          <td>
                            <button
                              onClick={() =>
                                sil(i.id)
                              }
                              style={{
                                padding:
                                  '6px 12px',
                                background:
                                  '#fee2e2',
                                color:
                                  '#991b1b',
                                border: 0,
                                borderRadius:
                                  '6px',
                                cursor:
                                  'pointer'
                              }}
                            >
                              Sil
                            </button>
                          </td>

                        </tr>

                      ))}

                      {gorunenListe.length ===
                        0 && (
                        <tr>
                          <td
                            colSpan="8"
                            style={{
                              padding:
                                '40px',
                              textAlign:
                                'center',
                              color:
                                '#94a3b8'
                            }}
                          >
                            Kayıt bulunamadı.
                          </td>
                        </tr>
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
