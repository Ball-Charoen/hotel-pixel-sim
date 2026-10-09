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
- P1 single-player game: DONE (owner playtest passed 8 Oct 2026; all pixel art in place 9 Oct 2026: 9 city vignettes, buildings T0/T1/T2, staff sprites, staff portraits).
- Current phase: **P2 multiplayer classroom** (decisions below in Locked decisions; checklist in docs/spec-summary.md §13).
- Full design rationale: `docs/spec-summary.md` (read when you need rules or numbers). Full exported doc: `docs/system-design-v0.3.md` (its §7 Tech stack is outdated; see `docs/design-doc.md`).

## Commands
- `npm test` — runs `tests/*.test.mjs` (node:test): sim core, `src/sim/save.js`, `src/ui/session.js`, text files. Must stay green.
- Testing in the browser pane: use Preview config `game-test` (port 5174) so test games never touch the owner's autosave/language on 5173.
- `npm run dev` — Vite dev server on port 5173 (Preview config "game" in `.claude/launch.json`). `npm run build` → `dist/`.
- `npm run sync:server` — copy `src/sim/{core,save,classroom}.js` into `supabase/functions/_shared/` after changing them (a test fails if stale). Deploy: `npx --yes supabase@latest functions deploy classroom --use-api --project-ref hyxrvdnijzyymlerspah`; schema: `npx --yes supabase@latest db push --linked` (the owner is logged in to the CLI; no password needed).
- Push to `main` = tests + build + deploy to GitHub Pages (https://ball-charoen.github.io/hotel-pixel-sim/) via `.github/workflows/pages.yml`. `gh` is at `~/.local/bin/gh`.
- `npm run font:zh` — rebuild the Chinese font subset after editing `src/i18n/zh-TW.json` (needs `tools/font-src/NotoSansTC[wght].ttf`, git-ignored; URL in `scripts/build-zh-font.mjs`). A test fails if a Chinese character is missing.
- Stack (owner-approved 8 Oct 2026): Vite 8 + Preact 10 (not 11, too new) + `@preact/preset-vite`. Node 24 LTS.

## Layout
- `src/sim/core.js` — economy core, ES module, pure and deterministic (seeded RNG). No DOM. All balance constants live here.
- `src/ui/` — Preact UI: `App.jsx`, `screens/`, `tabs/`, `components/`, `styles/game.css` (ported from prototype). `session.js` = pure glue (decision log, hire/fire, end week). `saveStore.js` = one autosave slot in localStorage.
- `src/sim/save.js` — game ↔ JSON (RNG state + shock ids as markers). A resumed game must replay identically (tests/save.test.mjs). Bump `SAVE_VERSION` in `src/ui/saveStore.js` when rules or the save format change.
- `src/i18n/` — `t(key, vars)` / `tx(key, {name: <jsx/>})`; every UI string goes in `th.json`, `en.json`, `zh-TW.json` (tests check same keys/placeholders). Core text (cities, events, names) lives under `data` and is shown via `src/ui/names.js`; the core has no display text.
- `src/scene/` — live pixel building (canvas 320×300, layout from the art guide) with walking staff. Placeholder art is drawn in code; owner PNGs in `assets/sprites/` (names in its README-TH.txt) replace it automatically via `import.meta.glob`. Walker logic is pure (`walkers.js`, tested); visual randomness never touches the sim RNG.
- `src/fonts/` — Noto Sans TC subset (regular only, 132 KB, OFL licence alongside), loaded only for Chinese text.
- `src/data/` — `thmap.json` (pixel map of Thailand rasterised from Natural Earth, public domain), `landmarks.json` (9 original 20×16 pixel vignettes).
- `prototype/` — P0 v0.3 single-file game + its source pieces (UI patterns to port).
- `assets/art-templates/` — palette (`hotel-pixel-32.gpl/.hex`), real-size canvases, layout guides. Owner's finished PNGs go to `assets/sprites/`.
- `tools/pixelate.py` — photo → palette pixel art (stdlib Python + macOS `sips`, no installs). `python3 tools/pixelate.py PHOTO OUT.png --size 160x96 --preview P.png`; options for crop, focus, gamma, hue-first matching, colour subset, stray-pixel cleanup. Owner photos stay out of git.
- Building art: ChatGPT does not hit exact positions, so each layout in `src/scene/layout.js` is MEASURED from its PNG (windows, floor beams, desk, stairs) and checked by drawing all lights over the art. T2 = T1 art + FOOD sign and table cut from a ChatGPT image (owner's choice). `tools/spritesheet.py` turns 8 AI images (2×2 poses each) into `staff-sprites.png` (characters ~22 px tall = the AI art's own pixel size); `tools/portraits.py` makes `staff-portraits.png` (shown at full 48 px). Both snap each source pixel to the palette before voting and skip pink/lamp/gold (magenta fringe, orange skin). `tools/blockout.py` makes 1024×1024 blockouts for T1/T2 prompts (`docs/art-prompts-chatgpt.md`).
- Classroom (P2): `src/sim/classroom.js` (pure rules: start game, apply/re-check decisions, run week, per-student view that hides others' private data, RNG, future shocks), `supabase/migrations/` (rooms, players, decisions, server-only room_state, reports, room_public; RLS helpers in schema `private`), `supabase/functions/classroom/` (start / advance, week lock), `src/sim/analysis.js` (end-of-game Key Success Factors, rule-based, shown via `components/AnalysisPanel.jsx` in single player, student final and instructor dashboard), `src/net/classroom.js` (Supabase client, loaded lazily), `src/ui/screens/ClassroomScreens.jsx` (join, student room, instructor). Links: `#join=CODE`, `#teacher`; dev-only `#classdemo` (and `#classdemo-final` for the 12-week final screen + analysis) renders a student screen from a local server-style view (no accounts). Never create Supabase users (even anonymous) yourself: the owner tests real sign-ins.
- `docs/` — spec summary, sources, decisions spreadsheet.

## Locked decisions (details in docs/spec-summary.md)
- Turn-based: everyone decides at once, 1 round = 1 game week, 12 weeks per game.
- 4 maps, 9 real cities; seasons per city: ไฮซีซั่น / กึ่งไฮซีซั่น / โลว์ซีซั่น (never "ไหล่ทาง"); Thai seasons per TMD.
- Score: finance 50%, reputation 35%, staff 15%; a hotel with cumulative loss always ranks below any profitable hotel.
- Events: scheduled events announced ahead (may be cancelled, 12%) + 21 shock events + 4 internal crises; same timeline for every hotel in a room; instructor sets chaos level and can disable fake reviews.
- Bots: rule-based, 3 skill levels × 4 personalities. LLM strategy explanations only in P3.
- UI: tabs (ตลาดและปฏิทิน, ตัดสินใจ, พนักงาน, ลูกค้า, รายงานผล); event library behind an "i" button top-right; KPI cards explain Occupancy/ADR/RevPAR/RGI with live calculation + sources; MPI/ARI 2×2 with labelled axes; sliders with −/+ steppers.
- Fonts: IBM Plex Sans Thai for text, VT323 for numbers. 3 languages: Thai, English, Traditional Chinese (owner decision 8 Oct 2026; all strings in locale files). Mobile = landscape.
- P2 (owner decisions 9 Oct 2026): GitHub Pages (public repo) + Supabase free; instructor login, students join with room code + name (+ optional owner name), no student accounts (Supabase anonymous sign-in); the whole class is ONE market (`marketScale`: demand and A0 × hotels/4, single player unchanged); instructor can add 0–3 bots; weeks advance by instructor button or timer. Results computed server-side only. The owner creates the accounts; Claude never signs in for them.

## P1 scope (tick in docs/spec-summary.md as done)
1. Building grows T0 → T2: apply for Type-1 hotel licence, then open a restaurant (Type 2).
2. Staff in 3 positions: front office, housekeeping, F&B.
3. Real pixel art from the owner; staff sprites walk inside the building (placeholders until PNGs arrive).
4. Language switch: Thai / English / Traditional Chinese.
5. Phone landscape layout.
6. Save game in the browser to continue later (owner confirmed 8 Oct 2026; autosave, one slot).

## Working rules
- Keep the sim core free of UI code; UI calls `newGame` / `simulateWeek` / `finalScores`.
- Small steps: one feature → run tests → show the owner in Preview → commit.
- Add a test whenever you change a rule or constant.
- Art spec: staff 32×32 px per frame (idle, walk1, walk2, serve) × 8 staff; portraits 48×48; buildings 320×300; city vignettes 160×96; only palette colours; PNG, no smoothing.
