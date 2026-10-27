# Safari compatibility review — October 27, 2026

Reviewed in real Safari 26.6.2 on macOS 26.6.2 with the signed local 1.0.0/build 6 candidate, global On, and the existing OS dark appearance. This is a representative visual sweep, not a guarantee for every page or interaction. Wikipedia was checked earlier in the same session before the final transition-guard refinement; the remaining broad-sweep pages used the final candidate. Existing user tabs were preserved.

| Site / URL | Checked | Observation / limit |
| --- | --- | --- |
| [JLH](https://www.jlh.org/about/) | Reload, About page, menu investigation | Fresh reload removes stale light rows. Controlled nested hover/focus regression reproduces the descendant bug and passes with the fix. Native continuous hover could not be reliably driven by the automation; final live page is readable. Dark wordmark artwork remains low contrast. |
| [Krugman / Substack](https://paulkrugman.substack.com/p/the-crisis-next-time) | Reload, public article preview and controls | Final loaded page is dark and readable. Late stylesheet and hydration timing pass controlled tests. No real first-paint video or slow-network measurement; paywalled content not tested. |
| [Wikipedia](https://en.wikipedia.org/wiki/Moon) | Article, table, photo, main-menu dropdown | Readable dark text surfaces and menu; photo preserved. Small dark symbol artwork remains low contrast. |
| [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS) | Documentation and CSS navigation dropdown | Native dark appearance and menu remain readable; original ad artwork retained. |
| [GitHub](https://github.com/sahilng/drkr) | Public repository list and Code dropdown | Text, URL field, tabs, and popup readable. No repository/account mutations. |
| [Hacker News](https://news.ycombinator.com/) | Dense story list and metadata | Readable. Original warm background hue maps to a dark olive/brown tint. |
| [BBC](https://www.bbc.com/news) | Terms/privacy overlay only | Overlay text and button readable; logo artwork dark. Did not accept Terms of Use, so underlying news page remains untested. |
| [GOV.UK](https://www.gov.uk/) | Homepage, cookie banner, navigation labels, search field | Dark surfaces and labels readable. No service forms submitted. |
| [W3C WAI](https://www.w3.org/WAI/tutorials/forms/labels/) | Scrolled form examples and code blocks; typed disposable text into example field | Labels, native field, checkbox, code, and links readable; editing works. No form submitted. |
| [OpenStreetMap](https://www.openstreetmap.org/) | Map, welcome sidebar, search, map control appearance | Sidebar and controls readable; map tiles preserve original light colors. No location permission requested or granted. |
| [Stack Overflow](https://stackoverflow.com/questions/tagged/javascript) | Question list, tags, search, cookie and Google sign-in overlays | Initial automatic challenge resolved without interaction. Main text and overlays readable; dark logo artwork low contrast. Did not sign in. |
| [YouTube](https://www.youtube.com/) | Homepage controls, search, metadata, thumbnails | Native dark appearance readable; thumbnails preserved. No video playback or account action tested; personalized content not stored in this report. |
| [DuckDuckGo](https://duckduckgo.com/?q=Safari+extensions) | Search results, filters, search field, promotional panel | Text and controls readable; artwork preserved. |

## Fixes and reproducible evidence

- Hover/focus updates now include bounded ancestor subtrees so CSS on an ancestor can restyle sibling submenu rows correctly.
- Stylesheet loading, document-level hydration, and restored pages schedule urgent scans before the next rendering opportunity, while ordinary mutations remain batched.
- Author-style measurement suppresses paint transitions only. Opacity/transform transitions continue, including transition:all menu fades that the build 5 universal guard could cancel.
- `tests/lifecycle.cjs` checks whole-submenu hover, child hover, keyboard focus, a still-running opacity fade, hydration, and a late stylesheet by the next animation frame. The original descendant handling failed the submenu assertion; the universal guard failed the fade assertion. The final implementation passes in WebKit and Chromium.
- Full startup/browser/popup/hardening/CSP/contrast/lifecycle suites and nine core tests pass. The 5,000-card fixture remains bounded and idle-stable; this is not a battery benchmark.

## Remaining scope

Dark image logos and map tiles are intentionally not globally inverted. Selective artwork treatment needs separate work. Live hover timing on JLH and first-paint recording on Krugman remain follow-up checks on a human-driven Safari session. Older supported Safari versions, exhaustive authenticated workflows, VoiceOver, and all network/load conditions were not covered by this sweep. Reload already-open tabs after an extension update so they receive the new content script.
