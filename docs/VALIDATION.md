# Drkr 0.2.0 validation — October 26, 2026

## Completed

- Node unit checks: settings validation/precedence, protocol handling, color parsing/mapping, gradient structure, manifest resources, native resource/version consistency.
- Chrome 155.0.8059.85, real DOM/CSS and simulated extension API boundary: startup cover, off/native-theme paths, failure recovery, system changes, per-site overrides, popup persistence, gradients, generated content, modern CSS colors, artwork/inline-important readability, open shadow roots, live stylesheets, form values, removed-stylesheet recovery, and idle stability.
- Large Chrome fixture: 5,000 repeated cards, 15,000 descendants. Recorded large update: about 170 ms, 15,001 processed elements, 18 shared style groups. Appending one card: about 16 ms, 3 processed elements. No further scan during an idle observation interval. Timings are one local development run, not a cross-device performance guarantee. Raw evidence is generated at `build/performance.json`.
- Real Safari **26.6.2** temporary-extension fixture: **7/7** checks passed for body dark styling, gradient retention, generated content, open shadow-root content, author-important panel preservation, form value preservation, and recolored mask icons. Added dynamic card rendered dark. Form controls and text were visually inspected.
- Public Wikipedia Moon article visually inspected in Safari: dark body, readable prose/links/table, and original Moon image pixels. Found a compatibility limit: baked-in black logos and some artwork icons lose contrast. This is not a clean pass for every icon or interaction on Wikipedia.
- macOS Xcode build: succeeded with ad-hoc signing. Deep/strict codesign verification passed. Packaged extension resource hashes, version numbers, app/extension identifier prefixes, and privacy manifests verified.
- Native app setup/help/privacy interface loaded and was visually inspected. The packaged app correctly reports its extension is disabled while the separate temporary extension remains enabled.

## Not yet established

- Full Safari test coverage of Gmail, LinkedIn, news sites, private-browsing behavior, oldest supported Safari/macOS, VoiceOver, long-running CPU/battery usage, navigation/back-forward restoration, or slow-network first-paint behavior.
- Full Safari popup control interaction coverage. Popup rendering/labels were observed in Safari; saved-control behavior is covered by Chrome integration checks, not a complete Safari keyboard/VoiceOver audit.
- Apple Developer distribution signing, App Store archive validation, notarization, external beta feedback, or App Review approval.

The build is a stronger development beta. These results do not establish public-release readiness. Follow [BETA-CHECKLIST.md](BETA-CHECKLIST.md) before submission.

## Public-repository preparation

- Added a pinned Playwright dependency and pnpm lockfile, CI for Chromium and WebKit, static support/privacy pages, MIT license, contribution instructions, and public issue templates.
- Nine unit/source checks pass. Pinned Playwright Chromium 151.0.7922.34 and WebKit 26.5 pass the full startup, popup, rendering, and website suites. Small neutral SVG controls are recolored; colored SVGs and standalone artwork are preserved, and Off restores the original paint.
- Current local performance run: Chromium large fixture 158 ms / one-card append 14 ms; WebKit large fixture 154 ms / one-card append 30 ms. These are individual local measurements, not a benchmark guarantee.
- Website checks pass at 1440px and 390px on both engines: navigation, images, no horizontal overflow, keyboard-operable demo, no third-party asset requests. Desktop/mobile layout visually checked in Chromium.
- Publisher-specific Mac build (`io.github.sahilng.drkr`) succeeds with verified resource hashes and local ad-hoc signing. The app opens support/source links only after explicit link activation.

Apple Developer enrollment, signed distribution archive, real App Store screenshots, oldest-supported OS coverage, and the remaining real-world Safari matrix are not complete.

The public MIT repository and GitHub Pages site are deployed. Homepage, support, and privacy URLs each returned HTTP 200 over HTTPS. These publications do not distribute an App Store app. CI uses pinned Ubuntu 24.04, pinned action revisions, a pnpm lockfile, and separate Chromium/WebKit jobs.

## drkr.space migration

All four GitHub Pages A records and the www CNAME were saved in Namecheap and verified against authoritative/public DNS. GitHub serves the site with HTTP 200 when addressed directly for drkr.space. Some resolvers still return the prior parking address, and the custom-domain TLS certificate was not yet issued at the last check. Do not treat the new HTTPS URLs as validated until normal certificate verification succeeds.

The planned US App Store price is $0.99 as a one-time purchase. No App Store listing, signing team, agreement, bank, or payout configuration has been changed. Distribution archives require a confirmed publisher-controlled Team ID in release-info.json.
