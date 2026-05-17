# CLAUDE.md

QA AMO Dashboard — VietJet Air Quality Assurance reporting portal.

## What this is

A single-page dashboard for VietJet Air's QA AMO (Aircraft Maintenance Organization)
quality reports: open RFIs, overdue findings, KPI charts, audit plans, exports.
UI language is Vietnamese.

## Architecture — read this first

The **entire app is one file: `index.html`** (~2030 lines). HTML + CSS + JS inline.
There is no build step, no `package.json`, no `node_modules`, no framework.

- `CNAME` — GitHub Pages custom domain (`vjc-qa-amo.com`). Deploy = push to `main`.
- Libraries load from CDN (in `<head>`): Chart.js 4.4.1, supabase-js 2, jsPDF 2.5.1,
  html2canvas 1.4.1, xlsx 0.18.5.

### Two backends — do not confuse them

1. **Supabase** (`SUPA_URL`/`SUPA_KEY`, ~line 766) — auth only. The `users` table
   holds login accounts (email, password, role, approval state).
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

## Known issues / gotchas

- **Galileo HTTP 524**: the report-summary query is slow; the Cloudflare Worker
  times out (~100s) intermittently. `fetchAll` caps each request at 30s and
  `loadData` shows a retry overlay on failure. The root slowness is backend.
- **Security — passwords stored plaintext** in the Supabase `users` table, and the
  table is readable with the publishable key embedded in `index.html`. Not yet
  fixed. Real fix = Supabase Auth + Row Level Security.

## Deploy

Push to `main` → GitHub Pages serves it at `vjc-qa-amo.com`. No CI, no build.
