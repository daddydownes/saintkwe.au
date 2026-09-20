# Saint KWE website

Static source for the Saint KWE homepage, opening video lettering, music links, concert gallery, eight-video catalog and five-preview flight experience. Clothing is currently a teaser, with no shop or checkout.

## Run
Serve this folder with any static web server, then open index.html through that server. For Python: `python -m http.server 4173`. Open http://localhost:4173/.

## Hosting
Production is published by GitHub Pages from the root of the main branch in daddydownes/saintkwe.au. Verify Pages' configured domain before any release; it is currently https://saintkwe.au/. Local changes are not published until explicitly released. No build step or backend is required. A different static host needs HTTPS and byte-range support for MP4 playback.

## Media and dependencies
Five local 12-second HD previews preload the next clip; the flight normally advances after eight seconds. A browser may require a tap to enable sound. A stalled preview offers Retry after 15 seconds. The opening downloads its full video before playback; failed downloads or decoding can be retried, and normal slow loading exposes Skip after 15 seconds. Google Fonts needs an internet connection; system font fallbacks are supplied. Streaming service destinations require internet access. Original media quality is preserved.

## Active source
index.html uses intro-selected.js for the opening and app.js for shared page behavior. catalog.html uses app.js for its scroll enhancement and accessible fallback. flight.html uses flight-local.js for playback and recovery. route-transition.js handles flight entry and Exit. scroll-videos.js is an older, unreferenced catalog controller; app.js is the active implementation.

manifest.json is a source inventory, not a web app manifest. Its asset byte count uses committed Git objects, so local line-ending conversion does not change that count.

## Verification
Before releasing changes, check local asset references, HTML IDs and anchors, JavaScript syntax, media hashes, the opening and its recovery, all catalog selections, five-preview progression, replay and immediate Exit. Include keyboard/focus, reduced motion, no-JavaScript fallback, media failures and narrow/short viewports. Keep test results tied to the exact source revision; investigation harnesses and screenshots live outside this runtime package.

Chromium, Firefox and Windows WebKit are useful test engines. Windows WebKit has a known limitation playing the opening's Blob MP4; its Skip recovery must remain usable. This is neither proof of a real Safari defect nor physical Safari/iPhone/iPad certification. External HTTP success does not certify platform playback or regional availability.
