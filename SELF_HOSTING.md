# Self-Hosting Oddlytics

Oddlytics is designed to be self-hosted. This ensures **100% data ownership and privacy**. Your data never leaves your Cloudflare account.

## Architecture

Oddlytics consists of two parts:
1.  **API Worker (`packages/worker`)**: A Cloudflare Worker that receives events and stores them in a D1 database.
2.  **Dashboard (`packages/dashboard`)**: A Next.js app (which can be deployed to Cloudflare Pages or Vercel) to visualize the data.

Because you deploy the Worker and D1 database to *your own* Cloudflare account, no one else (not even the Oddlytics developers) can access your analytics data.

## Deployment Guide

### Prerequisites
- A [Cloudflare Account](https://dash.cloudflare.com/sign-up) (Free tier is sufficient for personal projects)
- Node.js installed

### 1. Backend Deployment (Worker)

1.  Navigate to the worker directory:
    ```bash
    cd packages/worker
    ```

2.  Login to Cloudflare:
    ```bash
    npx wrangler login
    ```

3.  Create the D1 database:
    ```bash
    npx wrangler d1 create oddlytics-db
    ```
    *Copy the `database_id` output from this command.*

4.  Update `wrangler.toml`:
    Replace the `database_id` in `wrangler.toml` with your new ID.

5.  Initialize the database schema:
    ```bash
    npx wrangler d1 execute oddlytics-db --file=./schema.sql
    ```

6.  Deploy the worker:
    ```bash
    npx wrangler deploy
    ```
    *Note the URL of your deployed worker (e.g., `https://oddlytics-worker.yourname.workers.dev`).*

7.  **Secure your API**:
    Generate a confusing secret key (e.g., a random UUID) and set it as a secret:
    ```bash
    npx wrangler secret put AUTH_KEY
    # Enter your random key when prompted
    ```

### 2. Dashboard Deployment

1.  Navigate to the dashboard directory:
    ```bash
    cd packages/dashboard
    ```

2.  Configure Environment:
    Create a `.env.local` file (or set these variables in your deployment platform):
    ```env
    NEXT_PUBLIC_API_URL=https://your-worker-url.workers.dev
    NEXT_PUBLIC_API_KEY=your-secret-auth-key
    ```

3.  Deploy:
    - **Vercel**: Import the project, set the Root Directory to `packages/dashboard`, and add the environment variables above.
    - **Cloudflare Pages**: Connect your repo, set the build command to `npm run build`, output directory to `.next`, and add environment variables.

## Connecting Your Apps

To send data to your new Oddlytics instance, simply POST JSON data to your worker URL:

```bash
POST https://your-worker-url.workers.dev/track
Header: X-API-KEY: your-secret-auth-key

{
  "event": "App Opened",
  "app_id": "my-awesome-app",
  "session_id": "user-session-123",
  "timestamp": "2024-03-20T10:00:00Z"
}
```

By keeping your `AUTH_KEY` secret and only using it on your backend or secure environments, you ensure that only authorized apps can write data. Reading data via the dashboard also requires this key (proxied via the Next.js API or used directly if you are okay with exposing it to dashboard users).
