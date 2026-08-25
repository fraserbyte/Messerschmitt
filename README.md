# Messerschmitt Chassis Register — static web app

A self-contained Vite + React (Recharts) web app rendering the Messerschmitt Foundation of Great Britain
chassis register: 3,186 KR200s traced from the invoice book (1956–1964).

Built as **static files** so it can be hosted for free on GitHub Pages, GitLab Pages,
Netlify, Vercel, Cloudflare Pages, etc.

## Local development

```bash
npm install     # install dependencies
npm run dev     # start dev server (http://localhost:5173)
npm run build   # build static site into dist/
npm run preview # preview the production build locally
```

The production output is a fully static site in `dist/` — just point any static host at it.

## Deploy to GitHub Pages (free)

Two options — pick one:

### Option A: GitHub Actions (recommended, auto-deploys on every push)

1. Create a repo on GitHub and push this folder to it:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin git@github.com:<you>/<repo>.git
   git push -u origin main
   ```
2. In the repo: **Settings → Pages → Source: "GitHub Actions"**.
3. The included workflow (`.github/workflows/deploy.yml`) builds the app and publishes
   it automatically on every push to `main`. Your site appears at
   `https://<you>.github.io/<repo>/`.

The `base: "./"` in `vite.config.js` uses relative asset paths, so project sites (the
`/repo/` path above) work out of the box.

### Option B: Manual — publish the `dist/` folder

1. `npm run build`
2. Push the `dist/` folder to a `gh-pages` branch, or use
   **Settings → Pages → Source: "Deploy from a branch" → gh-pages**.

## Deploy to GitLab Pages (free)

Push this folder to a GitLab repo. The included `.gitlab-ci.yml` builds the site and
publishes it automatically. Your site appears at
`https://<you>.gitlab.io/<project>/`.

## Deploy elsewhere (Netlify / Vercel / Cloudflare Pages)

Point the service at the repo with:

- **Build command:** `npm run build`
- **Publish directory:** `dist`

## Project structure

```
index.html            HTML entry point
vite.config.js        Vite + React + Tailwind config (relative base for subpaths)
src/
  main.jsx            React root
  App.jsx             The dashboard component (was code.js)
  index.css           Tailwind import + base styles
.github/workflows/    GitHub Pages auto-deploy workflow
.gitlab-ci.yml        GitLab Pages auto-deploy config
```
