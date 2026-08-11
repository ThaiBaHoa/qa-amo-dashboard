# CLAUDE.md — QA AMO Dashboard

QA AMO Dashboard — VietJet Air Quality Assurance reporting portal.

---

## Quy trình chuẩn & skills

Toàn bộ vòng đời một thay đổi (sửa code → bump rev → cập nhật tài liệu kèm theo →
commit → hook backup → push/deploy → ghi nhận) được chuẩn hóa trong skill
**`quy-trinh-chuan`** (`.claude/skills/quy-trinh-chuan/`) — **mở skill này khi bắt đầu
một thay đổi hoặc khi chưa chắc bước tiếp theo**. Các skill con:

- **`probe-spec`** — Probe→Spec→Implement cho dữ liệu Galileo OData.
- **`cap-nhat-revision`** — bump `APP_REV` r### + commit đúng luật.
- (workspace) **`bao-cao-tuan`** — báo cáo tuần `.docx`; **`kiem-tra-dong-bo`** — check sync.

Skills được version hóa trong repo (`.claude/skills/`) → clone máy khác là có ngay.

---

## Behavior principles (Karpathy)

These apply to every task in this repo.

**Think before coding.** State assumptions explicitly. When a request is ambiguous, surface the
interpretations before picking one. Push back if a simpler approach exists. If confused about
Galileo data shape or OData behavior, say so and ask — do not guess and run.

**Simplicity first.** Write the minimum code that solves the problem. No speculative features,
no abstractions for single-use code, no flexibility that was not asked for. If 200 lines can
be 50, rewrite it. Would a senior engineer call this overcomplicated? If yes, simplify.

**Surgical changes.** `index.html` is ~8,700 lines. Touch only what the task requires. Do not
"improve" adjacent code, comments, or formatting. Do not refactor working code. Match the
existing inline style even if you would do it differently. If you notice unrelated dead code,
mention it — do not delete it. Remove only imports/vars/functions that *your* change made unused.
Every changed line must trace directly to the user's request.

**Goal-driven execution.** Define success criteria before writing code. For bug fixes: identify
the exact failure condition first, then fix, then verify the condition is gone. For multi-step
tasks, state a brief plan with per-step verification checkpoints before starting.

---

## What this is

A single-page dashboard for VietJet Air's QA AMO (Aircraft Maintenance Organization)
quality reports: open RFIs, overdue findings, KPI charts, audit plans, exports.
**UI language is English.** All user-facing dashboard text is English; Vietnamese is
used only for developer conversation and code comments, never in what the user sees.

---

## Architecture — read this first

The **entire app is one file: `index.html`** (~8,700 lines). HTML + CSS + JS inline.
There is no build step, no `package.json`, no `node_modules`, no framework.

- `CNAME` — GitHub Pages custom domain (`vjc-qa-amo.com`). Deploy = push to `main`.
- Libraries load from CDN (in `<head>`): Chart.js 4.4.1, supabase-js 2, jsPDF 2.5.1,
  html2canvas 1.4.1, xlsx 0.18.5, DOMPurify.
- **This repo is the canonical source for `index.html`.** A `post-commit` hook
  (`.git/hooks/post-commit`) auto-copies `index.html` to a backup at
  `F:\Onedrive - personal\OneDrive\build app cho cong ty\MQA dashboard website\index.html` after every commit.
  Never edit that OneDrive copy — it is overwritten on the next commit. Delete the hook
  to disable syncing.
- **Doc↔code drift guard.** The auto-sync above covers ONLY `index.html` — the `.md`
  spec docs are hand-maintained and once drifted to r107/r112 while code was r118. A
  `pre-commit` hook (`.git/hooks/pre-commit`) now runs `scripts/check-doc-sync.sh` when a
  commit touches `index.html`: it blocks if the code's major `rNN` isn't reflected in
  `CLAUDE.md` (Rev current) + `PROJECT_TECH_SPEC.md` (Version + §14). `TECHNICAL_REFERENCE.md`
  content (fields/flows) still needs a manual read — see `SO_DO_CAU_TRUC.html`.
  **Hooks aren't versioned** — on a fresh clone reinstall both (`post-commit`, `pre-commit`)
  from the snippets here; the check *script* IS versioned in `scripts/`. Bypass once with
  `git commit --no-verify`.

