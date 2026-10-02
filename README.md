# Amazon Music Toolbar Controls (Firefox)

A small Firefox extension that puts Amazon Music media controls in the toolbar
(right side, next to the other extension buttons).

- The toolbar button is **greyed out** until an Amazon Music tab
  (`music.amazon.com`) has a track loaded.
- While music is **playing**, the button shows a ▶ badge, and hovering it
  shows the current song.
- **Click** the button to open the controls: artwork, title/artist,
  ⏮ previous, ⏯ play/pause, ⏭ next, and a link that jumps to the Amazon Music tab.

Requires Firefox 140 or newer.

## Get the code

```powershell
cd C:\dev\projects
git clone https://github.com/rexhondo/ffam.git
cd ffam
```

The extension itself is in the `extension\` folder.

## Try it (temporary install)

1. Open `about:debugging#/runtime/this-firefox` in Firefox.
2. Click **Load Temporary Add-on…** and pick `C:\dev\projects\ffam\extension\manifest.json`.
3. Open https://music.amazon.com and play something. The button becomes active.
   (If it ends up in the puzzle-piece Extensions menu, right-click it there and
   choose **Pin to Toolbar**.)

Temporary add-ons are removed when Firefox restarts.

Or, with Node.js installed, launch a fresh Firefox profile that has the extension loaded:

```powershell
npx web-ext run -s extension
```

## Install permanently

Release Firefox only installs signed extensions. Either:

- **Sign it yourself (free, private):** create API keys at
  https://addons.mozilla.org/developers/addon/api/key/ and run
  ```powershell
  npx web-ext sign -s extension --channel unlisted --api-key <JWT issuer> --api-secret <JWT secret>
  ```
  Then drag the resulting `.xpi` from `web-ext-artifacts\` into Firefox.
- **Or** use Firefox Developer Edition/Nightly, set
  `xpinstall.signatures.required` to `false` in `about:config`, then build with
  `npx web-ext build -s extension` and install the zip via
  `about:addons` → gear icon → **Install Add-on From File…**.

## How it works

| File | Role |
|------|------|
| `extension/content.js` | Runs in Amazon Music tabs. Reads the track from the page's Media Session metadata and works out whether music is playing. To control playback, it clicks the web player's own buttons in the bottom player bar. |
| `extension/background.js` | Enables or disables the toolbar button and updates its badge and tooltip when tabs change or playback changes. |
| `extension/popup/` | The controls panel shown when you click the toolbar button. |

If you have several Amazon Music tabs, the extension controls the one that is
playing (or the most recently used one).

## If a button stops working

Amazon sometimes changes its web player's markup. All the selectors used to
find the play/pause/next/previous buttons are in the `SELECTORS` block at the
top of `extension/content.js`. Inspect the button in the player bar
(right-click → Inspect) and add a matching selector there.
