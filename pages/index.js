import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
export default function Dashboard() {
  const router = useRouter();

  const [isClient, setIsClient] = useState(false);
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
  const [duzenlenenKayitId, setDuzenlenenKayitId] = useState(null);
  const [filtreBaslangic, setFiltreBaslangic] = useState('');
  const [filtreBitis, setFiltreBitis] = useState('');

  const bugununTarihi = () => {
    const d = new Date();
    const yil = d.getFullYear();
    const ay = String(d.getMonth() + 1).padStart(2, '0');
    const gun = String(d.getDate()).padStart(2, '0');
    return `${yil}-${ay}-${gun}`;
  };

  const formBaslangic = {
    oge: '',
    makbuz_no: '',
    fatura_no: '',
    tarih: bugununTarihi(),
    kategori: '',
    aciklama: '',
    tutar: '',
    odeme_kaynagi: 'Kasa'
  };

  const [form, setForm] = useState(formBaslangic);

  // SAYFA AÇILDIĞINDA KULLANICI OTURUMUNU KONTROL ET
  useEffect(() => {
    let mounted = true;

    async function oturumKontrol() {
      const {
        data: { session },
        error
      } = await supabase.auth.getSession();

      if (error) {
        console.error('Oturum kontrol hatası:', error);
      }

      if (!session) {
        router.replace('/login');
        return;
      }

      if (mounted) {
        setIsClient(true);
        await projeleriGetir();
      }
    }

    oturumKontrol();

    return () => {
      mounted = false;
    };
  }, [router]);

  // SEÇİLİ PROJE DEĞİŞİNCE VERİLERİ GETİR
  useEffect(() => {
    if (seciliProje) {
      verileriGetir();
    }
  }, [seciliProje]);

  // PROJELERİ GETİR
  async function projeleriGetir() {
    setHata('');

    const { data, error } = await supabase
      .from('projeler')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Projeler alınamadı:', error);
      setHata('Projeler yüklenemedi: ' + error.message);
      return;
    }

    if (data) {
      setProjeler(data);

      if (data.length > 0 && !seciliProje) {
        setSeciliProje(data[0]);
      }
    }
  }

  // GELİR VE GİDERLERİ GETİR
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

  // YENİ PROJE EKLE
  async function yeniProjeEkle(event) {
    event.preventDefault();

    const projeAdi = yeniProjeAdi.trim();

    if (!projeAdi) {
      setHata('Lütfen proje adı girin.');
      return;
    }

    setHata('');
    setMesaj('');

    try {
      // Önce gerçekten giriş yapılmış mı kontrol ediyoruz
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/login');
        return;
      }

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
        console.error('Proje ekleme hatası:', error);
        setHata('Proje eklenemedi: ' + error.message);
        return;
      }

      setYeniProjeAdi('');
      setMesaj('Proje başarıyla eklendi.');

      await projeleriGetir();

      if (data) {
        setSeciliProje(data);
      }
    } catch (error) {
      console.error('Beklenmeyen hata:', error);
      setHata('Beklenmeyen bir hata oluştu.');
    }
  }

  // GELİR / GİDER KAYDET / GÜNCELLE
  async function kaydet(event) {
    event.preventDefault();

    if (!seciliProje) {
      setHata('Önce bir proje seçmelisiniz.');
      return;
    }

    const tutar = Number(form.tutar);

    if (!form.tarih || !form.oge.trim() || !form.kategori.trim()) {
      setHata('Tarih, Öğe/Firma/Kişi ve Kategori alanları zorunludur.');
      return;
    }

    if (!Number.isFinite(tutar) || tutar <= 0) {
      setHata('Lütfen geçerli ve 0’dan büyük bir tutar girin.');
      return;
    }

    setHata('');
    setMesaj('');

    const tablo = aktifSekme === 'gelirler' ? 'gelirler' : 'harcamalar';
    const kayit = {
      oge: form.oge.trim(),
      makbuz_no: form.makbuz_no.trim(),
      fatura_no: form.fatura_no.trim(),
      tarih: form.tarih,
      kategori: form.kategori.trim(),
      aciklama: form.aciklama.trim(),
      tutar,
      proje_id: seciliProje.id,
      ...(aktifSekme === 'giderler'
        ? { odeme_kaynagi: form.odeme_kaynagi || 'Kasa' }
        : {})
    };

    let error = null;

    if (duzenlenenKayitId) {
      const sonuc = await supabase
        .from(tablo)
        .update(kayit)
        .eq('id', duzenlenenKayitId)
        .eq('proje_id', seciliProje.id);
      error = sonuc.error;
    } else {
      const sonuc = await supabase
        .from(tablo)
        .insert([kayit]);
      error = sonuc.error;
    }

    if (error) {
      console.error('Kayıt kaydetme/güncelleme hatası:', error);
      setHata('Kayıt kaydedilemedi: ' + error.message);
      return;
    }

    setForm({ ...formBaslangic, tarih: bugununTarihi() });
    setDuzenlenenKayitId(null);
    setMesaj(duzenlenenKayitId ? 'Kayıt başarıyla güncellendi.' : 'Kayıt başarıyla eklendi.');

    await verileriGetir();
  }

  // KAYIT DÜZENLE
  function duzenle(kayit) {
    setForm({
      oge: kayit.oge || '',
      makbuz_no: kayit.makbuz_no || '',
      fatura_no: kayit.fatura_no || '',
      tarih: kayit.tarih || bugununTarihi(),
      kategori: kayit.kategori || '',
      aciklama: kayit.aciklama || '',
      tutar: kayit.tutar ?? '',
      odeme_kaynagi: kayit.odeme_kaynagi || 'Kasa'
    });
    setDuzenlenenKayitId(kayit.id);
    setMesaj('Kayıt düzenleme modunda. Değişiklikleri yapıp Güncelle butonuna basın.');
    setHata('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // DÜZENLEMEYİ İPTAL ET
  function duzenlemeyiIptalEt() {
    setDuzenlenenKayitId(null);
    setForm({ ...formBaslangic, tarih: bugununTarihi() });
    setMesaj('Düzenleme iptal edildi.');
    setHata('');
  }

  // KAYIT SİL
  async function sil(id) {
    if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;

    const tablo = aktifSekme === 'gelirler' ? 'gelirler' : 'harcamalar';
    const { error } = await supabase
      .from(tablo)
      .delete()
      .eq('id', id)
      .eq('proje_id', seciliProje.id);

    if (error) {
      console.error('Silme hatası:', error);
      setHata('Kayıt silinemedi: ' + error.message);
      return;
    }

    if (duzenlenenKayitId === id) duzenlemeyiIptalEt();
    setMesaj('Kayıt silindi.');
    setHata('');
    await verileriGetir();
  }

  // ÇIKIŞ
  async function cikisYap() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  const aktifListe =
    aktifSekme === 'gelirler' ? gelirler : harcamalar;

  const gorunenListe = aktifListe.filter((item) => {
    const kategoriUygun =
      filtreKategori === '' ||
      item.kategori?.toLowerCase().includes(filtreKategori.toLowerCase());
    const aramaMetni = `${item.aciklama || ''} ${item.oge || ''}`.toLowerCase();
    const aciklamaUygun =
      filtreAciklama === '' || aramaMetni.includes(filtreAciklama.toLowerCase());
    const baslangicUygun = filtreBaslangic === '' || (item.tarih || '') >= filtreBaslangic;
    const bitisUygun = filtreBitis === '' || (item.tarih || '') <= filtreBitis;
    return kategoriUygun && aciklamaUygun && baslangicUygun && bitisUygun;
  });

  const kategoriSecenekleri =
    aktifSekme === 'gelirler'
      ? ['Hakediş', 'Daire Satışı', 'Kapora', 'Kira', 'Diğer']
      : ['Malzeme', 'İşçilik', 'Taşeron', 'Belediye', 'Harç', 'Noter', 'Avukat', 'Nakliye', 'Vergi', 'SGK', 'Elektrik / Su / Doğalgaz', 'Diğer'];

  function filtreleriTemizle() {
    setFiltreKategori('');
    setFiltreAciklama('');
    setFiltreBaslangic('');
    setFiltreBitis('');
  }

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
  // DOSYA ADI İÇİN PROJE ADINI TEMİZLE
  function dosyaAdiOlustur() {
    const projeAdi = seciliProje?.ad || 'proje';

    return projeAdi
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, '_');
  }

  // EXCEL'E AKTAR
  function excelAktar() {
    if (!seciliProje) return setHata('Önce bir proje seçmelisiniz.');
    if (aktifSekme === 'ozet') return setHata('Excel aktarımı için Gelir veya Gider sekmesini seçin.');
    if (gorunenListe.length === 0) return setHata('Aktarılacak kayıt bulunamadı.');

    const excelVerileri = gorunenListe.map((i) => ({
      Tarih: i.tarih || '',
      'Öğe / Firma / Kişi': i.oge || '',
      'Makbuz No': i.makbuz_no || '',
      'Fatura No': i.fatura_no || '',
      Kategori: i.kategori || '',
      Açıklama: i.aciklama || '',
      ...(aktifSekme === 'giderler'
        ? { 'Ödeme Kaynağı': i.odeme_kaynagi || '' }
        : {}),
      'Tutar (₺)': Number(i.tutar) || 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelVerileri);
    worksheet['!cols'] = [
      { wch: 14 }, { wch: 25 }, { wch: 16 }, { wch: 16 },
      { wch: 24 }, { wch: 42 }, { wch: 18 }
    ];

    const workbook = XLSX.utils.book_new();
    const sekmeAdi = aktifSekme === 'gelirler' ? 'Gelirler' : 'Giderler';
    XLSX.utils.book_append_sheet(workbook, worksheet, sekmeAdi);
    XLSX.writeFile(workbook, `${dosyaAdiOlustur()}_${sekmeAdi}.xlsx`);
    setMesaj(`${gorunenListe.length} kayıt Excel'e aktarıldı.`);
    setHata('');
  }

  // LOGO
  const SIDEBAR_LOGO = '/logos/esmahan-light.png';
  const PDF_LOGO = '/logos/esmahan-dark.png';

  // Görseli PDF'e eklemek için data URL'e çevirir.
  async function resmiDataUrlOlustur(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Logo dosyası yüklenemedi: ${url}`);
    }

    const blob = await response.blob();

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // PDF FONTLARI: Türkçe karakterler için Noto Sans kullanılır.
  let pdfFontCache = null;

  async function pdfFontlariYukle() {
    if (pdfFontCache) return pdfFontCache;

    const bufferToBase64 = (buffer) => {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const chunkSize = 0x8000;

      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
        binary += String.fromCharCode(...chunk);
      }

      return btoa(binary);
    };

    const [regularResponse, boldResponse] = await Promise.all([
      fetch('/fonts/NotoSans-Regular.ttf'),
      fetch('/fonts/NotoSans-Bold.ttf')
    ]);

    if (!regularResponse.ok || !boldResponse.ok) {
      throw new Error('PDF Türkçe font dosyaları yüklenemedi.');
    }

    const [regularBuffer, boldBuffer] = await Promise.all([
      regularResponse.arrayBuffer(),
      boldResponse.arrayBuffer()
    ]);

    pdfFontCache = {
      regular: bufferToBase64(regularBuffer),
      bold: bufferToBase64(boldBuffer)
    };

    return pdfFontCache;
  }

  // PDF'E AKTAR
  async function pdfAktar() {
    if (!seciliProje) {
      setHata('Önce bir proje seçmelisiniz.');
      return;
    }

    if (aktifSekme === 'ozet') {
      setHata('PDF aktarımı için Gelir veya Gider sekmesini seçin.');
      return;
    }

    if (gorunenListe.length === 0) {
      setHata('Aktarılacak kayıt bulunamadı.');
      return;
    }

    try {
      setMesaj('PDF hazırlanıyor...');
      setHata('');

      const [fontlar, logoDataUrl] = await Promise.all([
        pdfFontlariYukle(),
        resmiDataUrlOlustur(PDF_LOGO)
      ]);

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Türkçe karakter desteği için Noto Sans fontlarını PDF'e göm.
      doc.addFileToVFS('NotoSans-Regular.ttf', fontlar.regular);
      doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
      doc.addFileToVFS('NotoSans-Bold.ttf', fontlar.bold);
      doc.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold');
      doc.setFont('NotoSans', 'normal');

      const sekmeAdi = aktifSekme === 'gelirler' ? 'Gelirler' : 'Giderler';
      const toplam = gorunenListe.reduce(
        (t, i) => t + Number(i.tutar || 0),
        0
      );

      doc.setProperties({
        title: `${seciliProje.ad || 'Proje'} - ${sekmeAdi}`,
        subject: 'Esmahan Yapı Şantiye Yönetim Portalı',
        author: 'Esmahan Yapı'
      });

      // PDF BAŞLIĞI + ESMAHAN LOGOSU
      doc.addImage(logoDataUrl, 'PNG', 14, 7, 48, 16);

      doc.setFont('NotoSans', 'bold');
      doc.setFontSize(16);
      doc.text(seciliProje.ad || 'Proje', 68, 14);

      doc.setFont('NotoSans', 'normal');
      doc.setFontSize(10);
      doc.text(`${sekmeAdi} Listesi`, 68, 21);

      const filtreBilgisi = [
        filtreBaslangic ? `Başlangıç: ${filtreBaslangic}` : '',
        filtreBitis ? `Bitiş: ${filtreBitis}` : '',
        filtreKategori ? `Kategori: ${filtreKategori}` : '',
        filtreAciklama ? `Arama: ${filtreAciklama}` : ''
      ]
        .filter(Boolean)
        .join(' | ');

      if (filtreBilgisi) {
        doc.setFontSize(8);
        doc.text(filtreBilgisi, 14, 29);
      }

      const tabloBasliklari = [
        'Tarih',
        'Öğe / Firma / Kişi',
        'Makbuz No',
        'Fatura No',
        'Kategori',
        ...(aktifSekme === 'giderler' ? ['Ödeme Kaynağı'] : []),
        'Açıklama',
        'Tutar (TL)'
      ];

      const tabloVerileri = gorunenListe.map((i) => [
        i.tarih || '',
        i.oge || '',
        i.makbuz_no || '-',
        i.fatura_no || '-',
        i.kategori || '-',
        ...(aktifSekme === 'giderler' ? [i.odeme_kaynagi || '-'] : []),
        i.aciklama || '-',
        `${Number(i.tutar || 0).toLocaleString('tr-TR')} TL`
      ]);

      autoTable(doc, {
        head: [tabloBasliklari],
        body: tabloVerileri,
        startY: filtreBilgisi ? 34 : 31,
        theme: 'grid',
        styles: {
          font: 'NotoSans',
          fontStyle: 'normal',
          fontSize: 8,
          cellPadding: 2.5,
          overflow: 'linebreak',
          valign: 'middle'
        },
        headStyles: {
          font: 'NotoSans',
          fontStyle: 'bold',
          fontSize: 8
        },
        columnStyles: {
          0: { cellWidth: 24 },
          1: { cellWidth: 36 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 30 },
          5: { cellWidth: 77 },
          6: { cellWidth: 30, halign: 'right' }
        },
        margin: { left: 14, right: 14 }
      });

      const sonY = doc.lastAutoTable?.finalY
        ? doc.lastAutoTable.finalY + 10
        : 200;

      doc.setFont('NotoSans', 'bold');
      doc.setFontSize(11);
      doc.text(
        `Toplam: ${toplam.toLocaleString('tr-TR')} TL | Kayıt: ${gorunenListe.length}`,
        14,
        sonY
      );

      doc.setFont('NotoSans', 'normal');
      doc.setFontSize(8);
      doc.text(`Oluşturulma: ${bugununTarihi()}`, 14, sonY + 6);

      doc.save(`${dosyaAdiOlustur()}_${sekmeAdi}.pdf`);
      setMesaj(`${gorunenListe.length} kayıt PDF'e aktarıldı.`);
      setHata('');
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      setHata(
        'PDF oluşturulamadı. Türkçe font dosyalarının public/fonts klasöründe olduğundan emin olun.'
      );
      setMesaj('');
    }
  }

  if (!isClient) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#64748b'
        }}
      >
        Sistem yükleniyor...
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif'
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
          boxShadow: '4px 0 10px rgba(0,0,0,0.05)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '25px',
            borderBottom: '1px solid #1e293b',
            paddingBottom: '15px'
          }}
        >
          <img
            src={SIDEBAR_LOGO}
            alt="Esmahan Yapı"
            style={{
              width: '38px',
              height: '38px',
              objectFit: 'contain',
              flexShrink: 0
            }}
          />

          <div>
            <h2
              style={{
                fontSize: '17px',
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
          {projeler.map((p) => (
            <li
              key={p.id}
              onClick={() => {
                setSeciliProje(p);
                setMesaj('');
                setHata('');
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
                  seciliProje?.id === p.id ? '600' : '400',
                boxShadow:
                  seciliProje?.id === p.id
                    ? '0 4px 12px rgba(59, 130, 246, 0.3)'
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
        </ul>

        {/* YENİ PROJE */}
        <form
          onSubmit={yeniProjeEkle}
          style={{
            marginTop: '20px',
            borderTop: '1px solid #1e293b',
            paddingTop: '20px'
          }}
        >
          <input
            value={yeniProjeAdi}
            onChange={(event) =>
              setYeniProjeAdi(event.target.value)
            }
            placeholder="Yeni Proje Adı..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #334155',
              marginBottom: '10px',
              backgroundColor: '#1e293b',
              color: 'white',
              fontSize: '13px',
              outline: 'none'
            }}
          />

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              boxShadow:
                '0 4px 10px rgba(16, 185, 129, 0.2)'
            }}
          >
            + Yeni Proje Ekle
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
            border: '1px solid #334155',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          Çıkış Yap
        </button>
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
        {!seciliProje ? (
          <div
            style={{
              textAlign: 'center',
              marginTop: '150px',
              color: '#64748b'
            }}
          >
            <span style={{ fontSize: '48px' }}>👈</span>

            <h2>
              Lütfen sol menüden yönetmek istediğiniz projeyi
              seçin.
            </h2>

            <p>
              Yeni proje eklemek için sol taraftaki alana proje
              adını yazabilirsiniz.
            </p>
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
                    margin: '0 0 5px 0'
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
                  Finansal Akış ve Gider/Gelir Takip Paneli
                </p>
              </div>
            </div>

            {/* MESAJ */}
            {mesaj && (
              <div
                style={{
                  marginBottom: '20px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: '#dcfce7',
                  color: '#166534',
                  border: '1px solid #bbf7d0',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {mesaj}
              </div>
            )}

            {/* HATA */}
            {hata && (
              <div
                style={{
                  marginBottom: '20px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: '#fee2e2',
                  color: '#991b1b',
                  border: '1px solid #fecaca',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {hata}
              </div>
            )}

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
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setAktifSekme(s.id);
                    setFiltreKategori('');
                    setFiltreAciklama('');
                    setFiltreBaslangic('');
                    setFiltreBitis('');
                    setDuzenlenenKayitId(null);
                    setForm({ ...formBaslangic, tarih: bugununTarihi() });
                    setMesaj('');
                    setHata('');
                  }}
                  style={{
                    padding: '12px 24px',
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
                    transition: 'all 0.2s'
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
                    border: '1px solid #dcfce7',
                    boxShadow:
                      '0 4px 6px -1px rgba(0,0,0,0.02)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '15px'
                    }}
                  >
                    <span
                      style={{
                        color: '#166534',
                        fontSize: '13px',
                        fontWeight: '700',
                        textTransform: 'uppercase'
                      }}
                    >
                      Toplam Gelir
                    </span>

                    <span style={{ fontSize: '20px' }}>
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
                    {toplamGelir.toLocaleString('tr-TR')}
                  </p>
                </div>

                <div
                  style={{
                    background:
                      'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)',
                    padding: '25px',
                    borderRadius: '16px',
                    border: '1px solid #fee2e2',
                    boxShadow:
                      '0 4px 6px -1px rgba(0,0,0,0.02)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '15px'
                    }}
                  >
                    <span
                      style={{
                        color: '#991b1b',
                        fontSize: '13px',
                        fontWeight: '700',
                        textTransform: 'uppercase'
                      }}
                    >
                      Toplam Gider
                    </span>

                    <span style={{ fontSize: '20px' }}>
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
                    {toplamGider.toLocaleString('tr-TR')}
                  </p>
                </div>

                <div
                  style={{
                    background:
                      'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
                    padding: '25px',
                    borderRadius: '16px',
                    border: '1px solid #dbeafe',
                    boxShadow:
                      '0 4px 6px -1px rgba(0,0,0,0.02)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '15px'
                    }}
                  >
                    <span
                      style={{
                        color: '#1e40af',
                        fontSize: '13px',
                        fontWeight: '700',
                        textTransform: 'uppercase'
                      }}
                    >
                      Net Kasa / Bakiye
                    </span>

                    <span style={{ fontSize: '20px' }}>
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
                    {netBakiye.toLocaleString('tr-TR')}
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
                  border: '1px solid #e2e8f0'
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
                  {duzenlenenKayitId
                    ? '✏️ Kayıt Düzenle'
                    : aktifSekme === 'gelirler'
                      ? '➕ Yeni Gelir Kalemi Ekle'
                      : '➕ Yeni Gider Kalemi Ekle'}
                </h3>

                {duzenlenenKayitId && (
                  <div
                    style={{
                      marginBottom: '12px', padding: '10px 14px', borderRadius: '8px',
                      background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e',
                      fontSize: '13px', fontWeight: '600'
                    }}
                  >
                    ✏️ Düzenleme modu aktif. Bilgileri değiştirip Güncelle butonuna basın.
                  </div>
                )}

                {/* FORM */}
                <form
                  onSubmit={kaydet}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                    marginBottom: '35px',
                    background: '#f8fafc',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
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
                      onChange={(e) =>
                        setForm({
                          ...form,
                          tarih: e.target.value
                        })
                      }
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px',
                        border: '1px solid #cbd5e1',
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
                      onChange={(e) =>
                        setForm({
                          ...form,
                          oge: e.target.value
                        })
                      }
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px',
                        border: '1px solid #cbd5e1',
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
                      onChange={(e) =>
                        setForm({
                          ...form,
                          makbuz_no: e.target.value
                        })
                      }
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px',
                        border: '1px solid #cbd5e1',
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
                      onChange={(e) =>
                        setForm({
                          ...form,
                          fatura_no: e.target.value
                        })
                      }
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px',
                        border: '1px solid #cbd5e1',
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

                    <select
                      required
                      value={form.kategori}
                      onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                      style={{
                        width: '100%', boxSizing: 'border-box', padding: '10px',
                        border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none',
                        background: '#fff', color: form.kategori ? '#0f172a' : '#94a3b8'
                      }}
                    >
                      <option value="">Kategori seçin</option>
                      {kategoriSecenekleri.map((kategori) => (
                        <option key={kategori} value={kategori}>{kategori}</option>
                      ))}
                    </select>
                  </div>

                  {aktifSekme === 'giderler' && (
                    <div
                      style={{
                        flex: 1.2,
                        minWidth: '150px'
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
                        ÖDEME KAYNAĞI
                      </label>

                      <input
                        placeholder="Örn: Kasa, Hüseyin Özdemir, ABC Yapı, Borç, Çek..."
                        value={form.odeme_kaynagi || ''}
                        onChange={(e) =>
                          setForm({ ...form, odeme_kaynagi: e.target.value })
                        }
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '10px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          outline: 'none',
                          background: '#fff',
                          color: '#0f172a'
                        }}
                      />
                    </div>
                  )}

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
                      onChange={(e) =>
                        setForm({
                          ...form,
                          aciklama: e.target.value
                        })
                      }
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px',
                        border: '1px solid #cbd5e1',
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
                      step="0.01"
                      placeholder="0.00"
                      value={form.tutar}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          tutar: e.target.value
                        })
                      }
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px',
                        border: '1px solid #cbd5e1',
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
                        flex: 1, padding: '12px',
                        backgroundColor: duzenlenenKayitId ? '#f59e0b' : '#2563eb',
                        color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer',
                        fontWeight: 'bold', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)'
                      }}
                    >
                      {duzenlenenKayitId ? '✓ Değişiklikleri Güncelle' : 'Sisteme Kaydet'}
                    </button>
                    {duzenlenenKayitId && (
                      <button
                        type="button"
                        onClick={duzenlemeyiIptalEt}
                        style={{
                          padding: '12px 20px', backgroundColor: '#f1f5f9', color: '#475569',
                          border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '700'
                        }}
                      >
                        İptal
                      </button>
                    )}
                  </div>
                </form>

                {/* FİLTRE */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    background: '#eff6ff',
                    padding: '15px 20px',
                    borderRadius: '12px',
                    border: '1px solid #bfdbfe',
                    flexWrap: 'wrap',
                    gap: '15px'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'center',
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
                      onChange={(e) =>
                        setFiltreKategori(e.target.value)
                      }
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #93c5fd',
                        outline: 'none',
                        fontSize: '13px',
                        background: '#fff'
                      }}
                    />

                    <input
                      placeholder="Açıklama / Taşeron ara..."
                      value={filtreAciklama}
                      onChange={(e) =>
                        setFiltreAciklama(e.target.value)
                      }
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #93c5fd',
                        outline: 'none',
                        fontSize: '13px',
                        background: '#fff',
                        minWidth: '180px'
                      }}
                    />

                    <input
                      type="date"
                      title="Başlangıç tarihi"
                      value={filtreBaslangic}
                      onChange={(e) => setFiltreBaslangic(e.target.value)}
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #93c5fd', outline: 'none', fontSize: '13px', background: '#fff' }}
                    />

                    <input
                      type="date"
                      title="Bitiş tarihi"
                      value={filtreBitis}
                      onChange={(e) => setFiltreBitis(e.target.value)}
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #93c5fd', outline: 'none', fontSize: '13px', background: '#fff' }}
                    />

                    <button
                      type="button"
                      onClick={filtreleriTemizle}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', cursor: 'pointer', fontWeight: '600' }}
                    >
                      Filtreleri Temizle
                    </button>
                  </div>

                  <div
                    style={{
                      background: '#1e40af',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '700',
                      boxShadow:
                        '0 2px 5px rgba(0,0,0,0.1)'
                    }}
                  >
                    Filtrelenen Toplam: ₺
                    {gorunenToplam.toLocaleString('tr-TR')}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={excelAktar}
                      style={{ padding: '9px 13px', borderRadius: '8px', border: '1px solid #86efac', background: '#f0fdf4', color: '#166534', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}
                    >
                      📊 Excel'e Aktar
                    </button>
                    <button
                      type="button"
                      onClick={pdfAktar}
                      style={{ padding: '9px 13px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}
                    >
                      📄 PDF'e Aktar
                    </button>
                  </div>
                </div>

                {/* TABLO */}
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
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
                          backgroundColor: '#f8fafc'
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

                        {aktifSekme === 'giderler' && (
                          <th style={{ padding: '14px 12px' }}>
                            Ödeme Kaynağı
                          </th>
                        )}

                        <th style={{ padding: '14px 12px' }}>
                          Açıklama
                        </th>

                        <th style={{ padding: '14px 12px' }}>
                          Tutar
                        </th>

                        <th
                          style={{
                            padding: '14px 12px',
                            textAlign: 'center'
                          }}
                        >
                          İşlem
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {gorunenListe.map((i) => (
                        <tr
                          key={i.id}
                          style={{
                            borderBottom:
                              '1px solid #f1f5f9'
                          }}
                        >
                          <td
                            style={{
                              padding: '14px 12px',
                              whiteSpace: 'nowrap',
                              color: '#334155'
                            }}
                          >
                            {i.tarih}
                          </td>

                          <td
                            style={{
                              padding: '14px 12px',
                              fontWeight: '600',
                              color: '#0f172a'
                            }}
                          >
                            {i.oge || '-'}
                          </td>

                          <td
                            style={{
                              padding: '14px 12px',
                              color: '#64748b'
                            }}
                          >
                            {i.makbuz_no || '-'}
                          </td>

                          <td
                            style={{
                              padding: '14px 12px',
                              color: '#64748b'
                            }}
                          >
                            {i.fatura_no || '-'}
                          </td>

                          <td style={{ padding: '14px 12px' }}>
                            <span
                              style={{
                                backgroundColor: '#f1f5f9',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                color: '#475569',
                                border:
                                  '1px solid #e2e8f0'
                              }}
                            >
                              {i.kategori || '-'}
                            </span>
                          </td>

                          {aktifSekme === 'giderler' && (
                            <td style={{ padding: '14px 12px' }}>
                              <span
                                style={{
                                  backgroundColor: '#eff6ff',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  color: '#1d4ed8',
                                  border: '1px solid #bfdbfe',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {i.odeme_kaynagi || 'Kasa'}
                              </span>
                            </td>
                          )}

                          <td
                            style={{
                              padding: '14px 12px',
                              color: '#64748b'
                            }}
                          >
                            {i.aciklama || '-'}
                          </td>

                          <td
                            style={{
                              padding: '14px 12px',
                              fontWeight: 'bold',
                              color:
                                aktifSekme === 'gelirler'
                                  ? '#059669'
                                  : '#dc2626'
                            }}
                          >
                            ₺
                            {Number(i.tutar).toLocaleString(
                              'tr-TR'
                            )}
                          </td>

                          <td
                            style={{
                              padding: '14px 12px',
                              textAlign: 'center'
                            }}
                          >
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => duzenle(i)}
                                style={{ padding: '6px 10px', backgroundColor: '#fef3c7', color: '#92400e', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
                              >
                                Düzenle
                              </button>
                              <button
                                onClick={() => sil(i.id)}
                                style={{ padding: '6px 10px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
                              >
                                Sil
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {gorunenListe.length === 0 && (
                        <tr>
                          <td
                            colSpan={aktifSekme === 'giderler' ? 9 : 8}
                            style={{
                              padding: '40px',
                              textAlign: 'center',
                              color: '#94a3b8'
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
