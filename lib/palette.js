/**
 * Every colour in this project comes from one number.
 *
 * Two stylesheets are built from that number and both live here, so the page
 * you are looking at and the page the API repaints cannot fall out of step:
 *
 *   themeRule()  — the tokens this site themes itself with, injected into the
 *                  document head so the first paint is already correct.
 *   overrideCss() — the blunt instrument the API forces onto a target site.
 */

/** [token, saturation %, lightness %] — the palette, in reading order. */
const TOKENS = [
  ['--bg', 24, 7],
  ['--surface', 20, 11],
  ['--surface-raised', 19, 14],
  ['--line', 16, 22],
  ['--line-bright', 22, 32],
  ['--muted', 12, 60],
  ['--text', 28, 93],
  ['--accent', 85, 65],
  ['--accent-dim', 60, 22]
];

export const DEFAULT_HUE = 284;

export function clampHue(value) {
  return Math.min(359, Math.max(0, Math.round(Number(value) || 0)));
}

/**
 * Declared against var(--hue) rather than a resolved colour, so dragging the
 * dial re-themes the page by changing one number rather than nine.
 */
export function themeRule(hue) {
  const declarations = TOKENS.map(([name, s, l]) => `${name}:hsl(var(--hue),${s}%,${l}%)`).join(';');
  return `:root{--hue:${clampHue(hue)};${declarations}}`;
}

/** The same palette, resolved and formatted for someone to paste into their own stylesheet. */
export function paletteCss(hue) {
  const safe = clampHue(hue);
  const width = Math.max(...TOKENS.map(([name]) => name.length));

  return [
    ':root {',
    `  --hue: ${safe};`,
    '',
    ...TOKENS.map(([name, s, l]) => `  ${`${name}:`.padEnd(width + 1)} hsl(var(--hue), ${s}%, ${l}%);`),
    '}'
  ].join('\n');
}

/**
 * What the API injects into the site being screenshotted. Deliberately heavy
 * handed: it overrides every colour property rather than trying to work out
 * which ones matter, because a blunt instrument applied uniformly produces a
 * coherent result where a clever one produces a broken one.
 */
export function overrideCss(hue) {
  const safe = clampHue(hue);

  return `:root {
  --hue: ${safe};
  --color-normal:    hsl(var(--hue), 10%, 62%);
  --color-light:     hsl(var(--hue), 15%, 35%);
  --color-richer:    hsl(var(--hue), 50%, 72%);
  --color-highlight: hsl(var(--hue), 70%, 45%);
  --link-color:      hsl(var(--hue), 90%, 70%);
  --background:      hsl(var(--hue), 20%, 12%);
}

* {
  color: var(--color-richer) !important;
  background-color: var(--background) !important;
  border-color: var(--color-light) !important;
  box-shadow: none !important;
  caret-color: var(--link-color) !important;
  column-rule-color: var(--color-light) !important;
  outline-color: var(--color-light) !important;
  text-decoration-color: var(--color-highlight) !important;
}

a, a * { color: var(--link-color) !important; }`;
}
