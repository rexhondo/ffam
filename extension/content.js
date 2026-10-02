// Runs inside music.amazon.com tabs. Reads what's playing and drives the
// web player's own transport buttons when the popup asks it to.
(() => {
  if (window.__ffamContentLoaded) return;
  window.__ffamContentLoaded = true;

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

  // Amazon Music is built from web components, so walk into shadow roots too.
  // openOrClosedShadowRoot is a Firefox content-script-only API.
  function allRoots() {
    const roots = [document];
    for (let i = 0; i < roots.length; i++) {
      for (const el of roots[i].querySelectorAll('*')) {
        const shadow = el.openOrClosedShadowRoot || el.shadowRoot;
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
    const shadow = el.openOrClosedShadowRoot || el.shadowRoot;
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
  function report() {
    let state;
    try {
      state = getState();
    } catch (_) {
      return;
    }
    const key = JSON.stringify(state);
    if (key === lastSent) return;
    lastSent = key;
    browser.runtime.sendMessage({ type: 'state', state }).catch(() => {});
  }

  browser.runtime.onMessage.addListener((msg) => {
    if (!msg) return undefined;
    if (msg.type === 'getState') return Promise.resolve(getState());
    if (msg.type === 'command') {
      const ok = runCommand(msg.command);
      setTimeout(report, 300);
      return Promise.resolve({ ok });
    }
    return undefined;
  });

  document.addEventListener('play', report, true);
  document.addEventListener('pause', report, true);
  setInterval(report, 1000);
  report();
})();