### Two backends — do not confuse them

1. **Supabase** (`SUPA_URL`/`SUPA_KEY`) — auth only, via **Supabase Auth**.
   `doLogin`/`doRegister` call `sb.auth.signInWithPassword` / `sb.auth.signUp`, so
   credentials live in Supabase's managed `auth.users` (bcrypt-hashed). The
   `public.users` table is a **profile table only** — `supabase_id` (FK to
   `auth.users`), `email`, `full_name`, `role`, `created_at`. **No password column.**
   Session lives in **`sessionStorage`** — never `localStorage`. Use `loadData(true)`
   for kiosk auto-refresh; `location.reload()` wipes the session and shows login screen.

2. **Galileo** (`G_URL`, ~line 768) — report data. A Cloudflare Worker proxy
   (`galileo-proxy.thaibahoa2308.workers.dev`) in front of an OData API. All report/
   workflow/audit data comes from here via `fetchAll()`.

### Key functions (search by name in `index.html`)

- `doLogin` / `doRegister` / `doLogout` — auth flow against Supabase.
- `initApp` — runs after login, builds UI shell, calls `loadData`.
- `loadData` — fetches reports from Galileo in stages, builds `allData` / `auditData`.
  **Never mutate `allData` directly** — use enriched clones only.
  **Never touch `loadData()` or `ORG_UNIT` unless the change is intentionally cross-page.**
- `startAutoRefresh` — kiosk/LED auto-refresh: wall-clock heartbeat every 5 min that
  calls `loadData(true)` in place every 12h. No page reload — sessionStorage safe.
  Started at the end of `initApp`; no-ops after logout via `if(!curUser)` guard.
- `fetchAll(url, skipOv=false)` — paginated OData fetch with 30s AbortController timeout.
  **Pass `skipOv=true` on every secondary / modal / lazy call** — otherwise the shared
  global overlay hijacks with stale text ("vết r41" bug).
- `renderAF` — All Forms table, schema-driven via `AF_SCHEMAS{report_title → {cols[], rowClick?}}`
  (`_default` = 14-col fallback). Form-specific views: EIS (`loadEisDetail`/`enrichEis`/
  `showEisDetail`) and QC Spot Check (`loadQcsDetail`/`enrichQcs`/`showQcsDetail`, r107) —
  each lazy-loads detail once and renders a dedicated modal.
  **When adding a new form type:** declare its `*_TITLE` + `AF_*_COLS` consts *before*
  `const AF_SCHEMAS` (it uses them as computed keys) or you get a TDZ `ReferenceError`
  that blanks the whole app at load.
- `renderAll` — renders every page from `allData`.
- `showPage` — sidebar nav / page switching. Blocks non-admins from admin pages.
- `setOv` / `showLoadError` — loading overlay + error/retry state.
- `loadUsers` / `approveUser` / `rejectUser` / `makeAdmin` — admin user management.

---

## Conventions

- Plain ES (no modules). Globals: `curUser`, `allData`, `auditData`, `charts`.
- `g(id)` = `getElementById`; `s(id,txt)` = set textContent. Used everywhere.
- **All user-facing text is English** — UI labels, toasts, alerts, error messages, exports.
  Vietnamese is allowed only in code comments / developer discussion, never in what the user sees.
- Edits are surgical: this is one giant file, match the existing inline style.
- **Year filters are multi-year** via `initYearMulti(id, years, {onChange, default})`.
  Each page mounts a `<div class="ymulti" id="...">`. Read selections with:
  `ymHas(id, value)` (true when "all"), `ymVal(id)` (array; `[]` = all),
  `ymText(id)` (label), `ymReset(id)`.
  **Do NOT use `g(id).value`** — these are divs, not `<select>`s.
- **Admin-only tools**: Export Reports, Query Builder, My Dashboard, Early Detection,
  User Management live under sidebar `#adminNav`. Every export button carries `.admin-only`
  (hidden for viewers) AND its handler re-checks `curUser.role==='admin'`.
- **Versioning** (`APP_REV = YYYY.MM.DD-rNN[-iM]`):
  - New feature / layout change / removed functionality → bump `rNN → r(NN+1)`
  - Pure bug fix → keep `rNN`, bump issue suffix (`r107-i1`, `r107-i2`)
  - Log fixes as "Issue 1/2/3" under that rev. Next feature resets issue counter.
  - **One `APP_REV` bump per combined spec** — never merge unrelated specs into one rev.
