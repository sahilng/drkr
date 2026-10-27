# Mac App Store release: remaining steps

The public source and GitHub Pages website are separate from App Store distribution. Publishing source does not require an Apple Developer membership; shipping the Safari extension through the Mac App Store does.

## Publisher action

The publisher's active individual membership has been verified in App Store Connect with Account Holder and Admin roles, Team ID `F9QX3SUK38`. This team is recorded in `release-info.json` for signing preparation. Apple Developer still displays a different membership name; the publisher has requested an information update. Confirm the correct legal seller identity with Apple before submission. Do not leave the membership or purchase another enrollment to resolve that display mismatch.

1. Enroll in the [Apple Developer Program](https://developer.apple.com/programs/enroll/). Choose individual or organization based on the publisher you intend to display. Individual enrollment displays your legal name as the seller; organization enrollment has additional verification requirements. Complete enrollment, identity verification, agreements, and payment yourself.
2. Add the enrolled Apple account in Xcode Settings → Accounts. Obtain the Team ID. Do not share passwords, private keys, or payment details in issues or chat.
3. Confirm the publishing team is a membership you control as Account Holder. Being invited as Admin on someone else's team does not make its seller identity or payout configuration yours. You can belong to multiple teams; leaving an unrelated team is not required to publish under your own membership. Do not use an unmanaged or third-party team for Drkr.
4. Record that confirmed Team ID in `release-info.json` as `apple_team_id`. The archive script refuses an unconfirmed team or a conflicting `DEVELOPMENT_TEAM` override.
5. Register the app identifier `io.github.sahilng.drkr` and extension identifier `io.github.sahilng.drkr.Extension` under your team, subject to availability. Confirm both targets' signing settings in Xcode. If identifiers change, update `release-info.json`, the project, and tests consistently.

## Paid distribution

The planned US base price is **$0.99 USD as a one-time purchase**. The actual App Store price remains unset until the app record and publishing team are confirmed. The source remains MIT licensed.

The publishing membership's Account Holder must accept the Paid Apps Agreement and complete the required tax/banking setup in App Store Connect. The publisher handles legal agreements, identity, tax, and banking information directly. No such changes have been made by the build tooling. Review [Apple's pricing instructions](https://developer.apple.com/help/app-store-connect/manage-app-pricing/set-a-price) and [banking requirements](https://developer.apple.com/help/app-store-connect/manage-banking-information/enter-banking-information/).

## Before archiving

- Complete the Safari gate in `BETA-CHECKLIST.md`, including authenticated workflows using test accounts, permissions/private browsing, popup keyboard/VoiceOver operation, back/forward, slow loads, and oldest supported versions.
- Re-test the packaged app separately from the temporary extension. Keep one copy enabled at a time.
- Finalize version/build numbers, a publisher-owned copyright, and distribution metadata.
- Capture actual Safari and native app screenshots in an accepted Mac size (1280×800, 1440×900, 2560×1600, or 2880×1800). Avoid private content and do not submit mock illustrations or Playwright screenshots as actual Safari use.

## Archive and submission

```sh
bash scripts/build-macos.sh --archive
```

Open `build/Drkr.xcarchive` with Xcode Organizer, validate the signed archive, and test the distributed build. The script does not upload or submit the app.

Create the macOS record in App Store Connect. Use `STORE-LISTING.md` for the draft description, support/privacy/marketing URLs, and reviewer steps. Complete price/availability, category, age rating, screenshots, accessibility answers, export-compliance questions, and App Privacy against the actual release binary. Check the hosted URLs after deployment.

App Store Connect privacy is currently expected to be “Data Not Collected” because the extension does not transmit data. Reassess if any release changes add network requests, analytics, accounts, or SDKs. GitHub support issues are public and voluntary, separate from automatic extension data collection.

Submit only after the signed build and metadata have been reviewed. No App Store approval or public release is implied by the local build or GitHub publication.

## References

- [Apple: distributing a Safari web extension](https://developer.apple.com/documentation/safariservices/distributing-your-safari-web-extension)
- [Apple: app privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/)
- [Apple: screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)
- [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
