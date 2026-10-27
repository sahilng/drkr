# Mac App Store release: remaining steps

The public source and GitHub Pages website are separate from App Store distribution. Publishing source does not require an Apple Developer membership; shipping the Safari extension through the Mac App Store does.

## Publisher action

The publisher's active individual membership has been verified in App Store Connect with Account Holder and Admin roles, Team ID `F9QX3SUK38`. The publisher explicitly approved proceeding under the existing membership/seller name, Rishav Gupta. The name is not a release blocker. This team is recorded in `release-info.json`; do not leave the membership or purchase another enrollment to change the displayed name.

Signing preparation is complete on the publisher's Mac: approved development, distribution, and installer identities, matching profiles, and explicit bundle IDs are configured. The publisher reported submitting **1.0.0/build 4** directly to Apple on October 26, 2026. Manual release is selected; the $0.99 worldwide listing is not public. The internal TestFlight group **Release checks** contains build 4 and only the publisher's account, with automatic distribution off.

**1.0.0/build 5** fixes the reported Tech Jobs for Good contrast and field flashing problems. Local signed Safari testing and Chromium/WebKit regression checks pass. Private upload and TestFlight distribution status are recorded at the end of `VALIDATION.md`. Adding a new beta build does not replace the submitted App Store build. The publisher must decide separately whether to replace an in-review build or submit a later update; do not cancel or change the review submission automatically. Do not commit or share private keys.

Two real Safari screenshots are uploaded to the private version draft. The calculated age rating is 4+ with regional equivalents, and the content declaration is saved. Worldwide availability is configured for all 175 current storefronts after release; EU compliance now shows Active with no outstanding regulatory requirements. Homepage/support/privacy pages now pass normal HTTPS verification, and HTTP/www redirect to the canonical HTTPS apex.

1. Enroll in the [Apple Developer Program](https://developer.apple.com/programs/enroll/). Choose individual or organization based on the publisher you intend to display. Individual enrollment displays your legal name as the seller; organization enrollment has additional verification requirements. Complete enrollment, identity verification, agreements, and payment yourself.
2. Add the enrolled Apple account in Xcode Settings → Accounts. Obtain the Team ID. Do not share passwords, private keys, or payment details in issues or chat.
3. Confirm the publishing team is a membership you control as Account Holder. Being invited as Admin on someone else's team does not make its seller identity or payout configuration yours. You can belong to multiple teams; leaving an unrelated team is not required to publish under your own membership. Do not use an unmanaged or third-party team for Drkr.
4. Record that confirmed Team ID in `release-info.json` as `apple_team_id`. The archive script refuses an unconfirmed team or a conflicting `DEVELOPMENT_TEAM` override.
5. Register the app identifier `io.github.sahilng.drkr` and extension identifier `io.github.sahilng.drkr.Extension` under your team, subject to availability. Confirm both targets' signing settings in Xcode. If identifiers change, update `release-info.json`, the project, and tests consistently.

## Paid distribution

The US base price is configured as **$0.99 USD as a one-time purchase**, with Apple's equivalent storefront prices. It takes effect when the app is available for sale. The publisher reported submitting build 4; the app is not live. The source remains MIT licensed.

The publishing membership's Account Holder must accept the Paid Apps Agreement and complete the required tax/banking setup in App Store Connect. The publisher handles legal agreements, identity, tax, and banking information directly. No such changes have been made by the build tooling. Review [Apple's pricing instructions](https://developer.apple.com/help/app-store-connect/manage-app-pricing/set-a-price) and [banking requirements](https://developer.apple.com/help/app-store-connect/manage-banking-information/enter-banking-information/).

## Before archiving

- Complete the Safari gate in `BETA-CHECKLIST.md`, including authenticated workflows using test accounts, permissions/private browsing, popup keyboard/VoiceOver operation, back/forward, slow loads, and oldest supported versions.
- Re-test the packaged app separately from the temporary extension. Keep one copy enabled at a time.
- Finalize version/build numbers, a publisher-owned copyright, and distribution metadata.
- Capture actual Safari and native app screenshots in an accepted Mac size (1280×800, 1440×900, 2560×1600, or 2880×1800). Avoid private content and do not submit mock illustrations or Playwright screenshots as actual Safari use.

Two real Safari homepage On/Off screenshots using original content from `docs/index.html` are saved in `store-assets/macos/` as `01-controls.jpg` and `02-reading.jpg`, and uploaded to the private version draft. They show the packaged extension operating on a local page, not an illustration of its UI. Wikipedia captures are QA references only. Re-capture if the release UI changes.

## Archive and submission

```sh
bash scripts/build-macos.sh --archive
python3 scripts/export-app-store.py
```

Open `build/Drkr.xcarchive` with Xcode Organizer, validate the signed archive, and test the distributed build. The archive script does not upload or submit the app.

The export tool uses existing valid local distribution/installer identities for the configured team and writes `build/AppStore/Drkr.pkg`. It verifies local Mac App Store profiles for both bundle IDs against their team, app identifier, certificate, platform, and expiration. Download the profiles through Apple Developer, install them for Xcode, and keep local copies at `build/signing/drkr-app-store.provisionprofile` and `build/signing/drkr-extension-app-store.provisionprofile`. Production profiles are imported for Xcode; System Settings accepts only development profiles. Profiles and private keys stay out of Git. The default command exports locally; `--validate` sends the archive for Apple validation, and `--upload` uploads privately to App Store Connect. None of these commands submit an app to App Review, register devices, create certificates, or update provisioning. The current release candidate is 1.0.0/build 4, and the private store version is aligned to 1.0.0.

Create the macOS record in App Store Connect. Use `STORE-LISTING.md` for the draft description, support/privacy/marketing URLs, and reviewer steps. Complete price/availability, category, age rating, screenshots, accessibility answers, export-compliance questions, and App Privacy against the actual release binary. Check the hosted URLs after deployment.

App Store Connect’s “Data Not Collected” label is published with explicit publisher approval because the extension does not transmit data. Reassess if any release changes add network requests, analytics, accounts, or SDKs. GitHub support issues are public and voluntary, separate from automatic extension data collection.

Submit only after the signed build and metadata have been reviewed. No App Store approval or public release is implied by the local build or GitHub publication.

## References

- [Apple: distributing a Safari web extension](https://developer.apple.com/documentation/safariservices/distributing-your-safari-web-extension)
- [Apple: app privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/)
- [Apple: screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)
- [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
