// Narrow, reviewable fixes for assets that cannot be inferred from page colors.
// Never apply an image-wide inversion rule: photographs must keep their pixels.
globalThis.DrkrSiteRules = {
  css(host) {
    if (host === "wikipedia.org" || host.endsWith(".wikipedia.org")) {
      return '.mw-logo-wordmark,.mw-logo-tagline{filter:invert(1) hue-rotate(180deg)!important}';
    }
    return "";
  }
};