- **Target date priority**: `stage_task_target` takes precedence over the user-entered
  custom field (`sd.td || f['Target date']`) — stale custom entries used to override
  authoritative workflow data.
- **Repeater grouping** (multiple findings/CAs per report from `dwanalytics_report_field`):
  group by **`section_id`, never by `created_date`/time order** — same-second saves
  produce incorrect mappings. Group `report_id → section_id`.

---

## Galileo OData — invariants that must never be violated

These rules are non-negotiable. Violating them causes silent data loss or HTTP 400 errors.

| # | Rule | Detail |
|---|------|--------|
| I1 | **Never filter EAV by `report_id` in `$filter`** | `report_id eq '<uuid>'` → HTTP 400. Fetch by `field_name`, post-filter with a JS `Set`. |
| I2 | **Narrow generic `field_name` queries** | A broad `field_name eq 'Finding description'` hits ~14k rows and times out. Add `report_raised_date ge <ISO>` derived from the earliest report in `allData`, and chunk `field_name` lists (~8/request). |
| I3 | **EAV table field names differ** | `report_form_section_field` uses `text_value`; `report_field` uses `value_text`. Never swap. |
| I4 | **UUID filter — no quotes** | UUIDs in `$filter` must not be quoted. String fields require single quotes. Exception: `dwreporting_document_task` UUIDs also unquoted (OData inconsistency). |
| I5 | **MaxNodeCount = 100** | Each OR condition = 2 nodes. Chunk bulk `field_name eq … or …` lists to ≤8 per request (~16 nodes). |
| I6 | **`report_summary` is append-only** | Dedup client-side: keep latest `modified_date` per `report_id`. Skip records with empty `report_number`. |
| I7 | **Never fetch `audit_workflow` globally** | 100k+ rows. Lazy-load per `audit_id` or use `$apply` aggregate. |
| I8 | **Filter document type by `type_id` UUID** | Never by `document_type` title string — titles get edited by admins. |
| I9 | **`section_id` is the only reliable repeater key** | `report_field_created_date` fails when multiple entries are saved in the same second. |
| I10 | **`category_id` UUID for Category filtering** | Never filter/group by `title`. `groupby` on `report_summary` misses unused options — always read master from `dwanalytics_report_category`. |
| I11 | **`skipOv=true` on all secondary `fetchAll` calls** | Modal, lazy-load, and detail fetches must pass `true` to avoid hijacking the global overlay. |

---

## Galileo data quality workarounds

Known Galileo data quirks — **do not "fix" them in Galileo data**, keep these workarounds in code:

| Quirk | Workaround |
|-------|-----------|
| Trailing space in `document_type` | `.trim()` before every string comparison |
| Double space: `"Foreign Air  Transport…"` (FAOC) | Match both variants + `sw('FAOC')` prefix |
| Typo: `"MQA - Qualilty Notice"` | Hardcode misspelled string in mapping |
| `stage_id = null` for NotStarted stages | Fallback key: `'_title_' + stage_title` |
| `@odata.nextLink` returns Galileo origin domain | Replace domain with proxy URL before following |
| Datetime stored as UTC `T17:00:00Z` = Vietnam midnight | Use `fd()` — extract UTC date part, never `toLocaleDateString()` |

---

## Category system

- Master table: `dwanalytics_report_category` (17 entries; cols: `id`, `category_key`, `category_id` UUID, `colour` 0–9 code, `title`)
- Join: `report_summary.category_id ↔ dwanalytics_report_category.category_id`
- `colour` 0–9 is a Galileo palette code, **not hex** — needs explicit mapping
- System-wide table; a form's dropdown is a subset only

---

## Probe-before-spec workflow

> Đóng gói thành skill **`probe-spec`** (`.claude/skills/probe-spec/`). Việc bump rev +
> commit là skill **`cap-nhat-revision`**. Cả hai được version hóa trong repo (clone máy
> khác là có ngay). Skill chỉ tóm tắt — mục này vẫn là nguồn chi tiết đầy đủ.

