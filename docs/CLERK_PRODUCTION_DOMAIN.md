# Clerk production – custom domain (clerk.siodelhi.org)

The app uses the **production** Clerk key so sign-in uses the same instance where users were pushed (`pk_live_...` / `sk_live_...`). That key is tied to **clerk.siodelhi.org**, which may not resolve yet (e.g. before DNS is set).

## Option A: Dev-server proxy (no DNS needed for local dev)

The Vite dev server can proxy Clerk requests so the app works **without** clerk.siodelhi.org resolving:

1. **Add your secret key**  
   In the project root `.env.local`, add (use the same value as in `api/.env`):
   ```env
   CLERK_SECRET_KEY=sk_live_...
   ```

2. **Enable proxy in Clerk Dashboard**  
   - Go to [Clerk Dashboard](https://dashboard.clerk.com) → your **production** app → **Configure** → **Domains**.  
   - Under **Frontend API**, open the **Advanced** section.  
   - Set **Proxy URL** to: `http://localhost:5173/__clerk` (or your dev server URL, e.g. `http://localhost:5174/__clerk` if port 5174).  
   - Save. If Clerk validates the URL and your dev server is not reachable from the internet, use Option B (DNS) or a tunnel (e.g. ngrok) for the proxy URL.

3. **Run the app**  
   Restart the dev server (`npm run dev`). The app will load Clerk via `http://localhost:5173/__clerk` and sign-in (e.g. `adnan1998`) will use production users.

## Option B: Fix DNS (for production and no proxy)

1. **Clerk Dashboard**  
   Go to [Clerk Dashboard](https://dashboard.clerk.com) → your **production** application → **Domains**.

2. **Add custom domain**  
   Ensure **clerk.siodelhi.org** is set as the Frontend API domain. Clerk will show the required **DNS record** (usually a CNAME).

3. **DNS**  
   At your DNS provider for `siodelhi.org`, add the CNAME Clerk shows (e.g. **Name:** `clerk`, **Target:** the value Clerk gives).

4. **Verify**  
   In Clerk Dashboard, verify the domain. Once it resolves, the app can load Clerk from `https://clerk.siodelhi.org` without using the dev proxy.
