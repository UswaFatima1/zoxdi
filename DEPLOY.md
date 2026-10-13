# Publishing Zoxdi (free)

Zoxdi is a fully static website: `npm run build` writes a plain `out/` folder
that any host can serve. This guide uses the free stack:

| Piece | Service | Cost |
| --- | --- | --- |
| Hosting + free subdomain | **Cloudflare Pages** | free |
| Accounts + saved progress | **Supabase** | free tier |
| Traffic + engagement analytics | **Google Analytics 4** | free |
| Visitor counts (optional) | **Cloudflare Web Analytics** | free |

You can deploy with **no** Supabase or analytics keys at all — the site still
works. Each service you add simply turns on one feature.

---

## 1. Get the code somewhere Git-based

Cloudflare Pages deploys straight from a Git repo (GitHub and GitLab both work).
From the project folder:

```bash
git init
git add .
git commit -m "Zoxdi"
# create an empty repo on GitHub, then:
git remote add origin https://github.com/<you>/zoxdi.git
git push -u origin main
```

Not using Git? Skip to step 5 and drag-and-drop the `out/` folder instead.

## 2. Supabase — accounts and saved progress

1. **Create a project** at <https://supabase.com/dashboard> (pick a region near
   your visitors; save the database password somewhere safe).
2. Open **SQL Editor → New query**, paste the whole of
   [`supabase/schema.sql`](./supabase/schema.sql) and click **Run**. This creates
   the `progress` and `profiles` tables, row-level security, the auto-profile
   trigger and the public `leaderboard` view.
3. Go to **Authentication → Providers → Email** and make sure Email is enabled.
   For an instant, login-and-go experience **turn “Confirm email” off** — with it
   on, Supabase emails a confirmation link before the first sign-in works.
4. Go to **Authentication → URL Configuration** and set:
   - **Site URL**: `https://<your-project>.pages.dev`
   - **Redirect URLs**: add `https://<your-project>.pages.dev/**`
     (add `http://localhost:3000/**` too if you test locally).
5. Go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Only the public anon key is used, and every row is protected by row-level
security, so it is safe to ship in the browser bundle.

## 3. Google Analytics 4 — page views and events

1. Go to <https://analytics.google.com> → **Admin → Create property** (name it
   “Zoxdi”, choose a timezone and currency).
2. Add a **Web** data stream for your future site URL
   (`https://<your-project>.pages.dev`).
3. Copy the **Measurement ID** — it looks like `G-XXXXXXXXXX`.
4. Set it as `NEXT_PUBLIC_GA_MEASUREMENT_ID` in step 5.

Zoxdi sends:

- a `page_view` on every route change,
- a `login` event on a successful log in,
- a `sign_up` event on a successful sign-up.

You can watch them live under **Reports → Realtime**.

## 4. Cloudflare Web Analytics (optional)

A cookieless, banner-free visitor counter:

1. <https://dash.cloudflare.com> → **Analytics & Logs → Web Analytics → Add a
   site**, enter your Pages URL, and copy the **beacon token**.
2. Set it as `NEXT_PUBLIC_CF_ANALYTICS_TOKEN` in step 5.

## 5. Deploy on Cloudflare Pages

1. <https://dash.cloudflare.com> → **Workers & Pages → Create → Pages →
   Connect to Git**, and pick your `zoxdi` repo.
2. Build settings:
   - **Framework preset**: `Next.js (Static HTML Export)`
   - **Build command**: `npm run build`
   - **Build output directory**: `out`
3. **Environment variables** (add for both Production and Preview):

   | Name | Value |
   | --- | --- |
   | `NODE_VERSION` | `20` |
   | `NEXT_PUBLIC_SUPABASE_URL` | from step 2 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from step 2 |
   | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-XXXXXXXXXX` (or leave blank) |
   | `NEXT_PUBLIC_CF_ANALYTICS_TOKEN` | optional |

   These are all public values baked into the build — never put a secret here.
4. Click **Save and Deploy**. The first build takes a couple of minutes, then
   your site is live at `https://<your-project>.pages.dev` — a **free address**,
   no card required.

Drag-and-drop alternative: run `npm run build` locally and drag the `out` folder
onto **Workers & Pages → Create → Pages → Upload assets**.

## 6. Your own domain (optional)

A free *real* `.com` does not exist — Freenom and friends are gone. Your
`*.pages.dev` address is free forever; if you want a memorable custom domain it
costs roughly **$8–12 / year**:

1. Buy the domain (Cloudflare Registrar sells at wholesale cost).
2. In the Pages project → **Custom domains → Set up a domain**, enter it, and
   follow the DNS prompt.
3. Update the Supabase **Site URL / Redirect URLs** (step 2.4) and the GA4 data
   stream URL (step 3) to the new domain, then redeploy.

---

## Local check before you ship

```bash
npm install
npm run typecheck
npm test
npm run build          # writes out/
node scripts/serve-static.mjs 4173 out
# open http://localhost:4173
```

To exercise the cloud flow locally, copy `.env.example` to `.env.local`, fill in
the Supabase URL/key, run `npm run build`, and reload.

## Troubleshooting

- **Sign-up says “check your email”.** Email confirmation is still on in
  Supabase. Turn it off (step 2.3) or click the link in the email.
- **Signed in, but progress does not follow me to another device.** Check the
  Supabase URL/key are set as **build** environment variables and redeploy; run
  `supabase/schema.sql` if you skipped it.
- **Analytics shows nothing.** GA4 reports can lag a few minutes; confirm
  `NEXT_PUBLIC_GA_MEASUREMENT_ID` was present at build time (values are baked in,
  so env changes require a new deploy).
- **A page 404s on refresh.** Cloudflare Pages serves `out/` directly; Zoxdi
  builds with trailing slashes so every route is a real `index.html`.
