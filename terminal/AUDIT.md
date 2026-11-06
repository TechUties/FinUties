# Terminal dependency audit

Last run: 2026-11-06 (community `terminal/` package). Previous full run: 2026-09-23.

## Summary

| Metric | Before upgrades | After upgrades |
| --- | --- | --- |
| **npm audit** | 21 (3 critical, 12 high, 4 moderate, 2 low) | **0** |
| **Primary drivers** | `astro@5`, transitive `vite`/`sharp`/`svgo`/`h3`, `echarts@5`, `maplibre-gl@5` | Resolved via targeted major bumps |

## Packages upgraded (direct dependencies)

| Package | Before (range) | After (range) | Why |
| --- | --- | --- | --- |
| `astro` | `^5.0.0` | `^7.3.4` | Critical/high Astro advisories (XSS, SSRF, path checks, sharp chain) |
| `@astrojs/solid-js` | `^5.1.3` | `^7.0.2` | Peer alignment with Astro 7 / Vite 8 |
| `echarts` | `^5.5.0` | `^6.1.0` | Moderate XSS advisory (GHSA-fgmj-fm8m-jvvx) |
| `maplibre-gl` | `^5.18.0` | `^6.11.1` | Critical XSS sanitizer bypass (GHSA-jrc7-96c5-q579) |

Transitive fixes landed via the lockfile refresh (e.g. `vite`, `sharp`, `svgo`, `h3`, `browserslist`, `defu`, `devalue`, `@babel/core`).

## Astro 7 code adjustments

Small, required compile/runtime updates (no product behavior change):

- `ViewTransitions` → `ClientRouter` (`astro:transitions`) in `src/layouts/DashboardLayout.astro`.
- Connect page (`src/pages/index.astro`): **do not** use Astro expressions or `define:vars` inside `<script is:inline>` (they can be emitted literally → SyntaxError; `define:vars` is incompatible with `is:inline`). Pass config via `<body data-api-base=…>` and read with `getAttribute`. Bind the connect form with `addEventListener('submit', …)` so a script error cannot fall back to native form submit.
- `vite.build.rollupOptions.output.manualChunks`: object form → function (Rolldown / Vite 8).

## Runtime requirements

`terminal/package.json` declares:

- **Node** `>=22.12.0` (Astro 7 engine)
- **npm** `>=9.6.5`

GitHub Actions CI already uses Node 22. Local dev on Node 20.x will not satisfy Astro 7; use Node 22.12+ (LTS).

### npm `EBADENGINE` warning (not a CVE)

After install you may see `undici@8.x` preferring Node `>=22.19.0` while CI/dev uses 22.12–22.18. This is an engine hint from a transitive dependency, not an `npm audit` finding. Upgrading the VM to Node 22.19+ silences it; audit remains clean.

## 2026-11-06 re-run and code cleanup

**Audit:** `npm audit` reported 7 vulnerabilities (2 critical, 5 high), all transitive and all fixable without a major bump: `seroval` (critical, via `solid-js`), `sharp`, `source-map-js`, `undici`, `vite` 8.3.x, `zod`. `npm audit fix` brought it to **0**. No direct dependency range changed.

**Removed packages (never imported):** `@deck.gl/core`, `@deck.gl/layers`, `@deck.gl/mapbox`, `arquero`, `maplibre-gl`, `regression`, `supercluster`, `simple-statistics`, `@types/regression`, `@types/supercluster`. Verified with grep over `src/**/*.{ts,tsx,astro}` and `astro.config.mjs` plus `knip`. 63 packages left `node_modules`; the attack surface for future audits shrinks accordingly. The "echarts / maplibre" note in *Residual risk posture* now applies to echarts only.

**Typecheck:** `npm run typecheck` was `tsc --noEmit || true`, which hid 39 errors. The `|| true` is gone, `src/env.d.ts` declares the Astro client types and the `PUBLIC_*` env schema, the errors are fixed (one was a real bug: the virtual table row offset `a - b ?? 0` never applied its fallback), and CI runs the typecheck before tests and build.

