# JustStory

Полнофункциональное приложение для интерактивных игр-сторителеров с использованием AI.

## Структура проекта

- `juststory_backend/` - NestJS backend API
- `juststory_frontend/` - Next.js frontend приложение

## Технологии

### Backend
- NestJS
- Prisma ORM
- SQLite
- Redis
- GigaChat AI
- JWT аутентификация

### Frontend
- Next.js 15
- React 19
- Redux Toolkit
- Tailwind CSS
- Framer Motion

## Быстрый старт

### Backend
```bash
cd juststory_backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

### Frontend
```bash
cd juststory_frontend
npm install
npm run dev
```

## Документация

Подробная документация находится в README файлах каждой части проекта.

