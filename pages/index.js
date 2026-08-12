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
  const [alacakBorclar, setAlacakBorclar] = useState([]);
  const [cariler, setCariler] = useState([]);
  const [hakedisler, setHakedisler] = useState([]);
  const [aktifSekme, setAktifSekme] = useState('ozet');

  const cariFormBaslangic = {
    ad: '',
    tip: 'Firma',
    yetkili: '',
    telefon: '',
    email: '',
    vergi_dairesi: '',
    vergi_no: '',
    adres: '',
    notlar: '',
    aktif: true
  };
  const [cariForm, setCariForm] = useState(cariFormBaslangic);
  const [cariDuzenlenenId, setCariDuzenlenenId] = useState(null);
  const [cariArama, setCariArama] = useState('');
  const [cariAktifFiltre, setCariAktifFiltre] = useState('aktif');

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
  const hakedisFormBaslangic = {
    cari_id: '',
    hakedis_no: '',
    tarih: bugununTarihi(),
    vade_tarihi: '',
    aciklama: '',
    brut_tutar: '',
    kesinti: '',
    odenen_tutar: '',
    durum: 'Bekliyor',
    notlar: ''
  };
  const [hakedisForm, setHakedisForm] = useState(hakedisFormBaslangic);
  const [hakedisDuzenlenenId, setHakedisDuzenlenenId] = useState(null);

  const finansFormBaslangic = {
    tur: 'Alacak',
    taraf: '',
    tarih: bugununTarihi(),
    vade_tarihi: '',
    kategori: '',
    aciklama: '',
    tutar: '',
    durum: 'Bekliyor'
  };
  const [finansForm, setFinansForm] = useState(finansFormBaslangic);

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

    const { data: f, error: fError } = await supabase
      .from('alacak_borclar')
      .select('*')
      .eq('proje_id', seciliProje.id)
      .order('vade_tarihi', { ascending: true, nullsFirst: false });

    const { data: c, error: cError } = await supabase
      .from('cariler')
      .select('*')
      .eq('proje_id', seciliProje.id)
      .order('ad', { ascending: true });

    const { data: hd, error: hdError } = await supabase
      .from('hakedisler')
      .select('*, cariler(id, ad, tip)')
      .eq('proje_id', seciliProje.id)
      .order('tarih', { ascending: false });

    if (hError) {
      console.error('Harcamalar alınamadı:', hError);
    }

    if (gError) {
      console.error('Gelirler alınamadı:', gError);
    }
    if (fError) {
      console.error('Alacak/borç kayıtları alınamadı:', fError);
    }
    if (cError) {
      console.error('Cariler alınamadı:', cError);
    }
    if (hdError) {
      console.error('Hakedişler alınamadı:', hdError);
    }

    setHarcamalar(h || []);
    setGelirler(g || []);
    setAlacakBorclar(f || []);
    setCariler(c || []);
    setHakedisler(hd || []);
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

  // ALACAK / BORÇ KAYDET / GÜNCELLE
  async function finansKaydet(event) {
    event.preventDefault();

    if (!seciliProje) {
      setHata('Önce bir proje seçmelisiniz.');
      return;
    }

    const tutar = Number(finansForm.tutar);
    if (!finansForm.taraf.trim() || !finansForm.tarih || !finansForm.kategori.trim()) {
      setHata('Tür, taraf, tarih ve kategori alanları zorunludur.');
      return;
    }
    if (!Number.isFinite(tutar) || tutar <= 0) {
      setHata('Lütfen geçerli ve 0’dan büyük bir tutar girin.');
      return;
    }

    setHata('');
    setMesaj('');

    const kayit = {
      tur: finansForm.tur,
      taraf: finansForm.taraf.trim(),
      tarih: finansForm.tarih,
      vade_tarihi: finansForm.vade_tarihi || null,
      kategori: finansForm.kategori.trim(),
      aciklama: finansForm.aciklama.trim(),
      tutar,
      durum: finansForm.durum,
      proje_id: seciliProje.id
    };

    let error = null;
    if (duzenlenenKayitId && aktifSekme === 'finans') {
      const sonuc = await supabase
        .from('alacak_borclar')
        .update(kayit)
        .eq('id', duzenlenenKayitId)
        .eq('proje_id', seciliProje.id);
      error = sonuc.error;
    } else {
      const sonuc = await supabase.from('alacak_borclar').insert([kayit]);
      error = sonuc.error;
    }

    if (error) {
      console.error('Alacak/borç kaydetme hatası:', error);
      setHata('Kayıt kaydedilemedi: ' + error.message);
      return;
    }

    setFinansForm({ ...finansFormBaslangic, tarih: bugununTarihi() });
    setDuzenlenenKayitId(null);
    setMesaj(duzenlenenKayitId ? 'Kayıt başarıyla güncellendi.' : 'Kayıt başarıyla eklendi.');
    await verileriGetir();
  }

  function finansDuzenle(kayit) {
    setFinansForm({
      tur: kayit.tur || 'Alacak',
      taraf: kayit.taraf || '',
      tarih: kayit.tarih || bugununTarihi(),
      vade_tarihi: kayit.vade_tarihi || '',
      kategori: kayit.kategori || '',
      aciklama: kayit.aciklama || '',
      tutar: kayit.tutar ?? '',
      durum: kayit.durum || 'Bekliyor'
    });
    setDuzenlenenKayitId(kayit.id);
    setMesaj('Kayıt düzenleme modunda.');
    setHata('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function finansSil(id) {
    if (!window.confirm('Bu alacak/borç kaydını silmek istediğinize emin misiniz?')) return;
    const { error } = await supabase
      .from('alacak_borclar')
      .delete()
      .eq('id', id)
      .eq('proje_id', seciliProje.id);
    if (error) {
      setHata('Kayıt silinemedi: ' + error.message);
      return;
    }
    if (duzenlenenKayitId === id) {
      setDuzenlenenKayitId(null);
      setFinansForm({ ...finansFormBaslangic, tarih: bugununTarihi() });
    }
    setMesaj('Kayıt silindi.');
    setHata('');
    await verileriGetir();
  }


  // CARİ KAYDET / GÜNCELLE
  async function cariKaydet(event) {
    event.preventDefault();

    if (!seciliProje) {
      setHata('Önce bir proje seçmelisiniz.');
      return;
    }

    if (!cariForm.ad.trim()) {
      setHata('Firma / kişi adı zorunludur.');
      return;
    }

    setHata('');
    setMesaj('');

    const kayit = {
      ad: cariForm.ad.trim(),
      tip: cariForm.tip,
      yetkili: cariForm.yetkili.trim(),
      telefon: cariForm.telefon.trim(),
      email: cariForm.email.trim(),
      vergi_dairesi: cariForm.vergi_dairesi.trim(),
      vergi_no: cariForm.vergi_no.trim(),
      adres: cariForm.adres.trim(),
      notlar: cariForm.notlar.trim(),
      aktif: cariForm.aktif,
      proje_id: seciliProje.id
    };

    let error = null;

    if (cariDuzenlenenId) {
      const sonuc = await supabase
        .from('cariler')
        .update(kayit)
        .eq('id', cariDuzenlenenId)
        .eq('proje_id', seciliProje.id);
      error = sonuc.error;
    } else {
      const sonuc = await supabase
        .from('cariler')
        .insert([kayit]);
      error = sonuc.error;
    }

    if (error) {
      console.error('Cari kaydetme hatası:', error);
      setHata('Cari kaydedilemedi: ' + error.message);
      return;
    }

    setCariForm({ ...cariFormBaslangic });
    setCariDuzenlenenId(null);
    setMesaj(cariDuzenlenenId ? 'Cari başarıyla güncellendi.' : 'Cari başarıyla eklendi.');
    await verileriGetir();
  }

  function cariDuzenle(cari) {
    setCariForm({
      ad: cari.ad || '',
      tip: cari.tip || 'Firma',
      yetkili: cari.yetkili || '',
      telefon: cari.telefon || '',
      email: cari.email || '',
      vergi_dairesi: cari.vergi_dairesi || '',
      vergi_no: cari.vergi_no || '',
      adres: cari.adres || '',
      notlar: cari.notlar || '',
      aktif: cari.aktif !== false
    });
    setCariDuzenlenenId(cari.id);
    setMesaj('Cari düzenleme modunda.');
    setHata('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cariDuzenlemeyiIptalEt() {
    setCariDuzenlenenId(null);
    setCariForm({ ...cariFormBaslangic });
    setMesaj('');
    setHata('');
  }

  async function cariSil(id) {
    if (!window.confirm('Bu cari kaydını silmek istediğinize emin misiniz?')) return;

    const { error } = await supabase
      .from('cariler')
      .delete()
      .eq('id', id)
      .eq('proje_id', seciliProje.id);

    if (error) {
      setHata('Cari silinemedi: ' + error.message);
      return;
    }

    if (cariDuzenlenenId === id) cariDuzenlemeyiIptalEt();
    setMesaj('Cari silindi.');
    setHata('');
    await verileriGetir();
  }

  // HAKEDİŞ KAYDET / GÜNCELLE
  async function hakedisKaydet(event) {
    event.preventDefault();

    if (!seciliProje) {
      setHata('Önce bir proje seçmelisiniz.');
      return;
    }
    if (!hakedisForm.cari_id) {
      setHata('Lütfen bir cari/firma seçin.');
      return;
    }
    if (!hakedisForm.hakedis_no.trim() || !hakedisForm.tarih) {
      setHata('Hakediş No ve tarih zorunludur.');
      return;
    }

    const brut = Number(hakedisForm.brut_tutar || 0);
    const kesinti = Number(hakedisForm.kesinti || 0);
    const odenen = Number(hakedisForm.odenen_tutar || 0);
    const net = brut - kesinti;

    if (!Number.isFinite(brut) || brut < 0 || !Number.isFinite(kesinti) || kesinti < 0 || !Number.isFinite(odenen) || odenen < 0) {
      setHata('Tutar alanlarını kontrol edin.');
      return;
    }
    if (kesinti > brut) {
      setHata('Kesinti, brüt hakedişten büyük olamaz.');
      return;
    }
    if (odenen > net) {
      setHata('Ödenen tutar net hakedişten büyük olamaz.');
      return;
    }

    setHata('');
    setMesaj('');

    const kayit = {
      proje_id: seciliProje.id,
      cari_id: Number(hakedisForm.cari_id),
      hakedis_no: hakedisForm.hakedis_no.trim(),
      tarih: hakedisForm.tarih,
      vade_tarihi: hakedisForm.vade_tarihi || null,
      aciklama: hakedisForm.aciklama.trim(),
      brut_tutar: brut,
      kesinti,
      odenen_tutar: odenen,
      durum: hakedisForm.durum,
      notlar: hakedisForm.notlar.trim()
    };

    let error = null;
    if (hakedisDuzenlenenId) {
      const sonuc = await supabase
        .from('hakedisler')
        .update(kayit)
        .eq('id', hakedisDuzenlenenId)
        .eq('proje_id', seciliProje.id);
      error = sonuc.error;
    } else {
      const sonuc = await supabase.from('hakedisler').insert([kayit]);
      error = sonuc.error;
    }

    if (error) {
      console.error('Hakediş kaydetme hatası:', error);
      setHata('Hakediş kaydedilemedi: ' + error.message);
      return;
    }

    setHakedisForm({ ...hakedisFormBaslangic, tarih: bugununTarihi() });
    setHakedisDuzenlenenId(null);
    setMesaj(hakedisDuzenlenenId ? 'Hakediş başarıyla güncellendi.' : 'Hakediş başarıyla eklendi.');
    await verileriGetir();
  }

  function hakedisDuzenle(kayit) {
    setHakedisForm({
      cari_id: kayit.cari_id || '',
      hakedis_no: kayit.hakedis_no || '',
      tarih: kayit.tarih || bugununTarihi(),
      vade_tarihi: kayit.vade_tarihi || '',
      aciklama: kayit.aciklama || '',
      brut_tutar: kayit.brut_tutar ?? '',
      kesinti: kayit.kesinti ?? '',
      odenen_tutar: kayit.odenen_tutar ?? '',
      durum: kayit.durum || 'Bekliyor',
      notlar: kayit.notlar || ''
    });
    setHakedisDuzenlenenId(kayit.id);
    setMesaj('Hakediş düzenleme modunda.');
    setHata('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function hakedisDuzenlemeyiIptalEt() {
    setHakedisDuzenlenenId(null);
    setHakedisForm({ ...hakedisFormBaslangic, tarih: bugununTarihi() });
    setMesaj('');
    setHata('');
  }

  async function hakedisSil(id) {
    if (!window.confirm('Bu hakediş kaydını silmek istediğinize emin misiniz?')) return;

    const { error } = await supabase
      .from('hakedisler')
      .delete()
      .eq('id', id)
      .eq('proje_id', seciliProje.id);

    if (error) {
      setHata('Hakediş silinemedi: ' + error.message);
      return;
    }

    if (hakedisDuzenlenenId === id) hakedisDuzenlemeyiIptalEt();
    setMesaj('Hakediş silindi.');
    setHata('');
    await verileriGetir();
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
    aktifSekme === 'gelirler' ? gelirler : aktifSekme === 'giderler' ? harcamalar : aktifSekme === 'finans' ? alacakBorclar : [];

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

  const gorunenCariler = cariler.filter((cari) => {
    const arama = cariArama.trim().toLowerCase();
    const aramaUygun =
      !arama ||
      [cari.ad, cari.yetkili, cari.telefon, cari.email, cari.vergi_no, cari.notlar]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(arama);

    const aktifUygun =
      cariAktifFiltre === 'tumu' ||
      (cariAktifFiltre === 'aktif' && cari.aktif !== false) ||
      (cariAktifFiltre === 'pasif' && cari.aktif === false);

    return aramaUygun && aktifUygun;
  });

  const toplamGelir = gelirler.reduce(
    (t, i) => t + Number(i.tutar),
    0
  );

  const toplamGider = harcamalar.reduce(
    (t, i) => t + Number(i.tutar),
    0
  );

  const netBakiye = toplamGelir - toplamGider;
  // DASHBOARD ÖZET HESAPLARI
  const toplamIslem = gelirler.length + harcamalar.length;

  const buAy = new Date();
  const buAyYil = buAy.getFullYear();
  const buAyNo = buAy.getMonth() + 1;

  const buAyGelir = gelirler.reduce((toplam, item) => {
    if (!item.tarih) return toplam;
    const d = new Date(`${item.tarih}T00:00:00`);
    return d.getFullYear() === buAyYil && d.getMonth() + 1 === buAyNo
      ? toplam + Number(item.tutar || 0)
      : toplam;
  }, 0);

  const buAyGider = harcamalar.reduce((toplam, item) => {
    if (!item.tarih) return toplam;
    const d = new Date(`${item.tarih}T00:00:00`);
    return d.getFullYear() === buAyYil && d.getMonth() + 1 === buAyNo
      ? toplam + Number(item.tutar || 0)
      : toplam;
  }, 0);

  const buAyNet = buAyGelir - buAyGider;

  function gruplaVeSirala(liste, alan) {
    const gruplar = {};
    liste.forEach((item) => {
      const ad = (item[alan] || 'Belirtilmemiş').trim() || 'Belirtilmemiş';
      gruplar[ad] = (gruplar[ad] || 0) + Number(item.tutar || 0);
    });

    return Object.entries(gruplar)
      .map(([ad, tutar]) => ({ ad, tutar }))
      .sort((a, b) => b.tutar - a.tutar);
  }

  const giderKategorileri = gruplaVeSirala(harcamalar, 'kategori');
  const odemeKaynaklari = gruplaVeSirala(harcamalar, 'odeme_kaynagi');

  const sonIslemler = [
    ...gelirler.map((item) => ({ ...item, islemTipi: 'Gelir' })),
    ...harcamalar.map((item) => ({ ...item, islemTipi: 'Gider' }))
  ]
    .sort((a, b) => (b.tarih || '').localeCompare(a.tarih || ''))
    .slice(0, 10);

  const dashboardFormat = (tutar) =>
    `${Number(tutar || 0).toLocaleString('tr-TR')} TL`;

  const buAyAdi = buAy.toLocaleDateString('tr-TR', {
    month: 'long',
    year: 'numeric'
  });

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
    <>

      <style jsx global>{`
        * { box-sizing: border-box; }
        html, body, #__next { margin: 0; min-height: 100%; }
        body { overflow-x: hidden; }
        .santiye-main { min-width: 0; }
        .santiye-tabs { overflow-x: auto; scrollbar-width: thin; padding-bottom: 2px; }
        .santiye-tabs button { flex: 0 0 auto; white-space: nowrap; }
        .santiye-main table { min-width: 760px; }
        .santiye-main input, .santiye-main select, .santiye-main textarea, .santiye-main button { max-width: 100%; }
        @media (max-width: 768px) {
          .santiye-app { flex-direction: column !important; min-height: 100vh !important; }
          .santiye-sidebar { width: 100% !important; min-height: auto !important; padding: 14px !important; position: relative !important; }
          .santiye-sidebar > ul { flex-direction: row !important; overflow-x: auto !important; overflow-y: hidden !important; flex: none !important; padding-bottom: 4px !important; }
          .santiye-sidebar > ul li { flex: 0 0 auto !important; white-space: nowrap !important; }
          .santiye-sidebar form { margin-top: 12px !important; padding-top: 12px !important; }
          .santiye-main { width: 100% !important; max-width: none !important; padding: 16px !important; overflow-x: hidden !important; }
          .santiye-main h1 { font-size: 22px !important; line-height: 1.2 !important; }
          .santiye-main h2 { font-size: 18px !important; }
          .santiye-main [style*="display: flex"] { flex-wrap: wrap !important; }
          .santiye-main [style*="display: grid"] { grid-template-columns: 1fr !important; }
          .santiye-main .santiye-tabs { flex-wrap: nowrap !important; }
          .santiye-main table { font-size: 12px !important; }
          .santiye-main th, .santiye-main td { padding: 9px 8px !important; }
        }
        @media (max-width: 480px) {
          .santiye-sidebar { padding: 12px !important; }
          .santiye-main { padding: 12px !important; }
          .santiye-main button { min-height: 42px; }
        }
      `}</style>
      <div
      className="santiye-app"
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* SOL MENÜ */}
      <div
        className="santiye-sidebar"
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
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
            style={{
              width: '82px',
              height: '38px',
              objectFit: 'contain',
              objectPosition: 'left center',
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
        className="santiye-main"
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
              className="santiye-tabs"
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
                },
                {
                  id: 'finans',
                  label: '💳 Alacak / Borç',
                  color: '#7c3aed'
                },
                {
                  id: 'cariler',
                  label: '👥 Cari Hesaplar',
                  color: '#0891b2'
                },
                {
                  id: 'hakedisler',
                  label: '🧾 Hakedişler',
                  color: '#d97706'
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
                    setCariDuzenlenenId(null);
                    setCariForm({ ...cariFormBaslangic });
                    setHakedisDuzenlenenId(null);
                    setHakedisForm({ ...hakedisFormBaslangic, tarih: bugununTarihi() });
                    setForm({ ...formBaslangic, tarih: bugununTarihi() });
                    setFinansForm({ ...finansFormBaslangic, tarih: bugununTarihi() });
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* ÜST ÖZET KARTLARI */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '18px'
                  }}
                >
                  {[
                    {
                      title: 'Toplam Gelir',
                      value: toplamGelir,
                      icon: '📈',
                      color: '#059669',
                      background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                      border: '#dcfce7'
                    },
                    {
                      title: 'Toplam Gider',
                      value: toplamGider,
                      icon: '📉',
                      color: '#dc2626',
                      background: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)',
                      border: '#fee2e2'
                    },
                    {
                      title: 'Net Proje Bakiyesi',
                      value: netBakiye,
                      icon: '💰',
                      color: netBakiye >= 0 ? '#2563eb' : '#dc2626',
                      background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
                      border: '#dbeafe'
                    },
                    {
                      title: 'Toplam İşlem',
                      value: toplamIslem,
                      icon: '🧾',
                      color: '#6366f1',
                      background: 'linear-gradient(135deg, #ffffff 0%, #eef2ff 100%)',
                      border: '#e0e7ff',
                      isCount: true
                    }
                  ].map((kart) => (
                    <div
                      key={kart.title}
                      style={{
                        background: kart.background,
                        padding: '22px',
                        borderRadius: '16px',
                        border: `1px solid ${kart.border}`,
                        boxShadow: '0 4px 12px rgba(15,23,42,0.04)'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '12px'
                        }}
                      >
                        <span
                          style={{
                            color: kart.color,
                            fontSize: '12px',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            letterSpacing: '0.4px'
                          }}
                        >
                          {kart.title}
                        </span>
                        <span style={{ fontSize: '21px' }}>{kart.icon}</span>
                      </div>
                      <p
                        style={{
                          fontSize: '28px',
                          fontWeight: '800',
                          color: kart.color,
                          margin: 0
                        }}
                      >
                        {kart.isCount ? kart.value.toLocaleString('tr-TR') : `₺${kart.value.toLocaleString('tr-TR')}`}
                      </p>
                    </div>
                  ))}
                </div>

                {/* BU AY */}
                <div
                  style={{
                    background: '#ffffff',
                    padding: '24px',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(15,23,42,0.04)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <div>
                      <h3 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>📅 Bu Ay</h3>
                      <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '13px', textTransform: 'capitalize' }}>
                        {buAyAdi}
                      </p>
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Aylık finansal durum</span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '14px'
                    }}
                  >
                    <div style={{ padding: '16px', borderRadius: '12px', background: '#f0fdf4', border: '1px solid #dcfce7' }}>
                      <div style={{ color: '#166534', fontSize: '12px', fontWeight: '700' }}>AYLIK GELİR</div>
                      <div style={{ color: '#059669', fontSize: '22px', fontWeight: '800', marginTop: '6px' }}>
                        {dashboardFormat(buAyGelir)}
                      </div>
                    </div>
                    <div style={{ padding: '16px', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fee2e2' }}>
                      <div style={{ color: '#991b1b', fontSize: '12px', fontWeight: '700' }}>AYLIK GİDER</div>
                      <div style={{ color: '#dc2626', fontSize: '22px', fontWeight: '800', marginTop: '6px' }}>
                        {dashboardFormat(buAyGider)}
                      </div>
                    </div>
                    <div style={{ padding: '16px', borderRadius: '12px', background: '#eff6ff', border: '1px solid #dbeafe' }}>
                      <div style={{ color: '#1e40af', fontSize: '12px', fontWeight: '700' }}>AYLIK NET</div>
                      <div style={{ color: buAyNet >= 0 ? '#2563eb' : '#dc2626', fontSize: '22px', fontWeight: '800', marginTop: '6px' }}>
                        {dashboardFormat(buAyNet)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* GİDER DAĞILIMI + ÖDEME KAYNAKLARI */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '24px'
                  }}
                >
                  <div
                    style={{
                      background: '#ffffff',
                      padding: '24px',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(15,23,42,0.04)'
                    }}
                  >
                    <div style={{ marginBottom: '18px' }}>
                      <h3 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>📊 Gider Dağılımı</h3>
                      <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '13px' }}>Kategori bazında toplam giderler</p>
                    </div>

                    {giderKategorileri.length === 0 ? (
                      <div style={{ padding: '25px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '10px' }}>
                        Henüz gider kaydı bulunmuyor.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
                        {giderKategorileri.map((item) => {
                          const yuzde = toplamGider > 0 ? (item.tutar / toplamGider) * 100 : 0;
                          return (
                            <div key={item.ad}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '6px', fontSize: '13px' }}>
                                <span style={{ color: '#334155', fontWeight: '600' }}>{item.ad}</span>
                                <span style={{ color: '#0f172a', fontWeight: '700', whiteSpace: 'nowrap' }}>
                                  {dashboardFormat(item.tutar)}
                                </span>
                              </div>
                              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(yuzde, 100)}%`, height: '100%', background: '#dc2626', borderRadius: '99px' }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      background: '#ffffff',
                      padding: '24px',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(15,23,42,0.04)'
                    }}
                  >
                    <div style={{ marginBottom: '18px' }}>
                      <h3 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>💳 Ödeme Kaynakları</h3>
                      <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '13px' }}>Giderlerin hangi kaynaktan ödendiği</p>
                    </div>

                    {odemeKaynaklari.length === 0 ? (
                      <div style={{ padding: '25px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '10px' }}>
                        Henüz ödeme kaynağı kaydı bulunmuyor.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {odemeKaynaklari.map((item) => (
                          <div
                            key={item.ad}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px 14px',
                              borderRadius: '10px',
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0'
                            }}
                          >
                            <span style={{ color: '#334155', fontWeight: '600', fontSize: '13px' }}>{item.ad}</span>
                            <span style={{ color: '#1e40af', fontWeight: '800', whiteSpace: 'nowrap' }}>
                              {dashboardFormat(item.tutar)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* SON İŞLEMLER */}
                <div
                  style={{
                    background: '#ffffff',
                    padding: '24px',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(15,23,42,0.04)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <div>
                      <h3 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>🕐 Son İşlemler</h3>
                      <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '13px' }}>Projeye ait son 10 gelir/gider kaydı</p>
                    </div>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>{toplamIslem} toplam kayıt</span>
                  </div>

                  {sonIslemler.length === 0 ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '10px' }}>
                      Henüz finansal işlem bulunmuyor.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                            <th style={{ padding: '10px' }}>Tarih</th>
                            <th style={{ padding: '10px' }}>Tür</th>
                            <th style={{ padding: '10px' }}>Öğe / Firma / Kişi</th>
                            <th style={{ padding: '10px' }}>Kategori</th>
                            <th style={{ padding: '10px' }}>Ödeme Kaynağı</th>
                            <th style={{ padding: '10px', textAlign: 'right' }}>Tutar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sonIslemler.map((item) => (
                            <tr key={`${item.islemTipi}-${item.id}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '11px 10px', whiteSpace: 'nowrap', color: '#475569' }}>
                                {item.tarih || '-'}
                              </td>
                              <td style={{ padding: '11px 10px' }}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    background: item.islemTipi === 'Gelir' ? '#dcfce7' : '#fee2e2',
                                    color: item.islemTipi === 'Gelir' ? '#166534' : '#991b1b'
                                  }}
                                >
                                  {item.islemTipi}
                                </span>
                              </td>
                              <td style={{ padding: '11px 10px', fontWeight: '600', color: '#0f172a' }}>
                                {item.oge || '-'}
                              </td>
                              <td style={{ padding: '11px 10px', color: '#475569' }}>
                                {item.kategori || '-'}
                              </td>
                              <td style={{ padding: '11px 10px', color: '#64748b' }}>
                                {item.islemTipi === 'Gider' ? (item.odeme_kaynagi || '-') : '-'}
                              </td>
                              <td
                                style={{
                                  padding: '11px 10px',
                                  textAlign: 'right',
                                  fontWeight: '800',
                                  color: item.islemTipi === 'Gelir' ? '#059669' : '#dc2626',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {item.islemTipi === 'Gelir' ? '+' : '-'}₺{Number(item.tutar || 0).toLocaleString('tr-TR')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            ) : aktifSekme === 'finans' ? (
              /* ALACAK / BORÇ */
              <div
                style={{
                  background: 'white',
                  padding: '30px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                  border: '1px solid #e2e8f0'
                }}
              >
                <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#0f172a', fontSize: '18px', fontWeight: '700' }}>
                  {duzenlenenKayitId ? '✏️ Alacak / Borç Düzenle' : '💳 Yeni Alacak / Borç Kaydı'}
                </h3>
                <form onSubmit={finansKaydet} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '28px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  {[
                    ['TÜR', 'tur', ['Alacak', 'Borç']],
                    ['DURUM', 'durum', ['Bekliyor', 'Kısmen Ödendi', 'Ödendi', 'İptal']]
                  ].map(([label, key, options]) => (
                    <div key={key} style={{ flex: 1, minWidth: '150px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>{label}</label>
                      <select value={finansForm[key]} onChange={(e) => setFinansForm({ ...finansForm, [key]: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff' }}>
                        {options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                  <div style={{ flex: 1.5, minWidth: '180px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>TARAF / FİRMA / KİŞİ</label>
                    <input required value={finansForm.taraf} onChange={(e) => setFinansForm({ ...finansForm, taraf: e.target.value })} placeholder="Örn: ABC Beton" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '140px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>TARİH</label>
                    <input required type="date" value={finansForm.tarih} onChange={(e) => setFinansForm({ ...finansForm, tarih: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '140px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>VADE TARİHİ</label>
                    <input type="date" value={finansForm.vade_tarihi} onChange={(e) => setFinansForm({ ...finansForm, vade_tarihi: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                  </div>
                  <div style={{ flex: 1.2, minWidth: '150px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>KATEGORİ</label>
                    <input required value={finansForm.kategori} onChange={(e) => setFinansForm({ ...finansForm, kategori: e.target.value })} placeholder="Örn: Hakediş, Malzeme" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '140px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>TUTAR (₺)</label>
                    <input required type="number" step="0.01" min="0" value={finansForm.tutar} onChange={(e) => setFinansForm({ ...finansForm, tutar: e.target.value })} placeholder="0.00" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '700' }} />
                  </div>
                  <div style={{ flex: 2, minWidth: '220px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>AÇIKLAMA</label>
                    <input value={finansForm.aciklama} onChange={(e) => setFinansForm({ ...finansForm, aciklama: e.target.value })} placeholder="Detay..." style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', width: '100%' }}>
                    <button type="submit" style={{ flex: 1, padding: '12px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                      {duzenlenenKayitId ? '✓ Güncelle' : 'Sisteme Kaydet'}
                    </button>
                    {duzenlenenKayitId && <button type="button" onClick={() => { setDuzenlenenKayitId(null); setFinansForm({ ...finansFormBaslangic, tarih: bugununTarihi() }); }} style={{ padding: '12px 20px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '700' }}>İptal</button>}
                  </div>
                </form>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                    <thead><tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                      {['Tür','Taraf','Tarih','Vade','Kategori','Açıklama','Tutar','Durum','İşlem'].map((h) => <th key={h} style={{ padding: '12px' }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {alacakBorclar.map((i) => (
                        <tr key={i.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px' }}><span style={{ color: i.tur === 'Alacak' ? '#059669' : '#dc2626', fontWeight: '800' }}>{i.tur}</span></td>
                          <td style={{ padding: '12px', fontWeight: '700' }}>{i.taraf}</td>
                          <td style={{ padding: '12px' }}>{i.tarih || '-'}</td>
                          <td style={{ padding: '12px' }}>{i.vade_tarihi || '-'}</td>
                          <td style={{ padding: '12px' }}>{i.kategori || '-'}</td>
                          <td style={{ padding: '12px', color: '#64748b' }}>{i.aciklama || '-'}</td>
                          <td style={{ padding: '12px', fontWeight: '800' }}>₺{Number(i.tutar || 0).toLocaleString('tr-TR')}</td>
                          <td style={{ padding: '12px' }}>{i.durum}</td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button type="button" onClick={() => finansDuzenle(i)} style={{ padding: '6px 9px', background: '#fef3c7', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Düzenle</button>
                              <button type="button" onClick={() => finansSil(i.id)} style={{ padding: '6px 9px', background: '#fee2e2', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Sil</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {alacakBorclar.length === 0 && <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Henüz alacak/borç kaydı yok.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : aktifSekme === 'cariler' ? (
              /* CARİLER */
              <div
                style={{
                  background: 'white',
                  padding: '30px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '20px' }}>{cariDuzenlenenId ? '✏️ Cari Düzenle' : '👥 Cari Hesaplar'}</h3>
                    <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '13px' }}>Firma ve kişi kayıtlarını proje bazında yönetin.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ padding: '9px 12px', borderRadius: '8px', background: '#ecfeff', color: '#0e7490', fontWeight: '800' }}>{cariler.length} Cari</span>
                    <span style={{ padding: '9px 12px', borderRadius: '8px', background: '#f0fdf4', color: '#166534', fontWeight: '800' }}>{cariler.filter(c => c.aktif !== false).length} Aktif</span>
                  </div>
                </div>

                <form onSubmit={cariKaydet} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '25px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  {[
                    ['tip', 'TÜR', ['Firma', 'Kişi']]
                  ].map(([key, label, options]) => (
                    <div key={key} style={{ flex: 1, minWidth: '140px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>{label}</label>
                      <select value={cariForm[key]} onChange={(e) => setCariForm({ ...cariForm, [key]: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff' }}>
                        {options.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                  {[
                    ['ad','FİRMA / KİŞİ ADI','Örn: ABC Beton A.Ş.'],
                    ['yetkili','YETKİLİ','Örn: Ahmet Yılmaz'],
                    ['telefon','TELEFON','05xx xxx xx xx'],
                    ['email','E-POSTA','ornek@firma.com'],
                    ['vergi_dairesi','VERGİ DAİRESİ',''],
                    ['vergi_no','VERGİ NO / T.C.','']
                  ].map(([key,label,placeholder]) => (
                    <div key={key} style={{ flex: key === 'ad' ? 1.5 : 1, minWidth: '160px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>{label}</label>
                      <input required={key === 'ad'} value={cariForm[key]} onChange={(e) => setCariForm({ ...cariForm, [key]: e.target.value })} placeholder={placeholder} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff' }} />
                    </div>
                  ))}
                  <div style={{ flex: 2, minWidth: '220px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>ADRES</label>
                    <input value={cariForm.adres} onChange={(e) => setCariForm({ ...cariForm, adres: e.target.value })} placeholder="Adres..." style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                  </div>
                  <div style={{ flex: 2, minWidth: '220px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>NOTLAR</label>
                    <input value={cariForm.notlar} onChange={(e) => setCariForm({ ...cariForm, notlar: e.target.value })} placeholder="Not..." style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 5px', fontWeight: '700', color: '#334155' }}>
                    <input type="checkbox" checked={cariForm.aktif} onChange={(e) => setCariForm({ ...cariForm, aktif: e.target.checked })} />
                    Aktif
                  </label>
                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <button type="submit" style={{ flex: 1, padding: '12px', background: cariDuzenlenenId ? '#f59e0b' : '#0891b2', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>
                      {cariDuzenlenenId ? '✓ Cariyi Güncelle' : '➕ Cari Ekle'}
                    </button>
                    {cariDuzenlenenId && <button type="button" onClick={cariDuzenlemeyiIptalEt} style={{ padding: '12px 20px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '700' }}>İptal</button>}
                  </div>
                </form>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px', padding: '14px', background: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: '10px' }}>
                  <input value={cariArama} onChange={(e) => setCariArama(e.target.value)} placeholder="🔎 Firma, kişi, yetkili, telefon veya vergi no ara..." style={{ flex: 1, minWidth: '220px', padding: '10px 12px', border: '1px solid #67e8f9', borderRadius: '8px', background: '#fff' }} />
                  <select value={cariAktifFiltre} onChange={(e) => setCariAktifFiltre(e.target.value)} style={{ padding: '10px 12px', border: '1px solid #67e8f9', borderRadius: '8px', background: '#fff' }}>
                    <option value="aktif">Aktifler</option>
                    <option value="pasif">Pasifler</option>
                    <option value="tumu">Tümü</option>
                  </select>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1050px' }}>
                    <thead><tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                      {['Tür','Firma / Kişi','Yetkili','Telefon','E-posta','Vergi No','Notlar','Durum','İşlem'].map(h => <th key={h} style={{ padding: '12px' }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {gorunenCariler.map((cari) => (
                        <tr key={cari.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px' }}>{cari.tip === 'Kişi' ? '👤 Kişi' : '🏢 Firma'}</td>
                          <td style={{ padding: '12px', fontWeight: '800', color: '#0f172a' }}>{cari.ad}</td>
                          <td style={{ padding: '12px' }}>{cari.yetkili || '-'}</td>
                          <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{cari.telefon || '-'}</td>
                          <td style={{ padding: '12px' }}>{cari.email || '-'}</td>
                          <td style={{ padding: '12px' }}>{cari.vergi_no || '-'}</td>
                          <td style={{ padding: '12px', color: '#64748b' }}>{cari.notlar || '-'}</td>
                          <td style={{ padding: '12px' }}><span style={{ padding: '4px 8px', borderRadius: '6px', background: cari.aktif !== false ? '#dcfce7' : '#f1f5f9', color: cari.aktif !== false ? '#166534' : '#64748b', fontWeight: '700', fontSize: '12px' }}>{cari.aktif !== false ? 'Aktif' : 'Pasif'}</span></td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              <button type="button" onClick={() => cariDuzenle(cari)} style={{ padding: '6px 10px', background: '#fef3c7', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>Düzenle</button>
                              <button type="button" onClick={() => cariSil(cari.id)} style={{ padding: '6px 10px', background: '#fee2e2', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>Sil</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {gorunenCariler.length === 0 && <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Cari kaydı bulunamadı.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : aktifSekme === 'hakedisler' ? (
              /* HAKEDİŞLER */
              <div
                style={{
                  background: 'white',
                  padding: '30px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '20px' }}>{hakedisDuzenlenenId ? '✏️ Hakediş Düzenle' : '🧾 Hakediş Yönetimi'}</h3>
                    <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '13px' }}>Taşeron ve firmaların hakedişlerini proje bazında takip edin.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ padding: '9px 12px', borderRadius: '8px', background: '#fff7ed', color: '#c2410c', fontWeight: '800' }}>{hakedisler.length} Hakediş</span>
                    <span style={{ padding: '9px 12px', borderRadius: '8px', background: '#f0fdf4', color: '#166534', fontWeight: '800' }}>
                      Net: ₺{hakedisler.reduce((t, i) => t + Number(i.net_tutar || 0), 0).toLocaleString('tr-TR')}
                    </span>
                    <span style={{ padding: '9px 12px', borderRadius: '8px', background: '#eff6ff', color: '#1d4ed8', fontWeight: '800' }}>
                      Kalan: ₺{hakedisler.reduce((t, i) => t + Math.max(Number(i.net_tutar || 0) - Number(i.odenen_tutar || 0), 0), 0).toLocaleString('tr-TR')}
                    </span>
                  </div>
                </div>

                {cariler.length === 0 ? (
                  <div style={{ padding: '18px', marginBottom: '20px', background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', borderRadius: '10px', fontWeight: '600' }}>
                    Hakediş eklemek için önce Cari Hesaplar bölümünden en az bir firma veya kişi oluşturun.
                  </div>
                ) : (
                  <form onSubmit={hakedisKaydet} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '25px', background: '#fffaf5', padding: '20px', borderRadius: '12px', border: '1px solid #fed7aa' }}>
                    <div style={{ flex: 1.5, minWidth: '220px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>CARİ / FİRMA *</label>
                      <select required value={hakedisForm.cari_id} onChange={(e) => setHakedisForm({ ...hakedisForm, cari_id: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff' }}>
                        <option value="">Cari seçin...</option>
                        {cariler.filter(c => c.aktif !== false).map(c => <option key={c.id} value={c.id}>{c.tip === 'Kişi' ? '👤' : '🏢'} {c.ad}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1, minWidth: '140px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>HAKEDİŞ NO *</label>
                      <input required value={hakedisForm.hakedis_no} onChange={(e) => setHakedisForm({ ...hakedisForm, hakedis_no: e.target.value })} placeholder="Örn: H-001" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: '140px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>TARİH *</label>
                      <input required type="date" value={hakedisForm.tarih} onChange={(e) => setHakedisForm({ ...hakedisForm, tarih: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: '140px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>VADE TARİHİ</label>
                      <input type="date" value={hakedisForm.vade_tarihi} onChange={(e) => setHakedisForm({ ...hakedisForm, vade_tarihi: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>BRÜT TUTAR (₺)</label>
                      <input required type="number" min="0" step="0.01" value={hakedisForm.brut_tutar} onChange={(e) => setHakedisForm({ ...hakedisForm, brut_tutar: e.target.value })} placeholder="0.00" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '700' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>KESİNTİ (₺)</label>
                      <input type="number" min="0" step="0.01" value={hakedisForm.kesinti} onChange={(e) => setHakedisForm({ ...hakedisForm, kesinti: e.target.value })} placeholder="0.00" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>NET HAKEDİŞ</label>
                      <div style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontWeight: '800' }}>
                        ₺{Math.max(Number(hakedisForm.brut_tutar || 0) - Number(hakedisForm.kesinti || 0), 0).toLocaleString('tr-TR')}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>ÖDENEN (₺)</label>
                      <input type="number" min="0" step="0.01" value={hakedisForm.odenen_tutar} onChange={(e) => setHakedisForm({ ...hakedisForm, odenen_tutar: e.target.value })} placeholder="0.00" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>DURUM</label>
                      <select value={hakedisForm.durum} onChange={(e) => setHakedisForm({ ...hakedisForm, durum: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff' }}>
                        <option>Bekliyor</option><option>Kısmen Ödendi</option><option>Ödendi</option><option>İptal</option>
                      </select>
                    </div>
                    <div style={{ flex: 2, minWidth: '240px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>AÇIKLAMA</label>
                      <input value={hakedisForm.aciklama} onChange={(e) => setHakedisForm({ ...hakedisForm, aciklama: e.target.value })} placeholder="İşin / hakedişin açıklaması" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                    </div>
                    <div style={{ flex: 2, minWidth: '240px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>NOTLAR</label>
                      <input value={hakedisForm.notlar} onChange={(e) => setHakedisForm({ ...hakedisForm, notlar: e.target.value })} placeholder="Ek not..." style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      <button type="submit" style={{ flex: 1, padding: '12px', background: hakedisDuzenlenenId ? '#f59e0b' : '#d97706', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>
                        {hakedisDuzenlenenId ? '✓ Hakedişi Güncelle' : '➕ Hakediş Kaydet'}
                      </button>
                      {hakedisDuzenlenenId && <button type="button" onClick={hakedisDuzenlemeyiIptalEt} style={{ padding: '12px 20px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '700' }}>İptal</button>}
                    </div>
                  </form>
                )}

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1250px' }}>
                    <thead><tr style={{ background: '#fff7ed', color: '#7c2d12', textAlign: 'left' }}>
                      {['Hakediş No','Cari / Firma','Tarih','Vade','Açıklama','Brüt','Kesinti','Net','Ödenen','Kalan','Durum','İşlem'].map(h => <th key={h} style={{ padding: '12px' }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {hakedisler.map((i) => {
                        const net = Number(i.net_tutar || 0);
                        const kalan = Math.max(net - Number(i.odenen_tutar || 0), 0);
                        return (
                          <tr key={i.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px', fontWeight: '800' }}>{i.hakedis_no}</td>
                            <td style={{ padding: '12px', fontWeight: '700' }}>{i.cariler?.ad || cariler.find(c => c.id === i.cari_id)?.ad || '-'}</td>
                            <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{i.tarih || '-'}</td>
                            <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{i.vade_tarihi || '-'}</td>
                            <td style={{ padding: '12px', color: '#64748b' }}>{i.aciklama || '-'}</td>
                            <td style={{ padding: '12px', fontWeight: '700' }}>₺{Number(i.brut_tutar || 0).toLocaleString('tr-TR')}</td>
                            <td style={{ padding: '12px' }}>₺{Number(i.kesinti || 0).toLocaleString('tr-TR')}</td>
                            <td style={{ padding: '12px', fontWeight: '800', color: '#166534' }}>₺{net.toLocaleString('tr-TR')}</td>
                            <td style={{ padding: '12px', color: '#1d4ed8', fontWeight: '700' }}>₺{Number(i.odenen_tutar || 0).toLocaleString('tr-TR')}</td>
                            <td style={{ padding: '12px', color: kalan > 0 ? '#dc2626' : '#166534', fontWeight: '800' }}>₺{kalan.toLocaleString('tr-TR')}</td>
                            <td style={{ padding: '12px' }}><span style={{ padding: '4px 8px', borderRadius: '6px', background: i.durum === 'Ödendi' ? '#dcfce7' : i.durum === 'İptal' ? '#f1f5f9' : '#fef3c7', color: i.durum === 'Ödendi' ? '#166534' : i.durum === 'İptal' ? '#64748b' : '#92400e', fontWeight: '700', fontSize: '12px' }}>{i.durum}</span></td>
                            <td style={{ padding: '12px' }}>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <button type="button" onClick={() => hakedisDuzenle(i)} style={{ padding: '6px 10px', background: '#fef3c7', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>Düzenle</button>
                                <button type="button" onClick={() => hakedisSil(i.id)} style={{ padding: '6px 10px', background: '#fee2e2', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>Sil</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {hakedisler.length === 0 && <tr><td colSpan={12} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Henüz hakediş kaydı yok.</td></tr>}
                    </tbody>
                  </table>
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
    </>
  );
}
