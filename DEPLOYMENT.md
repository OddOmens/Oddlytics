# Oddlytics Deployment Guide

## Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/): `npm install -g wrangler`
- Node.js 18+

## Step 1: Authenticate with Cloudflare

```bash
wrangler login
```

## Step 2: Create D1 Database

```bash
wrangler d1 create oddlytics-db
```

Copy the `database_id` from the output.

## Step 3: Update wrangler.toml

Edit `packages/worker/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "oddlytics-db"
database_id = "YOUR_DATABASE_ID_HERE"  # Paste the ID from step 2
```

## Step 4: Initialize Database Schema

```bash
wrangler d1 execute oddlytics-db --file=./schema.sql
```

## Step 5: Set API Key Secret

```bash
wrangler secret put AUTH_KEY
```

When prompted, enter a secure random string (e.g., generate with `openssl rand -hex 32`).

## Step 6: Deploy Worker

```bash
cd packages/worker
npm install
wrangler deploy
```

Note the Worker URL (e.g., `https://oddlytics-worker.your-subdomain.workers.dev`).

## Step 7: Configure Dashboard

Create `packages/dashboard/.env.local`:

```
NEXT_PUBLIC_API_URL=https://oddlytics-worker.your-subdomain.workers.dev
```

## Step 8: Deploy Dashboard to Cloudflare Pages

```bash
cd packages/dashboard
npm run build
```

### Option A: Deploy via Wrangler

```bash
npx wrangler pages deploy out --project-name=oddlytics-dashboard
```

### Option B: Connect GitHub Repository

1. Go to [Cloudflare Pages](https://dash.cloudflare.com/pages)
2. Click "Create a project"
3. Connect your GitHub repository
4. Set build settings:
   - Build command: `cd packages/dashboard && npm install && npm run build`
   - Build output directory: `packages/dashboard/out`
   - Environment variable: `NEXT_PUBLIC_API_URL` = your Worker URL

## Step 9: Configure Cloudflare Access (Optional)

Protect your dashboard with GitHub/Google login:

1. Go to [Cloudflare Zero Trust](https://one.dash.cloudflare.com/)
2. Navigate to Access > Applications
3. Add an application:
   - Application name: Oddlytics Dashboard
   - Subdomain: your-dashboard
   - Policy: Allow emails (add your email)
4. Save application

## Step 10: Use in iOS Apps

In your Swift app:

```swift
import Oddlytics

// In your App or AppDelegate
Analytics.configure(
    endpoint: "https://oddlytics-worker.your-subdomain.workers.dev",
    apiKey: "YOUR_AUTH_KEY_HERE",
    appId: "MyAwesomeApp"
)

// Track events
Analytics.track("app_opened")
Analytics.track("button_tapped", metadata: ["button": "login"])
```

## Monitoring & Limits

### Cloudflare Free Tier Limits

- D1: 5GB storage, 5M reads/day, 100k writes/day
- Workers: 100k requests/day
- Pages: Unlimited bandwidth, 500 builds/month

### Check Usage

```bash
wrangler d1 info oddlytics-db
```

### View Worker Logs

```bash
wrangler tail
```

## Troubleshooting

### "Database not found"
- Verify `database_id` in `wrangler.toml` matches output from `wrangler d1 create`

### "Unauthorized" when tracking events
- Verify `AUTH_KEY` secret is set: `wrangler secret list`
- Check API key in Swift app matches

### Dashboard shows no data
- Verify `NEXT_PUBLIC_API_URL` points to correct Worker URL
- Check Worker logs with `wrangler tail`
- Test API manually: `curl https://your-worker.workers.dev/stats/overview`

## Updating

### Update Worker

```bash
cd packages/worker
git pull
wrangler deploy
```

### Update Dashboard

```bash
cd packages/dashboard
git pull
npm run build
npx wrangler pages deploy out
```

Or push to `main` if using GitHub integration.

### Update Database Schema

```bash
wrangler d1 execute oddlytics-db --file=./schema.sql
```

Note: Be careful with schema changes on existing data. Consider migrations for production.