```
(1) PROBE → (2) SPEC → (3) IMPLEMENT
```

1. **Probe:** Verify live data shape via DevTools Console OData queries before writing any spec.
   Never rely on documentation or memory for field names or Galileo behavior.
2. **Spec:** Write a surgical find-replace Markdown spec with exact anchor text and safety gates
   ("abort if anchor not found"). One `APP_REV` bump per spec.
3. **Implement:** Claude Code applies the spec. Claude (chat) does not edit `index.html` directly.

**If probe results are not yet available, ask the developer to run the query first.**

---

## When to stop and ask

Stop and ask before implementing when:

1. A field name or data shape has not been verified via probe
2. The change requires touching `loadData()`, `ORG_UNIT`, or shared filters
3. Multiple valid approaches have meaningfully different tradeoffs
4. A Category/Type UUID is needed but not yet confirmed in live data
5. The task bundles multiple independent concerns into one revision

Do not ask when:
- The anchor text is clear and unique in the file
- The fix is cosmetic with no logic impact
- A clear precedent exists in a previous revision

---

## Known issues / gotchas

- **Galileo HTTP 524**: the report-summary query is slow; the Cloudflare Worker
  times out (~100s) intermittently. `fetchAll` caps each request at 30s and
  `loadData` shows a retry overlay on failure. Root cause is Galileo backend.
- **QC MQA Physical Finding category (r107+)**: New Galileo Category added by Sơn (~2026-06-19).
  Confirmed on CMR-1039 (org TQA). Many QC CMRs not yet backfilled. Do not build QC
  filter/KPI until backfill is confirmed complete — verify `category_id` is non-null on
  SCR-0001/0002/0003 before implementing.
- **Auth is Supabase Auth** — passwords are NOT in `public.users`. Row Level Security on
  `public.users` is a pending hardening item (profile table readable with the publishable key).
- **MCAR extension fields** — asymmetric naming: `First extension approved?` vs.
  `Second extension agreed?`. Derive extension count from approval/agreement flags, not
  request flags. Use `agreed date` for +30 day calc — `extension target date` fields drift ±1 day.
- **SPI trigger field names** — inconsistent across months (`'Jun - SPI Trigger?'` vs.
  `'Mar SPI Trigger?'`). Matcher must handle both forms.
- **PAVOI org scope** — records split across `QA AMO` and `TQA`. Needs dedicated `loadPavoi()`,
  not a modification to shared `loadData()`.
- **Cancelled/Deleted copyholders** in `dwreporting_document_task` — must be excluded before
  `.map()`. Galileo hides them in UI but they appear in the API with `task_delivery_status = 'overdue'`.
- **If data looks wrong after a code fix** — assume Galileo data entry error, not a code bug.
  Do not compensate with more code. Report back and confirm with the developer.

---

## Weekly report (.docx)

- Font: **Arial** — Calibri breaks stacked Vietnamese diacritics (Ộ/ộ) in LibreOffice
- `Footer` must be in `footers: { default: new Footer({...}) }` inside section properties — not in `children` (causes page overflow)
- Build with the `docx` Node.js skill
- Structure: title block → Tổng quan → Hạng mục (green ✓) → KPI → Định hướng → Việc tuần tới
- Summary table: 3 columns — Phiên bản / Hạng mục / Giá trị mang lại (blue header)

---

## Quick reference

```
Repo:        github.com/ThaiBaHoa/qa-amo-dashboard
Deploy:      vjc-qa-amo.com  (GitHub Pages, push to main)
Proxy:       galileo-proxy.thaibahoa2308.workers.dev
Galileo:     vietjet.ideagendata.com/odata/
Supabase:    czftzgdcnpnspbbegwjt.supabase.co
Rev current: 2026.08.11-r128

ORG_UNIT = 'QA AMO'   ← main pages (never change without cross-page intent)
                         CMR-CAR and ECAR use org_unit = 'TQA' — fetched separately
```

## Running locally

```
python -m http.server 8000
```
Open `http://localhost:8000`. Login hits live Supabase. Galileo proxy is also remote — local run uses production data.

---

*Combines [Karpathy-Inspired Claude Code Guidelines](https://github.com/multica-ai/andrej-karpathy-skills) with QA AMO Dashboard project-specific rules. Update alongside each significant revision spec.*
