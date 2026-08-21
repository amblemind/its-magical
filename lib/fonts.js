import { Bricolage_Grotesque, Instrument_Sans, DM_Mono } from 'next/font/google';

// Self-hosted at build time by next/font -- no external font requests at runtime.
export const display = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  display: 'swap',
  adjustFontFallback: false,
  variable: '--font-display',
});

export const body = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  adjustFontFallback: false,
  variable: '--font-body',
});

export const mono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  adjustFontFallback: false,
  variable: '--font-mono',
});

/** Applied to the app wrapper, putting the variables in scope for all content. */
export const fontVariables = `${display.variable} ${body.variable} ${mono.variable}`;
