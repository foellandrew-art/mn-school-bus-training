# Minnesota School Bus Training — Vite React app

This repo contains a lightweight Vite + React app for the Minnesota School Bus (S) endorsement training.

Quick start (local)
1. Install dependencies:
   npm install

2. Start dev server:
   npm run dev
   Open http://localhost:5173

Build
- npm run build
- Dist folder will be created at ./dist

Publish
- This repo includes a GitHub Actions workflow (.github/workflows/deploy.yml) that builds the site and publishes the contents of ./dist to the gh-pages branch on pushes to main.
- Alternatively, you can use Netlify/Vercel by connecting the repository and setting the build command to `npm run build` and publish directory to `dist`.

Notes
- Questions are stored in src/data/questions.js — add or replace content there if you want more questions.
- Tailwind and lucide are included via CDN in index.html for fastest setup. If you'd like a PostCSS/Tailwind build, I can add it.
- confetti is bundled via npm (canvas-confetti).
