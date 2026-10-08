# Hotel Pixel Simulation — instructions for Claude Code

Educational web game: students run a hotel in Thailand, from an 8-room hostel to a hotel, competing with bots (later with classmates). Pixel-art, side-view building. Built for hospitality classes, with an instructor dashboard later.

## The owner (read first)
- Owner: Charoen, hospitality graduate student. Not a programmer: Claude writes ALL code.
- Reply in **Thai**, short and direct. Offer 2–3 options when a decision is needed, with a recommendation.
- Explain each step in plain words before doing it. Ask before installing packages, creating accounts, or running anything destructive.
- Factual claims (hotel industry, tourism, law, research) need a source link. Mark game-design values you invented as **[ข้อเสนอ]**. Flag weak evidence instead of hiding it.
- Never silently change balance numbers. When a formula or constant changes, list old → new and why.

## Status
- P0 (economy prototype) is DONE: `prototype/hotel-sim-p0-v0.3.html` is the playable reference; its split sources are in `prototype/src/`.
- Current phase: **P1 single-player game** (see scope below). Gate to P2: the owner playtests 12 weeks on desktop and on a phone in landscape with no blockers, and `npm test` passes.
- Full design rationale: `docs/spec-summary.md` (read when you need rules or numbers). Full exported doc: `docs/system-design-v0.3.md` (its §7 Tech stack is outdated; see `docs/design-doc.md`).

## Commands
- `npm test` — runs `tests/*.test.mjs` (node:test) against `src/sim/core.js` and `src/ui/session.js`. Must stay green.
- `npm run dev` — Vite dev server on port 5173 (Preview config "game" in `.claude/launch.json`). `npm run build` → `dist/`.
- Stack (owner-approved 8 Oct 2026): Vite 8 + Preact 10 (not 11, too new) + `@preact/preset-vite`. Node 24 LTS.

## Layout
- `src/sim/core.js` — economy core, ES module, pure and deterministic (seeded RNG). No DOM. All balance constants live here.
- `src/ui/` — Preact UI: `App.jsx`, `screens/`, `tabs/`, `components/`, `styles/game.css` (ported from prototype). `session.js` = pure glue (decision log, hire/fire, end week).
- `src/i18n/` — `t(key, vars)` / `tx(key, {name: <jsx/>})`; every UI string goes in `th.json` (EN added in P1 step 2).
- `src/data/` — `thmap.json` (pixel map of Thailand rasterised from Natural Earth, public domain), `landmarks.json` (9 original 20×16 pixel vignettes).
- `prototype/` — P0 v0.3 single-file game + its source pieces (UI patterns to port).
- `assets/art-templates/` — palette (`hotel-pixel-32.gpl/.hex`), real-size canvases, layout guides. Owner's finished PNGs go to `assets/sprites/`.
- `docs/` — spec summary, sources, decisions spreadsheet.

## Locked decisions (details in docs/spec-summary.md)
- Turn-based: everyone decides at once, 1 round = 1 game week, 12 weeks per game.
- 4 maps, 9 real cities; seasons per city: ไฮซีซั่น / กึ่งไฮซีซั่น / โลว์ซีซั่น (never "ไหล่ทาง"); Thai seasons per TMD.
- Score: finance 50%, reputation 35%, staff 15%; a hotel with cumulative loss always ranks below any profitable hotel.
- Events: scheduled events announced ahead (may be cancelled, 12%) + 21 shock events + 4 internal crises; same timeline for every hotel in a room; instructor sets chaos level and can disable fake reviews.
- Bots: rule-based, 3 skill levels × 4 personalities. LLM strategy explanations only in P3.
- UI: tabs (ตลาดและปฏิทิน, ตัดสินใจ, พนักงาน, ลูกค้า, รายงานผล); event library behind an "i" button top-right; KPI cards explain Occupancy/ADR/RevPAR/RGI with live calculation + sources; MPI/ARI 2×2 with labelled axes; sliders with −/+ steppers.
- Fonts: IBM Plex Sans Thai for text, VT323 for numbers. Thai + English (all strings in locale files from the start of P1). Mobile = landscape.
- Hosting: classroom hosting is NOT confirmed. Recommended: GitHub Pages (static) + Supabase free tier for P2 multiplayer. Ask the owner before setting either up.

## P1 scope (tick in docs/spec-summary.md as done)
1. Building grows T0 → T2: apply for Type-1 hotel licence, then open a restaurant (Type 2).
2. Staff in 3 positions: front office, housekeeping, F&B.
3. Real pixel art from the owner; staff sprites walk inside the building (placeholders until PNGs arrive).
4. Thai / English switch.
5. Phone landscape layout.
6. [ข้อเสนอ] Save game in the browser to continue later (confirm with owner).

## Working rules
- Keep the sim core free of UI code; UI calls `newGame` / `simulateWeek` / `finalScores`.
- Small steps: one feature → run tests → show the owner in Preview → commit.
- Add a test whenever you change a rule or constant.
- Art spec: staff 32×32 px per frame (idle, walk1, walk2, serve) × 8 staff; portraits 48×48; buildings 320×300; city vignettes 160×96; only palette colours; PNG, no smoothing.
