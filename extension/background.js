// Keeps the toolbar button in sync with Amazon Music: greyed out when nothing
// is loaded, enabled when a track is loaded, and badged while music is playing.

const AMAZON_MUSIC_URLS = ['*://music.amazon.com/*'];

async function amazonMusicTabs() {
  return browser.tabs.query({ url: AMAZON_MUSIC_URLS });
}

async function tabState(tab) {
  try {
    const state = await browser.tabs.sendMessage(tab.id, { type: 'getState' });
    if (state.playing === null) state.playing = Boolean(tab.audible);
    return state;
  } catch (_) {
    // Content script not there (tab still loading, or opened before install).
    return tab.audible ? { playing: true, hasTrack: true, title: '', artist: '' } : null;
  }
}

let refreshQueued = false;
async function refresh() {
  // Coalesce bursts of events (every tab update fires several) into one pass.
  if (refreshQueued) return;
  refreshQueued = true;
  await new Promise((r) => setTimeout(r, 100));
  refreshQueued = false;

  const tabs = await amazonMusicTabs();
  const states = (await Promise.all(tabs.map(tabState))).filter(Boolean);
  const playing = states.find((s) => s.playing);
  const loaded = playing || states.find((s) => s.hasTrack);

  if (!loaded) {
    await browser.action.disable();
    await browser.action.setBadgeText({ text: '' });
    await browser.action.setTitle({
      title: tabs.length ? 'Amazon Music – nothing playing' : 'Amazon Music – not open',
    });
    return;
  }

  await browser.action.enable();
  await browser.action.setBadgeText({ text: playing ? '▶' : '' });
  const track = loaded.title
    ? `${loaded.title}${loaded.artist ? ' – ' + loaded.artist : ''}`
    : 'Amazon Music';
  await browser.action.setTitle({ title: `${playing ? 'Playing' : 'Paused'}: ${track}` });
}

// Content scripts declared in the manifest only load into pages opened after
// the extension is installed, so inject into any Amazon Music tabs already open.
async function injectIntoOpenTabs() {
  for (const tab of await amazonMusicTabs()) {
    browser.scripting
      .executeScript({ target: { tabId: tab.id }, files: ['content.js'] })
      .catch(() => {});
  }
}

browser.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === 'state') refresh();
});

browser.tabs.onRemoved.addListener(refresh);
browser.tabs.onUpdated.addListener(refresh, {
  properties: ['audible', 'status', 'url'],
});

browser.runtime.onInstalled.addListener(injectIntoOpenTabs);
browser.runtime.onStartup.addListener(refresh);

browser.action.setBadgeBackgroundColor({ color: '#7048e8' });
browser.action.setBadgeTextColor({ color: '#ffffff' });
refresh();
