# Toolbar Controls for Amazon Music (Firefox)

A small Firefox extension that puts Amazon Music media controls in the toolbar
(right side, next to the other extension buttons).

- The toolbar button is **greyed out** until an Amazon Music tab has a track loaded.
- While music is **playing**, the button shows a ▶ badge, and hovering it
  shows the current song.
- **Click** the button to open the controls: artwork, title/artist,
  ⏮ previous, ⏯ play/pause, ⏭ next, and a link that jumps to the Amazon Music tab.

Works on music.amazon.com and the regional sites: .co.uk, .de, .fr, .it, .es,
.ca, .com.au, .co.jp, .in, .com.br and .com.mx. Requires Firefox 140 or newer.

*Not affiliated with, endorsed by, or sponsored by Amazon. Amazon Music is a
trademark of Amazon.com, Inc. or its affiliates.*

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

## Install permanently (just for you)

Release Firefox only installs signed extensions. You can sign it privately
("unlisted") for free:

1. Create API keys at https://addons.mozilla.org/developers/addon/api/key/
2. Run:
   ```powershell
   npx web-ext sign -s extension --channel unlisted --api-key <JWT issuer> --api-secret <JWT secret>
   ```
3. Drag the resulting `.xpi` from `web-ext-artifacts\` into Firefox.

## Publish on addons.mozilla.org

1. Bump `version` in `extension/manifest.json` for every upload.
2. Run `npx web-ext lint -s extension` (one warning about Firefox for Android
   versions is expected; the extension targets desktop).
3. Run `npx web-ext build -s extension` to create a zip in `web-ext-artifacts\`.
4. Submit it at https://addons.mozilla.org/developers/addon/submit/ and choose
   **On this site**. The name, summary, description, reviewer notes and
   screenshots are in the [`store/`](store/) folder.

The add-on ID (`browser_specific_settings.gecko.id` in the manifest) is
permanent once it's uploaded, so don't change it afterwards.

## How it works

| File | Role |
|------|------|
| `extension/content.js` | Runs in Amazon Music tabs. Reads the track from the page's Media Session metadata and works out whether music is playing. To control playback, it clicks the web player's own buttons in the bottom player bar. |
| `extension/background.js` | Enables or disables the toolbar button and updates its badge and tooltip when tabs change or playback changes. |
| `extension/shared.js` | The Amazon Music tab lookup and site-access check, shared by the background script and the popup. |
| `extension/popup/` | The controls panel shown when you click the toolbar button. |

If you have several Amazon Music tabs, the extension controls the one that is
playing (or the most recently used one).

**Permissions:** access to the Amazon Music sites (to read the song and press
the player's buttons) and `scripting` (to start working in Amazon Music tabs
that were already open when the extension was installed). The extension
collects no data and makes no network requests of its own. If you switch off
its site access in `about:addons`, the toolbar button shows a "!" badge and the
popup offers an **Allow access** button.

## Adding another Amazon Music site

Add the site's pattern (e.g. `*://music.amazon.nl/*`) to both
`host_permissions` and `content_scripts` → `matches` in
`extension/manifest.json`. Nothing else needs to change.

## If a button stops working

Amazon sometimes changes its web player's markup. All the selectors used to
find the play/pause/next/previous buttons are in the `SELECTORS` block at the
top of `extension/content.js`. Inspect the button in the player bar
(right-click → Inspect) and add a matching selector there.

## License

[MIT](LICENSE)
