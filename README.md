# Repaint Your Site

Recolour any website with one number.

Give it a URL and a hue, and it loads the real page in a headless browser,
overrides every colour the site declares, and hands back a screenshot of the
result.

**[Try it →](https://repaint-your-site.vercel.app)**

<table>
  <tr>
    <td width="50%"><img src="docs/screenshot.png" alt="The Repaint Your Site interface at 284 degrees, themed in violet" /></td>
    <td width="50%"><img src="docs/screenshot-alt.png" alt="The same interface at 96 degrees, themed in green" /></td>
  </tr>
</table>

Those are the same page at two hues. The interface themes itself from the value
on the dial using the same colour relationships it will apply to your target
site, so the control previews the transformation before you ever run it.

## The idea

Recolouring an arbitrary website is hard if you try to parse its stylesheet:
every site structures colour differently, and there is no reliable "primary
colour" to swap.

So this doesn't parse anything. It takes one number — the hue, 0–359 — and
rebuilds an entire palette from it in HSL, then forces that palette onto every
colour property on the page:

```css
:root {
  --hue: 284;
  --color-richer:    hsl(var(--hue), 50%, 72%);
  --color-highlight: hsl(var(--hue), 70%, 45%);
  --link-color:      hsl(var(--hue), 90%, 70%);
  --background:      hsl(var(--hue), 20%, 12%);
}

* {
  color: var(--color-richer) !important;
  background-color: var(--background) !important;
  border-color: var(--color-light) !important;
  /* ...every other colour property */
}
```

Saturation and lightness are fixed by the palette; only the hue comes from the
user. That is the whole trick, and it is why the tool works on any URL without
knowing anything about the site: a blunt instrument applied uniformly produces
a coherent result where a clever one would produce a broken one.

## How it works

| Step | What happens |
| --- | --- |
| **Capture** | The URL is normalised and validated, then opened in a hosted headless Chrome session via [Browserless](https://browserless.io). |
| **Repaint** | The generated stylesheet is injected with `addStyleTag` after load and before capture, so the screenshot is of the recoloured page. |
| **Return** | The PNG is sent back as the response body and wrapped in an object URL by the client. Nothing is stored server-side. |

The entire API surface is one route: [`pages/api/remix.js`](pages/api/remix.js).

## Running it locally

```bash
npm install
cp .env.example .env.local   # then add your Browserless token
npm run dev
```

A [Browserless](https://browserless.io) token is the only credential the app
needs. There is no database and no object storage: the screenshot goes straight
from the browser session to the response body, so a request leaves nothing
behind on the server.

Without the token the interface still runs; the API returns a message naming
the variable it is missing.

## Notes

- URLs pointing at `localhost`, link-local, or private ranges are rejected, so
  the screenshot browser can't be pointed at internal infrastructure.
- Results are never persisted. That means no storage credentials to leak and no
  cleanup to run, at the cost of shareable links — a result lives only in the
  tab that produced it, and the Download button saves it.
- Fonts are self-hosted at build time through `next/font`, so the page makes no
  third-party requests at runtime.
- Sites that block automated browsers, or that render entirely in canvas or
  images, won't recolour meaningfully — there are no CSS colours to override.

## Built with

Next.js (pages router) · React · [Browserless](https://browserless.io) · deployed on Vercel

The badge in the bottom-right corner is served by
[Made By Tag](https://github.com/amblemind/made-by-tag), a sibling project — this site is its
live install.

## License

MIT — see [LICENSE](LICENSE).

---

A passion project by [Darren Alderman](https://github.com/amblemind). © AmbleMind LLC
