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
- `startAutoRefresh` — kiosk/LED auto-refresh: a wall-clock heartbeat (checks every 5
  min) that calls `loadData(true)` in place every 12h. No page reload, so the
  sessionStorage login is never touched. Started at the end of `initApp`; no-ops after
  logout via an `if(!curUser)` guard.
- `fetchAll` — paginated OData fetch with 30s `AbortController` timeout.
- `renderAF` — All Forms table, **schema-driven** via `AF_SCHEMAS{report_title → {cols[], rowClick?}}`
  (`_default` = 14-col fallback). Form-specific views: EIS (`loadEisDetail`/`enrichEis`/
  `showEisDetail`) and QC Spot Check (`loadQcsDetail`/`enrichQcs`/`showQcsDetail`, r107) —
  each lazy-loads detail once and renders a dedicated modal. **When adding a form here:**
  declare its `*_TITLE` + `AF_*_COLS` consts *before* `const AF_SCHEMAS` (it uses them as a
  computed key) or you get a TDZ `ReferenceError` that blanks the whole app at load.
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
- **Versioning** (`APP_REV = YYYY.MM.DD-rNN[-iM]`): **bump the rev (`rNN→r(NN+1)`)** only for a
  new feature, a layout change, or removing functionality. A **pure bug fix keeps `rNN` and
  bumps an issue suffix** (`r107-i1`, `r107-i2`) so the rev doesn't inflate from every hotfix.
  Next feature → `r(NN+1)`, issue counter resets. Log fixes as "Issue 1/2/3" under that rev.
- **Repeater grouping** (multiple findings/CAs per report from `dwanalytics_report_field`):
  group by **`section_id`, never by `created_date`/time order** — Galileo interleaves a
  report's fields across instances, so time-ordering mixes them up (wrong dept/finding).
  Group `report_id → section_id` (group report_id first; header section_id can be shared
  across reports of the same form). Used by EIS, QC Spot Check, CMR/ECAR.

## Known issues / gotchas

- **Galileo HTTP 524**: the report-summary query is slow; the Cloudflare Worker
  times out (~100s) intermittently. `fetchAll` caps each request at 30s and
  `loadData` shows a retry overlay on failure. The root slowness is backend.
- **`dwanalytics_report_field` EAV query traps** (detail/finding views): `report_id` is
  NOT filterable — `report_id eq '<uuid>'` returns **HTTP 400**, so fetch by `field_name`
  and post-filter a `Set` of report_ids client-side. But a `field_name`-only query on a
  *generic* field name (e.g. `'Finding description'` ≈ 14k rows system-wide) blows past the
  30s `fetchAll` timeout and silently yields empty data. Narrow with a
  `report_raised_date ge <ISO>` clause (derive the cutoff from the form's earliest report in
  `allData`) and chunk long `field_name eq … or …` lists (~8/request) to stay under the
  ~100-node OData filter cap. See PROJECT_TECH_SPEC §8.8 / invariant I11.
- **Auth is Supabase Auth** (passwords are NOT stored in `public.users` — earlier
  docs claimed plaintext storage; that was wrong). The remaining hardening item is
  **Row Level Security** on `public.users`: it's still readable with the publishable
  key embedded in `index.html`, so enable RLS policies to lock down profile reads.

## Deploy

Push to `main` → GitHub Pages serves it at `vjc-qa-amo.com`. No CI, no build.
