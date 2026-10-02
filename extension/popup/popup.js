const $ = (id) => document.getElementById(id);

let currentTab = null;

// Pick which Amazon Music tab to control: one that's playing, else one with
// a track loaded, else the most recently used.
async function findTarget() {
  const tabs = await browser.tabs.query({ url: ['*://music.amazon.com/*'] });
  tabs.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));

  const results = await Promise.all(
    tabs.map((tab) =>
      browser.tabs
        .sendMessage(tab.id, { type: 'getState' })
        .then((state) => ({ tab, state }))
        .catch(() => null),
    ),
  );
  const candidates = results.filter(Boolean);
  for (const c of candidates) {
    if (c.state.playing === null) c.state.playing = Boolean(c.tab.audible);
  }
  return (
    candidates.find((c) => c.state.playing) ||
    candidates.find((c) => c.state.hasTrack) ||
    candidates[0] ||
    null
  );
}

function render(target) {
  if (!target) {
    $('player').hidden = true;
    $('empty').hidden = false;
    return;
  }
  const { state } = target;
  $('player').hidden = false;
  $('empty').hidden = true;

  $('title').textContent = state.title || 'Amazon Music';
  $('artist').textContent = [state.artist, state.album].filter(Boolean).join(' · ');

  if (state.artwork) {
    $('art').src = state.artwork;
    $('art').hidden = false;
  } else {
    $('art').hidden = true;
  }

  // SVG elements ignore the `hidden` property, so the icon swap is done in CSS.
  $('toggle').classList.toggle('playing', Boolean(state.playing));
  $('toggle').title = state.playing ? 'Pause' : 'Play';
  $('previous').disabled = !state.canPrevious;
  $('next').disabled = !state.canNext;
}

async function update() {
  const target = await findTarget();
  currentTab = target ? target.tab : null;
  render(target);
}

async function send(command) {
  if (!currentTab) return;
  await browser.tabs.sendMessage(currentTab.id, { type: 'command', command }).catch(() => {});
  setTimeout(update, 350);
}

$('toggle').addEventListener('click', () => send('toggle'));
$('next').addEventListener('click', () => send('next'));
$('previous').addEventListener('click', () => send('previous'));
$('show-tab').addEventListener('click', async () => {
  if (!currentTab) return;
  await browser.tabs.update(currentTab.id, { active: true });
  await browser.windows.update(currentTab.windowId, { focused: true });
  window.close();
});

update();
setInterval(update, 1000);
