# archy-site — the landing page for Archy

Archy is a free, open-source (GPL-3.0), local-first game clipper for Windows:
https://github.com/hasthij/Archy. This repo is ONLY its website, hosted on
Cloudflare Pages (free) at `archy.pages.dev` (name to confirm when the user
connects it).

## The brief (decided with the user)

- Direction **B · "Zero frames lost"**: light, editorial, spec-sheet look. The
  approved mockup is `design/zero-frames-mockup.dc.html` (a Design-canvas file:
  read it as HTML/CSS reference; `{{accent}}` = `#2F6FEB`, `<sc-for>` = repeat the
  block for each item in the lists at the bottom). Match it closely, then make
  it production quality.
- The user wants **motion design** that looks professional and "not like vibe-coded
  slop": purposeful, smooth (transform/opacity only, 60 fps), every animation
  explains the product. Respect `prefers-reduced-motion`.
- Plain static site: HTML + CSS + a little vanilla JS. No framework, no build step,
  no trackers, no cookies. Fast (aim for Lighthouse 100) and accessible (real
  buttons/links, alt text, 4.5:1 contrast, keyboard friendly).
- Works from 360 px phones to wide desktops.
- Light theme is the main look; add a matching dark theme via
  `prefers-color-scheme` (dark panel colours already in the mockup).

## Design tokens (from the mockup)

- Fonts: **Archivo** (variable, width 62–125; headings use wide 112–118 % and
  weight 900, uppercase, tight tracking) + **IBM Plex Mono** (labels, numbers).
  Self-host them (both are OFL) in `fonts/` as woff2 — no Google Fonts request
  (Archy's whole pitch is privacy). Ask the user before downloading font files.
- Light: page `#F4F6F9`, white bands `#FFFFFF`, ink `#0E1320`, body text `#3D4659`,
  labels `#4F5A70`, rules `#DCE1EA` / `#D2D8E3`.
- Accent `#2F6FEB` (alternates offered: `#E8590C`, `#0B7F6C`, `#6A55F0`).
- Dark HUD panel: `#0E1320`, text `#E9EEF7`, captions `#B9C3D6`, muted `#8B96AD`,
  rules `#222B3D`, recording red `#FF4D5E`.
- Square corners (no border radius), 2 px ink borders on secondary buttons.

## Sections (in order, as in the mockup)

1. Header: `ARCHY.` wordmark (accent dot), Specs · How it works · Source, black
   "Download · Windows" button.
2. Hero: "ZERO / FRAMES / LOST." + one paragraph + Download free / Read the specs.
   Right: the dark HUD panel — FPS counter ticking 144/143/144/142, frame-time
   graph drawing "game alone" vs "with Archy" lines, scan line, blinking
   ARCHY RECORDING.
3. Steps 01/02/03 (outlined numerals): Open a game · Hit F8, or just say it ·
   Trim it, send it.
4. Specs table (see facts below).
5. Accent band: "CLIP IT. KEEP PLAYING." + Download Archy.
6. Add: a short FAQ (anti-cheat safe? where do clips go? does it upload anything?
   which GPUs?), a footer (GitHub, releases, licence, "made by Hasthi").

## Facts you may use (all true; never invent numbers)

- Download URL (always the newest installer):
  `https://github.com/hasthij/Archy/releases/latest/download/Archy-Setup.exe`
  (~12 MB; the installer also fetches FFmpeg and the voice model).
- Windows 10 version 2004 or newer, 64-bit. No account. Nothing uploaded; the only
  network use is an optional update check against GitHub.
- Encodes on the GPU's own video engine: Intel Quick Sync, NVIDIA NVENC, AMD AMF.
  Measured in Roblox on an Intel iGPU: about 2–3% FPS cost.
- H.264, HEVC or AV1 in MP4; 360p–1440p; 24–144 fps. ~19 MB per 30 s at 720p, or a
  "Discord" quality that fits the 10 MB upload limit.
- F8 saves the last 30 s, Shift+F8 the last 60 s; saves in well under a second.
- Voice clipping ("Archer, clip that"): on-device keyword spotting, hold-to-talk
  calibration, a live test with a confidence rating.
- Up to 4 audio tracks: everything, game, Discord, mic — separate volumes.
- Editor: trim, per-source volume, up to 3 text / image / video / audio tracks,
  export MP4 or GIF, save or copy to clipboard.
- Windows Graphics Capture; never injects into games (anti-cheat safe).
- Light and dark app themes (v0.4.0).
- Real screenshots/benchmark chart don't exist yet: leave clearly marked
  placeholders like `[Screenshot: clip library]` for the user to fill.

Brand: Archy's app icon is `design/archy.png` (blue `#4D8DFF` triangle "A").

## Deploying (the user does this once, in the Cloudflare dashboard)

Workers & Pages → Create → Pages → Connect to Git → `hasthij/archy-site`;
framework preset: None; build command: (empty); output directory: `/` (or `site`
if the files end up in a subfolder). After that every push to `main` deploys,
and other branches get preview links.

## Working rules

- Commit with plain imperative messages; ask before pushing anything new public.
- Keep this file current when decisions change.
