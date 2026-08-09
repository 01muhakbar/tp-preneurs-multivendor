# Oracle Cloud Always Free + TiDB Cloud Deployment Handoff

Use this path when you want the strongest free option and are comfortable managing a small VPS. The app runs as Docker containers on an Oracle Cloud Always Free VM, while TiDB Cloud provides the MySQL-compatible production database.

## 1. What You Need

- Oracle Cloud account with an Always Free VM.
- TiDB Cloud Starter database.
- A domain or subdomain pointed to the Oracle VM public IP.
- SSH access to the VM.

HTTPS is strongly recommended because production auth cookies use `COOKIE_SECURE=true`. The provided `deploy/oci/compose.yml` uses Caddy to request and renew TLS certificates automatically.

## 2. Create The Oracle VM

1. In Oracle Cloud, create an Always Free compute instance.
2. Prefer Ampere A1 ARM if capacity is available; otherwise use an Always Free AMD micro VM.
3. Use Ubuntu 24.04 or Ubuntu 22.04.
4. Add your SSH public key.
5. In the VM subnet/security list, allow inbound TCP:
   - `22` for SSH.
   - `80` for HTTP challenge/redirect.
   - `443` for HTTPS.

Do not expose port `3001` publicly. Caddy will proxy public traffic to the app container internally.

## 3. Create The TiDB Database

1. Create a TiDB Cloud Starter database.
2. Copy the MySQL-compatible connection settings.
3. Build `DATABASE_URL`:

```text
mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
```

URL-encode special characters in username/password, especially `@`, `:`, `/`, `#`, `?`, and `%`.

## 4. Install Docker On The VM

SSH into the VM:

```bash
ssh ubuntu@YOUR_VM_PUBLIC_IP
```

Install Docker:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
```

Log out and log back in so the Docker group applies.

## 5. Clone And Configure The App

```bash
git clone https://github.com/01muhakbar/tp-preneurs-multivendor.git
cd tp-preneurs-multivendor
cp deploy/oci/.env.example deploy/oci/.env
nano deploy/oci/.env
```

Set these values:

```text
DOMAIN=your-domain.example
ACME_EMAIL=you@example.com
DATABASE_URL=mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
JWT_SECRET=replace_with_at_least_24_random_characters
CLIENT_URL=https://your-domain.example
CORS_ORIGIN=https://your-domain.example
PUBLIC_BASE_URL=https://your-domain.example
```

Keep:

```text
NODE_ENV=production
DB_SYNC=false
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
COOKIE_SECURE=true
RATE_LIMIT_DISABLED=false
```

## 6. Point DNS To The VM

Create an `A` record:

```text
your-domain.example -> YOUR_VM_PUBLIC_IP
```

Wait until DNS resolves:

```bash
dig +short your-domain.example
```

## 7. Deploy

From the repo root on the VM:

```bash
docker compose -f deploy/oci/compose.yml --env-file deploy/oci/.env up -d --build
```

The app container runs:

```text
pnpm deploy:start
```

That applies migrations first and then starts the production server. The migration runner is idempotent and skips files already applied.

## 8. Verify

Check containers:

```bash
docker compose -f deploy/oci/compose.yml --env-file deploy/oci/.env ps
```

Check logs:

```bash
docker compose -f deploy/oci/compose.yml --env-file deploy/oci/.env logs -f app
docker compose -f deploy/oci/compose.yml --env-file deploy/oci/.env logs -f caddy
```

Open:

```text
https://your-domain.example/api/health
https://your-domain.example
```

Expected health response includes:

```json
{
  "ok": true,
  "db": "connected"
}
```

## 9. Updating The App

```bash
git pull
docker compose -f deploy/oci/compose.yml --env-file deploy/oci/.env up -d --build
```

## 10. Backups And Uploads

- TiDB Cloud should be treated as the durable database source.
- `app_uploads` is a Docker volume on the VM. Back it up before rebuilding or replacing the VM.
- For real production seller/admin media, move uploads to object storage such as Cloudflare R2.

## 11. Troubleshooting

- If HTTPS fails, confirm ports `80` and `443` are open in both Oracle security list and the VM firewall.
- If login cookies fail, confirm `CLIENT_URL`, `CORS_ORIGIN`, and `PUBLIC_BASE_URL` are exactly the HTTPS domain.
- If `/api/health` shows `db: disconnected`, re-check `DATABASE_URL`, TiDB allowlist/network access, and SSL env values.
- If the VM is ARM and a package has image/build trouble, retry on AMD micro or build with Docker Buildx. The current Node 22 Docker image is multi-architecture.
