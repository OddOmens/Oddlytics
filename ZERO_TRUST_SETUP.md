# Enabling Zero Trust for Oddlytics

To secure your dashboard so only you can access it, follow these steps in the Cloudflare Dashboard.

1. **Go to Cloudflare Zero Trust**
   - Navigate to [one.dash.cloudflare.com](https://one.dash.cloudflare.com).

2. **Create an Application**
   - Go to **Access** > **Applications**.
   - Click **Add an Application**.
   - Select **Self-hosted**.

3. **Configure Application**
   - **Application Name**: `Oddlytics Dashboard`
   - **Session Duration**: `24h`
   - **Application Domain**:
     - Subdomain: `oddlytics-dashboard` (or whatever your pages domain is, e.g. `d54ab79a.oddlytics-dashboard.pages.dev`)
     - *Note: If using the `.pages.dev` subdomain directly, you might need to use Cloudflare Access for Pages specifically via the Pages settings, or add a Custom Domain to your Pages project first.*

   **Alternative (Easier for Pages):**
   1. Go to **Workers & Pages**.
   2. Select your `oddlytics-dashboard` project.
   3. Go to **Settings** > **Access Policy**.
   4. Click **Enable Access Policy**.

4. **Create a Policy**
   - **Policy Name**: `Admin Only`
   - **Action**: `Allow`
   - **Configure Rules**:
     - **Include**: selector `Email`
     - **Value**: `your-email@example.com` (Enter your actual email)

5. **Save**
   - Click **Next** and complete the setup.

Now, whenever you visit your dashboard URL, you will be prompted to enter your email. A code will be sent to you to log in.
