# Tonique website

The presentation and download pages for [Tonique](https://github.com/rravelli/ToniqueDAW), a free,
open-source music studio.

Published at [rravelli.github.io/tonique](https://rravelli.github.io/tonique/).

## Development

```bash
npm install
npm run dev        # http://localhost:5173/tonique/
npm run build      # into dist/
npm run typecheck
```

- `index.html` is the presentation page and `download/index.html` the download page.
- Text is in `public/locales/`, in English and French.
- The roadmap is in `src/Roadmap.tsx`, and its text in the locale files. Update them when features ship.
- The download page finds the files of the latest ToniqueDAW release by itself.
- `tools/` explains how the demo song and the screenshots are made.

Pushing to `main` builds the site and publishes it to the `gh-pages` branch.
