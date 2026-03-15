# ADR-0001: Olay Yonetimi ve Gercek Zamanli Kopru

## Durum

Kabul edildi

## Baglam

Gorev degisiklikleri API tarafinda uretilir. Yazma endpoint'lerini socket yayiniyla dogrudan baglamadan asenkron yan etkiler ve gercek zamanli UI guncellemeleri gerekir.

## Karar

1. API, sabit routing key'ler ile Rabbit olaylarini yayinlar:
   - `task_created`
   - `task_assigned`
   - `comment_added`
   - `otp_requested`
2. Worker, `sprintdock.events` -> `sprintdock.worker` uzerinden tum key'leri tuketir.
3. Worker, alan routing key'lerini socket event adlarina esler:
   - `task_created`/`task_assigned` -> `task.updated`
   - `comment_added` -> `comment.added`
4. Worker, `INTERNAL_API_KEY` ile API ic endpoint'ini (`/internal/realtime`) cagirir.
5. API, `/realtime` namespace altinda `project:{projectId}` odasina yayin yapar.

## Sonuclar

- API yazma islemleri hizli kalir ve yan etkilerden ayrilir.
- Gercek zamanli kopru worker mantiginda merkezilesir.
- Olay adlandirmasi backend/frontend arasinda geriye donuk uyumlu kalir.
