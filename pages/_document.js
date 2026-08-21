import { Html, Head, Main, NextScript } from 'next/document';

/**
 * The Made By tag, from the sibling project at made-by-tag.vercel.app.
 *
 * Values are spelled out rather than left to the script's defaults, so this
 * site's badge does not silently change if those defaults are edited while
 * designing a tag for something else.
 *
 * Note: no next/font here. Font variables are applied in _app, because
 * next/font is not supported in _document and putting them here emits the
 * class names without the matching @font-face rules.
 */
const MADE_BY = {
  madeBy: 'Made by',
  handle: '@darrenalderman',
  link: 'https://www.linkedin.com/in/darren-alderman/',
  textColor: '#ffffff',
  bgColor: '#c76b2e',
  size: 1,
  location: 'bottom-right',
  spaceTop: 1,
  spaceRight: 1,
  spaceBottom: 1,
  spaceLeft: 1
};

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.madeByOverrides=${JSON.stringify(MADE_BY)}`
          }}
        />
        <script src="https://made-by-tag.vercel.app/madeby.js" defer />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
