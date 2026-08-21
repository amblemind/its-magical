import Head from 'next/head';
import { useCallback, useEffect, useRef, useState } from 'react';
import GitHubStar from '../components/GitHubStar';
import { DEFAULT_HUE, clampHue, overrideCss, paletteCss, themeRule } from '../lib/palette';
import styles from '../styles/Home.module.css';

const REPO = 'amblemind/repaint-your-site';

const SWATCHES = ['--bg', '--surface-raised', '--line-bright', '--accent-dim', '--muted', '--accent', '--text'];

const CSS_MODES = [
  {
    id: 'tokens',
    label: 'Design tokens',
    hint: 'The nine variables this page is built from. Drop them in and build with the same relationships.',
    build: paletteCss,
  },
  {
    id: 'override',
    label: 'Repaint an existing site',
    hint: 'The blunt version the API injects. Paste it last and it overrides every colour already on the page.',
    build: overrideCss,
  },
];

const EXAMPLES = ['stripe.com', 'nasa.gov', 'wikipedia.org'];

const PIPELINE = [
  {
    title: 'Capture',
    body: 'Your URL opens in a real headless Chrome session and renders exactly as a visitor would see it.',
  },
  {
    title: 'Repaint',
    body: 'One stylesheet, built from your hue alone, overrides every colour the page declares — text, borders, backgrounds, links.',
  },
  {
    title: 'Return',
    body: 'The recoloured page is captured at 2x, stored, and handed back as a shareable image.',
  },
];

