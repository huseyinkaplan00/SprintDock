# ADR-0002: Kalite Kapisi ve E2E Dogrulama

## Durum

Kabul edildi

## Baglam

Proje teknik olarak calisiyor olsa da degerlendirme ve ekip sureclerinde su riskler vardi:

- Her degisiklikte otomatik kalite kontrolu yok
- Kritik kullanici akislarinin uctan uca test kapsami sinirli
- Deploy/merge oncesi standart bir dogrulama zinciri tanimli degil

## Karar

1. GitHub Actions uzerinde standart CI hattina gecildi.
2. Lint + test + build adimlari zorunlu hale getirildi.
3. Docker Compose ile smoke kontrol eklendi.
4. Playwright ile OTP giris + temel CRUD akisina E2E test eklendi.
5. Pre-commit seviyesinde husky + lint-staged ile yerel kalite kapisi eklendi.

## Sonuclar

- Regresyonlar daha erken asamada yakalanir.
- Kod inceleme surecinde guven artar.
