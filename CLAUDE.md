# CLAUDE.md

QA AMO Dashboard — VietJet Air Quality Assurance reporting portal.

## What this is

A single-page dashboard for VietJet Air's QA AMO (Aircraft Maintenance Organization)
quality reports: open RFIs, overdue findings, KPI charts, audit plans, exports.
UI language is Vietnamese.

## Architecture — read this first

The **entire app is one file: `index.html`** (~8000 lines). HTML + CSS + JS inline.
There is no build step, no `package.json`, no `node_modules`, no framework.

- `CNAME` — GitHub Pages custom domain (`vjc-qa-amo.com`). Deploy = push to `main`.
- Libraries load from CDN (in `<head>`): Chart.js 4.4.1, supabase-js 2, jsPDF 2.5.1,
  html2canvas 1.4.1, xlsx 0.18.5.

### Two backends — do not confuse them

1. **Supabase** (`SUPA_URL`/`SUPA_KEY`) — auth only, via **Supabase Auth**.
   `doLogin`/`doRegister` call `sb.auth.signInWithPassword` / `sb.auth.signUp`, so
   credentials live in Supabase's managed `auth.users` (bcrypt-hashed). The
   `public.users` table is a **profile table only** — `supabase_id` (FK to
   `auth.users`), `email`, `full_name`, `role`, `created_at`. **No password column.**
2. **Galileo** (`G_URL`, ~line 768) — report data. A Cloudflare Worker proxy
   (`galileo-proxy.*.workers.dev`) in front of an OData API. All report/workflow/
   audit data comes from here via `fetchAll()`.

### Key functions (search by name in `index.html`)

- `doLogin` / `doRegister` / `doLogout` — auth flow against Supabase `users`.
- `initApp` — runs after login, builds UI shell, calls `loadData`.
- `loadData` — fetches reports from Galileo in stages, builds `allData` / `auditData`.
- `fetchAll` — paginated OData fetch with 30s `AbortController` timeout.
- `renderAll` — renders every page from `allData`.
- `showPage` — sidebar nav / page switching.
- `setOv` / `showLoadError` — loading overlay + error/retry state.
- `loadUsers` / `approveUser` / `rejectUser` / `makeAdmin` — admin user management.

## Running locally

```
python -m http.server 8000
```
Open `http://localhost:8000`. Login uses the live Supabase backend.
Galileo proxy is also remote — local run hits production data.

## Conventions

- Plain ES (no modules). Globals: `curUser`, `allData`, `auditData`, `charts`.
- `g(id)` = `getElementById`; `s(id,txt)` = set textContent. Used everywhere.
- Vietnamese strings in UI text and toasts — keep new user-facing text Vietnamese.
- Edits are surgical: this is one giant file, match the existing inline style.
- **Year filters are multi-year** via a shared widget (`initYearMulti(id, years, {onChange, default})`).
  Each page mounts a `<div class="ymulti" id="...">`; read selections with `ymHas(id, value)`
  (true when "all"), `ymVal(id)` (array; `[]` = all), `ymText(id)` (label), `ymReset(id)`.
  Do NOT use `g(id).value` on these — they're divs, not `<select>`s.
- **Admin-only tools**: Export Reports, Query Builder, My Dashboard, Early Detection, User
  Management live under the sidebar `#adminNav` block. Every export button carries the
  `.admin-only` class (hidden for viewers) AND its handler re-checks `curUser.role==='admin'`.
  `showPage` also blocks direct navigation to those pages for non-admins.

## Known issues / gotchas

- **Galileo HTTP 524**: the report-summary query is slow; the Cloudflare Worker
  times out (~100s) intermittently. `fetchAll` caps each request at 30s and
  `loadData` shows a retry overlay on failure. The root slowness is backend.
- **Auth is Supabase Auth** (passwords are NOT stored in `public.users` — earlier
  docs claimed plaintext storage; that was wrong). The remaining hardening item is
  **Row Level Security** on `public.users`: it's still readable with the publishable
  key embedded in `index.html`, so enable RLS policies to lock down profile reads.

## Deploy

Push to `main` → GitHub Pages serves it at `vjc-qa-amo.com`. No CI, no build.
