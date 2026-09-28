// Builds prototype/ into a standalone static site in dist/ for Vercel.
// - wraps the page in a full HTML document (doctype, viewport, favicon, social meta)
// - fingerprints CSS/JS filenames so they can be cached forever
// No dependencies: `node build.mjs`
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, extname, basename } from 'node:path';

const SRC = 'prototype';
const OUT = 'dist';

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// 1. fingerprint assets
const renamed = {};
for (const f of readdirSync(SRC)) {
  if (!['.css', '.js'].includes(extname(f))) continue;
  const buf = readFileSync(join(SRC, f));
  const hash = createHash('sha256').update(buf).digest('hex').slice(0, 10);
  const name = `${basename(f, extname(f))}.${hash}${extname(f)}`;
  writeFileSync(join(OUT, name), buf);
  renamed[f] = name;
}

// 2. split the source page into head tags and body markup
let page = readFileSync(join(SRC, 'index.html'), 'utf8');
for (const [from, to] of Object.entries(renamed)) {
  page = page.replace(new RegExp(`(href|src)="${from.replace('.', '\\.')}"`, 'g'), `$1="/assets/${to}"`);
}
const bodyStart = page.indexOf('<header');
if (bodyStart < 0) throw new Error('index.html: expected a <header> as the first body element');
const head = page.slice(0, bodyStart).replace(/<meta charset[^>]*>\s*/i, '').trim();
const body = page.slice(bodyStart).trim();

// move fingerprinted files under /assets
mkdirSync(join(OUT, 'assets'), { recursive: true });
for (const name of Object.values(renamed)) {
  writeFileSync(join(OUT, 'assets', name), readFileSync(join(OUT, name)));
  rmSync(join(OUT, name));
}

// 3. favicon (the brand mark)
writeFileSync(join(OUT, 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="3" fill="#F2C230"/><path d="M6 22h20" stroke="#1A1500" stroke-width="2.4" stroke-linecap="round"/><path d="M8.5 22v-2.2a7.5 7.5 0 0 1 15 0V22" fill="none" stroke="#1A1500" stroke-width="2.4"/><path d="M14 13V9h4v4" fill="none" stroke="#1A1500" stroke-width="2.2"/><path d="M4 4h4M4 4v4M28 4h-4M28 4v4M4 28h4M4 28v-4M28 28h-4M28 28v-4" stroke="#1A1500" stroke-width="1.6"/></svg>`);

// 4. full document
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0A0C0E">
<meta name="color-scheme" content="dark">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:title" content="Jharkhand Safety AR">
<meta property="og:description" content="Clickable prototype: worker AR safety training, supervisor QR verification and an admin compliance console.">
<meta property="og:type" content="website">
${head}
</head>
<body>
${body}
</body>
</html>
`;
writeFileSync(join(OUT, 'index.html'), html);

console.log('Built dist/');
for (const [from, to] of Object.entries(renamed)) console.log(`  ${from} -> assets/${to}`);
