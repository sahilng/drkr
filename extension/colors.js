globalThis.DrkrColors = (() => {
  const parsed = new Map(), mapped = new Map();
  let context;
  function remember(cache, key, value) {
    if (cache.size >= 2048) cache.clear();
    cache.set(key, value);
    return value;
  }
  function parse(value) {
    if (typeof value !== "string") return null;
    if (parsed.has(value)) return parsed.get(value);
    const match = value.match(/^rgba?\(([^)]+)\)$/);
    if (!match) {
      // Let the browser resolve CSS Color 4 (P3, OKLCH, etc.) into sRGB.
      // This samples only our own one-pixel color swatch, never page images.
      if (typeof document === "undefined" || !globalThis.CSS?.supports("color", value)) return null;
      if (!context) {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        context = canvas.getContext("2d", { willReadFrequently: true });
      }
      if (!context) return null;
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      const pixel = context.getImageData(0, 0, 1, 1).data;
      return remember(parsed, value, [pixel[0], pixel[1], pixel[2], pixel[3] / 255]);
    }
    const parts = match[1].replace(/\//g, " ").split(/[,\s]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const channel = v => v.endsWith("%") ? parseFloat(v) * 2.55 : Number(v);
    const result = parts.slice(0, 3).map(channel);
    result.push(parts[3] === undefined ? 1 : parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : Number(parts[3]));
    if (!result.every(Number.isFinite)) return null;
    return remember(parsed, value, result.map((v, i) => Math.max(0, Math.min(i === 3 ? 1 : 255, v))));
  }
  function luminance(c) {
    const rgb = c.slice(0, 3).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  }
  function hsl([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, l = (max + min) / 2;
    let h = 0, s = 0;
    if (d) {
      s = d / (1 - Math.abs(2 * l - 1));
      h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    return [h, s, l];
  }
  function map(value, role) {
    const key = `${role}:${value}`;
    if (mapped.has(key)) return mapped.get(key);
    const c = parse(value);
    if (!c || c[3] === 0) return null;
    let [h, s, l] = hsl(c);
    if (role === "background") {
      // Keep already-dark surfaces; lower bright surfaces without inverting media.
      if (l < .18) return null;
      l = s < .12 ? .075 + (1 - l) * .13 : .17 + (1 - l) * .12;
      s = Math.min(s, .55);
    } else if (role === "border") {
      l = .24 + (1 - l) * .08;
      s = Math.min(s, .25);
    } else {
      l = s < .12 ? .88 : .76;
      s = Math.min(s, .8);
    }
    return remember(mapped, key, `hsla(${h.toFixed(1)}, ${(s * 100).toFixed(1)}%, ${(l * 100).toFixed(1)}%, ${c[3]})`);
  }
  function gradient(value, role = "background") {
    if (!/gradient\(/i.test(value) || /url\(/i.test(value)) return null;
    // Replace complete color functions, preserving gradient type, angle,
    // interpolation space, stop positions, and multiple gradient layers.
    const colors = /\b(?:rgba?|hsla?|color|oklch|oklab|lab|lch)\(/gi;
    let result = "", from = 0, match;
    while ((match = colors.exec(value))) {
      let depth = 1, end = colors.lastIndex;
      while (end < value.length && depth) {
        if (value[end] === "(") depth++;
        if (value[end] === ")") depth--;
        end++;
      }
      if (depth) return null;
      const color = value.slice(match.index, end);
      result += value.slice(from, match.index) + (map(color, role) || color);
      from = end;
      colors.lastIndex = end;
    }
    return result + value.slice(from);
  }
  return { parse, luminance, map, gradient };
})();