**Duplicated helpers:** 22 card modules each carried their own `e()` HTML-escape and `items()` list-unwrapper, with 8 more `esc()` variants elsewhere; half of them did not escape single quotes. They are replaced by `src/lib/html.ts` (`escapeHtml`, `toItems`) and `src/lib/format.ts` (`formatShares`, `timeAgo`), covered by `tests/html-helpers.test.mjs` and `tests/format-helpers.test.mjs`. Single quotes are now escaped everywhere.

**Removed dead code:** `src/lib/data-hooks.ts` (imported nowhere; called `apiFetch` with the wrong signature and a non-existent `fetchRegistry`).

**Still unreachable, left for a product decision:** the SolidJS island layer `src/components/solid/*` (16 components), `src/stores/explorer.ts`, `src/lib/query-client.ts` and `src/lib/python-adapter/*` are not mounted by any page. They keep `solid-js`, `@astrojs/solid-js`, `nanostores`, `@nanostores/solid` and the three `@tanstack/solid-*` packages in the dependency tree. Either finish that migration or delete the layer; until then it type-checks and is tested by the build only.

**Results after cleanup:** audit 0, typecheck 0 errors, tests 15/15, `npm run build` 9 pages.

## Local dev CORS and API proxy (2026-09-23)

**Finding:** Browsers blocked connect (`fetch` to `/api/v1/auth/me`) when the community client pointed at `https://data.finuties.com` from `http://localhost:4321` — the API’s CORS allowlist targets `https://terminal.finuties.com`, not local origins.

**Mitigation (community client only):**

- `astro.config.mjs` — Vite `server.proxy` for `/api` and `/health` → `https://data.finuties.com` (override target with `FINUTIES_DEV_PROXY_TARGET` if needed).
- `src/lib/api-origin.ts` — `PUBLIC_API_ORIGIN` unset → dev defaults to same-origin (`''`), production to hosted API; `PUBLIC_API_ORIGIN=` (empty) → same-origin in any mode (never `PUBLIC_API_ORIGIN || hosted`). Stored `data.finuties.com` bases are rewritten to the dev origin in DEV; same-origin and localhost are allowed without `PUBLIC_ALLOW_NON_FINUTIES_API`.
- `src/lib/api-client.ts` — empty saved `base` resolves to `window.location.origin`; connect persists `API || window.location.origin` so dashboard modules do not fall back to hosted URL and hit CORS.
- **Production builds** (`npm run build`) still default to `https://data.finuties.com`; the FinUties-host allowlist is unchanged unless you explicitly set `PUBLIC_ALLOW_NON_FINUTIES_API=true`.

`npm run preview` serves the production bundle from localhost and does **not** enable the dev proxy — use `npm run dev` for local connect testing, or deploy like the hosted Terminal.

## Residual risk posture

- **Production**: static export (`output: "static"`). Dev-server-only issues in `vite`/`esbuild` affect local `npm run dev`, not the built site on a static host.
- **API keys**: stored in the browser (`localStorage` via the connect flow), not in server env. Optional `terminal/.env` only sets `PUBLIC_*` build-time overrides (see `terminal/.env.example`). Never commit `.env` or keys.
- **echarts**: chart library; keep user-controlled HTML out of chart options and tooltips (standard XSS hygiene). All template-string HTML goes through `escapeHtml` from `src/lib/html.ts`.

## Re-run the audit

From `terminal/`:

```bash
npm ci          # or npm install after package.json changes
npm run typecheck
npm test
npm run build
npm audit
```

Save audit output for records:

```bash
npm audit --json > /tmp/terminal-audit.json
```

To inspect direct vs transitive issues:

```bash
npm audit --omit=dev
```

Do **not** run `npm audit fix --force` without re-running tests and `npm run build`; major bumps need explicit review (as with Astro 7 and maplibre 6).

## Before-upgrade snapshot (reference)

Top-level audit themes on the pre-upgrade lockfile:

- **Critical**: `astro` (multiple GHSA entries), `maplibre-gl` (after partial transitive bump still on vulnerable 5.x until direct bump).
- **High**: `vite`, `browserslist`, `defu`, `h3`, `js-yaml`, `smol-toml`, `sharp` (via astro), `svgo` (via astro).
- **Moderate**: `devalue`, `echarts`, `baseline-browser-mapping`.

All cleared in the current lockfile as of the date above.
