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


### Apple validation and provisioning

Apple's validation-only workflow accepted 1.0.0/build 3. It returned a TestFlight eligibility warning because the main app had no provisioning profile. Created Mac App Store profiles for both registered bundle IDs using the existing approved Apple Distribution certificate. Verified their team, explicit App IDs, platform, certificate, expiration, and distribution type; installed them for Xcode and kept local copies only in the ignored signing folder.

The profiled export succeeds. Expanded its actual installer payload and verified both embedded profiles, both signatures, 1.0.0/build 3, lowercase native names, encryption declaration, and all 12 resource hashes. The export helper now supports explicit validation/private-upload modes and verifies matching profiles before either operation. Private upload/processing status is recorded after completion below; no App Review submission is performed by this tooling.


### Private upload and 1.0.0 Safari smoke test

Xcode reports Upload succeeded for the profiled 1.0.0/build 3 package. No TestFlight provisioning warning was returned during this upload. Apple is processing the package; TestFlight did not yet list a processed build at the last check. This is an upload, not an App Review submission or public release.

Refreshed the stable local signed copy to the exact 1.0.0 archive and verified its 12 resources, signatures, native lowercase name, setup version, and enabled status. Re-ran the real Safari fixture: 7/7 checks pass. The page select changes from One to Two, textarea editing works, and a new card renders. The original reading-page smoke also preserves input and themes dynamically added content. A private test window keeps the local page light and omits the drkr toolbar control under default denial; private opt-in remains untested. Closed the private test window. Additional QA evidence stays in the ignored build folder, separate from the two store screenshot files.

Apple processing completed: TestFlight lists 1.0.0/build 3 as Ready to Submit. Selected that build in the macOS 1.0.0 version draft, saved, and verified the attached build remains visible with Save disabled. The version remains Prepare for Submission. No App Review submission or public release has occurred. The owned loopback fixture server was stopped after testing.

The publisher chose to prioritize App Review over optional TestFlight distribution and further local testing. No TestFlight group or invitation was created. Apple’s Add for Review preflight succeeded: macOS 1.0.0/build 3 is Ready for Review, with one item in Draft Submissions and Submit for Review available. Manual release remains selected. Final publisher approval to send the submission is pending. Remaining QA limits above are unchanged; they are not represented as passed.

Submission held at the publisher’s request to replace local-host screenshots with matching On/Off views of a public demo at drkr.space/demo.html. No final review submission was sent.

### Homepage comparison and build 4

At the publisher’s request, added a native light appearance option to the public homepage for matching real On/Off screenshots. Website navigation, responsive desktop/mobile layout, keyboard demo controls, image loading, and no third-party requests pass WebKit checks; GitHub Pages deployment and CI passed at 1e2c7a3.

This caught a real Safari failure: the homepage’s strict style-src policy rejected the generated DOM style element, leaving its sheet null. The console showed the policy rejection and insertRule TypeError. Added a constructed-stylesheet fallback when Safari rejects a DOM sheet, including Off restoration, shadow-root cleanup, marker recovery, and normal native-dark detection. The page policy is unchanged; no extension permissions were added. Constructed sheets are available in Safari 16.4+; older Safari still uses the existing DOM path and may leave strict-policy pages original.

Strict-policy document/shadow-root, Off/On, preserved input, removed-marker recovery, and native-dark tests pass in both Chromium and WebKit. Existing WebKit browser, popup, startup, restoration, dynamic-content, and 5,000-card hardening suites pass, as do nine core tests. Signed 1.0.0/build 4 archive verifies all 12 packaged resources and signatures. Refreshed the stable Safari test installation and confirmed only that drkr registration remains. Real Safari now themes https://drkr.space/ dark with global On and shows the normal popup status, replacing the previous failure. The verified On capture uses build 4; the original-light Off capture uses build 3 with identical visible popup/page UI. Screenshots are unedited 2880×1800 Safari window captures at 85% zoom.

Xcode reports build 4 Upload succeeded / EXPORT SUCCEEDED. Apple processing and version attachment must be checked before final review submission. Build 3 was removed from the unsubmitted review draft so screenshot and build changes can be saved. No App Review submission or public release has occurred.

App Store Connect accepted homepage-on.jpg followed by homepage-off.jpg (2 of 10 screenshots) and Save is disabled after persistence. The previous localhost screenshots are removed from the version. Detached build 3 and saved the version while waiting for build 4.

Apple finished processing build 4 (Ready to Submit in TestFlight). Attached and saved 1.0.0 (4) in the version, verified both homepage screenshots persisted, and confirmed manual release. Add for Review preflight succeeded with the single 1.0.0 (4) item Ready for Review. The publisher will inspect the screenshots and submit directly. No App Review submission has been sent by the agent.

Handoff: the publisher explicitly chose to inspect and submit directly. App Store Connect is left on the draft submission with Submit for Review available. Both screenshot files were queued to open in Codex. Local checks passed as recorded above; GitHub Checks for cb27d6e was still running at handoff, while Pages deployment succeeded.


## October 27: contrast and field flashing, build 5

The publisher reported submitting build 4 directly. Subsequently created the internal TestFlight group Release checks with automatic distribution off, added build 4, and invited only the publisher's existing account after explicit approval. Apple showed that tester as Invited and build 4 Ready to Test.

Inspected the reported Tech Jobs for Good page in real Safari. Reproduced light text on white job-card panels, black count text on dark surfaces, faint company metadata, and animated color changes. A card uses inline color:inherit!important, which was incorrectly treated as an immutable original-painted surface. Website CSS transitions also interpolated colors during the engine's temporary author-style measurements. Stylesheet-important rules could keep an original background while its text was recolored.

Build 5 temporarily suppresses transitions only during synchronous measurements and final style resolution, then restores the author's transitions before yielding. It allows inherited/reset inline declarations that do not lock actual paint, raises generated rule specificity to keep author-important backgrounds and text paired, provides a dark first-frame fallback for new native form controls/comboboxes, and improves placeholder and partly transparent foreground contrast. Fully transparent text, original artwork, and explicit inline-important painted panels remain preserved. No permissions or network behavior changed.

New regression checks cover important inherited colors and stylesheet-important backgrounds, composited 4.5:1 title/description/metadata/count contrast in the controlled fixture, 24 hover-animation frames without light intermediates, first-frame dynamic inputs, author-transition restoration, and Off restoration. Nine core tests and full startup/browser/popup/hardening/strict-CSP/contrast suites pass in Chromium and WebKit. The 5,000-card fixture remains bounded and idle-stable; scan timings are recorded in ignored build/performance-*.json and are not a battery or field-performance benchmark.

Signed 1.0.0/build 5 archives successfully and verifies all 12 packaged resources and signatures. The stable local test installation is refreshed. Reloaded the actual reported page in Safari: job cards, button, count, search fields, descriptions, and company labels are readable; job cards stay dark. An explicit inline-important black count label retains a small light surface for contrast. Local visual evidence is in ignored build/safari-build5-techjobs.jpg. Real first-paint video/slow-network timing is not claimed; first-frame behavior is covered by the controlled browser test.

Private build 5 upload succeeded (EXPORT SUCCEEDED). Apple processed it, and after explicit publisher approval it was added to the existing Release checks group. Verified Internal Group · 1 Tester · 2 Builds, with 1.0.0 (5) showing Testing. Automatic distribution remains off. The publisher can update through TestFlight and reload open sites. The App Store submission remains build 4; it was not replaced or canceled.
