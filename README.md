# drkr · macOS beta 0.2.0

A local-first Safari dark-mode extension. Global On / System / Off, exact-hostname overrides, native dark-theme detection, preserved media, and a toolbar popup. No production dependencies, network services, analytics, or accounts. MIT licensed.

[Website](https://drkr.space/) · [Support](https://drkr.space/support.html) · [Privacy](https://drkr.space/privacy.html)

The Mac App Store version is being prepared; there is no public App Store download yet.

## Try it in Safari

1. Safari → Settings → Advanced: enable developer features if needed.
2. Settings → Developer → Add Temporary Extension: choose this repository's **extension/** folder. Authorize unsigned extensions if Safari asks.
3. Enable drkr and allow access to your chosen websites. Private-browsing access is optional.
4. Reload existing webpages. Use the moon toolbar icon to choose appearance.
5. After changing source files, use **Reload** on the temporary extension in Safari Settings, then reload webpages.

Temporary extensions expire after 24 hours or when Safari quits. This route does not require Xcode. The packaged app and temporary extension are separate copies; keep one enabled while testing.

## Build the macOS app

Install and open full Xcode, select its developer tools, then run:

```sh
bash scripts/build-macos.sh
```

This builds the checked-in **macos/Drkr/Drkr.xcodeproj** using local ad-hoc signing. It verifies signatures, resource hashes, matching bundle identifier prefixes, and version numbers. App output: `build/DerivedData/Build/Products/Debug/Drkr.app`. Open it for setup, help, and privacy information. The old `package-safari.sh` command delegates to this build script; it no longer regenerates the project.

A local build still requires Safari's unsigned-extension option. It is not an App Store distribution build.

To prepare a signed archive after choosing publisher-owned bundle identifiers, configuring your Apple Developer identity, and recording your confirmed Account Holder team ID as `apple_team_id` in `release-info.json`:

```sh
bash scripts/build-macos.sh --archive
```

Validate and distribute the archive with Xcode Organizer. The archive path is `build/Drkr.xcarchive`. No archive is uploaded or published by the script. Team signing, hosted support/privacy URLs, and completed App Store metadata are still required. [Apple distribution documentation](https://developer.apple.com/documentation/safariservices/distributing-your-safari-web-extension).

## How it behaves

- System follows the OS color scheme. Per-site overrides apply to the exact hostname across all paths; embedded frames use their own hostname preferences.
- “Respect existing dark themes” inspects the original body/root background. Disable it if a site is misidentified.
- Computed background, text, border, outline, and caret colors are remapped. CSS gradients keep their structure and stop positions. Generated before/after content and discoverable open shadow roots are themed too.
- Photos, videos, SVG artwork, and canvases retain their pixels. Small neutral SVG controls are recolored for contrast, and Wikipedia wordmarks receive a narrow compatibility fix while dark mode is active. Background artwork and inline-important panels can remain original to preserve readability.
- The engine batches computed-style reads before writes, shares CSS rules between matching elements, processes dirty areas, and removes disconnected-node bookkeeping. Dark mode Off disconnects mutation observation until re-enabled.
- A dark startup cover reduces the initial flash while preferences load. It reveals the original page promptly for Off settings and fails open after 1.5 seconds if startup fails. The cover briefly intercepts clicks so unseen controls aren't clicked. It can still appear briefly on disabled sites while preferences are read; Safari's own pre-injection navigation background is outside our control.
- Preferences (including hostnames with overrides) stay in Safari extension-local storage. No page text, form values, or browsing log is collected or transmitted. See [privacy policy](docs/PRIVACY.md).

## Validation

Use Node 22+ and pnpm 11.25.0. The extension needs no runtime packages; these dependencies are for development only.

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm test
pnpm exec playwright install chromium webkit
pnpm test:browser
BROWSER=webkit pnpm test:browser
pnpm test:site
```

GitHub Actions runs the unit, rendering, and website checks on both engines with pinned action revisions and a dependency lockfile.

Set `CHROME_PATH` to explicitly test an installed Chrome; otherwise use the pinned Playwright browser. Chromium and WebKit tests use real DOM/CSS with simulated extension storage/messaging boundaries, and do not replace installed Safari testing. `tests/hardening.cjs` checks generated content, gradients, modern CSS colors, shadow roots, conservative surfaces, form preservation, a 5,000-card fixture, small-update scope, and idle behavior. It writes timing evidence to `build/performance-chromium.json` and `build/performance-webkit.json`; these are development measurements, not release performance guarantees.

For the installed Safari extension, serve the controlled fixture:

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory tests
```

Open `http://127.0.0.1:8765/safari-fixture.html` in Safari. It displays checks based on actual extension-applied styles. Stop the server with Ctrl-C when finished. Real-world Safari QA and the distributed signed build still need the [beta checklist](docs/BETA-CHECKLIST.md). See [validation notes](docs/VALIDATION.md) for completed checks and their limits.

## Known limitations and release gate

Safari's protected pages cannot be themed. Closed shadow roots, shadow roots attached later without observable DOM changes, distant selector dependencies such as `:has()`, CSS animations, native browser popovers, and canvas-heavy apps may need site-specific support. Logos with baked-in black pixels can have poor contrast because artwork isn't inverted. Large document-wide CSS changes still require a full scan. This is a macOS beta, not advertised iPhone/iPad support.

[Beta checklist](docs/BETA-CHECKLIST.md) · [Privacy draft](docs/PRIVACY.md) · [Store listing draft](docs/STORE-LISTING.md)

## Publishing and contributions

The support/privacy website is static HTML/CSS/JS under `docs/`, hosted with GitHub Pages from the `main` branch's `/docs` folder. No analytics or external assets are loaded. GitHub Issues is the public support channel.

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [LICENSE](LICENSE). Public App Store distribution still needs Apple Developer enrollment, a signed archive, the remaining Safari QA gates, and the [submission steps](docs/APP-STORE-NEXT.md). The default publisher identifiers are `io.github.sahilng.drkr` and `io.github.sahilng.drkr.Extension`; forks must use their own identifiers and team.
