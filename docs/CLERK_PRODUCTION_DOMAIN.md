# Clerk production – custom domain (clerk.siodelhi.org)

**Production:** The production key (`pk_live_...`) is tied to **clerk.siodelhi.org**. Use it when that domain is set up (see below) or in your production build.

## Why localhost is rejected

Clerk **production** only allows requests when the browser’s **Origin** is your configured domain or a subdomain (e.g. `https://siodelhi.org`, `https://clerk.siodelhi.org`). When you open the app at **localhost** (e.g. `https://localhost:5174`), the Origin is `https://localhost:5174`, which is not `siodelhi.org` or a subdomain, so Clerk returns **400** and:

- *"Production Keys are only allowed for domain 'siodelhi.org'."*
- *"The Request HTTP Origin header must be equal to or a subdomain of the requesting URL."*

So **localhost is not allowed** by design. To use production keys and production users from your machine, you must use a **subdomain of siodelhi.org** that points to your machine (see Option C below).

**Simple local dev:** Use the **development** key (`pk_test_...`) in `.env.local`. The app will talk to Clerk’s dev instance; push users with `CLERK_SECRET_KEY=sk_test_... node scripts/push-users-to-clerk.mjs` to sign in locally.

## Option A: Dev-server proxy (no DNS needed for local dev) — advanced

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

## Option C: Use production Clerk from “local” (subdomain)

To use **production** keys and **production** users (e.g. `adnan1998`) while developing on your machine, the request Origin must be a subdomain of `siodelhi.org`. Do the following:

1. **Map a subdomain to this machine**  
   Add a line to your hosts file so `local.siodelhi.org` resolves to `127.0.0.1`:
   ```bash
   # Linux/macOS (run with sudo if needed)
   echo "127.0.0.1 local.siodelhi.org" | sudo tee -a /etc/hosts
   ```

2. **Run the app on HTTPS port 443**  
   Clerk’s origin check fails if the port is in the Origin (e.g. `https://local.siodelhi.org:5174`). You must use **port 443** so the Origin is `https://local.siodelhi.org` with no port.
   - Either run the Vite dev server on 443 (e.g. `sudo npm run dev` and set Vite’s port to 443, or use a local reverse proxy that listens on 443 and forwards to 5174).
   - Or use a tool like [mkcert](https://github.com/FiloSottile/mkcert) to create a cert for `local.siodelhi.org` and run your dev server with that cert on 443.

3. **Open the app at the subdomain**  
   In the browser, go to **`https://local.siodelhi.org`** (accept the self-signed cert warning if needed). The Origin will be `https://local.siodelhi.org`, which is a subdomain of `siodelhi.org`, so Clerk will accept the requests and you can sign in with production users.

4. **Use production key**  
   Keep `VITE_CLERK_PUBLISHABLE_KEY=pk_live_...` in `.env.local` so the app uses clerk.siodelhi.org.
