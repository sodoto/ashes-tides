# Ashes & Tides

A dice duel for your phone or desktop. Pick a hero, roll five dice up to three times, use abilities, defend, upgrade, and beat the AI.

Rules include 50 health, CP income and selling cards, offensive and defensive rolls, Main / Roll / Instant / Upgrade cards, ultimates and straights. The heroes, abilities, cards, symbols and art are all original.

## Play

Open the GitHub Pages site. On a phone, use **Add to Home Screen** (Safari: Share → Add to Home Screen; Chrome: ⋮ → Install app). It then opens fullscreen and works offline.

Your duel is saved after every move in the browser's local storage, so you can close it and continue later on the same device.

## Project layout

| Path | What it is |
| --- | --- |
| `index.html` | The built game, served by GitHub Pages. Do not edit by hand. |
| `src/engine.js` | Rules engine and AI. Pure JavaScript, no DOM. |
| `src/ui.js` | Rendering and input. |
| `src/head.html` | Title, fonts and all CSS. |
| `sw.js`, `manifest.webmanifest`, `icon*` | Offline support and home-screen app. |
| `tests/` | Balance simulation and save/restore tests (Node). |
| `artifact.html` | Same game without a `<head>`, for the Claude artifact host. |

## Develop

```sh
./build.sh          # rebuild index.html and artifact.html from src/
npm test            # rules simulation + save/restore determinism
python3 -m http.server 8000   # then open http://localhost:8000
```

After changing the game, bump `VERSION` in `sw.js` so installed copies pick up the update.

## Deploy on GitHub Pages

Repository **Settings → Pages → Build and deployment**: Source **Deploy from a branch**, branch **main**, folder **/ (root)**. The site appears at `https://<user>.github.io/<repo>/` a minute later.
