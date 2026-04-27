# CyberTracker frontend

Веб-клиент для CyberTracker: **React 19**, **React Router 7** (фреймворк + Vite), **TanStack Query**, типизированные запросы к REST через **openapi-fetch** / **openapi-react-query** по спецификации **OpenAPI**. Стили — **Tailwind CSS 4**, компоненты на базе **Radix UI** / **shadcn**. Сборка по умолчанию **без SSR** (`react-router.config.ts`: `ssr: false`).

## Требования

- **Node.js** ≥ 22  
- **npm** (или совместимый менеджер пакетов)  
- **Docker** (опционально, для сборки образа из `Dockerfile`)

## Документация API

OpenAPI-контракт для клиента лежит в **`openapi.yaml`** (вручную синхронизируется с бэкендом). Живая документация эндпоинтов — в [backend/README.md](../backend/README.md) (Scalar, Swagger, ReDoc, `/openapi.json`).

## Структура кода

Код в каталоге **`app/`**: маршруты, общий layout, клиент API, состояние авторизации, UI.

- **`app/routes.ts`**: декларация маршрутов React Router (дерево `layout` / `route` / `index`).
- **`app/root.tsx`**: корневой HTML-шелл, обработка ошибок маршрута, подключение провайдеров.
- **`app/providers.tsx`**: обёртка приложения (React Query, тема, toast).
- **`app/routes/_layout.tsx`**: общий каркас страниц (шапка, выход, `Outlet`).
- **`app/routes/`**: экраны приложения (домашняя, логин/регистрация, дисциплины, турниры, профиль, орг-зона, админка, персонал).
- **`app/lib/api.client.ts`**: `openapi-fetch` + `openapi-react-query`, базовый URL из env, **Bearer** и обновление access-токена через `/api/auth/refresh`.
- **`app/lib/api.schema.ts`**: типы `paths` / `components`, генерируются из `openapi.yaml` (**не править вручную** — см. раздел про `api:gen`).
- **`app/lib/api.types.ts`**: узкие алиасы типов для удобства импорта в экранах.
- **`app/lib/api-errors.ts`**: разбор тел ошибок API для toast/форм.
- **`app/lib/roles.ts`**: проверки ролей для условного UI (организатор, админ, судья и т.д.).
- **`app/lib/query.client.ts`**: фабрика клиента React Query (если используется отдельно от `$api`).
- **`app/lib/utils.ts`**: утилиты (`cn` и др.).
- **`app/store/auth.store.ts`**: **zustand** — access/refresh токены и синхронизация с `localStorage`.
- **`app/hooks/`**: хуки (`use-me`, `use-logout`).
- **`app/components/`**: прикладные блоки (шапка, пагинация, QR) и **`app/components/ui/`** — переиспользуемые контролы (кнопки, поля, таблицы, диалоги).
- **`app/app.css`**: глобальные стили и токены Tailwind.
- **`vite.config.ts`**: плагины Vite — **React Router**, **Tailwind**.
- **`react-router.config.ts`**: флаги фреймворка (в т.ч. **SSR**).
- **`openapi.yaml`**: схема API для генерации типов и как договорённость с бэкендом.

## Конфигурация

Параметры задаются переменными окружения и файлом **`.env`** (шаблон — **`.env.example`**).

| Переменная | Назначение |
|------------|------------|
| **`VITE_PUBLIC_API_BASE_URL`** | Origin бэкенда **без** завершающего слэша (в коде пути вида `/api/...`), например `http://127.0.0.1:8000`. |

## Локальная разработка

Установка зависимостей и dev-сервер (Vite):

```bash
npm ci
npm run dev
```

Проверка типов (генерация типов маршрутов + `tsc`):

```bash
npm run typecheck
```

Сборка продакшен-артефактов и запуск Node-сервера раздачи (как в Docker):

```bash
npm run build
npm run start
```

## Генерация типов из OpenAPI

После изменений в **`openapi.yaml`** (или при подтягивании актуальной схемы с бэкенда):

```bash
npm run api:gen
```

Обновляется **`app/lib/api.schema.ts`**.

## Docker: образ фронтенда

Сборка и запуск из каталога **`frontend/`** (порт по умолчанию у `react-router-serve` — уточняйте в логах или задайте через переменные окружения фреймворка):

```bash
docker build -t cybertracker-frontend .
docker run --rm -p 3000:3000 -e PORT=3000 cybertracker-frontend
```

Многостадийная сборка описана в **`Dockerfile`**: `npm ci` → `npm run build` → продакшен-зависимости и **`npm run start`** на артефакте `build/`.

## Линтинг и форматирование

```bash
npm run check
```

Используется **Biome** (`biome check --write` по скрипту `check`).
