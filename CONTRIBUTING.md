# Contributing to drkr

drkr is MIT licensed. Small, reviewable changes with a clear reproduction are welcome.

## Setup

Use Node 22+ and pnpm 11.25.0. Install dependencies with `pnpm install --frozen-lockfile`, then run `pnpm test`. Browser tests require `pnpm exec playwright install chromium webkit` and run with `pnpm test:browser` (Chromium) or `BROWSER=webkit pnpm test:browser` (WebKit). Playwright WebKit checks are not a replacement for installed Safari extension tests.

The extension itself has no runtime dependencies. Never add analytics, credentials, remote scripts, or network calls without an explicit product decision and privacy-policy review.

## Safari

Load `extension/` as a temporary extension in Safari's Developer settings. Reload the extension and webpage after changing sources. Test On / System / Off, site overrides, native dark themes, private browsing, form values, and restoring original appearance. Keep only one drkr copy enabled while testing.

Run `bash scripts/build-macos.sh` to build the checked-in native project. Keep manifest, package, and native version numbers aligned. The archive path requires an Apple Developer team and is separate from the local ad-hoc build.

## Changes

Open a GitHub issue with a public reproduction or a stripped-down fixture. Do not include account data or personal messages. Add a regression test for substantial rendering or behavior fixes. Prefer narrow compatibility fixes over broad inversion of images or arbitrary changes to website behavior.

See `docs/BETA-CHECKLIST.md` for remaining release gates and `SECURITY.md` for private vulnerability reporting.
