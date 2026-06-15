Portfolio

A personal developer portfolio that pulls projects straight from the GitHub API and includes a working contact form. The frontend is a Vue 3 + TypeScript single-page app built with Vite; the API ships in two flavors so you can host everything on Netlify as one origin, or run a standalone Express server.

Features


Live GitHub projects — fetches your profile and public repos at request time, server-side, behind a token to avoid rate limits. Results are cached so repeated visits don't hammer the API.
Search, filter, and sort — find projects by name, filter by language, and sort by stars or most recently updated.
Contact form — sends you an email via SMTP. If no SMTP credentials are configured, the endpoint still accepts submissions gracefully instead of erroring.
Resume download — one-click download served from public/resume.pdf.


Tech stack

LayerToolsFrontendVue 3, TypeScript, ViteAPI (option A)Netlify FunctionsAPI (option B)Express, Node 18+EmailNodemailer

Project structure

.
|-- frontend/                   # Vue 3 + Vite single-page app
|   |-- src/
|   |   |-- App.vue             # Layout: hero, project grid, contact section
|   |   |-- api.ts              # Calls the /api/* endpoints
|   |   |-- components/
|   |   |   |-- ProjectCard.vue
|   |   |   `-- ContactForm.vue
|   |   `-- style.css
|   |-- netlify/functions/      # Serverless ports of the API (Netlify deploy)
|   |   |-- projects.ts
|   |   `-- contact.ts
|   |-- netlify.toml            # /api/* -> functions + SPA fallback
|   `-- vite.config.ts          # Dev proxy: /api -> localhost:3000
|
|-- backend/                    # Standalone Express API (alternative host)
|   `-- src/
|       |-- server.ts           # /api/health, /api/projects, /api/contact
|       |-- routes/
|       |-- services/github.ts  # GitHub profile + repo fetching
|       `-- lib/cache.ts        # In-memory response cache
|
`-- .env.example

Getting started

Prerequisites


Node.js 18 or newer
A GitHub account (the projects list reads from a public profile)


1. Install dependencies

The frontend and backend are separate packages, so install each:

bashcd frontend && npm install
cd ../backend && npm install

2. Run it locally

In one terminal, start the API:

bashcd backend
npm run dev          # tsx watch — serves on http://localhost:3000

In a second terminal, start the frontend:

bashcd frontend
npm run dev          # Vite — serves on http://localhost:5173

Vite proxies /api/* to the backend on port 3000, so the browser sees a single origin and there's nothing to configure for local development. Open http://localhost:5173.


Running on Netlify functions instead of the Express backend? You don't need the backend at all — see the deployment section below.



Environment variables

Copy .env.example and fill in what you need. Everything here is optional for a basic run; the projects list works unauthenticated (subject to GitHub's lower rate limit) and the contact form no-ops cleanly without SMTP.

VariableUsed byPurposeGITHUB_USERNAMEAPIWhose profile/repos to show. Defaults to FernRios.GITHUB_TOKENAPIPersonal access token (no scopes needed for public data). Raises GitHub's rate limit from 60/hr to 5,000/hr.SMTP_HOSTAPIMail server host, e.g. smtp.gmail.com.SMTP_PORTAPIMail port. Defaults to 587.SMTP_USERAPISMTP username / sending address.SMTP_PASSAPISMTP password or app password. Keep this secret — never commit it.CONTACT_TOAPIWhere contact messages are delivered. Falls back to SMTP_USER.VITE_API_BASEFrontendProduction only. The deployed API origin. Leave blank for local dev and for the Netlify single-origin setup.CORS_ORIGINExpress backendAllowed frontend origin in production. Defaults to *.PORTExpress backendServer port. Defaults to 3000.

Deployment

There are two supported paths.

Option A — Netlify (frontend + functions, one origin)

The repo already includes netlify/functions/projects.ts and contact.ts plus a netlify.toml that routes /api/* to them and adds an SPA fallback.


Push the repo to GitHub and import it into Netlify.
Build settings (Netlify auto-detects Vite): build command npm run build, publish directory dist, base directory frontend.
Add the environment variables you need under Site configuration → Environment variables (GITHUB_TOKEN, the SMTP_* set, etc.). Mark secrets as secret.
Do not set VITE_API_BASE — leaving it blank keeps API calls same-origin so the redirects do their job.


Option B — Split hosting (static frontend + Express API)

Host the Express backend somewhere that runs Node (Render, Railway, Fly, etc.):

bashcd backend
npm run build        # tsc → dist/
npm start            # node dist/server.js

Then build the frontend with VITE_API_BASE pointed at that deployed API origin, and deploy the resulting dist/ to any static host. Set CORS_ORIGIN on the backend to your frontend's URL.

Available scripts

Frontend (cd frontend)

ScriptDescriptionnpm run devStart the Vite dev servernpm run buildProduction build to dist/npm run previewPreview the production build locallynpm run type-checkType-check with vue-tsc

Backend (cd backend)

ScriptDescriptionnpm run devRun with hot reload (tsx watch)npm run buildCompile TypeScript to dist/npm startRun the compiled server

Notes


Secrets (SMTP_PASS, GITHUB_TOKEN) live only in environment variables and are read server-side — they're never bundled into the frontend.
The GitHub token needs no special scopes since it only reads public profile and repository data.
