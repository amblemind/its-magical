const BROWSERLESS_ENDPOINT = 'https://chrome.browserless.io/screenshot';

// Hosts that should never be reachable from the screenshot browser. Without
// this, anyone could point the tool at internal infrastructure and read the
// response back as an image.
const BLOCKED_HOSTNAMES = new Set(['localhost', '0.0.0.0', '[::1]', '169.254.169.254']);
const PRIVATE_IP = /^(10\.|127\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/;

/**
 * Accepts what a person is likely to type ("stripe.com") and returns a URL we
 * can hand to a browser, or throws with a message worth showing them.
 */
function parseTargetUrl(input) {
  const trimmed = (input || '').trim();
  if (!trimmed) throw new Error('Enter a website URL to remix.');

  let url;
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    throw new Error(`"${trimmed}" is not a URL we can open. Try something like stripe.com.`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http and https URLs can be remixed.');
  }
  if (BLOCKED_HOSTNAMES.has(url.hostname) || PRIVATE_IP.test(url.hostname)) {
    throw new Error('That address is on a private network, so the browser cannot reach it.');
  }
  return url.toString();
}

// https://css-tricks.com/converting-color-spaces-in-javascript/#aa-hex-to-hsl
// Only the hue is kept -- saturation and lightness come from the palette below.
function hexToHue(hex) {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = '0x' + hex[1] + hex[1];
    g = '0x' + hex[2] + hex[2];
    b = '0x' + hex[3] + hex[3];
  } else if (hex.length === 7) {
    r = '0x' + hex[1] + hex[2];
    g = '0x' + hex[3] + hex[4];
    b = '0x' + hex[5] + hex[6];
  }
  r /= 255; g /= 255; b /= 255;

  const cmin = Math.min(r, g, b);
  const cmax = Math.max(r, g, b);
  const delta = cmax - cmin;

  let h = 0;
  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);
  return h < 0 ? h + 360 : h;
}

/** Resolves a hue from either the hue slider or a legacy hex colour. */
function resolveHue({ hue, color }) {
  const numeric = Number(hue);
  if (Number.isFinite(numeric)) return ((Math.round(numeric) % 360) + 360) % 360;
  if (typeof color === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) return hexToHue(color);
  throw new Error('Pick a hue between 0 and 359.');
}

/**
 * Every colour property on the target page, rebuilt from a single hue. This is
 * injected into the page after load and before the screenshot is taken.
 */
function generateCss(hue) {
  return `
  :root {
    --hue: ${hue};
    --color-normal: hsl(var(--hue), 10%, 62%);
    --color-light: hsl(var(--hue), 15%, 35%);
    --color-richer: hsl(var(--hue), 50%, 72%);
    --color-highlight: hsl(var(--hue), 70%, 45%);
    --link-color: hsl(var(--hue), 90%, 70%);
    --background: hsl(var(--hue), 20%, 12%);
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

  a, a * { color: var(--link-color) !important; }
  `;
}

function requireEnv(...names) {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Server is missing ${missing.join(', ')}. See .env.example.`);
  }
}

async function captureScreenshot(url, hue) {
  const response = await fetch(`${BROWSERLESS_ENDPOINT}?token=${process.env.BROWSERLESS_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
    body: JSON.stringify({
      url,
      gotoOptions: { waitUntil: 'networkidle2', timeout: 30000 },
      viewport: { width: 1600, height: 900, deviceScaleFactor: 2 },
      options: { fullPage: false, type: 'png' },
      addStyleTag: [{ content: generateCss(hue) }],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      response.status === 404 || detail.includes('net::ERR')
        ? 'The browser could not load that site. Check the URL and try again.'
        : 'The screenshot service did not respond. Try again in a moment.'
    );
  }
  return Buffer.from(await response.arrayBuffer());
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST to remix a page.' });
  }

  try {
    requireEnv('BROWSERLESS_TOKEN');
    const url = parseTargetUrl(req.body?.url);
    const hue = resolveHue(req.body ?? {});

    const image = await captureScreenshot(url, hue);

    // The PNG is returned as the response body rather than a link to it; the
    // client wraps it in an object URL. Errors still come back as JSON, so the
    // caller distinguishes the two by response status.
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', image.length);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Remix-Hue', String(hue));
    return res.status(200).send(image);
  } catch (error) {
    console.error('[remix]', error);
    return res.status(400).json({ error: error.message || 'The remix failed. Try again.' });
  }
}
