# Getting Started — Convoi Backend

This guide walks you through setting up the Convoi backend locally, from a fresh clone to a running API with Google sign-in.

## Prerequisites

- **Node.js** 22+ (or [Bun](https://bun.sh/))
- **PostgreSQL** 14+ running locally (or a hosted instance)
- A **Google Cloud** project (only if you want Google sign-in)

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment variables

Copy the example file and edit it:

```bash
cp .env.example .env
```

Minimum required values:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/convoi
AUTH_SECRET=some-random-secret-of-at-least-32-characters
APP_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

> **`AUTH_SECRET`** must be at least 32 characters. Generate one with:
>
> ```bash
> openssl rand -base64 48
> ```

All other variables are optional — see [`.env.example`](../.env.example) for their defaults.

## 3. Create the database

```bash
createdb convoi
# or, with psql:
psql -U postgres -c "CREATE DATABASE convoi;"
```

Make sure the `DATABASE_URL` in `.env` points to this database.

## 4. Apply migrations

```bash
npm run db:migrate
```

This creates all tables (`user`, `session`, `account`, `verification`, `vehicle`, `trip`, `reservation`, `message`) and their indexes.

## 5. Start the dev server

```bash
npm run dev
```

The API is now available at `http://localhost:3000`.

## 6. Explore the API

- **Interactive docs (Scalar):** http://localhost:3000/docs/scalar
- **Swagger UI:** http://localhost:3000/docs/swagger
- **OpenAPI JSON:** http://localhost:3000/docs/openapi.json

### Quick test with curl

```bash
# Sign up
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"password123"}'

# Sign in (stores the session cookie)
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}' \
  -c cookies.txt

# Get your profile
curl http://localhost:3000/api/users/me -b cookies.txt
```

## 7. Configure Google OAuth (optional)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and create an **OAuth 2.0 Client ID** (Web application).
2. Add the authorized redirect URI:
   ```
   http://localhost:3000/api/oauth/callback/google
   ```
3. Copy the client ID and secret into `.env`:
   ```env
   GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxxx
   ```
4. Restart the dev server. Sign-in with Google is now available via the OAuth callback route.

## Common commands

| Command               | Purpose                                   |
| --------------------- | ----------------------------------------- |
| `npm run dev`         | Start the dev server                      |
| `npm run db:generate` | Generate a migration after schema changes |
| `npm run db:migrate`  | Apply pending migrations                  |
| `npm run db:push`     | Push schema directly (dev only)           |
| `npm run db:studio`   | Browse the database with Drizzle Studio   |
| `npm run lint`        | Lint with ESLint                          |
| `npm run format`      | Format with Prettier                      |
| `npm run build`       | Production build                          |

## Troubleshooting

**`DATABASE_URL is required` / connection errors**
Make sure `.env` exists and `DATABASE_URL` points to a reachable PostgreSQL instance.

**`AUTH_SECRET must be at least 32 characters long`**
Your `AUTH_SECRET` is too short — use a random value of 32+ characters.

**CORS errors from the frontend**
The default allowed origin is `http://localhost:5173`. If your frontend runs elsewhere, set `CORS_ORIGINS` to a comma-separated list of origins.

**Google sign-in fails**

- Verify the redirect URI in Google Cloud matches `{APP_URL}/api/oauth/callback/google`.
- Make sure `APP_URL` in `.env` matches the URL you're actually using.
- Confirm `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are correct.

**401 on protected routes**
The session cookie is `httpOnly` and `secure`. Over plain `http` on a non-localhost host, the browser may refuse to send it — use `localhost` during development.
