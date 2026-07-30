# FocusFlow 🚀 — Kişisel Odaklanma & Hedef Yönetimi Platformu

![FocusFlow Banner](https://raw.githubusercontent.com/shadcn/ui/main/apps/www/public/og.png)

**FocusFlow**, tamamen yerel (offline) çalışan, gizliliğinizi ön planda tutan ve hedeflerinizi ağaç yapısında organize etmenizi sağlayan modern, ultra hızlı bir odaklanma ve görev yönetim platformudur.

---

## 🌟 Öne Çıkan Özellikler

### 🎯 1. Hiyerarşik Alan & Görev Yönetimi
- **Ağaç Yapısı:** Çalışma Alanları ➔ Alt Alanlar ➔ Görevler hiyerarşisi ile tüm projelerinizi ve öğrenim süreçlerinizi düzenleyin.
- **Zengin Notlar (Rich Text):** Her alt alana veya göreve özel biçimlendirilmiş notlar (başlıklar, kod blokları, listeler) ekleyin.

### 📅 2. Çoklu Tarihli Akıllı Görevler
- Düzensiz tekrarlayan işlerinizi (staj, dersler, periyodik toplantılar) tek bir görev altında birden fazla güne bağlayın.
- İnteraktif mini-takvim ile istediğiniz günleri tek tıkla işaretleyin.

### 🔒 3. Özel Şifre Koruması
- Uygulamanıza sadece sizin erişebilmeniz için özel bir **Şifre Koruması** tanımlayın.
- İster bilgisayarınızda ister internette (`.github.io`) yayınlansın, şifrenizi girmeyen kimse verilerinize erişemez.

### 🛡️ 4. Otomatik Geçmiş Logları & Veri Güvenliği
- **Arka Plan Yedekleri:** Yapılan her değişiklikte otomatik olarak geriye dönük versiyon yedeği (son 15 log) tutulur.
- **JSON Dışa / İçe Aktarma:** Tüm sisteminizi tek tıkla `.json` dosyası olarak indirin veya yükleyin.

### 🎨 5. Modern Glassmorphism Tasarım
- Yumuşak mor/pembe renk paleti, akıcı animasyonlar ve şık karanlık/aydınlık (Dark/Light) tema desteği.
- Mobil cihazlar, tabletler ve masaüstü ekranlar için %100 uyumlu duyarlı (responsive) arayüz.

---

## 🚀 Hızlı Başlangıç

### Gereksinimler
- **Node.js**: v18.0.0 veya üzeri
- **npm** / **yarn** / **pnpm**

### Kurulum

1. Depoyu klonlayın:
```bash
git clone https://github.com/KULLANICI_ADIN/REPO_ADIN.git
cd REPO_ADIN
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Geliştirici sunucusunu başlatın:
```bash
npm run dev
```
Tarayıcınızda `http://localhost:3000` adresini açarak kullanmaya başlayabilirsiniz.

---

## 🌐 GitHub Pages (.github.io) Üzerinden Yayınlama

Proje statik HTML/JS çıktısı (`output: 'export'`) alacak şekilde konfigüre edilmiştir.

### 1. Statik Derleme Alın:
```bash
npm run build
```
Bu komut projenizi kök dizindeki `/out` klasörüne statik web sitesi olarak derler.

### 2. GitHub Pages Dağıtımı:
1. Kodlarınızı GitHub'a gönderin:
   ```bash
   git add .
   git commit -m "FocusFlow yayın sürümü"
   git push origin main
   ```
2. Repository ayarlarınızdan **Settings** ➔ **Pages** sekmesine gidin.
3. **Source** seçeneğini **GitHub Actions** (Next.js) olarak ayarlayın.
4. Siteniz birkaç dakika içinde `https://kullaniciadi.github.io/repo-adi` adresinde canlıya geçecektir!

---

## ☁️ Supabase ile cihazlar arası senkronizasyon

Supabase yapılandırılmadığında uygulama yerel depolama ile çalışmaya devam eder. Telefon ve bilgisayar arasında ortak veri için aşağıdaki kurulumu bir kez yapın:

1. [Supabase](https://supabase.com/dashboard) üzerinde bir proje oluşturun. **SQL Editor**'de [schema.sql](supabase/schema.sql) dosyasının tamamını çalıştırın.
2. Project Settings → API bölümündeki **Project URL** ve **anon public** anahtarını alın. `service_role` anahtarını kesinlikle kullanmayın.
3. Yerelde `.env.local` oluşturup şunları ekleyin:

```env
NEXT_PUBLIC_SUPABASE_URL=https://proje-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-public-key
NEXT_PUBLIC_FOCUSFLOW_LOGIN_EMAIL=senin-eposta-adresin@example.com
```

4. GitHub deposunda Settings → Secrets and variables → Actions altında aynı adlarla `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` secret'larını ekleyip tekrar deploy edin.
5. Supabase Authentication → URL Configuration bölümünde Site URL ve Redirect URLs alanına GitHub Pages adresinizi ekleyin: `https://KULLANICI_ADI.github.io/To-Do-Personal/`.

Canlı sitede ilk açılışta e-posta/parola ile hesap oluşturun. Aynı hesapla telefonunuzda giriş yaptığınızda görevler, notlar, başvurular, yol haritaları, yedekler ve uygulama kilidi eşitlenir. İlk hesabınızda mevcut tarayıcı verisi buluta aktarılır; diğer cihazlarda buluttaki veri açılır.

## 🔒 Gizlilik & Veri Mimarisi

FocusFlow önce tarayıcıya kaydeder ve Supabase ayarlıysa aynı veriyi buluttaki kişisel kaydınıza da eşitler. Tablo üzerindeki RLS kuralları, yalnızca oturum açmış kullanıcının kendi kaydını okumasına veya değiştirmesine izin verir.

---

## 📄 Lisans
Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır.