export default function Home() {
  const [url, setUrl] = useState('');
  const [hue, setHue] = useState(DEFAULT_HUE);
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [cssMode, setCssMode] = useState('tokens');
  const [copied, setCopied] = useState(false);
  const objectUrl = useRef(null);
  const copyTimer = useRef(null);

  const remix = useCallback(async () => {
    setStatus('loading');
    setError(null);
    // Pinned now, so the caption still describes what was rendered even if the
    // dial moves while the request is in flight.
    const requestedHue = hue;

    try {
      const response = await fetch('/api/remix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, hue }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'The remix failed. Try again.');
      }

      // The route answers with the PNG itself, so it becomes an object URL
      // rather than a link into storage. Revoke the previous one first --
      // object URLs live until the document is discarded otherwise.
      const blob = await response.blob();
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = URL.createObjectURL(blob);

      setResult({ url: objectUrl.current, hue: requestedHue, bytes: blob.size });
      setStatus('done');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, [url, hue]);

  // Release the last object URL when the page goes away.
  useEffect(() => () => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  }, []);

  const updateUrl = useCallback((value) => {
    setUrl(value);
    if (status === 'error') {
      setStatus(result ? 'done' : 'idle');
      setError(null);
    }
  }, [status, result]);

  const canRemix = url.trim().length > 0 && status !== 'loading';
  // Clamped before interpolation into a stylesheet.
  const mode = CSS_MODES.find((item) => item.id === cssMode) ?? CSS_MODES[0];
  const cssText = mode.build(hue);

  const copyCss = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cssText);
    } catch {
      // No async clipboard on insecure origins or older browsers.
      const scratch = document.createElement('textarea');
      scratch.value = cssText;
      scratch.setAttribute('readonly', '');
      scratch.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(scratch);
      scratch.select();
      document.execCommand('copy');
      scratch.remove();
    }

    setCopied(true);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1800);
  }, [cssText]);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const safeHue = clampHue(hue);

  return (
    <div className={styles.page}>
      <Head>
        {/*
          The palette tokens are declared on :root, so their var(--hue) resolves
          against :root -- setting the hue on a descendant would never recompute
          them. Rendering the whole :root rule here keeps the page themed from
          the very first paint, before hydration, with no flash of the wrong
          colour, and keeps lib/palette.js the only place the palette is defined.
        */}
        <style>{themeRule(safeHue)}</style>
        <title>Repaint Your Site — recolour any website with one number</title>
        <meta
          name="description"
          content="Enter a URL, pick a hue, and get back a screenshot of that site with every colour rebuilt from your one number."
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </Head>

      <header className={styles.topbar}>
        <div className={`${styles.shell} ${styles.topbarInner}`}>
          <span className={styles.wordmark}>
            <span className={styles.mark} aria-hidden="true" />
            Repaint Your Site
          </span>
          <div className={styles.topbarRight}>
            <span className={styles.readout}>
              <span>current hue</span>
              <span className={styles.readoutValue}>{String(hue).padStart(3, '0')}°</span>
            </span>
            <GitHubStar repo={REPO} />
          </div>
        </div>
      </header>

      <main className={styles.shell}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Screenshot recolouring</p>
          <h1 className={styles.title}>
            Repaint any website with <span className={styles.titleAccent}>one number</span>.
          </h1>
          <p className={styles.lede}>
            Every colour on this page comes from the hue below — and so will every colour on the
            site you remix. Drag the dial to watch it happen here first.
          </p>
        </section>

        <section className={styles.console}>
          <div>
            <label className={styles.fieldLabel} htmlFor="url">
              <span>Website</span>
              <span className={styles.examples}>
                try{' '}
                {EXAMPLES.map((example, i) => (
                  <span key={example}>
                    <button type="button" className={styles.chip} onClick={() => updateUrl(example)}>
                      {example}
                    </button>
                    {i < EXAMPLES.length - 1 ? ' ' : ''}
                  </span>
                ))}
              </span>
            </label>
            <input
              id="url"
              className={styles.urlInput}
              type="url"
              inputMode="url"
              value={url}
              onChange={(e) => updateUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && canRemix && remix()}
              placeholder="stripe.com"
              autoComplete="off"
              spellCheck="false"
            />
          </div>

          <div>
            <div className={styles.dialHeader}>
              <label className={styles.fieldLabel} htmlFor="hue" style={{ marginBottom: 0 }}>
                Hue
              </label>
              <span className={styles.degrees} aria-hidden="true">
                {hue}
                <span className={styles.degreesUnit}>°</span>
              </span>
            </div>
            <input
              id="hue"
              className={styles.slider}
              type="range"
              min="0"
              max="359"
              step="1"
              value={hue}
              onChange={(e) => setHue(Number(e.target.value))}
              aria-label="Hue in degrees"
              aria-valuetext={`${hue} degrees`}
            />
            <div className={styles.scale}>
              <span>0° red</span>
              <span>120° green</span>
              <span>240° blue</span>
              <span>359°</span>
            </div>
          </div>

          <div className={styles.actions}>
            <button className={styles.remix} onClick={remix} disabled={!canRemix}>
              {status === 'loading' ? 'Remixing…' : 'Remix'}
            </button>
            {status === 'error' ? (
              <p className={styles.error}>{error}</p>
            ) : (
              <span className={styles.hint}>Takes about ten seconds.</span>
            )}
          </div>
        </section>

        <section className={styles.stage}>
          <div className={styles.stageFrame}>
            {status === 'loading' && (
              <div className={styles.placeholder}>
                <div className={styles.spinner} />
                <p className={styles.placeholderBody}>Loading the page and repainting it…</p>
              </div>
            )}

            {status !== 'loading' && result && (
              /* A presigned URL that expires; Next's image optimiser would
                 cache it past its lifetime, so this stays a plain img. */
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className={styles.resultImage}
                src={result.url}
                alt={`Screenshot recoloured to ${result.hue} degrees`}
              />
            )}

            {status !== 'loading' && !result && (
              <div className={styles.placeholder}>
                <p className={styles.placeholderTitle}>Nothing remixed yet</p>
                <p className={styles.placeholderBody}>
                  Enter a URL, pick a hue, and the recoloured screenshot lands here.
                </p>
              </div>
            )}
          </div>

          {result && (
            <div className={styles.stageFooter}>
              <span>
                rendered at {result.hue}° · {Math.round(result.bytes / 1024)} KB
              </span>
              <span className={styles.stageActions}>
                <a
                  className={styles.stageLink}
                  href={result.url}
                  download={`repaint-${result.hue}deg.png`}
                >
                  Download PNG
                </a>
                <a className={styles.stageLink} href={result.url} target="_blank" rel="noreferrer">
                  Open full size ↗
                </a>
              </span>
            </div>
          )}
        </section>

        <section className={styles.palette} id="palette">
          <div className={styles.paletteHead}>
            <div>
              <h2 className={styles.paletteTitle}>Take the palette</h2>
              <p className={styles.paletteBody}>{mode.hint}</p>
            </div>
            <button type="button" className={styles.copyCss} onClick={copyCss}>
              {copied ? 'Copied' : 'Copy CSS'}
            </button>
          </div>

          <div className={styles.swatches} aria-hidden="true">
            {SWATCHES.map((token) => (
              <span key={token} style={{ background: `var(${token})` }} />
            ))}
          </div>

          <div className={styles.paletteTabs} role="group" aria-label="Which stylesheet to copy">
            {CSS_MODES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.id === cssMode ? styles.paletteTabOn : styles.paletteTab}
                aria-pressed={item.id === cssMode}
                onClick={() => setCssMode(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <pre className={styles.paletteCode}>
            <code>{cssText}</code>
          </pre>
        </section>

        <section className={styles.pipeline}>
          {PIPELINE.map((step, i) => (
            <article className={styles.step} key={step.title}>
              <div className={styles.stepIndex}>Step {i + 1}</div>
              <h2 className={styles.stepTitle}>{step.title}</h2>
              <p className={styles.stepBody}>{step.body}</p>
            </article>
          ))}
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.shell} ${styles.footerInner}`}>
          <span>A passion project by Darren Alderman · © AmbleMind LLC</span>
          <span className={styles.footerNote}>Every colour above came from {safeHue}°.</span>
        </div>
      </footer>
    </div>
  );
}
