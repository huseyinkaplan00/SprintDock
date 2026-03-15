# Uygulanan İyileştirmeler

Bu doküman SprintDock içinde uygulanan ve ürünün üretim kalitesini artıran başlıca iyileştirmeleri özetler.

## 1) Kalite Kapısı ve CI

Dosya: `.github/workflows/ci.yml`

Eklenen kontroller:

- `pnpm lint`
- `pnpm test`
- `pnpm build`
- Docker smoke kontrolü
- Playwright E2E akışı

Etkisi:

- Değişikliklerin ortak kalite kapısından geçmesi
- Yerel ortam farklarından kaynaklı regresyon riskinin azalması

## 2) E2E Akış Doğrulaması

Dosyalar:

- `apps/web/playwright.config.js`
- `apps/web/e2e/auth-and-crud.spec.js`

Kapsam:

- OTP ile giriş
- Proje oluşturma
- Görev oluşturma
- Görev detayına geçiş
- Yorum ekleme

## 3) UI Tutarlılığı

Yapılanlar:

- Protected sayfalar tek layout altında toplandı
- Ortak sol menü ve üst çubuk standardize edildi
- Tablolar, toast'lar ve form davranışları ortak bileşenler üzerinden taşındı

## 4) Frontend Performans İyileştirmesi

Dosya: `apps/web/src/app/routes/index.jsx`

Yapılanlar:

- Sayfalar `React.lazy` ile bölündü
- `Suspense` fallback ve skeleton davranışları eklendi

## 5) Realtime Dağıtım Hazırlığı

Yapılanlar:

- Frontend, local/ngrok bağımlılığı olmadan hosted API kullanacak şekilde env tabanlı hale getirildi
- API ve worker dış servislerle çalışacak şekilde ayrıştırıldı
- Render üzerinde worker için `/health` endpoint'i desteklendi

## 6) Mobil UX İyileştirmeleri

Yapılanlar:

- OTP girişinde tam kopyala-yapıştır desteği eklendi
- iOS input zoom problemi azaltıldı
- Mobil klavye açıldığında aktif alanın görünür kalması için scroll davranışı düzeltildi
- Dar ekranlarda tablo scroll davranışı sadeleştirildi

## 7) Veri Sunumu ve Bilgi Mimarisi

Yapılanlar:

- Ham ObjectId gösterimleri azaltıldı
- Tekrarlayan meta veriler sadeleştirildi
- Görev ve proje detaylarında anlamlı başlık/breadcrumb kullanımı iyileştirildi

## 8) Deploy Kararlılığı

Yapılanlar:

- Native `bcrypt` yerine deploy dostu `bcryptjs` kullanıldı
- `PORT` temelli başlatma ve health kontrol uyumu sağlandı
- CORS ve Socket allowlist mantığı Vercel/Render akışına uygun hale getirildi

Not: Teknik sözleşmeler korunmuştur; endpoint path'leri, Rabbit routing key'leri ve Socket event adları değişmemiştir.
