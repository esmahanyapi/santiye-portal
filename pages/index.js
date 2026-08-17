import React, { useState, useEffect, useRef } from 'react';
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
  const [projeDuzenlemeAcik, setProjeDuzenlemeAcik] = useState(false);
  const [projeDuzenlenen, setProjeDuzenlenen] = useState(null);
  const [projeDuzenlemeAdi, setProjeDuzenlemeAdi] = useState('');
  const [projeDuzenlemeYukleniyor, setProjeDuzenlemeYukleniyor] = useState(false);

  const [harcamalar, setHarcamalar] = useState([]);
  const [gelirler, setGelirler] = useState([]);
  const [alacakBorclar, setAlacakBorclar] = useState([]);
  const [cariler, setCariler] = useState([]);
  const [hakedisler, setHakedisler] = useState([]);
  const [projeButceleri, setProjeButceleri] = useState([]);
  const [projeMaliyetleri, setProjeMaliyetleri] = useState([]);
  const [finansEvraklari, setFinansEvraklari] = useState([]);
  const [belgeDosyalari, setBelgeDosyalari] = useState([]);
  const [belgeYukleniyor, setBelgeYukleniyor] = useState(false);
  const [belgeModalKayit, setBelgeModalKayit] = useState(null);
  const [belgeModalYukleniyor, setBelgeModalYukleniyor] = useState(false);
  const [maliyetForm, setMaliyetForm] = useState({ kategori: 'Beton', butce_tutari: '', aciklama: '' });
  const [maliyetKayitForm, setMaliyetKayitForm] = useState({ kategori: 'Beton', tutar: '', tarih: '', cari_id: '', gider_id: '', aciklama: '' });
  const [butceDuzenlenenId, setButceDuzenlenenId] = useState(null);
  const [maliyetDuzenlenenId, setMaliyetDuzenlenenId] = useState(null);
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
  const [cariDetayId, setCariDetayId] = useState(null);

  // KULLANICI YÖNETİMİ
  const [kullaniciProfili, setKullaniciProfili] = useState(null);
  const [kullanicilar, setKullanicilar] = useState([]);
  const [kullaniciYetkileri, setKullaniciYetkileri] = useState([]);
  const [kullaniciYukleniyor, setKullaniciYukleniyor] = useState(false);
  const [kullaniciForm, setKullaniciForm] = useState({ email: '', ad_soyad: '', rol: 'personel', aktif: true });
  const [seciliKullaniciId, setSeciliKullaniciId] = useState(null);
  const [seciliKullaniciProjeIds, setSeciliKullaniciProjeIds] = useState([]);

  // EXCEL'DEN TOPLU AKTARIM
  const [excelAktarimAcik, setExcelAktarimAcik] = useState(false);
  const [excelAktarimSatirlari, setExcelAktarimSatirlari] = useState([]);
  const [excelAktarimHatalari, setExcelAktarimHatalari] = useState([]);
  const [excelAktarimDosyaAdi, setExcelAktarimDosyaAdi] = useState('');
  const [excelAktarimYukleniyor, setExcelAktarimYukleniyor] = useState(false);
  const [excelAktarimSonuc, setExcelAktarimSonuc] = useState(null);
  const [mobilMenuAcik, setMobilMenuAcik] = useState(false);
  const excelDosyaRef = useRef(null);

  const [filtreKategori, setFiltreKategori] = useState('');
  const [filtreAciklama, setFiltreAciklama] = useState('');

  const [mesaj, setMesaj] = useState('');
  const [hata, setHata] = useState('');
  const [duzenlenenKayitId, setDuzenlenenKayitId] = useState(null);
  const [filtreBaslangic, setFiltreBaslangic] = useState('');
  const [filtreBitis, setFiltreBitis] = useState('');
  const [evrakArama, setEvrakArama] = useState('');
  const [evrakTipFiltre, setEvrakTipFiltre] = useState('tumu');
  const [evrakTurFiltre, setEvrakTurFiltre] = useState('tumu');

  // GELİR / GİDER LİSTE SIRALAMA
  const [siralaAlan, setSiralaAlan] = useState('tarih');
  const [siralaYon, setSiralaYon] = useState('desc');
  const [listeSayfasi, setListeSayfasi] = useState(1);
  const SAYFA_BASI_KAYIT = 50;

  function siralamayiDegistir(alan) {
    if (siralaAlan === alan) {
      setSiralaYon((yon) => (yon === 'asc' ? 'desc' : 'asc'));
    } else {
      setSiralaAlan(alan);
      setSiralaYon(alan === 'tutar' ? 'desc' : 'asc');
    }
  }

  function siralamaIkonu(alan) {
    if (siralaAlan !== alan) return '↕';
    return siralaYon === 'asc' ? '↑' : '↓';
  }

  function siraliListeOlustur(liste) {
    return [...liste].sort((a, b) => {
      let sonuc = 0;

      if (siralaAlan === 'tutar') {
        sonuc = Number(a.tutar || 0) - Number(b.tutar || 0);
      } else {
        const aDeger = String(a[siralaAlan] || '').trim().toLocaleLowerCase('tr-TR');
        const bDeger = String(b[siralaAlan] || '').trim().toLocaleLowerCase('tr-TR');
        sonuc = aDeger.localeCompare(bDeger, 'tr-TR', {
          numeric: true,
          sensitivity: 'base'
        });
      }

      return siralaYon === 'asc' ? sonuc : -sonuc;
    });
  }

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

  useEffect(() => {
    setMaliyetKayitForm((prev) => ({ ...prev, tarih: prev.tarih || bugununTarihi() }));
  }, []);

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
        const { data: profil } = await supabase
          .from('kullanici_profilleri')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        setKullaniciProfili(profil || null);
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

    const { data: userResult } = await supabase.auth.getUser();
    const user = userResult?.user;

    if (!user) {
      router.replace('/login');
      return;
    }

    const { data: profil } = await supabase
      .from('kullanici_profilleri')
      .select('rol, aktif')
      .eq('id', user.id)
      .maybeSingle();

    if (profil && profil.aktif === false) {
      await supabase.auth.signOut();
      router.replace('/login');
      return;
    }

    const { data, error } = await supabase
      .from('projeler')
      .select('*')
      .order('sira_no', { ascending: true }).order('created_at', { ascending: true });

    if (error) {
      console.error('Projeler alınamadı:', error);
      setHata('Projeler yüklenemedi: ' + error.message);
      return;
    }

    let izinliProjeler = data || [];

    if (profil?.rol !== 'yonetici') {
      const { data: yetkiler, error: yetkiError } = await supabase
        .from('kullanici_proje_yetkileri')
        .select('proje_id')
        .eq('kullanici_id', user.id);

      if (yetkiError) {
        console.error('Proje yetkileri alınamadı:', yetkiError);
        setHata('Proje yetkileri yüklenemedi: ' + yetkiError.message);
        return;
      }

      const izinliIdler = new Set((yetkiler || []).map((y) => Number(y.proje_id)));
      izinliProjeler = izinliProjeler.filter((p) => izinliIdler.has(Number(p.id)));
    }

    setProjeler(izinliProjeler);

    if (izinliProjeler.length === 0) {
      setSeciliProje(null);
      setHata('Bu kullanıcıya atanmış bir proje bulunmuyor.');
      return;
    }

    setSeciliProje((prev) => {
      if (prev && izinliProjeler.some((p) => Number(p.id) === Number(prev.id))) return prev;
      return izinliProjeler[0];
    });
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

    const { data: pb, error: pbError } = await supabase
      .from('proje_butceleri')
      .select('*')
      .eq('proje_id', seciliProje.id)
      .order('kategori', { ascending: true });

    const { data: pm, error: pmError } = await supabase
      .from('proje_maliyetleri')
      .select('*, cariler(id, ad, tip)')
      .eq('proje_id', seciliProje.id)
      .order('tarih', { ascending: false });

    const { data: fe, error: feError } = await supabase
      .from('finans_evraklari')
      .select('*')
      .eq('proje_id', seciliProje.id)
      .order('created_at', { ascending: false });

    if (hError) {
      console.error('Harcamalar alınamadı:', hError);
    }

    if (gError) {
      console.error('Gelirler alınamadı:', gError);
    }
    if (feError) {
      console.error('Finans evrakları alınamadı:', feError);
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
    if (pbError) {
      console.error('Proje bütçeleri alınamadı:', pbError);
    }
    if (pmError) {
      console.error('Proje maliyetleri alınamadı:', pmError);
    }

    setHarcamalar(h || []);
    setGelirler(g || []);
    setAlacakBorclar(f || []);
    setCariler(c || []);
    setHakedisler(hd || []);
    setProjeButceleri(pb || []);
    setProjeMaliyetleri(pm || []);
    setFinansEvraklari(fe || []);
  }

  // KULLANICI YÖNETİMİ
  async function kullanicilariGetir() {
    setKullaniciYukleniyor(true);
    setHata('');

    const { data: profil } = await supabase
      .from('kullanici_profilleri')
      .select('*')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .maybeSingle();

    setKullaniciProfili(profil || null);

    if (profil?.rol !== 'yonetici') {
      setKullaniciYukleniyor(false);
      setHata('Kullanıcı yönetimi sadece yöneticilere açıktır.');
      return;
    }

    const [kullaniciSonuc, yetkiSonuc] = await Promise.all([
      supabase.from('kullanici_profilleri').select('*').order('ad_soyad', { ascending: true }),
      supabase.from('kullanici_proje_yetkileri').select('id, kullanici_id, proje_id').order('id', { ascending: true })
    ]);

    if (kullaniciSonuc.error) {
      setHata('Kullanıcılar yüklenemedi: ' + kullaniciSonuc.error.message);
      setKullaniciYukleniyor(false);
      return;
    }

    if (yetkiSonuc.error) {
      setHata('Proje yetkileri yüklenemedi: ' + yetkiSonuc.error.message);
      setKullaniciYukleniyor(false);
      return;
    }

    setKullanicilar(kullaniciSonuc.data || []);
    setKullaniciYetkileri(yetkiSonuc.data || []);
    setKullaniciYukleniyor(false);
  }

  async function kullaniciProfiliOlustur(event) {
    event.preventDefault();

    if (kullaniciProfili?.rol !== 'yonetici') {
      setHata('Bu işlem sadece yöneticilere açıktır.');
      return;
    }

    const email = kullaniciForm.email.trim().toLowerCase();
    const adSoyad = kullaniciForm.ad_soyad.trim();

    if (!email || !adSoyad) {
      setHata('E-posta ve ad soyad zorunludur.');
      return;
    }

    setHata('');
    setMesaj('');

    const { data, error } = await supabase.rpc('yonetici_kullanici_profili_ekle', {
      p_email: email,
      p_ad_soyad: adSoyad,
      p_rol: kullaniciForm.rol,
      p_aktif: kullaniciForm.aktif
    });

    if (error) {
      setHata('Kullanıcı eklenemedi: ' + error.message);
      return;
    }

    setKullaniciForm({ email: '', ad_soyad: '', rol: 'personel', aktif: true });
    setMesaj(data?.mesaj || 'Kullanıcı profili başarıyla oluşturuldu.');
    await kullanicilariGetir();
  }

  function kullaniciDuzenle(profil) {
    setSeciliKullaniciId(profil.id);
    setKullaniciForm({
      email: profil.email || '',
      ad_soyad: profil.ad_soyad || '',
      rol: profil.rol || 'personel',
      aktif: profil.aktif !== false
    });

    const yetkiler = kullaniciYetkileri
      .filter((y) => y.kullanici_id === profil.id)
      .map((y) => Number(y.proje_id));

    setSeciliKullaniciProjeIds(yetkiler);
    setHata('');
    setMesaj('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function kullaniciKaydet() {
    if (!seciliKullaniciId || kullaniciProfili?.rol !== 'yonetici') return;

    setHata('');
    setMesaj('');

    const { error } = await supabase
      .from('kullanici_profilleri')
      .update({
        ad_soyad: kullaniciForm.ad_soyad.trim(),
        rol: kullaniciForm.rol,
        aktif: kullaniciForm.aktif,
        updated_at: new Date().toISOString()
      })
      .eq('id', seciliKullaniciId);

    if (error) {
      setHata('Kullanıcı güncellenemedi: ' + error.message);
      return;
    }

    const mevcut = kullaniciYetkileri.filter((y) => y.kullanici_id === seciliKullaniciId);
    const seciliSet = new Set(seciliKullaniciProjeIds.map(Number));

    const silinecekler = mevcut.filter((y) => !seciliSet.has(Number(y.proje_id)));
    if (silinecekler.length > 0) {
      const { error: silError } = await supabase
        .from('kullanici_proje_yetkileri')
        .delete()
        .in('id', silinecekler.map((y) => y.id));

      if (silError) {
        setHata('Proje yetkileri güncellenemedi: ' + silError.message);
        return;
      }
    }

    const mevcutSet = new Set(mevcut.map((y) => Number(y.proje_id)));
    const eklenecekler = [...seciliSet]
      .filter((projeId) => !mevcutSet.has(projeId))
      .map((projeId) => ({ kullanici_id: seciliKullaniciId, proje_id: projeId }));

    if (eklenecekler.length > 0) {
      const { error: ekleError } = await supabase
        .from('kullanici_proje_yetkileri')
        .insert(eklenecekler);

      if (ekleError) {
        setHata('Proje yetkileri eklenemedi: ' + ekleError.message);
        return;
      }
    }

    setSeciliKullaniciId(null);
    setSeciliKullaniciProjeIds([]);
    setKullaniciForm({ email: '', ad_soyad: '', rol: 'personel', aktif: true });
    setMesaj('Kullanıcı ve proje yetkileri güncellendi.');
    await kullanicilariGetir();
  }

  function kullaniciDuzenlemeyiIptalEt() {
    setSeciliKullaniciId(null);
    setSeciliKullaniciProjeIds([]);
    setKullaniciForm({ email: '', ad_soyad: '', rol: 'personel', aktif: true });
    setMesaj('');
    setHata('');
  }

  function kullaniciProjeYetkisiDegistir(projeId) {
    setSeciliKullaniciProjeIds((prev) => {
      const id = Number(projeId);
      return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    });
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

      const { data: sonSiraKaydi } = await supabase
        .from('projeler')
        .select('sira_no')
        .order('sira_no', { ascending: false })
        .limit(1)
        .maybeSingle();

      const yeniSiraNo = Number(sonSiraKaydi?.sira_no || 0) + 1;

      const { data, error } = await supabase
        .from('projeler')
        .insert([
          {
            ad: projeAdi,
            sira_no: yeniSiraNo
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

  // PROJE ADI DÜZENLE
  function projeDuzenlemeAc(proje) {
    if (kullaniciProfili?.rol !== 'yonetici') return;
    setProjeDuzenlenen(proje);
    setProjeDuzenlemeAdi(proje?.ad || '');
    setProjeDuzenlemeAcik(true);
    setHata('');
    setMesaj('');
    setMobilMenuAcik(false);
  }

  async function projeAdiGuncelle(event) {
    event.preventDefault();

    if (!projeDuzenlenen?.id) return;

    const yeniAd = projeDuzenlemeAdi.trim();
    if (!yeniAd) {
      setHata('Lütfen proje adı girin.');
      return;
    }

    setProjeDuzenlemeYukleniyor(true);
    setHata('');
    setMesaj('');

    const { data, error } = await supabase
      .from('projeler')
      .update({ ad: yeniAd })
      .eq('id', projeDuzenlenen.id)
      .select()
      .single();

    setProjeDuzenlemeYukleniyor(false);

    if (error) {
      console.error('Proje adı güncelleme hatası:', error);
      setHata('Proje adı güncellenemedi: ' + error.message);
      return;
    }

    if (data) {
      setProjeler((prev) => prev.map((p) => Number(p.id) === Number(data.id) ? { ...p, ...data } : p));
      setSeciliProje((prev) => prev && Number(prev.id) === Number(data.id) ? { ...prev, ...data } : prev);
      setProjeDuzenlenen(data);
    }

    setProjeDuzenlemeAcik(false);
    setProjeDuzenlenen(null);
    setProjeDuzenlemeAdi('');
    setMesaj('Proje adı başarıyla güncellendi.');
  }


  // PROJE SIRASINI DEĞİŞTİR
  async function projeSiraDegistir(projeId, yon) {
    if (kullaniciProfili?.rol !== 'yonetici') return;

    const mevcutIndex = projeler.findIndex((p) => Number(p.id) === Number(projeId));
    if (mevcutIndex < 0) return;

    const hedefIndex = yon === 'yukari' ? mevcutIndex - 1 : mevcutIndex + 1;
    if (hedefIndex < 0 || hedefIndex >= projeler.length) return;

    const mevcut = projeler[mevcutIndex];
    const hedef = projeler[hedefIndex];
    const mevcutSira = Number(mevcut.sira_no || mevcutIndex + 1);
    const hedefSira = Number(hedef.sira_no || hedefIndex + 1);

    setHata('');
    setMesaj('Proje sırası güncelleniyor...');

    const { error } = await supabase
      .from('projeler')
      .update({ sira_no: hedefSira })
      .eq('id', mevcut.id);

    if (error) {
      setHata('Proje sırası güncellenemedi: ' + error.message);
      setMesaj('');
      return;
    }

    const { error: hedefError } = await supabase
      .from('projeler')
      .update({ sira_no: mevcutSira })
      .eq('id', hedef.id);

    if (hedefError) {
      // İlk değişikliği geri almaya çalış.
      await supabase.from('projeler').update({ sira_no: mevcutSira }).eq('id', mevcut.id);
      setHata('Proje sırası güncellenemedi: ' + hedefError.message);
      setMesaj('');
      return;
    }

    const yeniListe = [...projeler];
    [yeniListe[mevcutIndex], yeniListe[hedefIndex]] = [yeniListe[hedefIndex], yeniListe[mevcutIndex]];
    const numaraliListe = yeniListe.map((p, index) => ({ ...p, sira_no: index + 1 }));

    // Görünen listeyi güncelle; seçili proje nesnesini de güncel tut.
    setProjeler(numaraliListe);
    setSeciliProje((prev) => prev ? { ...prev, sira_no: numaraliListe.find((p) => Number(p.id) === Number(prev.id))?.sira_no || prev.sira_no } : prev);
    setMesaj('Proje sırası güncellendi.');
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
    setBelgeDosyalari([]);
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

  // HAKEDİŞTEN DOĞRUDAN İLGİLİ CARİ HESABA GEÇ
  function cariFinansAc(cariId) {
    const id = Number(cariId);
    if (!id) return;
    setAktifSekme('cariler');
    setCariDetayId(id);
    setHata('');
    setMesaj('İlgili cari hesabın finansal özeti açıldı.');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
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

    // Hakedişin seçilen cari hesaba ve aynı projeye ait olduğundan emin ol.
    const secilenCari = cariler.find((c) => Number(c.id) === Number(hakedisForm.cari_id));
    if (!secilenCari) {
      setHata('Seçilen cari hesap bu projede bulunamadı. Lütfen cari hesabı yeniden seçin.');
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

  // PROJE BÜTÇESİ / MALİYET KAYDET
  const maliyetKategorileri = ['Beton', 'Demir', 'Kalıp', 'İşçilik', 'Taşeron', 'Elektrik', 'Mekanik', 'Doğrama', 'Boya', 'Belediye / Ruhsat / Harç', 'Nakliye', 'Vergi / SGK', 'Diğer'];

  async function butceKaydet(event) {
    event.preventDefault();
    if (!seciliProje) return setHata('Önce bir proje seçmelisiniz.');
    const tutar = Number(maliyetForm.butce_tutari);
    if (!maliyetForm.kategori || !Number.isFinite(tutar) || tutar < 0) {
      return setHata('Kategori ve geçerli bütçe tutarı girin.');
    }
    setHata(''); setMesaj('');
    const kayit = { proje_id: seciliProje.id, kategori: maliyetForm.kategori, butce_tutari: tutar, aciklama: maliyetForm.aciklama.trim(), aktif: true };
    const sonuc = butceDuzenlenenId
      ? await supabase.from('proje_butceleri').update(kayit).eq('id', butceDuzenlenenId).eq('proje_id', seciliProje.id)
      : await supabase.from('proje_butceleri').upsert([kayit], { onConflict: 'proje_id,kategori' });
    if (sonuc.error) { setHata('Bütçe kaydedilemedi: ' + sonuc.error.message); return; }
    setMaliyetForm({ kategori: 'Beton', butce_tutari: '', aciklama: '' });
    setButceDuzenlenenId(null);
    setMesaj('Proje bütçesi kaydedildi.');
    await verileriGetir();
  }

  function butceDuzenle(kayit) {
    setMaliyetForm({ kategori: kayit.kategori || 'Beton', butce_tutari: kayit.butce_tutari ?? '', aciklama: kayit.aciklama || '' });
    setButceDuzenlenenId(kayit.id); setHata(''); setMesaj('Bütçe düzenleme modunda.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function butceSil(id) {
    if (!window.confirm('Bu bütçe kalemini silmek istediğinize emin misiniz?')) return;
    const { error } = await supabase.from('proje_butceleri').delete().eq('id', id).eq('proje_id', seciliProje.id);
    if (error) { setHata('Bütçe silinemedi: ' + error.message); return; }
    setMesaj('Bütçe kalemi silindi.'); setHata(''); await verileriGetir();
  }

  async function maliyetKaydet(event) {
    event.preventDefault();
    if (!seciliProje) return setHata('Önce bir proje seçmelisiniz.');
    const tutar = Number(maliyetKayitForm.tutar);
    if (!maliyetKayitForm.kategori || !maliyetKayitForm.tarih || !Number.isFinite(tutar) || tutar <= 0) {
      return setHata('Tarih, kategori ve 0’dan büyük tutar zorunludur.');
    }
    setHata(''); setMesaj('');
    const kayit = {
      proje_id: seciliProje.id,
      gider_id: maliyetKayitForm.gider_id ? Number(maliyetKayitForm.gider_id) : null,
      kategori: maliyetKayitForm.kategori,
      tutar,
      tarih: maliyetKayitForm.tarih,
      aciklama: maliyetKayitForm.aciklama.trim(),
      cari_id: maliyetKayitForm.cari_id ? Number(maliyetKayitForm.cari_id) : null,
      aktif: true
    };
    const sonuc = maliyetDuzenlenenId
      ? await supabase.from('proje_maliyetleri').update(kayit).eq('id', maliyetDuzenlenenId).eq('proje_id', seciliProje.id)
      : await supabase.from('proje_maliyetleri').insert([kayit]);
    if (sonuc.error) { setHata('Maliyet kaydedilemedi: ' + sonuc.error.message); return; }
    setMaliyetKayitForm({ kategori: 'Beton', tutar: '', tarih: bugununTarihi(), cari_id: '', gider_id: '', aciklama: '' });
    setMaliyetDuzenlenenId(null); setMesaj(maliyetDuzenlenenId ? 'Maliyet güncellendi.' : 'Maliyet kaydedildi.');
    await verileriGetir();
  }

  function maliyetDuzenle(kayit) {
    setMaliyetKayitForm({ kategori: kayit.kategori || 'Beton', tutar: kayit.tutar ?? '', tarih: kayit.tarih || bugununTarihi(), cari_id: kayit.cari_id || '', gider_id: kayit.gider_id || '', aciklama: kayit.aciklama || '' });
    setMaliyetDuzenlenenId(kayit.id); setHata(''); setMesaj('Maliyet düzenleme modunda.'); window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function maliyetSil(id) {
    if (!window.confirm('Bu maliyet kaydını silmek istediğinize emin misiniz?')) return;
    const { error } = await supabase.from('proje_maliyetleri').delete().eq('id', id).eq('proje_id', seciliProje.id);
    if (error) { setHata('Maliyet silinemedi: ' + error.message); return; }
    if (maliyetDuzenlenenId === id) setMaliyetDuzenlenenId(null);
    setMesaj('Maliyet kaydı silindi.'); setHata(''); await verileriGetir();
  }

  // FİNANS EVRAKLARI
  function guvenliDosyaAdi(ad) {
    return String(ad || 'belge')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'belge';
  }

  function kayitEvraklari(kayitTipi, kayitId) {
    return finansEvraklari.filter((e) => e.kayit_tipi === kayitTipi && Number(e.kayit_id) === Number(kayitId));
  }

  async function belgeModalAc(kayit) {
    const kayitTipi = aktifSekme === 'gelirler' ? 'gelir' : 'gider';
    setBelgeModalYukleniyor(true);
    setBelgeModalKayit({ ...kayit, kayitTipi });
    try {
      const { data, error } = await supabase
        .from('finans_evraklari')
        .select('*')
        .eq('proje_id', seciliProje.id)
        .eq('kayit_tipi', kayitTipi)
        .eq('kayit_id', kayit.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setFinansEvraklari((prev) => [
        ...prev.filter((e) => !(e.kayit_tipi === kayitTipi && Number(e.kayit_id) === Number(kayit.id))),
        ...(data || [])
      ]);
    } catch (error) {
      setHata('Belgeler yüklenemedi: ' + error.message);
    } finally {
      setBelgeModalYukleniyor(false);
    }
  }

  async function belgeGoruntule(evrak) {
    try {
      const { data, error } = await supabase.storage.from('finans-evraklari').createSignedUrl(evrak.dosya_yolu, 60 * 10);
      if (error) throw error;
      if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setHata('Belge açılamadı: ' + error.message);
    }
  }

  async function belgeSil(evrak) {
    if (!window.confirm(`"${evrak.dosya_adi}" belgesini silmek istediğinize emin misiniz?`)) return;
    try {
      const { error: storageError } = await supabase.storage.from('finans-evraklari').remove([evrak.dosya_yolu]);
      if (storageError) throw storageError;
      const { error: dbError } = await supabase.from('finans_evraklari').delete().eq('id', evrak.id).eq('proje_id', seciliProje.id);
      if (dbError) throw dbError;
      setFinansEvraklari((prev) => prev.filter((e) => e.id !== evrak.id));
      setMesaj('Belge silindi.');
      setHata('');
    } catch (error) {
      setHata('Belge silinemedi: ' + error.message);
    }
  }

  async function finansEvraklariniYukle(kayitTipi, kayitId, dosyalar) {
    if (!dosyalar?.length) return;
    const izinliTipler = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    for (const dosya of dosyalar) {
      if (dosya.size > 10 * 1024 * 1024) throw new Error(`"${dosya.name}" 10 MB sınırını aşıyor.`);
      if (!izinliTipler.includes(dosya.type)) throw new Error(`"${dosya.name}" desteklenmeyen dosya türü. PDF, JPG, PNG veya WEBP yükleyin.`);
    }
    const { data: userData } = await supabase.auth.getUser();
    for (const dosya of dosyalar) {
      const temizAd = guvenliDosyaAdi(dosya.name);
      const dosyaYolu = `${seciliProje.id}/${kayitTipi}/${kayitId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${temizAd}`;
      const { error: uploadError } = await supabase.storage.from('finans-evraklari').upload(dosyaYolu, dosya, { upsert: false, contentType: dosya.type || undefined });
      if (uploadError) throw uploadError;
      const { error: insertError } = await supabase.from('finans_evraklari').insert([{
        proje_id: seciliProje.id,
        kayit_tipi: kayitTipi,
        kayit_id: kayitId,
        dosya_adi: dosya.name,
        dosya_yolu: dosyaYolu,
        mime_type: dosya.type || null,
        dosya_boyutu: dosya.size,
        yukleyen_id: userData?.user?.id || null
      }]);
      if (insertError) {
        await supabase.storage.from('finans-evraklari').remove([dosyaYolu]);
        throw insertError;
      }
    }
  }

  // EVRAK MERKEZİ
  function evrakKayitBilgisi(evrak) {
    const liste = evrak.kayit_tipi === 'gelir' ? gelirler : harcamalar;
    const kayit = liste.find((x) => Number(x.id) === Number(evrak.kayit_id));
    if (!kayit) return { oge: 'Kayıt bulunamadı', tarih: '', tutar: 0, kategori: '-' };
    return {
      oge: kayit.oge || kayit.aciklama || '-',
      tarih: kayit.tarih || '',
      tutar: Number(kayit.tutar || 0),
      kategori: kayit.kategori || '-'
    };
  }

  function evraklariFiltrele() {
    const arama = evrakArama.trim().toLocaleLowerCase('tr-TR');
    return finansEvraklari.filter((evrak) => {
      if (evrakTipFiltre !== 'tumu' && evrak.kayit_tipi !== evrakTipFiltre) return false;
      const bilgi = evrakKayitBilgisi(evrak);
      const metin = `${evrak.dosya_adi || ''} ${bilgi.oge || ''} ${bilgi.kategori || ''}`.toLocaleLowerCase('tr-TR');
      if (arama && !metin.includes(arama)) return false;
      return true;
    }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  async function evrakMerkeziniYenile() {
    if (!seciliProje) return;
    setBelgeModalYukleniyor(true);
    try {
      const { data, error } = await supabase
        .from('finans_evraklari')
        .select('*')
        .eq('proje_id', seciliProje.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setFinansEvraklari(data || []);
      setMesaj('Evrak listesi yenilendi.');
      setHata('');
    } catch (error) {
      setHata('Evraklar yenilenemedi: ' + error.message);
    } finally {
      setBelgeModalYukleniyor(false);
    }
  }

  // GELİR / GİDER KAYDET / GÜNCELLE
  async function kaydet(event) {
    event.preventDefault();
    if (!seciliProje) return setHata('Önce bir proje seçmelisiniz.');
    const tutar = Number(form.tutar);
    if (!form.tarih || !form.oge.trim() || !form.kategori.trim()) return setHata('Tarih, Öğe/Firma/Kişi ve Kategori alanları zorunludur.');
    if (!Number.isFinite(tutar) || tutar <= 0) return setHata('Lütfen geçerli ve 0’dan büyük bir tutar girin.');

    setHata(''); setMesaj(''); setBelgeYukleniyor(true);
    const tablo = aktifSekme === 'gelirler' ? 'gelirler' : 'harcamalar';
    const kayitTipi = aktifSekme === 'gelirler' ? 'gelir' : 'gider';
    const kayit = {
      oge: form.oge.trim(), makbuz_no: form.makbuz_no.trim(), fatura_no: form.fatura_no.trim(),
      tarih: form.tarih, kategori: form.kategori.trim(), aciklama: form.aciklama.trim(), tutar,
      proje_id: seciliProje.id,
      ...(aktifSekme === 'giderler' ? { odeme_kaynagi: form.odeme_kaynagi || 'Kasa' } : {})
    };

    let error = null; let kayitId = duzenlenenKayitId;
    if (duzenlenenKayitId) {
      const sonuc = await supabase.from(tablo).update(kayit).eq('id', duzenlenenKayitId).eq('proje_id', seciliProje.id).select('id').single();
      error = sonuc.error; kayitId = sonuc.data?.id || duzenlenenKayitId;
    } else {
      const sonuc = await supabase.from(tablo).insert([kayit]).select('id').single();
      error = sonuc.error; kayitId = sonuc.data?.id;
    }
    if (error) {
      console.error('Kayıt kaydetme/güncelleme hatası:', error);
      setHata('Kayıt kaydedilemedi: ' + error.message); setBelgeYukleniyor(false); return;
    }

    try {
      await finansEvraklariniYukle(kayitTipi, kayitId, belgeDosyalari);
    } catch (error) {
      console.error('Belge yükleme hatası:', error);
      setHata(`Finans kaydı kaydedildi ancak belge yüklenemedi: ${error.message}`);
      setMesaj('Finans kaydı kaydedildi.'); setBelgeYukleniyor(false); setBelgeDosyalari([]); await verileriGetir(); return;
    }

    setForm({ ...formBaslangic, tarih: bugununTarihi() }); setBelgeDosyalari([]); setDuzenlenenKayitId(null);
    setMesaj(duzenlenenKayitId ? 'Kayıt ve belgeler başarıyla güncellendi.' : 'Kayıt ve belgeler başarıyla eklendi.');
    setBelgeYukleniyor(false); await verileriGetir();
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
    setBelgeDosyalari([]);
    setForm({ ...formBaslangic, tarih: bugununTarihi() });
    setMesaj('Düzenleme iptal edildi.');
    setHata('');
  }

  // KAYIT SİL
  async function sil(id) {
    if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;

    const tablo = aktifSekme === 'gelirler' ? 'gelirler' : 'harcamalar';
    const kayitTipi = aktifSekme === 'gelirler' ? 'gelir' : 'gider';
    const { data: bagliEvraklar } = await supabase.from('finans_evraklari').select('id, dosya_yolu').eq('proje_id', seciliProje.id).eq('kayit_tipi', kayitTipi).eq('kayit_id', id);
    if (bagliEvraklar?.length) {
      const yollar = bagliEvraklar.map((e) => e.dosya_yolu).filter(Boolean);
      if (yollar.length) {
        const { error: storageError } = await supabase.storage.from('finans-evraklari').remove(yollar);
        if (storageError) { setHata('Kayıt silinmedi. Bağlı belgeler silinemedi: ' + storageError.message); return; }
      }
      const { error: evrakError } = await supabase.from('finans_evraklari').delete().eq('proje_id', seciliProje.id).eq('kayit_tipi', kayitTipi).eq('kayit_id', id);
      if (evrakError) { setHata('Bağlı belgeler silinemedi: ' + evrakError.message); return; }
    }

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

  const filtrelenmisListe = aktifListe.filter((item) => {
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

  const gorunenListe = siraliListeOlustur(filtrelenmisListe);
  const toplamSayfa = Math.max(1, Math.ceil(gorunenListe.length / SAYFA_BASI_KAYIT));
  const baslangicIndex = (listeSayfasi - 1) * SAYFA_BASI_KAYIT;
  const sayfaliListe = gorunenListe.slice(baslangicIndex, baslangicIndex + SAYFA_BASI_KAYIT);

  useEffect(() => {
    setListeSayfasi(1);
  }, [seciliProje?.id, aktifSekme, filtreKategori, filtreAciklama, filtreBaslangic, filtreBitis, siralaAlan, siralaYon]);

  useEffect(() => {
    if (listeSayfasi > toplamSayfa) setListeSayfasi(toplamSayfa);
  }, [listeSayfasi, toplamSayfa]);

  const kategoriSecenekleri =
    aktifSekme === 'gelirler'
      ? ['Hakediş', 'Daire Satışı', 'Kapora', 'Kira', 'Diğer']
      : [
          'Kaba İnşaat Malzeme',
          'Kaba İnşaat İşçilik',
          'İnce İşçilik Malzeme',
          'İnce İşçilik',
          'Elektrik',
          'Mekanik',
          'Harita',
          'Proje / Mühendislik',
          'Hafriyat',
          'Nakliye',
          'Asansör',
          'İzolasyon',
          'Çatı',
          'Peyzaj',
          'Şantiye Giderleri',
          'Belediye / Ruhsat / Harç',
          'Vergi / SGK',
          'Hukuk / Noter',
          'Sigorta',
          'Finansman',
          'Pazarlama / Reklam',
          'Diğer'
        ];

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

  // BU AY VADESİ GELEN ALACAK / BORÇ ÖZETİ
  // Sadece vadesi bu ay olan ve henüz Ödendi / İptal durumuna geçmemiş kayıtlar dahil edilir.
  const buAyAlacaklar = alacakBorclar.filter((item) => {
    if (!item.vade_tarihi) return false;
    if (item.tur !== 'Alacak') return false;
    if (item.durum === 'Ödendi' || item.durum === 'İptal') return false;

    const d = new Date(`${item.vade_tarihi}T00:00:00`);

    return (
      d.getFullYear() === buAyYil &&
      d.getMonth() + 1 === buAyNo
    );
  });

  const buAyBorclar = alacakBorclar.filter((item) => {
    if (!item.vade_tarihi) return false;
    if (item.tur !== 'Borç') return false;
    if (item.durum === 'Ödendi' || item.durum === 'İptal') return false;

    const d = new Date(`${item.vade_tarihi}T00:00:00`);

    return (
      d.getFullYear() === buAyYil &&
      d.getMonth() + 1 === buAyNo
    );
  });

  const buAyAlinacak = buAyAlacaklar.reduce(
    (toplam, item) => toplam + Number(item.tutar || 0),
    0
  );

  const buAyOdenecek = buAyBorclar.reduce(
    (toplam, item) => toplam + Number(item.tutar || 0),
    0
  );

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

  // EXCEL'DEN TOPLU AKTARIM
  const excelBaslikEslesmeleri = {
    tarih: ['tarih', 'işlem tarihi', 'islem tarihi', 'date'],
    oge: ['öğe / firma / kişi', 'öğe', 'oge / firma / kisi', 'oge', 'firma', 'firma adı', 'firma adi', 'kişi', 'kisi', 'taraf'],
    makbuz_no: ['makbuz no', 'makbuz numarası', 'makbuz numarasi', 'makbuz'],
    fatura_no: ['fatura no', 'fatura numarası', 'fatura numarasi', 'fatura'],
    kategori: ['kategori', 'gider kategorisi', 'gelir kategorisi'],
    aciklama: ['açıklama', 'aciklama', 'not', 'notlar', 'detay'],
    tutar: ['tutar', 'tutar (₺)', 'tutar tl', 'bedel', 'miktar', 'amount', 'fiyat'],
    odeme_kaynagi: ['ödeme kaynağı', 'odeme kaynagi', 'ödeyen kim', 'odeyen kim', 'ödeme kaynağı / ödeyen', 'kaynak']
  };

  function excelBaslikNormalize(deger) {
    return String(deger ?? '')
      .trim()
      .toLocaleLowerCase('tr-TR')
      .replace(/\u0307/g, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ');
  }

  function excelTarihCevir(deger) {
    if (deger === null || deger === undefined || deger === '') return '';
    if (deger instanceof Date && !Number.isNaN(deger.getTime())) {
      return `${deger.getFullYear()}-${String(deger.getMonth()+1).padStart(2,'0')}-${String(deger.getDate()).padStart(2,'0')}`;
    }
    if (typeof deger === 'number' && deger > 20000 && deger < 60000) {
      const d = XLSX.SSF.parse_date_code(deger);
      if (d) return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
    }
    const metin = String(deger).trim();
    const iso = metin.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (iso) return `${iso[1]}-${String(iso[2]).padStart(2,'0')}-${String(iso[3]).padStart(2,'0')}`;
    const tr = metin.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (tr) return `${tr[3]}-${String(tr[2]).padStart(2,'0')}-${String(tr[1]).padStart(2,'0')}`;
    return '';
  }

  function excelTutarCevir(deger) {
    if (typeof deger === 'number') return deger;
    let metin = String(deger ?? '').trim().replace(/₺|TL|TRY/gi, '').replace(/\s/g, '');
    if (!metin) return NaN;
    if (metin.includes(',') && metin.includes('.')) {
      if (metin.lastIndexOf(',') > metin.lastIndexOf('.')) metin = metin.replace(/\./g, '').replace(',', '.');
      else metin = metin.replace(/,/g, '');
    } else if (metin.includes(',')) {
      metin = metin.replace(',', '.');
    }
    return Number(metin.replace(/[^0-9.-]/g, ''));
  }

  function excelSatirDegeri(satir, alan) {
    const anahtarlar = excelBaslikEslesmeleri[alan] || [];
    const bulunan = Object.keys(satir).find((baslik) => anahtarlar.includes(excelBaslikNormalize(baslik)));
    return bulunan ? satir[bulunan] : '';
  }

  async function excelDosyasiSecildi(event) {
    const dosya = event.target.files?.[0];
    if (!dosya) return;
    setHata('');
    setMesaj('');
    setExcelAktarimSonuc(null);
    setExcelAktarimDosyaAdi(dosya.name);
    setExcelAktarimYukleniyor(true);

    try {
      const buffer = await dosya.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const hamSatirlar = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: true });
      if (!hamSatirlar.length) throw new Error('Excel dosyasında veri bulunan satır bulunamadı.');

      const tip = aktifSekme === 'giderler' ? 'Gider' : 'Gelir';
      const mevcut = tip === 'Gider' ? harcamalar : gelirler;
      const mevcutAnahtarlar = new Set(mevcut.map((i) => `${i.tarih}|${i.oge}|${Number(i.tutar || 0).toFixed(2)}|${i.fatura_no || ''}`));
      const hatalar = [];
      const kayitlar = [];
      const tekrarlar = [];

      hamSatirlar.forEach((satir, index) => {
        const satirNo = index + 2;
        const tarih = excelTarihCevir(excelSatirDegeri(satir, 'tarih'));
        const oge = String(excelSatirDegeri(satir, 'oge') ?? '').trim();
        const kategori = String(excelSatirDegeri(satir, 'kategori') ?? '').trim();
        const aciklama = String(excelSatirDegeri(satir, 'aciklama') ?? '').trim();
        const tutar = excelTutarCevir(excelSatirDegeri(satir, 'tutar'));
        const makbuz_no = String(excelSatirDegeri(satir, 'makbuz_no') ?? '').trim();
        const fatura_no = String(excelSatirDegeri(satir, 'fatura_no') ?? '').trim();
        const odeme_kaynagi = String(excelSatirDegeri(satir, 'odeme_kaynagi') ?? '').trim() || 'Kasa';

        if (!tarih || !/^\d{4}-\d{2}-\d{2}$/.test(tarih)) { hatalar.push(`Satır ${satirNo}: Geçerli tarih bulunamadı.`); return; }
        if (!oge) { hatalar.push(`Satır ${satirNo}: Öğe / Firma / Kişi boş.`); return; }
        if (!kategori) { hatalar.push(`Satır ${satirNo}: Kategori boş.`); return; }
        if (!Number.isFinite(tutar) || tutar <= 0) { hatalar.push(`Satır ${satirNo}: Geçerli ve 0'dan büyük tutar bulunamadı.`); return; }

        const anahtar = `${tarih}|${oge}|${Number(tutar).toFixed(2)}|${fatura_no}`;
        if (mevcutAnahtarlar.has(anahtar)) { tekrarlar.push(satirNo); return; }
        if (kayitlar.some((i) => `${i.tarih}|${i.oge}|${Number(i.tutar).toFixed(2)}|${i.fatura_no}` === anahtar)) { tekrarlar.push(satirNo); return; }

        kayitlar.push({
          proje_id: seciliProje.id,
          oge,
          makbuz_no,
          fatura_no,
          tarih,
          kategori,
          aciklama,
          tutar,
          ...(tip === 'Gider' ? { odeme_kaynagi } : {})
        });
      });

      setExcelAktarimSatirlari(kayitlar);
      setExcelAktarimHatalari(hatalar);
      setExcelAktarimSonuc({ tip, toplam: hamSatirlar.length, aktarilabilir: kayitlar.length, tekrar: tekrarlar.length });
    } catch (error) {
      setExcelAktarimSatirlari([]);
      setExcelAktarimHatalari([error.message || 'Excel okunamadı.']);
      setExcelAktarimSonuc(null);
    } finally {
      setExcelAktarimYukleniyor(false);
      event.target.value = '';
    }
  }

  async function excelTopluAktar() {
    if (!seciliProje || !excelAktarimSatirlari.length) return;
    setExcelAktarimYukleniyor(true);
    setHata('');
    setMesaj('');
    try {
      const tablo = excelAktarimSonuc?.tip === 'Gelir' ? 'gelirler' : 'harcamalar';
      const batchSize = 200;
      for (let i = 0; i < excelAktarimSatirlari.length; i += batchSize) {
        const parca = excelAktarimSatirlari.slice(i, i + batchSize);
        const { error } = await supabase.from(tablo).insert(parca);
        if (error) throw error;
      }
      const adet = excelAktarimSatirlari.length;
      setMesaj(`${adet} ${excelAktarimSonuc?.tip?.toLocaleLowerCase('tr-TR')} kaydı Excel'den başarıyla aktarıldı.`);
      setExcelAktarimSatirlari([]);
      setExcelAktarimHatalari([]);
      setExcelAktarimSonuc(null);
      setExcelAktarimDosyaAdi('');
      setExcelAktarimAcik(false);
      await verileriGetir();
    } catch (error) {
      setHata('Excel aktarımı sırasında hata oluştu: ' + error.message);
    } finally {
      setExcelAktarimYukleniyor(false);
    }
  }

  function excelAktarimPenceresiniAc() {
    if (!seciliProje) return setHata('Önce bir proje seçmelisiniz.');
    if (!['gelirler', 'giderler'].includes(aktifSekme)) return setHata('Excel toplu aktarımı için Gelir veya Gider sekmesini seçin.');
    setExcelAktarimAcik(true);
    setExcelAktarimSatirlari([]);
    setExcelAktarimHatalari([]);
    setExcelAktarimSonuc(null);
    setExcelAktarimDosyaAdi('');
  }

  function excelAktarimKapat() {
    if (excelAktarimYukleniyor) return;
    setExcelAktarimAcik(false);
    setExcelAktarimSatirlari([]);
    setExcelAktarimHatalari([]);
    setExcelAktarimSonuc(null);
    setExcelAktarimDosyaAdi('');
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

  // PDF FONTLARI: Türkçe karakterler için DejaVu Sans kullanılır.
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
      fetch('/fonts/DejaVuSans.ttf'),
      fetch('/fonts/DejaVuSans-Bold.ttf')
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

      // Türkçe karakter desteği için DejaVu Sans fontlarını PDF'e göm.
      doc.addFileToVFS('DejaVuSans.ttf', fontlar.regular);
      doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
      doc.addFileToVFS('DejaVuSans-Bold.ttf', fontlar.bold);
      doc.addFont('DejaVuSans-Bold.ttf', 'DejaVuSans', 'bold');
      doc.setFont('DejaVuSans', 'normal');

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

      doc.setFont('DejaVuSans', 'bold');
      doc.setFontSize(16);
      doc.text(seciliProje.ad || 'Proje', 68, 14);

      doc.setFont('DejaVuSans', 'normal');
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
          font: 'DejaVuSans',
          fontStyle: 'normal',
          fontSize: 8,
          cellPadding: 2.5,
          overflow: 'linebreak',
          valign: 'middle'
        },
        headStyles: {
          font: 'DejaVuSans',
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

      doc.setFont('DejaVuSans', 'bold');
      doc.setFontSize(11);
      doc.text(
        `Toplam: ${toplam.toLocaleString('tr-TR')} TL | Kayıt: ${gorunenListe.length}`,
        14,
        sonY
      );

      doc.setFont('DejaVuSans', 'normal');
      doc.setFontSize(8);
      doc.text(`Oluşturulma: ${bugununTarihi()}`, 14, sonY + 6);

      doc.save(`${dosyaAdiOlustur()}_${sekmeAdi}.pdf`);
      setMesaj(`${gorunenListe.length} kayıt PDF'e aktarıldı.`);
      setHata('');
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      setHata(
        'PDF oluşturulamadı. DejaVu Sans font dosyalarının public/fonts klasöründe olduğundan emin olun.'
      );
      setMesaj('');
    }
  }


  // PROJE BÜTÇESİ ÖZET HESAPLARI
  const projeToplamButce = projeButceleri.reduce((t, i) => t + Number(i.butce_tutari || 0), 0);
  const projeGerceklesenMaliyet = projeMaliyetleri.reduce((t, i) => t + Number(i.tutar || 0), 0);
  const projeKalanButce = projeToplamButce - projeGerceklesenMaliyet;
  const projeGerceklesmeYuzdesi = projeToplamButce > 0
    ? (projeGerceklesenMaliyet / projeToplamButce) * 100
    : 0;
  const projeBuAyGider = projeMaliyetleri.reduce((toplam, item) => {
    if (!item.tarih) return toplam;
    const d = new Date(`${item.tarih}T00:00:00`);
    return d.getFullYear() === buAyYil && d.getMonth() + 1 === buAyNo
      ? toplam + Number(item.tutar || 0)
      : toplam;
  }, 0);
  const projeBuAyOdenecek = alacakBorclar.reduce((toplam, item) => {
    if (item.tur !== 'Borç' || !item.vade_tarihi || item.durum === 'Ödendi' || item.durum === 'İptal') return toplam;
    const d = new Date(`${item.vade_tarihi}T00:00:00`);
    return d.getFullYear() === buAyYil && d.getMonth() + 1 === buAyNo
      ? toplam + Number(item.tutar || 0)
      : toplam;
  }, 0);
  const butceAsimSayisi = projeButceleri.filter((b) => {
    const but = Number(b.butce_tutari || 0);
    const ger = projeMaliyetleri
      .filter((m) => m.kategori === b.kategori)
      .reduce((t, m) => t + Number(m.tutar || 0), 0);
    return but > 0 && ger > but;
  }).length;

  if (!isClient) {    return (
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

        .mobil-menu-butonu {
          display: none;
        }

        .mobil-menu-overlay {
          display: none;
        }

        .mobil-kart-liste {
          display: none;
        }

        .mobil-kart {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 12px;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
          overflow: hidden;
        }

        .mobil-kart-ust {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }

        .mobil-kart-oge {
          color: #0f172a;
          font-size: 15px;
          font-weight: 800;
          line-height: 1.3;
          word-break: break-word;
        }

        .mobil-kart-tarih {
          margin-top: 5px;
          color: #64748b;
          font-size: 12px;
        }

        .mobil-kart-tutar {
          flex: 0 0 auto;
          font-size: 16px;
          font-weight: 800;
          white-space: nowrap;
        }

        .mobil-kart-detay {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0 14px;
        }

        .mobil-kart-alan {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 10px 0;
          border-bottom: 1px solid #f8fafc;
        }

        .mobil-kart-etiket {
          color: #94a3b8;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .mobil-kart-deger {
          color: #334155;
          font-size: 13px;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }

        .mobil-kart-islem {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .mobil-kart-islem button {
          flex: 1;
          min-height: 38px;
        }

        @media (max-width: 768px) {
          .santiye-app {
            display: block !important;
            width: 100%;
            min-width: 0;
          }

          .santiye-sidebar {
            position: fixed !important;
            z-index: 1000 !important;
            top: 0;
            left: 0;
            bottom: 0;
            width: min(300px, 86vw) !important;
            height: 100vh;
            overflow-y: auto;
            transform: translateX(-105%);
            transition: transform 0.22s ease;
            box-shadow: 8px 0 30px rgba(15, 23, 42, 0.25) !important;
          }

          .santiye-sidebar.mobil-acik {
            transform: translateX(0);
          }

          .mobil-menu-overlay {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 999;
            background: rgba(15, 23, 42, 0.45);
          }

          .mobil-menu-butonu {
            display: flex;
            align-items: center;
            justify-content: center;
            position: fixed;
            top: 12px;
            left: 12px;
            z-index: 998;
            width: 42px;
            height: 42px;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            background: #fff;
            color: #0f172a;
            box-shadow: 0 3px 12px rgba(15, 23, 42, 0.12);
            font-size: 22px;
            cursor: pointer;
          }

          .santiye-main {
            width: 100% !important;
            max-width: none !important;
            padding: 68px 12px 24px !important;
            overflow-x: hidden !important;
          }

          .santiye-main table {
            min-width: 0 !important;
          }

          .desktop-table-wrap {
            display: none !important;
          }

          .mobil-kart-liste {
            display: block !important;
            width: 100%;
          }

          .santiye-tabs {
            gap: 8px !important;
            margin-bottom: 18px !important;
          }

          .santiye-tabs button {
            padding: 10px 13px !important;
            font-size: 13px !important;
          }
        }

        @media (max-width: 480px) {
          .santiye-main {
            padding-left: 10px !important;
            padding-right: 10px !important;
          }

          .mobil-kart {
            padding: 12px;
          }

          .mobil-kart-detay {
            grid-template-columns: 1fr;
          }

          .mobil-kart-alan[style*="grid-column"] {
            grid-column: auto !important;
          }
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
      {mobilMenuAcik && (
        <div className="mobil-menu-overlay" onClick={() => setMobilMenuAcik(false)}>
          <button type="button" aria-label="Menüyü kapat" />
        </div>
      )}
      <div
        className={`santiye-sidebar${mobilMenuAcik ? ' mobil-acik' : ''}`}
        style={{
          width: '300px',
          backgroundColor: '#0f172a',
          color: 'white',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          boxSizing: 'border-box',
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
          overflow: 'hidden',
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
            alt="Esmahan Yapı - Ana Sayfa"
            title="Ana Sayfaya Dön"
            onClick={() => {
              setAktifSekme('ozet');
              setHata('');
              setMesaj('');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
            style={{
              width: '82px',
              height: '38px',
              objectFit: 'contain',
              objectPosition: 'left center',
              flexShrink: 0,
              cursor: 'pointer'
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
                setMobilMenuAcik(false);
              }}
              style={{
                padding: '10px 12px',
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
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: '8px',
                minWidth: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                <span style={{ flexShrink: 0 }}>🏢</span>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.25 }}>
                  {p.ad}
                </span>
              </div>
              {kullaniciProfili?.rol === 'yonetici' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', paddingLeft: '28px', flexWrap: 'wrap' }} onClick={(event) => event.stopPropagation()}>
                  <span
                    title={`Proje sırası: ${p.sira_no || projeler.indexOf(p) + 1}`}
                    style={{
                      minWidth: '22px', height: '22px', padding: '0 5px', borderRadius: '6px',
                      background: seciliProje?.id === p.id ? 'rgba(255,255,255,0.16)' : '#1e293b',
                      color: seciliProje?.id === p.id ? '#fff' : '#94a3b8', fontSize: '11px', fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box'
                    }}
                  >{p.sira_no || projeler.indexOf(p) + 1}</span>
                  <button
                    type="button"
                    title="Yukarı taşı"
                    aria-label="Yukarı taşı"
                    onClick={() => projeSiraDegistir(p.id, 'yukari')}
                    disabled={projeler.indexOf(p) === 0}
                    style={{
                      width: '24px', height: '24px', borderRadius: '6px', border: '1px solid #334155',
                      background: projeler.indexOf(p) === 0 ? '#0f172a' : (seciliProje?.id === p.id ? 'rgba(255,255,255,0.10)' : '#172236'),
                      color: projeler.indexOf(p) === 0 ? '#475569' : '#cbd5e1', cursor: projeler.indexOf(p) === 0 ? 'default' : 'pointer',
                      fontSize: '12px', lineHeight: 1
                    }}
                  >↑</button>
                  <button
                    type="button"
                    title="Aşağı taşı"
                    aria-label="Aşağı taşı"
                    onClick={() => projeSiraDegistir(p.id, 'asagi')}
                    disabled={projeler.indexOf(p) === projeler.length - 1}
                    style={{
                      width: '24px', height: '24px', borderRadius: '6px', border: '1px solid #334155',
                      background: projeler.indexOf(p) === projeler.length - 1 ? '#0f172a' : (seciliProje?.id === p.id ? 'rgba(255,255,255,0.10)' : '#172236'),
                      color: projeler.indexOf(p) === projeler.length - 1 ? '#475569' : '#cbd5e1', cursor: projeler.indexOf(p) === projeler.length - 1 ? 'default' : 'pointer',
                      fontSize: '12px', lineHeight: 1
                    }}
                  >↓</button>
                  <button
                    type="button"
                    title="Proje adını düzenle"
                    aria-label="Proje adını düzenle"
                    onClick={() => projeDuzenlemeAc(p)}
                    style={{
                      width: '28px', height: '28px', borderRadius: '7px',
                      border: seciliProje?.id === p.id ? '1px solid rgba(255,255,255,0.35)' : '1px solid #334155',
                      background: seciliProje?.id === p.id ? 'rgba(255,255,255,0.12)' : '#172236',
                      color: seciliProje?.id === p.id ? '#fff' : '#94a3b8', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'
                    }}
                  >✏️</button>
                </div>
              )}
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

      {projeDuzenlemeAcik && projeDuzenlenen && (
        <div
          onClick={() => {
            if (!projeDuzenlemeYukleniyor) {
              setProjeDuzenlemeAcik(false);
              setProjeDuzenlenen(null);
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <form
            onSubmit={projeAdiGuncelle}
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '460px',
              background: '#fff',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 24px 60px rgba(15, 23, 42, 0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '19px' }}>✏️ Proje Düzenle</h3>
                <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '12px' }}>Proje adı değiştirildiğinde mevcut kayıtlar korunur.</p>
              </div>
              <button
                type="button"
                onClick={() => { setProjeDuzenlemeAcik(false); setProjeDuzenlenen(null); }}
                disabled={projeDuzenlemeYukleniyor}
                style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', color: '#475569', fontSize: '18px' }}
              >
                ×
              </button>
            </div>

            <label style={{ display: 'block', color: '#334155', fontSize: '13px', fontWeight: 600, marginBottom: '7px' }}>Proje Adı</label>
            <input
              autoFocus
              value={projeDuzenlemeAdi}
              onChange={(event) => setProjeDuzenlemeAdi(event.target.value)}
              placeholder="Proje adını yazın..."
              disabled={projeDuzenlemeYukleniyor}
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '9px', fontSize: '14px', outline: 'none', color: '#0f172a' }}
            />

            <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
              <button
                type="button"
                onClick={() => { setProjeDuzenlemeAcik(false); setProjeDuzenlenen(null); }}
                disabled={projeDuzenlemeYukleniyor}
                style={{ flex: 1, padding: '11px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', borderRadius: '9px', cursor: 'pointer', fontWeight: 600 }}
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={projeDuzenlemeYukleniyor}
                style={{ flex: 1, padding: '11px', border: 'none', background: '#2563eb', color: '#fff', borderRadius: '9px', cursor: projeDuzenlemeYukleniyor ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: projeDuzenlemeYukleniyor ? 0.7 : 1 }}
              >
                {projeDuzenlemeYukleniyor ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>
            </div>
          </form>
        </div>
      )}

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
        <button type="button" className="mobil-menu-butonu" aria-label="Menüyü aç" onClick={() => setMobilMenuAcik(true)}>
          ☰
        </button>
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
                  id: 'evraklar',
                  label: '📎 Evrak Merkezi',
                  color: '#0f766e'
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
                },
                {
                  id: 'maliyet',
                  label: '🏗️ Proje Maliyeti',
                  color: '#2563eb'
                },
                ...(kullaniciProfili?.rol === 'yonetici'
                  ? [{ id: 'kullanicilar', label: '⚙️ Kullanıcı Yönetimi', color: '#475569' }]
                  : [])
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setAktifSekme(s.id);
                    setFiltreKategori('');
                    setFiltreAciklama('');
                    setFiltreBaslangic('');
                    setFiltreBitis('');
                    setEvrakArama('');
                    setEvrakTipFiltre('tumu');
                    setEvrakTurFiltre('tumu');
                    setDuzenlenenKayitId(null);
                    setCariDuzenlenenId(null);
                    setCariForm({ ...cariFormBaslangic });
                    setHakedisDuzenlenenId(null);
                    setHakedisForm({ ...hakedisFormBaslangic, tarih: bugununTarihi() });
                    setButceDuzenlenenId(null);
                    setMaliyetDuzenlenenId(null);
                    setMaliyetForm({ kategori: 'Beton', butce_tutari: '', aciklama: '' });
                    setMaliyetKayitForm({ kategori: 'Beton', tutar: '', tarih: bugununTarihi(), cari_id: '', gider_id: '', aciklama: '' });
                    setForm({ ...formBaslangic, tarih: bugununTarihi() });
                    setFinansForm({ ...finansFormBaslangic, tarih: bugununTarihi() });
                    setMesaj('');
                    setHata('');
                    if (s.id === 'kullanicilar') {
                      kullanicilariGetir();
                    }
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

                  {/* BU AY ÖDENECEK / ALINACAKLAR */}
                  <div style={{ marginTop: '18px' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ color: '#0f172a', fontSize: '14px', fontWeight: '800' }}>💳 Bu Ay Ödenecek / Alınacaklar</div>
                      <div style={{ marginTop: '4px', color: '#64748b', fontSize: '12px' }}>Vadesi bu ay olan, henüz tamamlanmamış alacak ve borçlar</div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '14px'
                      }}
                    >
                      <div style={{ padding: '16px', borderRadius: '12px', background: '#f0fdf4', border: '1px solid #dcfce7' }}>
                        <div style={{ color: '#166534', fontSize: '12px', fontWeight: '700' }}>🟢 BU AY ALINACAK</div>
                        <div style={{ color: '#059669', fontSize: '22px', fontWeight: '800', marginTop: '6px' }}>
                          {dashboardFormat(buAyAlinacak)}
                        </div>
                        <div style={{ marginTop: '5px', color: '#64748b', fontSize: '12px' }}>
                          {buAyAlacaklar.length} kayıt
                        </div>
                      </div>

                      <div style={{ padding: '16px', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fee2e2' }}>
                        <div style={{ color: '#991b1b', fontSize: '12px', fontWeight: '700' }}>🔴 BU AY ÖDENECEK</div>
                        <div style={{ color: '#dc2626', fontSize: '22px', fontWeight: '800', marginTop: '6px' }}>
                          {dashboardFormat(buAyOdenecek)}
                        </div>
                        <div style={{ marginTop: '5px', color: '#64748b', fontSize: '12px' }}>
                          {buAyBorclar.length} kayıt
                        </div>
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
            ) : aktifSekme === 'kullanicilar' ? (
              /* KULLANICI YÖNETİMİ */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15,23,42,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ margin: 0, color: '#0f172a', fontSize: '19px' }}>⚙️ Kullanıcı Yönetimi</h3>
                      <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '13px' }}>Kullanıcı rolleri ve proje erişimlerini yönetin.</p>
                    </div>
                    <button type="button" onClick={kullanicilariGetir} style={{ padding: '9px 14px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>↻ Yenile</button>
                  </div>

                  <div style={{ padding: '12px 14px', marginBottom: '18px', borderRadius: '10px', background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: '13px' }}>
                    Yeni kişinin önce <b>Supabase → Authentication → Users</b> bölümünde hesabı oluşturulmuş olmalıdır. Buradan hesabın profilini ve proje yetkilerini tanımlıyoruz.
                  </div>

                  <form onSubmit={kullaniciProfiliOlustur} style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1.2, minWidth: '220px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>E-POSTA</label>
                      <input type="email" required value={kullaniciForm.email} disabled={!!seciliKullaniciId} onChange={(e) => setKullaniciForm({ ...kullaniciForm, email: e.target.value })} placeholder="Auth kullanıcısının e-posta adresi" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', background: seciliKullaniciId ? '#f1f5f9' : '#fff' }} />
                    </div>
                    <div style={{ flex: 1.2, minWidth: '200px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>AD SOYAD</label>
                      <input required value={kullaniciForm.ad_soyad} onChange={(e) => setKullaniciForm({ ...kullaniciForm, ad_soyad: e.target.value })} placeholder="Örn: Hatice Feyza Danışman" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: '170px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>ROL</label>
                      <select value={kullaniciForm.rol} onChange={(e) => setKullaniciForm({ ...kullaniciForm, rol: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff' }}>
                        <option value="yonetici">Yönetici</option>
                        <option value="proje_yoneticisi">Proje Yöneticisi</option>
                        <option value="muhasebe">Muhasebe</option>
                        <option value="santiye">Şantiye</option>
                        <option value="personel">Personel</option>
                      </select>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '100px', fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                      <input type="checkbox" checked={kullaniciForm.aktif} onChange={(e) => setKullaniciForm({ ...kullaniciForm, aktif: e.target.checked })} /> Aktif
                    </label>
                    <div style={{ width: '100%', display: 'flex', gap: '8px' }}>
                      <button type="submit" style={{ flex: 1, padding: '11px', background: seciliKullaniciId ? '#2563eb' : '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                        {seciliKullaniciId ? '✓ Kullanıcıyı Güncelle' : '+ Kullanıcı Profilini Ekle'}
                      </button>
                      {seciliKullaniciId && <button type="button" onClick={kullaniciDuzenlemeyiIptalEt} style={{ padding: '11px 18px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>İptal</button>}
                    </div>
                  </form>

                  <div style={{ marginTop: '24px', overflowX: 'auto' }}>
                    {kullaniciYukleniyor ? (
                      <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Kullanıcılar yükleniyor...</div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '820px' }}>
                        <thead><tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                          <th style={{ padding: '12px' }}>Kullanıcı</th><th style={{ padding: '12px' }}>Rol</th><th style={{ padding: '12px' }}>Durum</th><th style={{ padding: '12px' }}>Proje Yetkileri</th><th style={{ padding: '12px', textAlign: 'center' }}>İşlem</th>
                        </tr></thead>
                        <tbody>
                          {kullanicilar.map((k) => {
                            const yetkiliProjeler = kullaniciYetkileri.filter((y) => y.kullanici_id === k.id).map((y) => projeler.find((p) => Number(p.id) === Number(y.proje_id))?.ad).filter(Boolean);
                            return (
                              <tr key={k.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '13px 12px' }}><div style={{ fontWeight: '700', color: '#0f172a' }}>{k.ad_soyad || 'İsimsiz Kullanıcı'}</div><div style={{ color: '#64748b', fontSize: '12px', marginTop: '3px' }}>{k.email || '-'}</div></td>
                                <td style={{ padding: '13px 12px' }}><span style={{ padding: '5px 9px', borderRadius: '6px', background: '#eef2ff', color: '#4338ca', fontSize: '12px', fontWeight: '700' }}>{{ yonetici: 'Yönetici', proje_yoneticisi: 'Proje Yöneticisi', muhasebe: 'Muhasebe', santiye: 'Şantiye', personel: 'Personel' }[k.rol] || k.rol}</span></td>
                                <td style={{ padding: '13px 12px', color: k.aktif ? '#166534' : '#991b1b', fontWeight: '700', fontSize: '12px' }}>{k.aktif ? '● Aktif' : '● Pasif'}</td>
                                <td style={{ padding: '13px 12px', color: '#475569', fontSize: '13px' }}>{k.rol === 'yonetici' ? 'Tüm projeler' : (yetkiliProjeler.length ? yetkiliProjeler.join(', ') : 'Proje atanmadı')}</td>
                                <td style={{ padding: '13px 12px', textAlign: 'center' }}><button type="button" onClick={() => kullaniciDuzenle(k)} style={{ padding: '7px 11px', background: '#fef3c7', color: '#92400e', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Düzenle</button></td>
                              </tr>
                            );
                          })}
                          {kullanicilar.length === 0 && <tr><td colSpan={5} style={{ padding: '35px', textAlign: 'center', color: '#94a3b8' }}>Kullanıcı profili bulunamadı.</td></tr>}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {seciliKullaniciId && (
                  <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15,23,42,0.04)' }}>
                    <h3 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '18px' }}>🏗️ Proje Erişimleri</h3>
                    <p style={{ margin: '0 0 18px', color: '#64748b', fontSize: '13px' }}>Bu kullanıcının erişebileceği projeleri seçin.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                      {projeler.map((p) => {
                        const secili = seciliKullaniciProjeIds.includes(Number(p.id));
                        return <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', border: secili ? '1px solid #93c5fd' : '1px solid #e2e8f0', background: secili ? '#eff6ff' : '#fff', borderRadius: '10px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={secili} onChange={() => kullaniciProjeYetkisiDegistir(p.id)} />
                          <span style={{ fontWeight: '600', color: '#334155' }}>{p.ad}</span>
                        </label>;
                      })}
                    </div>
                    <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={kullaniciKaydet} style={{ padding: '11px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>✓ Kullanıcı ve Yetkileri Kaydet</button>
                    </div>
                  </div>
                )}
              </div>
            ) : aktifSekme === 'evraklar' ? (
              /* EVRAK MERKEZİ */
              <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15,23,42,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '20px' }}>📎 Evrak Merkezi</h3>
                    <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '13px' }}>Bu projedeki gelir ve giderlere bağlı tüm fatura, dekont ve makbuzları tek yerden yönetin.</p>
                  </div>
                  <button type="button" onClick={evrakMerkeziniYenile} disabled={belgeModalYukleniyor} style={{ padding: '9px 14px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '8px', fontWeight: '700', cursor: belgeModalYukleniyor ? 'not-allowed' : 'pointer', color: '#334155' }}>
                    {belgeModalYukleniyor ? '⏳ Yenileniyor...' : '↻ Yenile'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 2fr) minmax(160px, 1fr)', gap: '10px', marginBottom: '18px' }}>
                  <input value={evrakArama} onChange={(e) => setEvrakArama(e.target.value)} placeholder="🔎 Dosya adı, firma/kişi veya kategori ara..." style={{ width: '100%', padding: '11px 13px', border: '1px solid #cbd5e1', borderRadius: '9px', background: '#fff' }} />
                  <select value={evrakTipFiltre} onChange={(e) => setEvrakTipFiltre(e.target.value)} style={{ width: '100%', padding: '11px 13px', border: '1px solid #cbd5e1', borderRadius: '9px', background: '#fff' }}>
                    <option value="tumu">Tüm Kayıtlar</option>
                    <option value="gelir">📈 Sadece Gelirler</option>
                    <option value="gider">📉 Sadece Giderler</option>
                  </select>
                </div>

                {(() => {
                  const liste = evraklariFiltrele();
                  const toplamBoyut = liste.reduce((t, e) => t + Number(e.dosya_boyutu || 0), 0);
                  const gelirBelge = finansEvraklari.filter((e) => e.kayit_tipi === 'gelir').length;
                  const giderBelge = finansEvraklari.filter((e) => e.kayit_tipi === 'gider').length;
                  return (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '18px' }}>
                        <div style={{ padding: '14px', borderRadius: '10px', background: '#f0fdfa', border: '1px solid #ccfbf1' }}><div style={{ fontSize: '11px', color: '#0f766e', fontWeight: '800' }}>TOPLAM EVRAK</div><div style={{ fontSize: '22px', fontWeight: '800', color: '#115e59', marginTop: '4px' }}>{finansEvraklari.length}</div></div>
                        <div style={{ padding: '14px', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #dcfce7' }}><div style={{ fontSize: '11px', color: '#166534', fontWeight: '800' }}>GELİR EVRAKI</div><div style={{ fontSize: '22px', fontWeight: '800', color: '#15803d', marginTop: '4px' }}>{gelirBelge}</div></div>
                        <div style={{ padding: '14px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fee2e2' }}><div style={{ fontSize: '11px', color: '#991b1b', fontWeight: '800' }}>GİDER EVRAKI</div><div style={{ fontSize: '22px', fontWeight: '800', color: '#dc2626', marginTop: '4px' }}>{giderBelge}</div></div>
                        <div style={{ padding: '14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}><div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800' }}>SEÇİLİ LİSTE BOYUTU</div><div style={{ fontSize: '18px', fontWeight: '800', color: '#334155', marginTop: '6px' }}>{(toplamBoyut / 1024 / 1024).toFixed(2)} MB</div></div>
                      </div>

                      {liste.length === 0 ? (
                        <div style={{ padding: '45px 20px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                          <div style={{ fontSize: '34px', marginBottom: '8px' }}>📂</div>
                          <div style={{ fontWeight: '700', color: '#64748b' }}>{finansEvraklari.length === 0 ? 'Bu projede henüz evrak bulunmuyor.' : 'Arama kriterlerine uygun evrak bulunamadı.'}</div>
                        </div>
                      ) : (
                        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px', fontSize: '13px' }}>
                            <thead>
                              <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                                <th style={{ padding: '12px' }}>Evrak</th>
                                <th style={{ padding: '12px' }}>Tür</th>
                                <th style={{ padding: '12px' }}>Kayıt</th>
                                <th style={{ padding: '12px' }}>Tarih</th>
                                <th style={{ padding: '12px', textAlign: 'right' }}>Tutar</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>İşlem</th>
                              </tr>
                            </thead>
                            <tbody>
                              {liste.map((evrak) => {
                                const bilgi = evrakKayitBilgisi(evrak);
                                return (
                                  <tr key={evrak.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px' }}>
                                      <div style={{ fontWeight: '700', color: '#334155', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📄 {evrak.dosya_adi}</div>
                                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>{evrak.mime_type || 'Belge'} • {evrak.dosya_boyutu ? `${(evrak.dosya_boyutu / 1024 / 1024).toFixed(2)} MB` : '-'}</div>
                                    </td>
                                    <td style={{ padding: '12px' }}><span style={{ padding: '5px 8px', borderRadius: '6px', background: evrak.kayit_tipi === 'gelir' ? '#dcfce7' : '#fee2e2', color: evrak.kayit_tipi === 'gelir' ? '#166534' : '#991b1b', fontWeight: '800', fontSize: '11px' }}>{evrak.kayit_tipi === 'gelir' ? 'GELİR' : 'GİDER'}</span></td>
                                    <td style={{ padding: '12px' }}><div style={{ fontWeight: '700', color: '#334155' }}>{bilgi.oge}</div><div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>{bilgi.kategori}</div></td>
                                    <td style={{ padding: '12px', color: '#64748b' }}>{bilgi.tarih ? new Date(`${bilgi.tarih}T00:00:00`).toLocaleDateString('tr-TR') : '-'}</td>
                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800', color: evrak.kayit_tipi === 'gelir' ? '#166534' : '#991b1b', whiteSpace: 'nowrap' }}>₺{bilgi.tutar.toLocaleString('tr-TR')}</td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}><div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}><button type="button" onClick={() => belgeGoruntule(evrak)} style={{ padding: '7px 10px', border: 'none', borderRadius: '7px', background: '#dbeafe', color: '#1d4ed8', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>Görüntüle</button><button type="button" onClick={() => belgeSil(evrak)} style={{ padding: '7px 10px', border: 'none', borderRadius: '7px', background: '#fee2e2', color: '#991b1b', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>Sil</button></div></td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  );
                })()}
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
                      {gorunenCariler.map((cari) => {
                        const cariHakedisleri = hakedisler.filter(h => Number(h.cari_id) === Number(cari.id));
                        const toplamHakedis = cariHakedisleri.reduce((t, h) => t + Number(h.net_tutar || 0), 0);
                        const odenenHakedis = cariHakedisleri.reduce((t, h) => t + Number(h.odenen_tutar || 0), 0);
                        const kalanHakedis = Math.max(toplamHakedis - odenenHakedis, 0);
                        const cariFinans = alacakBorclar.filter(f => (f.taraf || '').trim().toLocaleLowerCase('tr-TR') === (cari.ad || '').trim().toLocaleLowerCase('tr-TR'));
                        const toplamAlacak = cariFinans.filter(f => f.tur === 'Alacak').reduce((t, f) => t + Number(f.tutar || 0), 0);
                        const toplamBorc = cariFinans.filter(f => f.tur === 'Borç').reduce((t, f) => t + Number(f.tutar || 0), 0);
                        const bekleyenAlacak = cariFinans.filter(f => f.tur === 'Alacak' && f.durum !== 'Ödendi' && f.durum !== 'İptal').reduce((t, f) => t + Number(f.tutar || 0), 0);
                        const bekleyenBorc = cariFinans.filter(f => f.tur === 'Borç' && f.durum !== 'Ödendi' && f.durum !== 'İptal').reduce((t, f) => t + Number(f.tutar || 0), 0);
                        const detayAcik = cariDetayId === cari.id;
                        return (
                          <React.Fragment key={cari.id}>
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
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
                              <button type="button" onClick={() => setCariDetayId(detayAcik ? null : cari.id)} style={{ padding: '6px 10px', background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>{detayAcik ? 'Kapat' : 'Finans'}</button>
                              <button type="button" onClick={() => cariSil(cari.id)} style={{ padding: '6px 10px', background: '#fee2e2', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>Sil</button>
                            </div>
                          </td>
                        </tr>
                        {detayAcik && (
                          <tr>
                            <td colSpan={9} style={{ padding: '0 12px 16px', background: '#f8fafc' }}>
                              <div style={{ marginTop: '8px', padding: '18px', borderRadius: '12px', border: '1px solid #dbeafe', background: '#fff' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
                                  <div>
                                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>📊 {cari.ad} — Finansal Özet</div>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Hakediş, ödeme ve alacak/borç kayıtlarının özeti</div>
                                  </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '10px', marginBottom: '18px' }}>
                                  <div style={{ padding: '14px', background: '#eff6ff', borderRadius: '10px' }}><div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800' }}>TOPLAM HAKEDİŞ</div><div style={{ fontSize: '20px', fontWeight: '900', color: '#1d4ed8', marginTop: '5px' }}>₺{toplamHakedis.toLocaleString('tr-TR')}</div></div>
                                  <div style={{ padding: '14px', background: '#f0fdf4', borderRadius: '10px' }}><div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800' }}>HAKEDİŞ ÖDENEN</div><div style={{ fontSize: '20px', fontWeight: '900', color: '#15803d', marginTop: '5px' }}>₺{odenenHakedis.toLocaleString('tr-TR')}</div></div>
                                  <div style={{ padding: '14px', background: '#fff7ed', borderRadius: '10px' }}><div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800' }}>HAKEDİŞ KALAN</div><div style={{ fontSize: '20px', fontWeight: '900', color: '#c2410c', marginTop: '5px' }}>₺{kalanHakedis.toLocaleString('tr-TR')}</div></div>
                                  <div style={{ padding: '14px', background: '#fef2f2', borderRadius: '10px' }}><div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800' }}>BEKLEYEN BORÇ</div><div style={{ fontSize: '20px', fontWeight: '900', color: '#b91c1c', marginTop: '5px' }}>₺{bekleyenBorc.toLocaleString('tr-TR')}</div></div>
                                  <div style={{ padding: '14px', background: '#ecfdf5', borderRadius: '10px' }}><div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800' }}>BEKLEYEN ALACAK</div><div style={{ fontSize: '20px', fontWeight: '900', color: '#047857', marginTop: '5px' }}>₺{bekleyenAlacak.toLocaleString('tr-TR')}</div></div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '16px' }}>
                                  <div>
                                    <div style={{ fontWeight: '900', color: '#334155', marginBottom: '8px' }}>🧾 Hakediş Geçmişi</div>
                                    {cariHakedisleri.length === 0 ? <div style={{ color: '#94a3b8', fontSize: '13px' }}>Henüz hakediş yok.</div> : (
                                      <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}><thead><tr style={{ background: '#f8fafc', textAlign: 'left' }}><th style={{ padding: '8px' }}>No</th><th style={{ padding: '8px' }}>Tarih</th><th style={{ padding: '8px' }}>Net</th><th style={{ padding: '8px' }}>Ödenen</th><th style={{ padding: '8px' }}>Kalan</th><th style={{ padding: '8px' }}>Durum</th></tr></thead><tbody>{cariHakedisleri.map(h => { const net = Number(h.net_tutar || 0); const od = Number(h.odenen_tutar || 0); return <tr key={h.id} style={{ borderTop: '1px solid #f1f5f9' }}><td style={{ padding: '8px', fontWeight: '700' }}>{h.hakedis_no}</td><td style={{ padding: '8px' }}>{h.tarih || '-'}</td><td style={{ padding: '8px' }}>₺{net.toLocaleString('tr-TR')}</td><td style={{ padding: '8px' }}>₺{od.toLocaleString('tr-TR')}</td><td style={{ padding: '8px', fontWeight: '800' }}>₺{Math.max(net-od,0).toLocaleString('tr-TR')}</td><td style={{ padding: '8px' }}>{h.durum || '-'}</td></tr>; })}</tbody></table></div>
                                    )}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: '900', color: '#334155', marginBottom: '8px' }}>💳 Alacak / Borç Geçmişi</div>
                                    {cariFinans.length === 0 ? <div style={{ color: '#94a3b8', fontSize: '13px' }}>Bu cari adına kayıtlı alacak/borç yok.</div> : (
                                      <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}><thead><tr style={{ background: '#f8fafc', textAlign: 'left' }}><th style={{ padding: '8px' }}>Tür</th><th style={{ padding: '8px' }}>Tarih</th><th style={{ padding: '8px' }}>Kategori</th><th style={{ padding: '8px' }}>Tutar</th><th style={{ padding: '8px' }}>Durum</th></tr></thead><tbody>{cariFinans.map(f => <tr key={f.id} style={{ borderTop: '1px solid #f1f5f9' }}><td style={{ padding: '8px', fontWeight: '800', color: f.tur === 'Alacak' ? '#047857' : '#b91c1c' }}>{f.tur}</td><td style={{ padding: '8px' }}>{f.tarih || '-'}</td><td style={{ padding: '8px' }}>{f.kategori || '-'}</td><td style={{ padding: '8px', fontWeight: '700' }}>₺{Number(f.tutar || 0).toLocaleString('tr-TR')}</td><td style={{ padding: '8px' }}>{f.durum || '-'}</td></tr>)}</tbody></table></div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                          </React.Fragment>
                        );
                      })}
                      {gorunenCariler.length === 0 && <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Cari kaydı bulunamadı.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : aktifSekme === 'maliyet' ? (
              /* PROJE MALİYETİ */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: 'white', padding: '26px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
                    <div><h3 style={{ margin: 0, color: '#0f172a', fontSize: '20px' }}>{butceDuzenlenenId ? '✏️ Bütçe Düzenle' : '🎯 Proje Bütçesi'}</h3><p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '13px' }}>Planlanan bütçe ile gerçekleşen maliyetleri karşılaştırın.</p></div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ padding: '9px 12px', borderRadius: '8px', background: '#eff6ff', color: '#1d4ed8', fontWeight: '800' }}>Bütçe: ₺{projeToplamButce.toLocaleString('tr-TR')}</span>
                      <span style={{ padding: '9px 12px', borderRadius: '8px', background: projeKalanButce < 0 ? '#fef2f2' : '#f0fdf4', color: projeKalanButce < 0 ? '#dc2626' : '#166534', fontWeight: '800' }}>Kalan: ₺{projeKalanButce.toLocaleString('tr-TR')}</span>
                    </div>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'12px', marginBottom:'20px' }}>
                    <div style={{padding:'15px',borderRadius:'12px',background:'#f8fafc',border:'1px solid #e2e8f0'}}>
                      <div style={{fontSize:'11px',fontWeight:'800',color:'#64748b'}}>GERÇEKLEŞEN MALİYET</div>
                      <div style={{fontSize:'21px',fontWeight:'900',color:'#0f172a',marginTop:'5px'}}>₺{projeGerceklesenMaliyet.toLocaleString('tr-TR')}</div>
                    </div>
                    <div style={{padding:'15px',borderRadius:'12px',background:'#eff6ff',border:'1px solid #dbeafe'}}>
                      <div style={{fontSize:'11px',fontWeight:'800',color:'#1e40af'}}>BÜTÇE GERÇEKLEŞMESİ</div>
                      <div style={{fontSize:'21px',fontWeight:'900',color:projeGerceklesmeYuzdesi>100?'#dc2626':'#2563eb',marginTop:'5px'}}>{projeGerceklesmeYuzdesi.toLocaleString('tr-TR',{maximumFractionDigits:1})}%</div>
                    </div>
                    <div style={{padding:'15px',borderRadius:'12px',background:'#fef2f2',border:'1px solid #fee2e2'}}>
                      <div style={{fontSize:'11px',fontWeight:'800',color:'#991b1b'}}>BU AY GİDER</div>
                      <div style={{fontSize:'21px',fontWeight:'900',color:'#dc2626',marginTop:'5px'}}>₺{projeBuAyGider.toLocaleString('tr-TR')}</div>
                    </div>
                    <div style={{padding:'15px',borderRadius:'12px',background:'#fff7ed',border:'1px solid #fed7aa'}}>
                      <div style={{fontSize:'11px',fontWeight:'800',color:'#9a3412'}}>BU AY ÖDENECEK</div>
                      <div style={{fontSize:'21px',fontWeight:'900',color:'#ea580c',marginTop:'5px'}}>₺{projeBuAyOdenecek.toLocaleString('tr-TR')}</div>
                    </div>
                  </div>

                  <div style={{marginBottom:'20px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',fontWeight:'800',color:'#475569',marginBottom:'7px'}}>
                      <span>Genel bütçe kullanımı</span><span>{projeGerceklesmeYuzdesi.toLocaleString('tr-TR',{maximumFractionDigits:1})}%</span>
                    </div>
                    <div style={{height:'10px',background:'#e2e8f0',borderRadius:'999px',overflow:'hidden'}}>
                      <div style={{width:`${Math.min(Math.max(projeGerceklesmeYuzdesi,0),100)}%`,height:'100%',background:projeGerceklesmeYuzdesi>100?'#dc2626':projeGerceklesmeYuzdesi>=90?'#f59e0b':'#2563eb',borderRadius:'999px'}} />
                    </div>
                    {butceAsimSayisi > 0 && <div style={{marginTop:'8px',fontSize:'12px',fontWeight:'800',color:'#dc2626'}}>⚠️ {butceAsimSayisi} bütçe kaleminde aşım var.</div>}
                  </div>
                  <form onSubmit={butceKaydet} style={{ display:'flex', gap:'12px', flexWrap:'wrap', background:'#f8fafc', padding:'18px', borderRadius:'12px', border:'1px solid #e2e8f0', marginBottom:'20px' }}>
                    <div style={{ flex:1, minWidth:'180px' }}><label style={{ display:'block',fontSize:'11px',fontWeight:'bold',color:'#64748b',marginBottom:'6px' }}>KATEGORİ</label><select value={maliyetForm.kategori} onChange={e=>setMaliyetForm({...maliyetForm,kategori:e.target.value})} style={{width:'100%',padding:'10px',border:'1px solid #cbd5e1',borderRadius:'8px',background:'#fff'}}>{maliyetKategorileri.map(k=><option key={k}>{k}</option>)}</select></div>
                    <div style={{ flex:1, minWidth:'180px' }}><label style={{ display:'block',fontSize:'11px',fontWeight:'bold',color:'#64748b',marginBottom:'6px' }}>BÜTÇE TUTARI (₺)</label><input type="number" min="0" step="0.01" value={maliyetForm.butce_tutari} onChange={e=>setMaliyetForm({...maliyetForm,butce_tutari:e.target.value})} placeholder="0.00" style={{width:'100%',padding:'10px',border:'1px solid #cbd5e1',borderRadius:'8px'}} /></div>
                    <div style={{ flex:2, minWidth:'220px' }}><label style={{ display:'block',fontSize:'11px',fontWeight:'bold',color:'#64748b',marginBottom:'6px' }}>AÇIKLAMA</label><input value={maliyetForm.aciklama} onChange={e=>setMaliyetForm({...maliyetForm,aciklama:e.target.value})} placeholder="Örn: kaba yapı bütçesi" style={{width:'100%',padding:'10px',border:'1px solid #cbd5e1',borderRadius:'8px'}} /></div>
                    <div style={{ display:'flex',alignItems:'end',gap:'8px' }}><button type="submit" style={{padding:'10px 18px',background:'#2563eb',color:'#fff',border:'none',borderRadius:'8px',fontWeight:'800',cursor:'pointer'}}>{butceDuzenlenenId?'✓ Güncelle':'➕ Bütçe Ekle'}</button>{butceDuzenlenenId&&<button type="button" onClick={()=>{setButceDuzenlenenId(null);setMaliyetForm({kategori:'Beton',butce_tutari:'',aciklama:''})}} style={{padding:'10px 15px',background:'#f1f5f9',border:'1px solid #cbd5e1',borderRadius:'8px',fontWeight:'700'}}>İptal</button>}</div>
                  </form>
                  <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',minWidth:'700px'}}><thead><tr style={{background:'#eff6ff',color:'#1e3a8a',textAlign:'left'}}>{['Kategori','Bütçe','Gerçekleşen','Kalan','Gerçekleşme','Durum','İşlem'].map(h=><th key={h} style={{padding:'11px'}}>{h}</th>)}</tr></thead><tbody>
                    {projeButceleri.map(b=>{
                      const ger=projeMaliyetleri.filter(m=>m.kategori===b.kategori).reduce((t,m)=>t+Number(m.tutar||0),0);
                      const but=Number(b.butce_tutari||0);
                      const kalan=but-ger;
                      const yuzde=but>0?(ger/but)*100:0;
                      const durum = yuzde > 100 ? 'Aşıldı' : yuzde >= 90 ? 'Kritik' : yuzde >= 75 ? 'Yaklaşıyor' : 'Normal';
                      const durumBg = durum === 'Aşıldı' ? '#fee2e2' : durum === 'Kritik' ? '#fef3c7' : durum === 'Yaklaşıyor' ? '#fff7ed' : '#dcfce7';
                      const durumColor = durum === 'Aşıldı' ? '#b91c1c' : durum === 'Kritik' ? '#92400e' : durum === 'Yaklaşıyor' ? '#c2410c' : '#166534';
                      return <tr key={b.id} style={{borderBottom:'1px solid #f1f5f9'}}>
                        <td style={{padding:'11px',fontWeight:'800'}}>{b.kategori}</td>
                        <td style={{padding:'11px'}}>₺{but.toLocaleString('tr-TR')}</td>
                        <td style={{padding:'11px',fontWeight:'700'}}>₺{ger.toLocaleString('tr-TR')}</td>
                        <td style={{padding:'11px',fontWeight:'800',color:kalan<0?'#dc2626':'#166534'}}>₺{kalan.toLocaleString('tr-TR')}</td>
                        <td style={{padding:'11px',minWidth:'150px'}}>
                          <div style={{fontWeight:'800',marginBottom:'5px'}}>{yuzde.toLocaleString('tr-TR',{maximumFractionDigits:1})}%</div>
                          <div style={{height:'7px',background:'#e2e8f0',borderRadius:'999px',overflow:'hidden'}}><div style={{width:`${Math.min(Math.max(yuzde,0),100)}%`,height:'100%',background:yuzde>100?'#dc2626':yuzde>=90?'#f59e0b':'#2563eb',borderRadius:'999px'}} /></div>
                        </td>
                        <td style={{padding:'11px'}}><span style={{display:'inline-block',padding:'4px 8px',borderRadius:'999px',background:durumBg,color:durumColor,fontSize:'11px',fontWeight:'800'}}>{durum}</span></td>
                        <td style={{padding:'11px'}}><button onClick={()=>butceDuzenle(b)} style={{padding:'6px 9px',background:'#fef3c7',border:'none',borderRadius:'6px',fontWeight:'700',cursor:'pointer',marginRight:'5px'}}>Düzenle</button><button onClick={()=>butceSil(b.id)} style={{padding:'6px 9px',background:'#fee2e2',border:'none',borderRadius:'6px',fontWeight:'700',cursor:'pointer'}}>Sil</button></td>
                      </tr>
                    })}
                    {projeButceleri.length===0&&<tr><td colSpan={7} style={{padding:'35px',textAlign:'center',color:'#94a3b8'}}>Henüz bütçe kalemi eklenmedi.</td></tr>}
                  </tbody></table></div>
                </div>

                <div style={{ background:'white', padding:'26px', borderRadius:'16px', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.05)', border:'1px solid #e2e8f0' }}>
                  <h3 style={{margin:'0 0 5px',color:'#0f172a',fontSize:'20px'}}>{maliyetDuzenlenenId?'✏️ Maliyet Düzenle':'💸 Gerçekleşen Maliyet Ekle'}</h3><p style={{margin:'0 0 18px',color:'#64748b',fontSize:'13px'}}>Gerçekleşen harcamaları proje maliyetine işleyin. Mevcut gider kaydını seçerseniz aynı kayda bağlantı kurulur.</p>
                  <form onSubmit={maliyetKaydet} style={{display:'flex',gap:'12px',flexWrap:'wrap',background:'#f8fafc',padding:'18px',borderRadius:'12px',border:'1px solid #e2e8f0',marginBottom:'20px'}}>
                    <div style={{flex:1,minWidth:'170px'}}><label style={{display:'block',fontSize:'11px',fontWeight:'bold',color:'#64748b',marginBottom:'6px'}}>TARİH *</label><input required type="date" value={maliyetKayitForm.tarih} onChange={e=>setMaliyetKayitForm({...maliyetKayitForm,tarih:e.target.value})} style={{width:'100%',padding:'10px',border:'1px solid #cbd5e1',borderRadius:'8px'}}/></div>
                    <div style={{flex:1,minWidth:'170px'}}><label style={{display:'block',fontSize:'11px',fontWeight:'bold',color:'#64748b',marginBottom:'6px'}}>KATEGORİ *</label><select value={maliyetKayitForm.kategori} onChange={e=>setMaliyetKayitForm({...maliyetKayitForm,kategori:e.target.value})} style={{width:'100%',padding:'10px',border:'1px solid #cbd5e1',borderRadius:'8px',background:'#fff'}}>{maliyetKategorileri.map(k=><option key={k}>{k}</option>)}</select></div>
                    <div style={{flex:1,minWidth:'170px'}}><label style={{display:'block',fontSize:'11px',fontWeight:'bold',color:'#64748b',marginBottom:'6px'}}>TUTAR (₺) *</label><input required type="number" min="0.01" step="0.01" value={maliyetKayitForm.tutar} onChange={e=>setMaliyetKayitForm({...maliyetKayitForm,tutar:e.target.value})} placeholder="0.00" style={{width:'100%',padding:'10px',border:'1px solid #cbd5e1',borderRadius:'8px',fontWeight:'700'}}/></div>
                    <div style={{flex:1.2,minWidth:'190px'}}><label style={{display:'block',fontSize:'11px',fontWeight:'bold',color:'#64748b',marginBottom:'6px'}}>CARİ / FİRMA</label><select value={maliyetKayitForm.cari_id} onChange={e=>setMaliyetKayitForm({...maliyetKayitForm,cari_id:e.target.value})} style={{width:'100%',padding:'10px',border:'1px solid #cbd5e1',borderRadius:'8px',background:'#fff'}}><option value="">Seçim yok</option>{cariler.map(c=><option key={c.id} value={c.id}>{c.ad}</option>)}</select></div>
                    <div style={{flex:1.5,minWidth:'220px'}}><label style={{display:'block',fontSize:'11px',fontWeight:'bold',color:'#64748b',marginBottom:'6px'}}>MEVCUT GİDER KAYDI</label><select value={maliyetKayitForm.gider_id} onChange={e=>setMaliyetKayitForm({...maliyetKayitForm,gider_id:e.target.value})} style={{width:'100%',padding:'10px',border:'1px solid #cbd5e1',borderRadius:'8px',background:'#fff'}}><option value="">Bağlantı yok</option>{harcamalar.map(g=><option key={g.id} value={g.id}>{g.tarih||'-'} — {g.oge||'-'} — ₺{Number(g.tutar||0).toLocaleString('tr-TR')}</option>)}</select></div>
                    <div style={{flex:2,minWidth:'240px'}}><label style={{display:'block',fontSize:'11px',fontWeight:'bold',color:'#64748b',marginBottom:'6px'}}>AÇIKLAMA</label><input value={maliyetKayitForm.aciklama} onChange={e=>setMaliyetKayitForm({...maliyetKayitForm,aciklama:e.target.value})} placeholder="Maliyet açıklaması" style={{width:'100%',padding:'10px',border:'1px solid #cbd5e1',borderRadius:'8px'}}/></div>
                    <div style={{display:'flex',alignItems:'end',gap:'8px'}}><button type="submit" style={{padding:'10px 18px',background:'#2563eb',color:'#fff',border:'none',borderRadius:'8px',fontWeight:'800',cursor:'pointer'}}>{maliyetDuzenlenenId?'✓ Güncelle':'➕ Maliyet Kaydet'}</button>{maliyetDuzenlenenId&&<button type="button" onClick={()=>{setMaliyetDuzenlenenId(null);setMaliyetKayitForm({kategori:'Beton',tutar:'',tarih:bugununTarihi(),cari_id:'',gider_id:'',aciklama:''})}} style={{padding:'10px 15px',background:'#f1f5f9',border:'1px solid #cbd5e1',borderRadius:'8px',fontWeight:'700'}}>İptal</button>}</div>
                  </form>
                  <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',minWidth:'950px'}}><thead><tr style={{background:'#eff6ff',color:'#1e3a8a',textAlign:'left'}}>{['Tarih','Kategori','Cari / Firma','Gider Bağlantısı','Açıklama','Tutar','İşlem'].map(h=><th key={h} style={{padding:'11px'}}>{h}</th>)}</tr></thead><tbody>
                    {projeMaliyetleri.map(m=><tr key={m.id} style={{borderBottom:'1px solid #f1f5f9'}}><td style={{padding:'11px',whiteSpace:'nowrap'}}>{m.tarih||'-'}</td><td style={{padding:'11px',fontWeight:'800'}}>{m.kategori}</td><td style={{padding:'11px'}}>{m.cariler?.ad||cariler.find(c=>c.id===m.cari_id)?.ad||'-'}</td><td style={{padding:'11px'}}>{m.gider_id ? `#${m.gider_id}` : '-'}</td><td style={{padding:'11px',color:'#64748b'}}>{m.aciklama||'-'}</td><td style={{padding:'11px',fontWeight:'800'}}>₺{Number(m.tutar||0).toLocaleString('tr-TR')}</td><td style={{padding:'11px'}}><button onClick={()=>maliyetDuzenle(m)} style={{padding:'6px 9px',background:'#fef3c7',border:'none',borderRadius:'6px',fontWeight:'700',cursor:'pointer',marginRight:'5px'}}>Düzenle</button><button onClick={()=>maliyetSil(m.id)} style={{padding:'6px 9px',background:'#fee2e2',border:'none',borderRadius:'6px',fontWeight:'700',cursor:'pointer'}}>Sil</button></td></tr>)}
                    {projeMaliyetleri.length===0&&<tr><td colSpan={7} style={{padding:'35px',textAlign:'center',color:'#94a3b8'}}>Henüz gerçekleşen maliyet kaydı yok.</td></tr>}
                  </tbody></table></div>
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
                            <td style={{ padding: '12px' }}>
                              <button
                                type="button"
                                onClick={() => cariFinansAc(i.cari_id)}
                                title="Bu hakedişin bağlı olduğu cari hesabı aç"
                                style={{
                                  padding: 0,
                                  border: 'none',
                                  background: 'transparent',
                                  color: '#1d4ed8',
                                  cursor: 'pointer',
                                  fontWeight: '800',
                                  textAlign: 'left'
                                }}
                              >
                                {i.cariler?.ad || cariler.find(c => Number(c.id) === Number(i.cari_id))?.ad || '-'}
                              </button>
                              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>↗ Cari hesabı aç</div>
                            </td>
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

                  <div style={{ width: '100%', padding: '12px 14px', border: '1px dashed #93c5fd', borderRadius: '10px', background: '#eff6ff' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#1e40af', marginBottom: '7px' }}>📎 DEKONT / MAKBUZ / FATURA</label>
                    <input type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" disabled={belgeYukleniyor} onChange={(e) => setBelgeDosyalari(Array.from(e.target.files || []))} style={{ width: '100%', fontSize: '13px', color: '#334155' }} />
                    <div style={{ marginTop: '7px', color: '#64748b', fontSize: '11px' }}>PDF, JPG, PNG veya WEBP • Tek dosya en fazla 10 MB</div>
                    {belgeDosyalari.length > 0 && <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>{belgeDosyalari.map((dosya, index) => <div key={`${dosya.name}-${index}`} style={{ fontSize: '12px', color: '#334155' }}>📄 {dosya.name} <span style={{ color: '#64748b' }}>({(dosya.size / 1024 / 1024).toFixed(2)} MB)</span></div>)}</div>}
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
                      disabled={belgeYukleniyor}
                      style={{
                        flex: 1, padding: '12px',
                        backgroundColor: duzenlenenKayitId ? '#f59e0b' : '#2563eb',
                        color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer',
                        fontWeight: 'bold', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)'
                      }}
                    >
                      {belgeYukleniyor ? 'Kaydediliyor...' : duzenlenenKayitId ? '✓ Değişiklikleri Güncelle' : 'Sisteme Kaydet'}
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
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                      Sıralama: başlıklara tıklayın
                    </span>
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

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={excelAktarimPenceresiniAc}
                      style={{ padding: '9px 13px', borderRadius: '8px', border: '1px solid #93c5fd', background: '#eff6ff', color: '#1d4ed8', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}
                    >
                      📥 Excel'den Toplu Aktar
                    </button>
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

                                {/* MOBİL KART GÖRÜNÜMÜ */}
                <div className="mobil-kart-liste">
                  {sayfaliListe.map((i) => (
                    <div className="mobil-kart" key={`mobil-${i.id}`}>
                      <div className="mobil-kart-ust">
                        <div>
                          <div className="mobil-kart-oge">{i.oge || '-'}</div>
                          <div className="mobil-kart-tarih">{i.tarih || '-'}</div>
                        </div>
                        <div className="mobil-kart-tutar" style={{ color: aktifSekme === 'gelirler' ? '#059669' : '#dc2626' }}>
                          ₺{Number(i.tutar || 0).toLocaleString('tr-TR')}
                        </div>
                      </div>
                      <div className="mobil-kart-detay">
                        <div className="mobil-kart-alan"><span className="mobil-kart-etiket">Kategori</span><span className="mobil-kart-deger">{i.kategori || '-'}</span></div>
                        {aktifSekme === 'giderler' && <div className="mobil-kart-alan"><span className="mobil-kart-etiket">Ödeme Kaynağı</span><span className="mobil-kart-deger">{i.odeme_kaynagi || 'Kasa'}</span></div>}
                        <div className="mobil-kart-alan"><span className="mobil-kart-etiket">Makbuz No</span><span className="mobil-kart-deger">{i.makbuz_no || '-'}</span></div>
                        <div className="mobil-kart-alan"><span className="mobil-kart-etiket">Fatura No</span><span className="mobil-kart-deger">{i.fatura_no || '-'}</span></div>
                        <div className="mobil-kart-alan" style={{ gridColumn: '1 / -1' }}><span className="mobil-kart-etiket">Açıklama</span><span className="mobil-kart-deger">{i.aciklama || '-'}</span></div>
                      </div>
                      <div className="mobil-kart-islem">
                        <button type="button" onClick={() => belgeModalAc(i)} style={{ padding: '7px 10px', backgroundColor: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>📎 {kayitEvraklari(aktifSekme === 'gelirler' ? 'gelir' : 'gider', i.id).length || 'Belge'}</button>
                        <button type="button" onClick={() => duzenle(i)} style={{ padding: '7px 10px', backgroundColor: '#fef3c7', color: '#92400e', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>✏️ Düzenle</button>
                        <button type="button" onClick={() => sil(i.id)} style={{ padding: '7px 10px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>🗑️ Sil</button>
                      </div>
                    </div>
                  ))}
                  {gorunenListe.length === 0 && <div style={{ padding: '35px 15px', textAlign: 'center', color: '#94a3b8', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>Kayıt bulunamadı.</div>}
                </div>

{/* TABLO */}
                <div className="desktop-table-wrap" style={{ overflowX: 'auto' }}>
                  <table
                    className="desktop-data-table"
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
                          <button
                            type="button"
                            onClick={() => siralamayiDegistir('tarih')}
                            title="Tarihe göre sırala"
                            style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', font: 'inherit', fontWeight: '700', color: 'inherit' }}
                          >
                            Tarih {siralamaIkonu('tarih')}
                          </button>
                        </th>

                        <th style={{ padding: '14px 12px' }}>
                          <button
                            type="button"
                            onClick={() => siralamayiDegistir('oge')}
                            title="Öğe / firma / kişiye göre sırala"
                            style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', font: 'inherit', fontWeight: '700', color: 'inherit' }}
                          >
                            Öğe {siralamaIkonu('oge')}
                          </button>
                        </th>

                        <th style={{ padding: '14px 12px' }}>
                          Makbuz No
                        </th>

                        <th style={{ padding: '14px 12px' }}>
                          Fatura No
                        </th>

                        <th style={{ padding: '14px 12px' }}>
                          <button
                            type="button"
                            onClick={() => siralamayiDegistir('kategori')}
                            title="Kategoriye göre sırala"
                            style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', font: 'inherit', fontWeight: '700', color: 'inherit' }}
                          >
                            Kategori {siralamaIkonu('kategori')}
                          </button>
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
                          <button
                            type="button"
                            onClick={() => siralamayiDegistir('tutar')}
                            title="Tutara göre sırala"
                            style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', font: 'inherit', fontWeight: '700', color: 'inherit' }}
                          >
                            Tutar {siralamaIkonu('tutar')}
                          </button>
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
                      {sayfaliListe.map((i) => (
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
                                type="button"
                                onClick={() => belgeModalAc(i)}
                                style={{ padding: '6px 10px', backgroundColor: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
                              >
                                📎 {kayitEvraklari(aktifSekme === 'gelirler' ? 'gelir' : 'gider', i.id).length || 'Belge'}
                              </button>
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

                {gorunenListe.length > 0 && (
                  <div
                    className="liste-sayfalama"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap',
                      padding: '14px 4px 2px'
                    }}
                  >
                    <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
                      {baslangicIndex + 1}-{Math.min(baslangicIndex + SAYFA_BASI_KAYIT, gorunenListe.length)} / {gorunenListe.length} kayıt
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setListeSayfasi((s) => Math.max(1, s - 1))}
                        disabled={listeSayfasi === 1}
                        style={{
                          minWidth: '36px', height: '36px', border: '1px solid #cbd5e1', borderRadius: '8px',
                          background: listeSayfasi === 1 ? '#f1f5f9' : '#fff',
                          color: listeSayfasi === 1 ? '#94a3b8' : '#0f172a', cursor: listeSayfasi === 1 ? 'default' : 'pointer',
                          fontWeight: '800'
                        }}
                      >‹</button>

                      {Array.from({ length: toplamSayfa }, (_, idx) => idx + 1).map((sayfa) => (
                        <button
                          type="button"
                          key={sayfa}
                          onClick={() => setListeSayfasi(sayfa)}
                          style={{
                            minWidth: '36px', height: '36px', border: `1px solid ${listeSayfasi === sayfa ? '#2563eb' : '#cbd5e1'}`,
                            borderRadius: '8px', background: listeSayfasi === sayfa ? '#2563eb' : '#fff',
                            color: listeSayfasi === sayfa ? '#fff' : '#334155', cursor: 'pointer', fontWeight: '800'
                          }}
                        >{sayfa}</button>
                      ))}

                      <button
                        type="button"
                        onClick={() => setListeSayfasi((s) => Math.min(toplamSayfa, s + 1))}
                        disabled={listeSayfasi === toplamSayfa}
                        style={{
                          minWidth: '36px', height: '36px', border: '1px solid #cbd5e1', borderRadius: '8px',
                          background: listeSayfasi === toplamSayfa ? '#f1f5f9' : '#fff',
                          color: listeSayfasi === toplamSayfa ? '#94a3b8' : '#0f172a', cursor: listeSayfasi === toplamSayfa ? 'default' : 'pointer',
                          fontWeight: '800'
                        }}
                      >›</button>
                    </div>

                    <div style={{ color: '#64748b', fontSize: '12px' }}>
                      Sayfa {listeSayfasi} / {toplamSayfa} · 50 kayıt/sayfa
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      </div>

      {excelAktarimAcik && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}
        >
          <div
            style={{
              width: 'min(900px, 100%)', maxHeight: '90vh', overflowY: 'auto', background: '#fff',
              borderRadius: '18px', padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '22px' }}>📥 Excel'den Toplu Aktar</h2>
                <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '13px' }}>
                  {aktifSekme === 'giderler' ? 'Gider' : 'Gelir'} kayıtlarını seçili projeye aktar. İlk sayfa okunur.
                </p>
              </div>
              <button type="button" onClick={excelAktarimKapat} style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '8px 11px', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                <input ref={excelDosyaRef} type="file" accept=".xlsx,.xls,.csv" onChange={excelDosyasiSecildi} style={{ display: 'none' }} />
                <button type="button" disabled={excelAktarimYukleniyor} onClick={() => excelDosyaRef.current?.click()} style={{ padding: '11px 16px', border: 'none', borderRadius: '9px', background: '#2563eb', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>
                  {excelAktarimYukleniyor ? '⏳ İşleniyor...' : '📁 Excel Dosyası Seç'}
                </button>
                {excelAktarimDosyaAdi && <span style={{ color: '#334155', fontSize: '13px', fontWeight: '600' }}>{excelAktarimDosyaAdi}</span>}
              </div>
              <div style={{ marginTop: '12px', color: '#64748b', fontSize: '12px', lineHeight: 1.6 }}>
                Desteklenen sütunlar: <b>Tarih, Öğe/Firma/Kişi, Makbuz No, Fatura No, Kategori, Açıklama, Tutar</b>. Giderlerde ayrıca <b>Ödeme Kaynağı / Ödeyen Kim</b>. Sütun adları birebir aynı olmak zorunda değildir.
              </div>
            </div>

            {excelAktarimSonuc && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                <div style={{ padding: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}><div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>TOPLAM SATIR</div><div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{excelAktarimSonuc.toplam}</div></div>
                <div style={{ padding: '14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px' }}><div style={{ fontSize: '11px', color: '#166534', fontWeight: '700' }}>AKTARILABİLİR</div><div style={{ fontSize: '22px', fontWeight: '800', color: '#059669' }}>{excelAktarimSonuc.aktarilabilir}</div></div>
                <div style={{ padding: '14px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px' }}><div style={{ fontSize: '11px', color: '#9a3412', fontWeight: '700' }}>ZATEN VAR</div><div style={{ fontSize: '22px', fontWeight: '800', color: '#ea580c' }}>{excelAktarimSonuc.tekrar}</div></div>
                <div style={{ padding: '14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px' }}><div style={{ fontSize: '11px', color: '#991b1b', fontWeight: '700' }}>HATALI</div><div style={{ fontSize: '22px', fontWeight: '800', color: '#dc2626' }}>{excelAktarimHatalari.length}</div></div>
              </div>
            )}

            {excelAktarimHatalari.length > 0 && (
              <div style={{ marginBottom: '16px', padding: '14px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                <div style={{ fontWeight: '800', color: '#9a3412', marginBottom: '8px' }}>⚠️ Aktarılmayan satırlar</div>
                {excelAktarimHatalari.slice(0, 50).map((e, i) => <div key={i} style={{ fontSize: '12px', color: '#7c2d12', marginBottom: '4px' }}>{e}</div>)}
                {excelAktarimHatalari.length > 50 && <div style={{ fontSize: '12px', color: '#7c2d12' }}>... ve {excelAktarimHatalari.length - 50} hata daha.</div>}
              </div>
            )}

            {excelAktarimSatirlari.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Önizleme — ilk 10 kayıt</div>
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '720px' }}>
                    <thead><tr style={{ background: '#f8fafc', color: '#475569' }}>
                      <th style={{ padding: '9px', textAlign: 'left' }}>Tarih</th><th style={{ padding: '9px', textAlign: 'left' }}>Öğe</th><th style={{ padding: '9px', textAlign: 'left' }}>Kategori</th><th style={{ padding: '9px', textAlign: 'left' }}>Açıklama</th><th style={{ padding: '9px', textAlign: 'right' }}>Tutar</th>
                    </tr></thead>
                    <tbody>{excelAktarimSatirlari.slice(0, 10).map((i, idx) => <tr key={idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '9px' }}>{i.tarih}</td><td style={{ padding: '9px' }}>{i.oge}</td><td style={{ padding: '9px' }}>{i.kategori}</td><td style={{ padding: '9px' }}>{i.aciklama || '-'}</td><td style={{ padding: '9px', textAlign: 'right', fontWeight: '700' }}>₺{Number(i.tutar).toLocaleString('tr-TR')}</td>
                    </tr>)}</tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
              <button type="button" onClick={excelAktarimKapat} disabled={excelAktarimYukleniyor} style={{ padding: '11px 18px', border: '1px solid #cbd5e1', borderRadius: '9px', background: '#fff', color: '#475569', fontWeight: '700', cursor: 'pointer' }}>İptal</button>
              <button type="button" onClick={excelTopluAktar} disabled={excelAktarimYukleniyor || excelAktarimSatirlari.length === 0} style={{ padding: '11px 18px', border: 'none', borderRadius: '9px', background: excelAktarimSatirlari.length ? '#059669' : '#94a3b8', color: '#fff', fontWeight: '800', cursor: excelAktarimSatirlari.length ? 'pointer' : 'not-allowed' }}>
                {excelAktarimYukleniyor ? '⏳ Aktarılıyor...' : `✅ ${excelAktarimSatirlari.length} Kaydı Aktar`}
              </button>
            </div>
          </div>
        </div>
      )}


      {belgeModalKayit && (
        <div onClick={() => setBelgeModalKayit(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '620px', maxHeight: '80vh', overflowY: 'auto', background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 24px 60px rgba(15,23,42,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '18px' }}>
              <div><h3 style={{ margin: 0, color: '#0f172a', fontSize: '19px' }}>📎 Finans Evrakları</h3><p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '12px' }}>{belgeModalKayit.oge || '-'} • ₺{Number(belgeModalKayit.tutar || 0).toLocaleString('tr-TR')}</p></div>
              <button type="button" onClick={() => setBelgeModalKayit(null)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', color: '#475569', fontSize: '18px' }}>×</button>
            </div>
            {belgeModalYukleniyor ? <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Belgeler yükleniyor...</div> : (
              kayitEvraklari(belgeModalKayit.kayitTipi, belgeModalKayit.id).length === 0 ?
                <div style={{ padding: '28px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '10px' }}>Bu kayda bağlı belge bulunmuyor.</div> :
                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>{kayitEvraklari(belgeModalKayit.kayitTipi, belgeModalKayit.id).map((evrak) => (
                  <div key={evrak.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc' }}>
                    <div style={{ minWidth: 0 }}><div style={{ fontWeight: '700', color: '#334155', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📄 {evrak.dosya_adi}</div><div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '3px' }}>{evrak.mime_type || 'Belge'} • {evrak.dosya_boyutu ? `${(evrak.dosya_boyutu / 1024 / 1024).toFixed(2)} MB` : '-'}</div></div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}><button type="button" onClick={() => belgeGoruntule(evrak)} style={{ padding: '7px 10px', border: 'none', borderRadius: '7px', background: '#dbeafe', color: '#1d4ed8', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>Görüntüle</button><button type="button" onClick={() => belgeSil(evrak)} style={{ padding: '7px 10px', border: 'none', borderRadius: '7px', background: '#fee2e2', color: '#991b1b', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>Sil</button></div>
                  </div>
                ))}</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
