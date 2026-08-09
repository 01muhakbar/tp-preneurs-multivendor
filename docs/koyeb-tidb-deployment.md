# Koyeb + TiDB Cloud Deployment Handoff

Use this path when Render free tier is too limiting or you want a second free hosting option. The app still uses the same Docker image and TiDB/MySQL-compatible `DATABASE_URL`.

## 1. Create The TiDB Database

1. Sign in to TiDB Cloud.
2. Create a Starter database.
3. Choose a region close to Koyeb. For the free Koyeb instance, choose the closest TiDB region available to your selected Koyeb region.
4. Copy the MySQL-compatible connection details.
5. Build a `DATABASE_URL`:

```text
mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
```

URL-encode special characters in username/password, especially `@`, `:`, `/`, `#`, `?`, and `%`.

## 2. Create The Koyeb Service

1. Open Koyeb and choose **Create Web Service**.
2. Select **GitHub** as the deployment method.
3. Select this repository: `01muhakbar/tp-preneurs-multivendor`.
4. Select branch `main`.
5. Select **Dockerfile** as the builder.
6. Set Dockerfile path to `Dockerfile`.
7. Select the free instance if available.
8. Expose port `3001` with protocol `HTTP`.
9. Set the public route path to `/`.
10. Set the health check path to `/api/health`.

Koyeb sets `PORT` automatically for exposed web services. This repo also defaults to `3001`, so explicit `PORT=3001` is safe if the UI asks for it.

## 3. Environment Variables

Use Koyeb bulk edit for the environment values:

```text
NODE_ENV=production
CLIENT_DIST_DIR=client/dist
DB_SYNC=false
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
AUTH_COOKIE_NAME=tp_auth
COOKIE_SECURE=true
UPLOAD_DIR=uploads
RATE_LIMIT_DISABLED=false
DATABASE_URL=mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
JWT_SECRET=replace_with_at_least_24_random_characters
```

On Koyeb, the server can infer `CLIENT_URL`, `CORS_ORIGIN`, and `PUBLIC_BASE_URL` from `KOYEB_PUBLIC_DOMAIN`. Set those manually only when you add a custom domain.

## 4. Startup And Migration

Use this Docker command:

```text
pnpm deploy:start
```

`deploy:start` runs migrations first, then starts the server. The migration runner is idempotent and skips files already applied.

## 5. Local Verification Before Deploy

Run:

```bash
pnpm.cmd deploy:verify
```

For a production database proof, run with the TiDB `DATABASE_URL` in your shell:

```bash
pnpm.cmd -F server migrate --print-config
pnpm.cmd -F server migrate --dry-run
```

Do not set `DB_SYNC=true` in production.

## 6. Known Free-Tier Limits

Koyeb free instances are suitable for demos and hobby projects. They have low CPU/RAM and local disk is not a durable production media store. Move real production uploads to object storage, such as Cloudflare R2, before accepting seller/admin media uploads.
