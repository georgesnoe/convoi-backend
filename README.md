# Convoi Backend

Backend API for **Convoi**, a carpooling / ride-sharing application. It handles authentication (email/password + Google OAuth), user profiles, vehicles, trips, reservations and messaging.

Built with [Nitro v3](https://nitro.build/), [h3](https://h3.dev/), [Vite](https://vite.dev/) and [rolldown](https://rolldown.rs/).

## Stack

| Layer            | Technology                                                                |
| ---------------- | ------------------------------------------------------------------------- |
| Server framework | [Nitro v3](https://nitro.build/) + [h3](https://h3.dev/)                  |
| Build tooling    | [Vite](https://vite.dev/) + [rolldown](https://rolldown.rs/)              |
| Database         | PostgreSQL via [Drizzle ORM](https://orm.drizzle.team/) (db0 integration) |
| Validation       | [Zod](https://zod.dev/) v4                                                |
| Auth             | bcrypt (passwords), session cookies, Google OAuth 2.0 (PKCE)              |
| API docs         | OpenAPI + [Scalar](https://scalar.com/) / Swagger UI                      |

## Features

- **Authentication**
  - Sign-up / sign-in / sign-out with email + password (bcrypt-hashed)
  - Google OAuth 2.0 with PKCE (`/api/oauth/callback/google`)
  - HttpOnly session cookies with configurable lifetime
- **Users**
  - Profile retrieval and update (`name`, `image`, `type`: `conductor` | `passenger`)
- **Vehicles** (registered by conductors)
  - Create, list own, update and delete — owner-only for update/delete
- **Trips** (published by conductors)
  - Create (conductor-only), list, update and delete (owner-only)
  - `once` or `weekly` frequency with `weekDays` bitmask
- **Reservations**
  - Create a reservation on a trip (snapshots the trip details)
  - Visible to the passenger and the trip's vehicle owner
  - Only the vehicle owner can confirm; the passenger can delete
- **Messaging**
  - Send, list (as sender or receiver), update and delete messages
  - Sender edits content, receiver marks as read
- **API documentation** — interactive OpenAPI docs at `/docs/scalar` and `/docs/swagger`

## Project structure

```
├── server/
│   ├── api/                 # /api route handlers
│   │   ├── auth/            # sign-in, sign-up, sign-out
│   │   ├── oauth/           # Google OAuth callback
│   │   ├── users/           # /api/users/me
│   │   ├── vehicles/        # /api/vehicles
│   │   ├── trips/           # /api/trips
│   │   ├── reservations/    # /api/reservations
│   │   └── messages/        # /api/messages
│   ├── middleware/          # global middleware (01.auth, 02.conductor)
│   ├── routes/              # non-prefixed route handlers
│   └── utils/               # auth, env, db (schema + config), oauth
├── drizzle/                 # generated SQL migrations
├── public/                  # static assets
├── nitro.config.ts          # server config (db, openAPI, CORS)
├── drizzle.config.ts        # drizzle-kit config
└── vite.config.ts           # Vite + Nitro plugin
```

## Getting started

```bash
npm install
cp .env.example .env   # then fill in the values
npm run db:migrate     # apply database migrations
npm run dev
```

The API is then available at `http://localhost:3000` and the interactive docs at `http://localhost:3000/docs/scalar`.

See the **[Getting Started guide](docs/getting-started.md)** for a detailed walkthrough (database setup, Google OAuth configuration, testing with curl, troubleshooting).

## API overview

| Method   | Route                        | Description               | Access                    |
| -------- | ---------------------------- | ------------------------- | ------------------------- |
| `POST`   | `/api/auth/sign-up`          | Create an account         | public                    |
| `POST`   | `/api/auth/sign-in`          | Sign in                   | public                    |
| `POST`   | `/api/auth/sign-out`         | Sign out                  | public                    |
| `GET`    | `/api/oauth/callback/google` | Google OAuth callback     | public                    |
| `GET`    | `/api/users/me`              | Current user profile      | authenticated             |
| `PATCH`  | `/api/users/me`              | Update profile            | authenticated             |
| `POST`   | `/api/vehicles`              | Create a vehicle          | conductor                 |
| `GET`    | `/api/vehicles`              | List own vehicles         | authenticated             |
| `PATCH`  | `/api/vehicles/:id`          | Update a vehicle          | owner                     |
| `DELETE` | `/api/vehicles/:id`          | Delete a vehicle          | owner                     |
| `POST`   | `/api/trips`                 | Create a trip             | conductor                 |
| `GET`    | `/api/trips`                 | List trips                | authenticated             |
| `PATCH`  | `/api/trips/:id`             | Update a trip             | owner                     |
| `DELETE` | `/api/trips/:id`             | Delete a trip             | owner                     |
| `POST`   | `/api/reservations`          | Create a reservation      | authenticated             |
| `GET`    | `/api/reservations`          | List visible reservations | passenger / vehicle owner |
| `PATCH`  | `/api/reservations/:id`      | Update a reservation      | passenger / vehicle owner |
| `DELETE` | `/api/reservations/:id`      | Delete a reservation      | passenger                 |
| `POST`   | `/api/messages`              | Send a message            | authenticated             |
| `GET`    | `/api/messages`              | List related messages     | sender / receiver         |
| `PATCH`  | `/api/messages/:id`          | Update a message          | sender / receiver         |
| `DELETE` | `/api/messages/:id`          | Delete a message          | sender                    |

## Environment variables

See [`.env.example`](.env.example) for the full list with comments.

| Variable               | Required | Default                 | Description                            |
| ---------------------- | -------- | ----------------------- | -------------------------------------- |
| `DATABASE_URL`         | ✅       | —                       | PostgreSQL connection string           |
| `AUTH_SECRET`          | ✅       | —                       | Session secret (min 32 chars)          |
| `APP_URL`              | ✅       | —                       | Public base URL (OAuth redirects)      |
| `GOOGLE_CLIENT_ID`     | ✅       | —                       | Google OAuth client ID                 |
| `GOOGLE_CLIENT_SECRET` | ✅       | —                       | Google OAuth client secret             |
| `SESSION_COOKIE_NAME`  | —        | `SESSION_COOKIE`        | Session cookie name                    |
| `SESSION_DURATION_MS`  | —        | `3600000`               | Session lifetime (ms)                  |
| `SALT_ROUNDS`          | —        | `10`                    | bcrypt salt rounds                     |
| `CORS_ORIGINS`         | —        | `http://localhost:5173` | Allowed CORS origins (comma-separated) |

## Database & migrations

The schema lives in `server/utils/db/schema.ts` and is managed with [drizzle-kit](https://orm.drizzle.team/kit/).

```bash
npm run db:generate   # generate a new migration from schema changes
npm run db:migrate    # apply pending migrations
npm run db:push       # push schema directly (dev only)
npm run db:studio     # open Drizzle Studio
```

## Scripts

| Script                            | Description                  |
| --------------------------------- | ---------------------------- |
| `npm run dev`                     | Start the dev server         |
| `npm run build`                   | Build for production         |
| `npm run preview`                 | Preview the production build |
| `npm run lint` / `lint:fix`       | Lint with ESLint             |
| `npm run format` / `format:check` | Format with Prettier         |
| `npm run db:*`                    | Database tooling (see above) |

## Deploying

```bash
npm run build
npm run preview
```

Then checkout the [Nitro documentation](https://nitro.build/deploy) to learn more about the different deployment presets (the project is configured with the `bun` preset in `nitro.config.ts`).
