# Pirate Web Deckbuilder

A React and Vite deckbuilder prototype.

## Local Development

```sh
npm install
npm run dev
```

## Production Build

```sh
npm run build
npm run preview
```

## Vercel Deployment

This project is ready to deploy as a Vite static app on Vercel.

Recommended Vercel settings:

- Framework preset: `Vite`
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`

No environment variables are required for the current app.

The `vercel.json` file includes a catch-all rewrite to `index.html` so client-side routing and refreshes work correctly.
