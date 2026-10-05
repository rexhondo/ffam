// Runs inside music.amazon.com tabs. Reads what's playing and drives the
// web player's own transport buttons when the popup asks it to.
(() => {
  // Firefox calls the extension API `browser`, Chrome calls it `chrome`.
  // Kept local on purpose: content scripts from an old and a new copy of the
  // extension can share globals in Chrome (see alive() below).
  const api = globalThis.browser || globalThis.chrome;

  // False once this copy of the script has been orphaned, which happens in
  // Chrome when the extension is updated or reloaded while the tab stays open.
  const alive = () => {
    try {
      return Boolean(api.runtime && api.runtime.id);
    } catch (_) {
      return false;
    }
  };

  // Don't run twice in the same page, unless the earlier copy is orphaned.
  if (window.__ffamAlive && window.__ffamAlive()) return;
  window.__ffamAlive = alive;

  // Amazon changes its markup from time to time. If a control stops working,
  // this is the only block that should need updating. Each list is tried in order.
  const SELECTORS = {
    play: [
      'music-button[icon-name="play"]',
      'button[aria-label="Play"]',
      '[role="button"][aria-label="Play"]',
    ],
    pause: [
      'music-button[icon-name="pause"]',
      'button[aria-label="Pause"]',
      '[role="button"][aria-label="Pause"]',
    ],
    next: [
      'music-button[icon-name="next"]',
      'button[aria-label="Next"]',
      'button[aria-label="Next song"]',
      '[role="button"][aria-label="Next"]',
    ],
    previous: [
      'music-button[icon-name="previous"]',
      'button[aria-label="Previous"]',
      'button[aria-label="Previous song"]',
      '[role="button"][aria-label="Previous"]',
    ],
  };

  // Amazon Music is built from web components, so walk into shadow roots too,
  // including closed ones. Firefox exposes those to content scripts as
  // el.openOrClosedShadowRoot; Chrome has chrome.dom.openOrClosedShadowRoot().
  function shadowOf(el) {
    if ('openOrClosedShadowRoot' in el) return el.openOrClosedShadowRoot;
    if (el.shadowRoot) return el.shadowRoot;
    // Only custom elements (tag names with a dash) can have closed roots here.
    if (api.dom && el.localName.includes('-')) return api.dom.openOrClosedShadowRoot(el);
    return null;
  }

  function allRoots() {
    const roots = [document];
    for (let i = 0; i < roots.length; i++) {
      for (const el of roots[i].querySelectorAll('*')) {
        const shadow = shadowOf(el);
        if (shadow) roots.push(shadow);
      }
    }
    return roots;
  }

  function isVisible(el) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    const style = getComputedStyle(el);
    return style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0';
  }

  // The page has lots of "Play" buttons (albums, playlists...). The transport
  // controls live in the player bar pinned to the bottom of the window, so
  // pick the visible match that sits lowest on screen.
  function findControl(name, roots) {
    let best = null;
    let bestBottom = -Infinity;
    for (const selector of SELECTORS[name]) {
      for (const root of roots) {
        for (const el of root.querySelectorAll(selector)) {
          if (!isVisible(el)) continue;
          const bottom = el.getBoundingClientRect().bottom;
          if (bottom > bestBottom) {
            best = el;
            bestBottom = bottom;
          }
        }
      }
      if (best) return best;
    }
    return null;
  }

  function press(el) {
    // Clicking the real <button> inside a custom element is what the page's
    // own handlers listen for; the click still bubbles out to the host.
    const shadow = shadowOf(el);
    const inner = shadow && shadow.querySelector('button, [role="button"]');
    (inner || el).click();
  }

  function mediaElements(roots) {
    return roots.flatMap((root) => [...root.querySelectorAll('audio, video')]);
  }

  function readMetadata() {
    const md = navigator.mediaSession && navigator.mediaSession.metadata;
    if (md && md.title) {
      let artwork = '';
      try {
        const images = Array.from(md.artwork || []);
        if (images.length) artwork = images[images.length - 1].src || '';
      } catch (_) {
        // Artwork is optional.
      }
      return { title: md.title, artist: md.artist || '', album: md.album || '', artwork };
    }
    return { title: '', artist: '', album: '', artwork: '' };
  }

  // Returns true/false, or null when we can't tell (the background script then
  // falls back to Firefox's "tab is making sound" flag).
  function readPlaying(roots) {
    const media = mediaElements(roots).filter((m) => m.currentSrc || m.srcObject);
    if (media.length) return media.some((m) => !m.paused && !m.ended);

    if (findControl('pause', roots)) return true;
    if (findControl('play', roots)) return false;

    const ps = navigator.mediaSession && navigator.mediaSession.playbackState;
    if (ps === 'playing') return true;
    if (ps === 'paused') return false;
    return null;
  }

  function getState() {
    const roots = allRoots();
    const playing = readPlaying(roots);
    const meta = readMetadata();
    return {
      playing,
      ...meta,
      // A track is "loaded" if we know what it is or it's currently playing.
      hasTrack: Boolean(meta.title) || playing === true,
      canPrevious: Boolean(findControl('previous', roots)),
      canNext: Boolean(findControl('next', roots)),
    };
  }

  function runCommand(command) {
    const roots = allRoots();
    if (command === 'toggle') {
      const button = findControl('pause', roots) || findControl('play', roots);
      if (button) {
        press(button);
        return true;
      }
      // Fall back to the media element itself.
      const media = mediaElements(roots).find((m) => m.currentSrc || m.srcObject);
      if (media) {
        if (media.paused) media.play();
        else media.pause();
        return true;
      }
      return false;
    }
    if (command === 'next' || command === 'previous') {
      const button = findControl(command, roots);
      if (button) {
        press(button);
        return true;
      }
    }
    return false;
  }

  // Tell the background script when something changes so it can update the
  // toolbar button. Polling once a second is cheap and survives Amazon's
  // re-renders far better than trying to observe specific elements.
  let lastSent = '';
  let timer = null;
  function report() {
    if (!alive()) {
      // Orphaned: a newer copy of the script has taken over (or will), so stop.
      clearInterval(timer);
      document.removeEventListener('play', report, true);
      document.removeEventListener('pause', report, true);
      return;
    }
    let state;
    try {
      state = getState();
    } catch (_) {
      return;
    }
    const key = JSON.stringify(state);
    if (key === lastSent) return;
    lastSent = key;
    // Nobody may be listening (e.g. Chrome's background worker is asleep and
    // wakes for the message without replying), so ignore delivery errors.
    Promise.resolve(api.runtime.sendMessage({ type: 'state', state })).catch(() => {});
  }

  // Replying through sendResponse (rather than returning a Promise) works in
  // both Firefox and Chrome.
  api.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg) return;
    if (msg.type === 'getState') {
      sendResponse(getState());
    } else if (msg.type === 'command') {
      sendResponse({ ok: runCommand(msg.command) });
      setTimeout(report, 300);
    }
  });

  document.addEventListener('play', report, true);
  document.addEventListener('pause', report, true);
  timer = setInterval(report, 1000);
  report();
})();
