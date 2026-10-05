# Store listings

Text and images to copy into the store submission forms. The Firefox
(addons.mozilla.org) listing comes first; the Chrome Web Store section is at
the end and reuses the same description.

# addons.mozilla.org (Firefox)

## Name

Toolbar Controls for Amazon Music

## Summary (max 250 characters)

Play/pause, skip and go back in the Amazon Music web player from a button in your Firefox toolbar, without switching tabs. Not affiliated with or endorsed by Amazon.

## Description

Control the Amazon Music web player from any tab.

When an Amazon Music tab has a song loaded, the toolbar button lights up, and it shows a ▶ badge while music is playing. Hover it to see the current song. Click it for a small panel with:

- album art, song title and artist
- previous / play-pause / next buttons
- a link that jumps straight to the Amazon Music tab

Works on music.amazon.com and the regional Amazon Music sites (.co.uk, .de, .fr, .it, .es, .ca, .com.au, .co.jp, .in, .com.br, .com.mx). If several Amazon Music tabs are open, it controls the one that's playing.

Privacy: the extension collects no data and makes no network requests of its own. It only reads the current song from the Amazon Music page and presses the player's own buttons for you.

Open source (MIT): https://github.com/rexhondo/ffam

This extension is not affiliated with, endorsed by, or sponsored by Amazon. Amazon Music is a trademark of Amazon.com, Inc. or its affiliates.

## Categories

Music & Tabs (or: Other)

## Tags

amazon music, music, media controls, toolbar

## Add-on icon

`icon-128.png` (128×128, transparent background). `icon-256.png` is the same icon at double size, if you need it.

## Screenshots

- `screenshot-light.png` – popup while playing (light theme)
- `screenshot-dark.png` – popup while playing (dark theme)

(Rendered from the real popup with made-up track details and placeholder artwork.)

## Notes to reviewer

- No build step, minification or bundling: the uploaded files are the source.
- The same files also run in Chrome. `service-worker.js` and the manifest's `background.service_worker` and `minimum_chrome_version` are for Chrome only; Firefox ignores them and loads `background.scripts`.
- Permissions:
  - Host access to the `music.amazon.*` sites: needed for the content script that reads the current song (from `navigator.mediaSession` and the player bar) and clicks the player's own play/pause/next/previous buttons.
  - `scripting`: used once, at install (and again if the user re-grants site access), to inject the same content script into Amazon Music tabs that were already open.
- No remote code, no analytics, no network requests. `data_collection_permissions` is set to `none`.
- To test: sign in at https://music.amazon.com (a free account works), play any song, then use the toolbar button.

# Chrome Web Store

The name and the short summary come from `extension/manifest.json`
automatically (`name` and `description`).

## Store listing tab

- **Description:** paste the Description from the Firefox section above.
- **Category:** Tools (or Entertainment)
- **Language:** English
- **Store icon:** `chrome-icon-128.png` (128×128 with transparent padding, as
  Chrome's guidelines ask)
- **Screenshots:** `screenshot-light.png` and `screenshot-dark.png` (1280×800)
- **Small promo tile:** `promo-tile-440x280.png`
- **Homepage / support URL:** https://github.com/rexhondo/ffam

## Privacy tab

**Single purpose description**

> Adds play/pause, next and previous buttons for the Amazon Music web player to the browser toolbar, and shows the current song.

**Permission justifications**

- **Host permissions (music.amazon.com and the regional Amazon Music sites):**
  > Needed to read the current song from the Amazon Music page and to press the web player's own play/pause, next and previous buttons when the user clicks the toolbar controls. The extension runs on no other sites.
- **scripting:**
  > Used to start the extension's content script in Amazon Music tabs that were already open when the extension was installed or updated, so the controls work without reloading those tabs.

**Remote code:** No, I am not using remote code.

**Data usage:** tick none of the data types (the extension collects no user
data), then tick all three certifications:

- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL:** not required, because no user data is collected. Leave
it blank unless the form insists, in which case use the README's Permissions
section: https://github.com/rexhondo/ffam#how-it-works

## Distribution tab

Public, all regions.
