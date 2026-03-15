# ADR-0003: Demo Ortamı İçin OTP_ECHO Bayrağı

## Durum

Kabul edildi.

## Bağlam

Canlı demo ortamında OTP kodunun kullanıcıya ulaştırılması için normalde email veya SMS entegrasyonu gerekir. Bu repoda odak, ürün akışını ve sistem davranışını göstermek olduğu için ek mesajlaşma altyapısı yerine kontrollü bir demo seçeneği gerekliydi.

## Karar

- `NODE_ENV != production` iken OTP kodu geliştirme kolaylığı için response içinde dönebilir.
- `NODE_ENV == production` iken OTP kodu yalnızca `OTP_ECHO=true` ise response içinde döner.
- `OTP_ECHO` yalnızca demo/testing ortamlarında açılır.

## Sonuçlar

- Canlı demo hızlı doğrulanabilir.
- Üretim dışı bir kolaylık olarak net şekilde sınırlandırılmış olur.
- Gerçek üretimde `OTP_ECHO` kapalı tutulmalı ve OTP ayrı bir mesajlaşma kanalıyla iletilmelidir.
