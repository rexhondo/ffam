// Chrome runs the background as a service worker, which loads its scripts here.
// Firefox ignores this file and loads "background.scripts" from the manifest.
importScripts('shared.js', 'background.js');
