# SprintDock

SprintDock, Hüseyin Kaplan tarafından portföy odaklı geliştirilen gerçek zamanlı bir iş takip ve ekip koordinasyon uygulamasıdır. Monorepo yapı içinde Express API, worker, React istemcisi ve ortak UI paketini bir arada barındırır.

## Öne Çıkan Özellikler

- OTP tabanlı giriş akışı ve JWT access/refresh token yönetimi
- Proje, görev ve yorum için uçtan uca CRUD akışları
- RabbitMQ üzerinden event publish/consume hattı
- Socket.io ile proje odalarına gerçek zamanlı güncelleme akışı
- Tekrar kullanılabilir `packages/ui` bileşen paketi
- Docker Compose, Render ve Vercel ile yerel + bulut çalıştırma seçenekleri

## Mimari Özet

- `apps/api` - Express REST API, auth/session akışları, Rabbit publish ve Socket.io server
- `apps/worker` - Rabbit consumer, bildirim/analytics işleyicileri ve internal realtime bridge
- `apps/web` - React + Vite istemcisi, TanStack Query, Zustand ve gerçek zamanlı invalidation katmanı
- `packages/ui` - ortak UI primitive ve veri tablo bileşenleri
- `packages/common` - paylaşılan schema/sabit katmanı

## Teknoloji Yığını

- Node.js
- Express
- React + Vite
- MongoDB + Mongoose
- Redis
- RabbitMQ
- Socket.io
- pnpm workspaces

## Yerel Kurulum

Gereksinimler:

- Node.js 20+
- pnpm 10+
- Docker + Docker Compose

Kurulum:

```bash
pnpm install
pnpm lint
pnpm test
pnpm build
```

Geliştirme modunda başlatma:

```bash
pnpm dev
```

Varsayılan adresler:

- API: `http://localhost:4000`
- Web: `http://localhost:5173`
- RabbitMQ UI: `http://localhost:15672`

## Docker ile Çalıştırma

```bash
docker compose up -d --build
docker compose ps
curl -i http://localhost:4000/health
```

## Ortam Değişkenleri

Örnek değerler için `.env.example` dosyasını kullan.

Temel değişkenler:

- `MONGO_URI`
- `REDIS_URL`
- `RABBIT_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `INTERNAL_API_KEY`
- `API_INTERNAL_URL`
- `VITE_API_URL`
- `VITE_SOCKET_URL`

Notlar:

- MongoDB parolasında özel karakter varsa connection string içinde URL-encode edilmelidir.
- `OTP_ECHO=true` yalnızca demo/testing senaryosu içindir; gerçek üretimde OTP email/SMS ile iletilmelidir.

## Bulut Dağıtımı

### Vercel

Frontend için `vercel.json` hazırdır.

Gerekli environment variable'lar:

- `VITE_API_URL=https://<api-domain>`
- `VITE_SOCKET_URL=https://<api-domain>`

### Render

`render.yaml` API ve worker servisleri için başlangıç şablonunu içerir.

API tarafında gerekli env seti:

- `NODE_ENV=production`
- `PORT=10000`
- `MONGO_URI=<atlas-uri>`
- `REDIS_URL=<upstash-uri>`
- `RABBIT_URL=<cloudamqp-uri>`
- `JWT_SECRET=<secret>`
- `JWT_REFRESH_SECRET=<secret>`
- `CORS_ORIGINS=https://<your-vercel-domain>`
- `INTERNAL_API_KEY=<shared-secret>`
- `OTP_ECHO=true` yalnızca demo gerekiyorsa

Worker tarafında gerekli env seti:

- `NODE_ENV=production`
- `MONGO_URI=<atlas-uri>`
- `REDIS_URL=<upstash-uri>`
- `RABBIT_URL=<cloudamqp-uri>`
- `INTERNAL_API_KEY=<shared-secret>`
- `API_INTERNAL_URL=https://<api-domain>/internal/realtime`

## Doğrulama Akışları

Health kontrolü:

```bash
curl -i https://<api-domain>/health
```

OTP isteme:

```bash
curl -X POST https://<api-domain>/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com"}'
```

OTP doğrulama:

```bash
curl -X POST https://<api-domain>/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","otp":"123456"}'
```

CRUD smoke akışı:

- `POST /api/projects`
- `GET /api/projects`
- `POST /api/tasks`
- `GET /api/tasks?projectId=...`
- `POST /api/comments`

Event doğrulaması:

- Worker loglarında `task_created`, `task_assigned`, `comment_added`
- Socket tarafında `task.updated`, `comment.added`

## Kalite Kapısı

- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `docker compose up -d --build`
- `pnpm --filter @sprintdock/web test:e2e`

## Dokümantasyon

- ADR'ler: `docs/ADRs`
- Mimari akış: `docs/architecture/realtime-flow.svg`
- ERD: `docs/ERD/sprintdock-erd.svg`
- Postman koleksiyonu: `docs/postman/SprintDock.postman_collection.json`
- İyileştirme günlüğü: `docs/uygulanan-iyilestirmeler.md`

## Lisans ve Kullanım

Bu repo portföy ve teknik gösterim amaçlı hazırlanmıştır. Canlı ortama çıkmadan önce secret yönetimi, OTP iletim altyapısı ve servis planları proje ihtiyaçlarına göre yeniden düzenlenmelidir.
