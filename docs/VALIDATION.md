# drkr validation log — October 26, 2026

This is a chronological record. Early beta results and blockers are historical; the latest release-candidate status is recorded at the end.

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

The planned US App Store price is $0.99 as a one-time purchase. No App Store listing, agreement, bank, or payout configuration has been changed.

## Signing preparation — October 26, 2026

App Store Connect verified Account Holder and Admin roles for team `F9QX3SUK38`; that team is now recorded in `release-info.json`. The publisher subsequently explicitly approved proceeding with the existing membership/seller name, Rishav Gupta; it is not a release blocker. The archive script checks the app and extension signatures against the configured team after a successful archive.

The initial archive preflight failed because no development signing identity was installed. Xcode disabled certificate creation, and Certificate Assistant failed before saving a CSR. With explicit publisher approval, separate signing keys were generated locally, imported into the login Keychain, and their temporary private-key files removed after successful import. Public CSRs were submitted through Apple Developer. Apple Development, Apple Distribution, and Mac Installer Distribution certificates were issued and installed, along with Apple's official WWDR G3 intermediate. All three identities validate locally. No private keys or signing requests are included in the repository or source package.

`bash scripts/build-macos.sh --archive` now succeeds. The app and extension use the Apple Development identity for team `F9QX3SUK38`; deep/strict signature verification and all 12 packaged-resource checks pass. The app now declares the Utilities category, resolving Xcode's missing-category warning. This is a development-signed archive, not an App Store-validated distribution package. Distribution and installer certificates contain the existing membership name approved by the publisher.

The latest existing GitHub checks passed. Custom-domain HTTPS still fails hostname verification and remains pending. No app upload, App Review submission, legal agreement, banking change, or membership change was performed.

## Lowercase branding and App Store preparation — October 26, 2026

The publisher approved the existing membership/seller name and requested lowercase **drkr** branding. Updated the extension manifest/popup, native display names and menus, setup UI, website, and store copy while preserving bundle IDs and build paths. Nine core checks and the Chromium/WebKit website suites pass. The rebuilt signed archive verifies all 12 packaged resources.

Registered `io.github.sahilng.drkr` and `io.github.sahilng.drkr.Extension` under the confirmed team. Created private App Store Connect record `6827359533` (macOS, English US, SKU `drkr-macos`). Saved the description, keywords, reviewer notes, copyright, marketing/support links, subtitle, Utilities category, and manual release setting. Configured a $0.99 USD base price with Apple's equivalent storefront prices. Saved the privacy policy URL and a Data Not Collected draft (not yet published). Availability, age rating, screenshots, accessibility answers, reviewer contact, paid distribution readiness, final version alignment, and server validation remain incomplete.

The local App Store export succeeds with existing certificates. Expanded the exported package and verified current source-resource hashes, lowercase display names, and Apple Distribution signatures on both targets for team `F9QX3SUK38`. `pkgutil --check-signature` verifies the installer chain. Added `scripts/export-app-store.py` to repeat the local export without uploading or creating signing assets. This is beta 0.2.0/build 2; the draft store version defaults to 1.0. No build has been uploaded, submitted for review, or released.

## Packaged Safari verification and metadata — October 26, 2026

Completed the age questionnaire for the utility's actual features; Apple calculated 4+ with regional equivalents. Saved the content declaration based on drkr supplying no third-party content or browsing interface. It styles pages the user already visits in Safari. The bundled setup UI only loads local files and explicitly opens support/source links externally.

Safari initially selected conflicting development registrations, so the popup did not open and pages stayed light. Removed the two drkr development registrations and registered one stable, signature-verified archive copy at `build/SafariTest/Drkr.app`. The app reports the packaged extension enabled; its actual Safari popup opens and Wikipedia renders dark with readable prose/table, a visible wordmark, and the original Moon photo. Navigation, refresh, and Back rendered dark. This does not establish all website or history-restoration cases.

The publisher manually confirmed all immediate popup transitions in Safari: global Off → light, On → dark, Keep original → light, and Use global setting → the global choice. Automated popup clicks were unreliable because the computer-control connection targeted the underlying page; these passes are explicitly publisher-reported.

On the original local reading fixture, the packaged extension preserved an entered input value, allowed the button handler to add content, themed the new card, and preserved the embedded color-sample image. Captured unedited real Safari screenshots at 2880×1800. `reading-controls-2880.jpg` and `reading-dark-2880.jpg` are store candidates with original content; Wikipedia screenshots are QA references. Full keyboard/VoiceOver, authenticated-site, private-window, sustained-performance, and oldest-OS coverage remain incomplete.

Native bundle names are explicitly lowercase, including the application menu name. Added `ITSAppUsesNonExemptEncryption=false` after checking that the current app/extension has no encryption implementation or external network service; built-in OS/browser facilities handle any user-opened HTTPS links. The rebuilt archive and local App Store export pass. The stable Safari test copy was refreshed and the native menu verified as lowercase. Xcode’s generated Info.plist mode overwrote CFBundleName, so both native targets now use explicit Info.plists with all required bundle/version/entry-point metadata. The package checker rejects uppercase native names or a missing encryption declaration.


## Release candidate 1.0.0/build 3

Aligned the native app, extension manifest, package metadata, and private store version to 1.0.0; incremented the native build to 3. Native setup UI shows the release version and no longer suggests unsigned-extension settings to App Store users. Signed archive, 12 packaged-resource checks, lowercase native bundle-name checks, encryption metadata check, and local App Store export pass. Nine core checks pass. The extension's theming/settings code is unchanged from the packaged Safari checks above.

Both original-content screenshots are uploaded to the private macOS draft and preserved in `store-assets/macos/`. Worldwide availability is configured for all 175 current storefronts on release. EU compliance shows Active with no outstanding regulatory requirements. The publisher filled and saved private reviewer contact directly with Apple; those values are not in this repository. Published the Data Not Collected privacy label after explicit approval of Apple's final attestation.

GitHub's TLS certificate for drkr.space/www.drkr.space is approved and HTTPS enforcement is enabled. Homepage, support, and privacy return HTTP 200 using normal certificate verification; HTTP and www redirect to the canonical HTTPS apex. Earlier pending-TLS notes are resolved.

Server-side build validation is being checked separately. No App Review submission or public release has occurred. Broader authenticated-site, full keyboard/VoiceOver, private-window, sustained-performance, and oldest-supported-OS coverage remain incomplete and must not be represented as passed.
