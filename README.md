# Jharkhand Safety AR — prototype

Clickable prototype of an industrial safety training platform for Jharkhand's mining, steel, manufacturing and mica-processing sectors:

- **Worker app** (Android, phone camera AR): Fire & Explosion and Gas Leak & Confined Space missions, assessment, certification, offline mode with auto-sync, English / हिंदी / ᱥᱟᱱᱛᱟᱲᱤ
- **Supervisor app**: QR certificate verification, crew clearance, site compliance
- **Admin console**: compliance command center — workers, sites, training content, assessments, certifications, alerts, analytics, localization, reports
- **Design system**: tokens and components

All data is sample data. The AR camera feed is simulated.

## Files

| Path | What it is |
|---|---|
| `prototype/index.html` | Page source (body markup + head tags) |
| `prototype/styles.css` | Design tokens and all component styles |
| `prototype/core.js` | Shared state, icons, i18n strings, sample data, QR, AR scene drawings |
| `prototype/worker.js` | Worker app screens, navigation, assessment, QR scanner |
| `prototype/ar.js` | AR engine and the fire / gas mission logic |
| `prototype/console.js` | Prototype shell, supervisor app, admin console, design system |
| `build.mjs` | Builds `prototype/` into a standalone static site in `dist/` (no dependencies) |
| `vercel.json` | Vercel build, output and caching config |

## Run locally

```bash
npm run preview
```

Then open http://localhost:8080. Deep links: `/#worker`, `/#supervisor`, `/#admin`, `/#system`.

## Deploy to Vercel

The site is static; the build only needs Node 18+ and installs nothing.

**From GitHub:** push this repo, then in Vercel choose *Add New → Project*, import the repo and deploy. `vercel.json` already sets the build command (`npm run build`) and output directory (`dist`), so leave the framework preset as *Other*.

**From the CLI:**

```bash
npm i -g vercel
vercel          # preview deployment
vercel --prod   # production
```
