import Head from 'next/head';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from '../styles/Home.module.css';

const DEFAULT_HUE = 284;

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
  const objectUrl = useRef(null);

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
  const safeHue = Math.min(359, Math.max(0, Math.round(Number(hue) || 0)));

  return (
    <div className={styles.page}>
      <Head>
        {/*
          The palette tokens are declared on :root, so their var(--hue) resolves
          against :root -- setting the hue on a descendant would never recompute
          them. Rendering it as a :root rule here keeps the page themed from the
          very first paint, before hydration, with no flash of the wrong colour.
        */}
        <style>{`:root{--hue:${safeHue}}`}</style>
        <title>It&apos;s Magical — repaint any website with one hue</title>
        <meta
          name="description"
          content="Enter a URL, pick a hue, and get back a screenshot of that site with every colour rebuilt from your one number."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.topbar}>
        <div className={`${styles.shell} ${styles.topbarInner}`}>
          <span className={styles.wordmark}>
            <span className={styles.mark} aria-hidden="true" />
            It&apos;s Magical
          </span>
          <span className={styles.readout}>
            <span>current hue</span>
            <span className={styles.readoutValue}>{String(hue).padStart(3, '0')}°</span>
          </span>
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
                  download={`its-magical-${result.hue}deg.png`}
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
          <a
            className={styles.footerLink}
            href="https://github.com/amblemind/its-magical"
            target="_blank"
            rel="noreferrer"
          >
            Source on GitHub ↗
          </a>
        </div>
      </footer>
    </div>
  );
}
