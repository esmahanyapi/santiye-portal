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
  const [gelirler, setGelirler] = useState([]);

  const [aktifSekme, setAktifSekme] = useState('ozet');

  const [filtreKategori, setFiltreKategori] = useState('');
  const [filtreAciklama, setFiltreAciklama] = useState('');

  const [projeEkleniyor, setProjeEkleniyor] = useState(false);

  const [mesaj, setMesaj] = useState('');
  const [mesajTipi, setMesajTipi] = useState('');

  const formBaslangic = {
    oge: '',
    makbuz_no: '',
    fatura_no: '',
    tarih: new Date().toISOString().split('T')[0],
    kategori: '',
    aciklama: '',
    tutar: ''
  };

  const [form, setForm] = useState(formBaslangic);

  useEffect(() => {
    setIsClient(true);
    projeleriGetir();
  }, []);

  useEffect(() => {
    if (seciliProje) {
      verileriGetir();
    }
  }, [seciliProje]);

  function basariMesaji(metin) {
    setMesaj(metin);
    setMesajTipi('basari');

    setTimeout(() => {
      setMesaj('');
      setMesajTipi('');
    }, 4000);
  }

  function hataMesaji(metin) {
    setMesaj(metin);
    setMesajTipi('hata');
  }

  async function projeleriGetir() {
    const { data, error } = await supabase
      .from('projeler')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Projeler alınamadı:', error);
      hataMesaji('Projeler alınamadı: ' + error.message);
      return;
    }

    if (data) {
      setProjeler(data);

      if (data.length > 0 && !seciliProje) {
        setSeciliProje(data[0]);
      }
    }
  }

  async function verileriGetir() {
    if (!seciliProje) return;

    const { data: h, error: hError } = await supabase
      .from('harcamalar')
      .select('*')
      .eq('proje_id', seciliProje.id)
      .order('tarih', { ascending: false });

    if (hError) {
      console.error('Harcamalar alınamadı:', hError);
      hataMesaji('Harcamalar alınamadı: ' + hError.message);
    }

    const { data: g, error: gError } = await supabase
      .from('gelirler')
      .select('*')
      .eq('proje_id', seciliProje.id)
      .order('tarih', { ascending: false });

    if (gError) {
      console.error('Gelirler alınamadı:', gError);
      hataMesaji('Gelirler alınamadı: ' + gError.message);
    }

    setHarcamalar(h || []);
    setGelirler(g || []);
  }

  async function yeniProjeEkle(e) {
    e.preventDefault();

    const projeAdi = yeniProjeAdi.trim();

    if (!projeAdi) {
      hataMesaji('Lütfen yeni proje adını yazın.');
      return;
    }

    if (projeEkleniyor) {
      return;
    }

    setProjeEkleniyor(true);
    setMesaj('');
    setMesajTipi('');

    try {
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
        console.error('Yeni proje ekleme hatası:', error);

        hataMesaji(
          'Proje eklenemedi: ' +
          error.message
        );

        return;
      }

      if (!data) {
        hataMesaji(
          'Proje eklenemedi. Supabase herhangi bir kayıt döndürmedi.'
        );

        return;
      }

      setProjeler(prev => [...prev, data]);

      setSeciliProje(data);

      setYeniProjeAdi('');

      setAktifSekme('ozet');

      basariMesaji(
        `"${data.ad}" projesi başarıyla oluşturuldu.`
      );

    } catch (error) {
      console.error('Beklenmeyen proje ekleme hatası:', error);

      hataMesaji(
        'Beklenmeyen bir hata oluştu: ' +
        error.message
      );
    } finally {
      setProjeEkleniyor(false);
    }
  }

  async function kaydet(e) {
    e.preventDefault();

    if (!seciliProje) {
      hataMesaji('Önce bir proje seçmelisiniz.');
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
      console.error('Kayıt ekleme hatası:', error);

      hataMesaji(
        'Kayıt eklenemedi: ' +
        error.message
      );

      return;
    }

    setForm({
      ...formBaslangic,
      tarih: new Date().toISOString().split('T')[0]
    });

    await verileriGetir();

    basariMesaji(
      aktifSekme === 'gelirler'
        ? 'Gelir başarıyla kaydedildi.'
        : 'Gider başarıyla kaydedildi.'
    );
  }

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
      console.error('Silme hatası:', error);

      hataMesaji(
        'Kayıt silinemedi: ' +
        error.message
      );

      return;
    }

    await verileriGetir();

    basariMesaji('Kayıt başarıyla silindi.');
  }

  const aktifListe =
    aktifSekme === 'gelirler'
      ? gelirler
      : harcamalar;

  const gorunenListe = aktifListe.filter(item =>
    (
      filtreKategori === '' ||
      item.kategori?.toLowerCase().includes(
        filtreKategori.toLowerCase()
      )
    ) &&
    (
      filtreAciklama === '' ||
      item.aciklama?.toLowerCase().includes(
        filtreAciklama.toLowerCase()
      )
    )
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

  if (!isClient) {
    return null;
  }

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

        {/* LOGO / BAŞLIK */}
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

        {/* PROJE LİSTESİ */}
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
              onClick={() => {
                setSeciliProje(p);
                setAktifSekme('ozet');
                setMesaj('');
              }}
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
                    ? '0 4px 12px rgba(59, 130, 246, 0.3)'
                    : 'none',

                transition:
                  'all 0.2s ease',

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
                color: '#64748b',
                fontSize: '13px',
                padding: '10px'
              }}
            >
              Henüz proje bulunmuyor.
            </li>
          )}
        </ul>

        {/* YENİ PROJE FORMU */}
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
            disabled={projeEkleniyor}
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
                  ? 'not-allowed'
                  : 'pointer',

              fontWeight: '600',

              boxShadow:
                '0 4px 10px rgba(16, 185, 129, 0.2)'
            }}
          >
            {projeEkleniyor
              ? '⏳ Proje Ekleniyor...'
              : '+ Yeni Proje Ekle'}
          </button>
        </form>
      </div>

      {/* ANA İÇERİK */}
      <div
        style={{
          flex: 1,
          padding: '40px',
          overflowY: 'auto',
          maxWidth: '1400px'
        }}
      >

        {/* MESAJ */}
        {mesaj && (
          <div
            style={{
              marginBottom: '20px',
              padding: '14px 18px',
              borderRadius: '10px',

              backgroundColor:
                mesajTipi === 'basari'
                  ? '#dcfce7'
                  : '#fee2e2',

              color:
                mesajTipi === 'basari'
                  ? '#166534'
                  : '#991b1b',

              border:
                mesajTipi === 'basari'
                  ? '1px solid #86efac'
                  : '1px solid #fecaca',

              fontWeight: '600',
              fontSize: '14px'
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
            <span style={{ fontSize: '48px' }}>
              👈
            </span>

            <h2>
              Lütfen sol menüden yönetmek
              istediğiniz projeyi seçin.
            </h2>
          </div>

        ) : (

          <>
            {/* BAŞLIK */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
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

            {/* SEKMELER */}
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
                        : '0 1px 3px rgba(0,0,0,0.02)',

                    transition:
                      'all 0.2s'
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

                {/* GELİR */}
                <div
                  style={{
                    background:
                      'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                    padding: '25px',
                    borderRadius: '16px',
                    border:
                      '1px solid #dcfce7',
                    boxShadow:
                      '0 4px 6px -1px rgba(0,0,0,0.02)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      alignItems: 'center',
                      marginBottom: '15px'
                    }}
                  >
                    <span
                      style={{
                        color: '#166534',
                        fontSize: '13px',
                        fontWeight: '700',
                        textTransform:
                          'uppercase'
                      }}
                    >
                      Toplam Gelir
                    </span>

                    <span
                      style={{
                        fontSize: '20px'
                      }}
                    >
                      📈
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: '32px',
                      fontWeight: '800',
                      color: '#059669',
                      margin: 0
                    }}
                  >
                    ₺
                    {toplamGelir.toLocaleString(
                      'tr-TR'
                    )}
                  </p>
                </div>

                {/* GİDER */}
                <div
                  style={{
                    background:
                      'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)',
                    padding: '25px',
                    borderRadius: '16px',
                    border:
                      '1px solid #fee2e2',
                    boxShadow:
                      '0 4px 6px -1px rgba(0,0,0,0.02)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      alignItems: 'center',
                      marginBottom: '15px'
                    }}
                  >
                    <span
                      style={{
                        color: '#991b1b',
                        fontSize: '13px',
                        fontWeight: '700',
                        textTransform:
                          'uppercase'
                      }}
                    >
                      Toplam Gider
                    </span>

                    <span
                      style={{
                        fontSize: '20px'
                      }}
                    >
                      📉
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: '32px',
                      fontWeight: '800',
                      color: '#dc2626',
                      margin: 0
                    }}
                  >
                    ₺
                    {toplamGider.toLocaleString(
                      'tr-TR'
                    )}
                  </p>
                </div>

                {/* NET */}
                <div
                  style={{
                    background:
                      'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
                    padding: '25px',
                    borderRadius: '16px',
                    border:
                      '1px solid #dbeafe',
                    boxShadow:
                      '0 4px 6px -1px rgba(0,0,0,0.02)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      alignItems: 'center',
                      marginBottom: '15px'
                    }}
                  >
                    <span
                      style={{
                        color: '#1e40af',
                        fontSize: '13px',
                        fontWeight: '700',
                        textTransform:
                          'uppercase'
                      }}
                    >
                      Net Kasa / Bakiye
                    </span>

                    <span
                      style={{
                        fontSize: '20px'
                      }}
                    >
                      💰
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: '32px',
                      fontWeight: '800',

                      color:
                        netBakiye >= 0
                          ? '#2563eb'
                          : '#dc2626',

                      margin: 0
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
                    color: '#0f172a',
                    fontSize: '18px',
                    fontWeight: '700'
                  }}
                >
                  {aktifSekme === 'gelirler'
                    ? '➕ Yeni Gelir Kalemi Ekle'
                    : '➕ Yeni Gider Kalemi Ekle'}
                </h3>

                {/* FORM */}
                <form
                  onSubmit={kaydet}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                    marginBottom: '35px',
                    background:
                      '#f8fafc',
                    padding: '20px',
                    borderRadius: '12px',
                    border:
                      '1px solid #e2e8f0'
                  }}
                >

                  <div
                    style={{
                      flex: 1,
                      minWidth: '140px'
                    }}
                  >
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#64748b',
                        marginBottom: '6px'
                      }}
                    >
                      TARİH
                    </label>

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
                        width: '100%',
                        padding: '10px',
                        border:
                          '1px solid #cbd5e1',
                        borderRadius: '8px',
                        outline: 'none',
                        background: '#fff'
                      }}
                    />
                  </div>

                  <div
                    style={{
                      flex: 1.2,
                      minWidth: '160px'
                    }}
                  >
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#64748b',
                        marginBottom: '6px'
                      }}
                    >
                      ÖĞE (FİRMA/KİŞİ)
                    </label>

                    <input
                      required
                      placeholder="Örn: Beton A.Ş."
                      value={form.oge}
                      onChange={e =>
                        setForm({
                          ...form,
                          oge:
                            e.target.value
                        })
                      }
                      style={{
                        width: '100%',
                        padding: '10px',
                        border:
                          '1px solid #cbd5e1',
                        borderRadius: '8px',
                        outline: 'none',
                        background: '#fff'
                      }}
                    />
                  </div>

                  <div
                    style={{
                      flex: 1,
                      minWidth: '110px'
                    }}
                  >
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#64748b',
                        marginBottom: '6px'
                      }}
                    >
                      MAKBUZ NO
                    </label>

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
                        width: '100%',
                        padding: '10px',
                        border:
                          '1px solid #cbd5e1',
                        borderRadius: '8px',
                        outline: 'none',
                        background: '#fff'
                      }}
                    />
                  </div>

                  <div
                    style={{
                      flex: 1,
                      minWidth: '110px'
                    }}
                  >
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#64748b',
                        marginBottom: '6px'
                      }}
                    >
                      FATURA NO
                    </label>

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
                        width: '100%',
                        padding: '10px',
                        border:
                          '1px solid #cbd5e1',
                        borderRadius: '8px',
                        outline: 'none',
                        background: '#fff'
                      }}
                    />
                  </div>

                  <div
                    style={{
                      flex: 1.2,
                      minWidth: '130px'
                    }}
                  >
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#64748b',
                        marginBottom: '6px'
                      }}
                    >
                      KATEGORİ
                    </label>

                    <input
                      required
                      placeholder="Örn: Hafriyat"
                      value={form.kategori}
                      onChange={e =>
                        setForm({
                          ...form,
                          kategori:
                            e.target.value
                        })
                      }
                      style={{
                        width: '100%',
                        padding: '10px',
                        border:
                          '1px solid #cbd5e1',
                        borderRadius: '8px',
                        outline: 'none',
                        background: '#fff'
                      }}
                    />
                  </div>

                  <div
                    style={{
                      flex: 1.8,
                      minWidth: '200px'
                    }}
                  >
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#64748b',
                        marginBottom: '6px'
                      }}
                    >
                      AÇIKLAMA / TAŞERON
                    </label>

                    <input
                      placeholder="Detay girin..."
                      value={form.aciklama}
                      onChange={e =>
                        setForm({
                          ...form,
                          aciklama:
                            e.target.value
                        })
                      }
                      style={{
                        width: '100%',
                        padding: '10px',
                        border:
                          '1px solid #cbd5e1',
                        borderRadius: '8px',
                        outline: 'none',
                        background: '#fff'
                      }}
                    />
                  </div>

                  <div
                    style={{
                      flex: 1,
                      minWidth: '120px'
                    }}
                  >
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#64748b',
                        marginBottom: '6px'
                      }}
                    >
                      TUTAR (₺)
                    </label>

                    <input
                      required
                      type="number"
                      placeholder="0.00"
                      value={form.tutar}
                      onChange={e =>
                        setForm({
                          ...form,
                          tutar:
                            e.target.value
                        })
                      }
                      style={{
                        width: '100%',
                        padding: '10px',
                        border:
                          '1px solid #cbd5e1',
                        borderRadius: '8px',
                        outline: 'none',
                        background: '#fff',
                        fontWeight: 'bold',
                        color: '#0f172a'
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      width: '100%'
                    }}
                  >
                    <button
                      type="submit"
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor:
                          '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        boxShadow:
                          '0 4px 10px rgba(37, 99, 235, 0.2)'
                      }}
                    >
                      Sisteme Kaydet
                    </button>
                  </div>

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
                    border:
                      '1px solid #bfdbfe',
                    flexWrap: 'wrap',
                    gap: '15px'
                  }}
                >

                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      alignItems:
                        'center',
                      flexWrap: 'wrap',
                      flex: 1
                    }}
                  >

                    <span
                      style={{
                        fontWeight: '700',
                        color: '#1e40af',
                        fontSize: '14px'
                      }}
                    >
                      🔍 Filtrele:
                    </span>

                    <input
                      placeholder="Kategoriye göre ara..."
                      value={filtreKategori}
                      onChange={e =>
                        setFiltreKategori(
                          e.target.value
                        )
                      }
                      style={{
                        padding:
                          '8px 12px',
                        borderRadius: '6px',
                        border:
                          '1px solid #93c5fd',
                        outline: 'none',
                        fontSize: '13px',
                        background: '#fff'
                      }}
                    />

                    <input
                      placeholder="Açıklama / Taşeron ara..."
                      value={filtreAciklama}
                      onChange={e =>
                        setFiltreAciklama(
                          e.target.value
                        )
                      }
                      style={{
                        padding:
                          '8px 12px',
                        borderRadius: '6px',
                        border:
                          '1px solid #93c5fd',
                        outline: 'none',
                        fontSize: '13px',
                        background: '#fff',
                        minWidth: '180px'
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
                      fontSize: '14px',
                      fontWeight: '700',
                      boxShadow:
                        '0 2px 5px rgba(0,0,0,0.1)'
                    }}
                  >
                    Filtrelenen Toplam: ₺
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
                      textAlign: 'right',
                      fontSize: '14px'
                    }}
                  >

                    <thead>
                      <tr
                        style={{
                          borderBottom:
                            '2px solid #e2e8f0',
                          color: '#475569',
                          backgroundColor:
                            '#f8fafc'
                        }}
                      >
                        <th style={{ padding: '14px 12px' }}>
                          Tarih
                        </th>

                        <th style={{ padding: '14px 12px' }}>
                          Öğe
                        </th>

                        <th style={{ padding: '14px 12px' }}>
                          Makbuz No
                        </th>

                        <th style={{ padding: '14px 12px' }}>
                          Fatura No
                        </th>

                        <th style={{ padding: '14px 12px' }}>
                          Kategori
                        </th>

                        <th style={{ padding: '14px 12px' }}>
                          Açıklama
                        </th>

                        <th style={{ padding: '14px 12px' }}>
                          Tutar
                        </th>

                        <th
                          style={{
                            padding:
                              '14px 12px',
                            textAlign:
                              'center'
                          }}
                        >
                          İşlem
                        </th>
                      </tr>
                    </thead>

                    <tbody>

                      {gorunenListe.map(i => (

                        <tr
                          key={i.id}
                          style={{
                            borderBottom:
                              '1px solid #f1f5f9',
                            transition:
                              'background 0.1s'
                          }}
                          onMouseEnter={e =>
                            e.currentTarget.style.background =
                              '#f8fafc'
                          }
                          onMouseLeave={e =>
                            e.currentTarget.style.background =
                              'transparent'
                          }
                        >

                          <td
                            style={{
                              padding:
                                '14px 12px',
                              whiteSpace:
                                'nowrap',
                              color:
                                '#334155'
                            }}
                          >
                            {i.tarih}
                          </td>

                          <td
                            style={{
                              padding:
                                '14px 12px',
                              fontWeight:
                                '600',
                              color:
                                '#0f172a'
                            }}
                          >
                            {i.oge || '-'}
                          </td>

                          <td
                            style={{
                              padding:
                                '14px 12px',
                              color:
                                '#64748b'
                            }}
                          >
                            {i.makbuz_no || '-'}
                          </td>

                          <td
                            style={{
                              padding:
                                '14px 12px',
                              color:
                                '#64748b'
                            }}
                          >
                            {i.fatura_no || '-'}
                          </td>

                          <td
                            style={{
                              padding:
                                '14px 12px'
                            }}
                          >
                            <span
                              style={{
                                backgroundColor:
                                  '#f1f5f9',
                                padding:
                                  '4px 10px',
                                borderRadius:
                                  '6px',
                                fontSize:
                                  '12px',
                                color:
                                  '#475569',
                                border:
                                  '1px solid #e2e8f0'
                              }}
                            >
                              {i.kategori || '-'}
                            </span>
                          </td>

                          <td
                            style={{
                              padding:
                                '14px 12px',
                              color:
                                '#64748b'
                            }}
                          >
                            {i.aciklama || '-'}
                          </td>

                          <td
                            style={{
                              padding:
                                '14px 12px',
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

                          <td
                            style={{
                              padding:
                                '14px 12px',
                              textAlign:
                                'center'
                            }}
                          >
                            <button
                              onClick={() =>
                                sil(i.id)
                              }
                              style={{
                                padding:
                                  '6px 12px',
                                backgroundColor:
                                  '#fee2e2',
                                color:
                                  '#991b1b',
                                border:
                                  'none',
                                borderRadius:
                                  '6px',
                                cursor:
                                  'pointer',
                                fontSize:
                                  '12px',
                                fontWeight:
                                  '700'
                              }}
                            >
                              Sil
                            </button>
                          </td>

                        </tr>

                      ))}

                      {gorunenListe.length === 0 && (

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
