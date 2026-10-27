# Drkr 0.2.0 beta gate

## Implemented

- Checked-in macOS containing app and extension project, matching bundle identifier prefixes, startup stylesheet included.
- Local ad-hoc build command and separate team-signed archive command.
- Grouped CSS rules, batched style reads/writes, targeted DOM updates, bounded color caches, disconnected-node cleanup.
- Gradient recoloring, generated-content styling, open shadow-root discovery, conservative original styling for artwork and inline-important panels.
- Local privacy-policy draft and in-app help.
- Bundled privacy manifests and a native handler that does not read or log message payloads.

See [validation notes](VALIDATION.md) for actual runs and remaining limits. The controlled Safari fixture passed 7/7 checks on Safari 26.6.2; the public-site matrix below remains broader than that smoke test.

## Required Safari testing

Record results; do not infer them from Chrome checks. Test the temporary extension and packaged app separately. Disable one while testing the other to avoid duplicate engines. Use a dedicated test profile and test accounts; do not enter sensitive credentials just for testing.

| Site / case | Result | Notes |
| --- | --- | --- |
| LinkedIn feed, navigation, menus, scrolling | Pending | |
| Gmail list, composer, search, dialogs | Pending | |
| Wikipedia article, table, images | Partial | Moon article visually inspected in Safari 26.6.2. Text/table/media render; baked-in black logos/icons have contrast limitations. |
| News article with sticky header and lazy content | Pending | |
| Forms: input, select, textarea, disabled, focus | Pending | |
| Native dark theme and live OS appearance changes | Pending | |
| Global Off and site override restore original colors | Pending | |
| Safari private window and denied website permission | Pending | |
| Cold navigation, slow page, refresh, back/forward | Pending | |
| Long page: sustained scroll and CPU | Pending | |
| Keyboard-only popup and VoiceOver labels | Pending | |
| Minimum supported macOS / Safari versions | Pending | macOS 13+ build target; oldest supported Safari unverified |

Record Safari/macOS version, Drkr version, URL, global/site mode, steps, and before/after screenshots for visual bugs. Do not include private messages or account data.

## Public source and website

- Source: https://github.com/sahilng/drkr (MIT)
- Website: https://drkr.space/
- Support: https://drkr.space/support.html
- Privacy: https://drkr.space/privacy.html
- All three Pages URLs verified HTTP 200 over HTTPS. Private vulnerability reporting is enabled on the repository.
- Automated checks cover Chromium and WebKit; real Safari gates below still apply.

## Public release still requires

- Complete the Safari matrix and resolve severe readability, navigation, and performance defects.
- Choose publisher-owned bundle identifiers and Apple Developer team; archive, validate, and test the distributed signed build.
- Support and privacy pages are live on GitHub Pages. Confirm publisher identity and App Store privacy answers against the release binary (current code transmits no data).
- Review app icon, create real Safari screenshots, choose category, age rating, availability, and complete reviewer instructions.
- If shipping outside the Mac App Store, sign and notarize using Developer ID instead.

The beta is macOS-only. Do not advertise iPhone/iPad support. Closed shadow roots, distant selector dependencies such as :has(), late shadow roots attached without observable DOM changes, CSS animations, and canvas artwork remain compatibility limits. Original artwork and inline-important panels may remain light to preserve readability.
