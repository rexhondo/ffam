// Shared by the background script and the popup.

// Firefox calls the extension API `browser`, Chrome calls it `chrome`. Both
// return promises from their API calls in Manifest V3, so one name is enough.
globalThis.browser ??= globalThis.chrome;

// The Amazon Music sites this extension works on. The list lives in
// manifest.json ("host_permissions") so there's only one place to edit it.
const AMAZON_MUSIC_URLS = browser.runtime.getManifest().host_permissions;

// The browser only reveals a tab's URL to us when we have access to that site, so
// keeping tabs with a URL means keeping exactly the Amazon Music tabs we can reach.
async function amazonMusicTabs() {
  const tabs = await browser.tabs.query({ url: AMAZON_MUSIC_URLS });
  return tabs.filter((tab) => tab.url);
}

// True when the user has switched off our access to every Amazon Music site
// (about:addons → this extension → Permissions).
async function hasNoSiteAccess() {
  const granted = await Promise.all(
    AMAZON_MUSIC_URLS.map((origin) => browser.permissions.contains({ origins: [origin] })),
  );
  return !granted.some(Boolean);
}
