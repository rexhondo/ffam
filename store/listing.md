# addons.mozilla.org listing

Copy these into the AMO submission form.

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
- Permissions:
  - Host access to the `music.amazon.*` sites: needed for the content script that reads the current song (from `navigator.mediaSession` and the player bar) and clicks the player's own play/pause/next/previous buttons.
  - `scripting`: used once, at install (and again if the user re-grants site access), to inject the same content script into Amazon Music tabs that were already open.
- No remote code, no analytics, no network requests. `data_collection_permissions` is set to `none`.
- To test: sign in at https://music.amazon.com (a free account works), play any song, then use the toolbar button.
