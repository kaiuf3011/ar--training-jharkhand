'use strict';
/* =================================================================
   SHELL · SUPERVISOR APP · ADMIN CONSOLE · DESIGN SYSTEM
   ================================================================= */

/* ---------------- screen metadata for the prototype side panels ---------------- */
const LOOP = ['LEARN', 'PRACTICE', 'SIMULATE', 'RESPOND', 'ASSESS', 'CERTIFY', 'VERIFY', 'RETRAIN'];
const SCREEN_META = {
  splash: { t: 'Splash', n: 'Launch screen. Content pack loads from device storage, so the app opens without a network.', r: ['Android 10+', 'Offline-first'] },
  lang: { t: 'Language selection', n: 'First-run language choice. Persists across the app and can be changed in Profile › Settings.', r: ['Hindi', 'Santali (Ol Chiki)', 'Voice instructions'] },
  reg1: { t: 'Registration · 1 / 2', n: 'Four fields only. Worker ID can be scanned from the employer ID card.', r: ['Worker tracking'] },
  reg2: { t: 'Registration · 2 / 2', n: 'Experience and language as large tap targets — no typing needed.', r: ['Accessibility', 'Localization'] },
  home: { t: 'Worker home', n: 'Progress across all 5 safety domains, resume point, renewal reminder and a visible offline state.', r: ['Offline + auto-sync', 'Expiry alerts', '5 domains'] },
  hub: { t: 'Training hub', n: 'All five domains exist in the architecture; three are marked as in development with their build status.', r: ['Fire', 'Gas & confined space', 'Future modules'] },
  intro: { t: 'Mission briefing', n: 'Scenario-first briefing instead of a textbook page. Every line can be read aloud.', r: ['Voice instructions', 'Phone camera AR'], s: 'LEARN' },
  calib: { t: 'AR calibration', n: 'Plane detection, anchor count and light check before the simulation starts. No headset.', r: ['Smartphone AR', 'Mid-range Android'], s: 'PRACTICE' },
  ar: { t: 'AR simulation', n: 'Drag the view (or use ◀ ▶ / arrow keys) to move the phone. Hold the reticle on a target to detect it; tap to act.', r: ['Practical AR evaluation', 'Hazard recognition'], s: 'SIMULATE' },
  assess: { t: 'Assessment engine', n: 'Knowledge questions plus the practical actions logged during AR, weighted 30 / 40 / 20 / 10.', r: ['Interactive assessment', 'Competency scoring'], s: 'ASSESS' },
  review: { t: 'Performance review', n: 'Per-competency result with a concrete retraining recommendation.', r: ['Training insights'], s: 'ASSESS' },
  certified: { t: 'Certification', n: 'Certificate issued on pass. Offline passes are provisional until the phone syncs.', r: ['Digital certification', 'QR code'], s: 'CERTIFY' },
  certview: { t: 'Certificate', n: 'Full certificate with QR. Anyone can verify it without logging in.', r: ['Digital certification'], s: 'CERTIFY' },
  verify: { t: 'QR verification', n: 'Public certificate check. Try the expired and revoked samples too.', r: ['QR verification', 'No login'], s: 'VERIFY' },
  certs: { t: 'Certificates tab', n: 'All earned certificates with validity and renewal status.', r: ['Expiry / renewal'] },
  profile: { t: 'Profile & settings', n: 'Worker record, sync status and settings: language, voice, large text, haptics.', r: ['Localization', 'Accessibility', 'Sync status'] }
};

/* ============================ SHELL ============================ */
const Shell = {
  init() {
    const bar = $('#shell');
    bar.innerHTML = `<div class="brand">${BRAND_MARK}<div class="brand-txt">Jharkhand Safety AR<small>Industrial safety training system</small></div></div>
      <nav class="mode-tabs" aria-label="Experience">${[['worker', 'phone', 'Worker', 'app'], ['supervisor', 'qr', 'Supervisor', ''], ['admin', 'grid', 'Admin', 'console'], ['system', 'layers', 'Design', 'system']].map(([k, i, a, b]) => `<button data-mode="${k}" aria-pressed="${S.mode === k}">${ic(i)}<span>${a}</span>${b ? `<span class="lbl-long">${b}</span>` : ''}</button>`).join('')}</nav>
      <div class="shell-note">CLICKABLE PROTOTYPE · <b>SAMPLE DATA</b><br>ANDROID · SUPERVISOR · WEB ADMIN</div>`;
    bar.addEventListener('click', e => { const b = e.target.closest('[data-mode]'); if (b) Shell.setMode(b.dataset.mode); });
    Shell.render();
  },
  setMode(m) {
    AR.stop();
    S.mode = m; store.set('mode', m);
    $$('#shell [data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === m));
    Shell.render();
    window.scrollTo(0, 0);
  },
  render() {
    const st = $('#stage');
    $('#toasts-page')?.remove();
    if (S.mode === 'worker' || S.mode === 'supervisor') {
      st.innerHTML = `<div class="stage-device"><aside class="side side-left" id="side-l" aria-label="Prototype controls"></aside>
        <div class="device ${S.mode === 'supervisor' ? 'tablet' : ''}"><div class="device-screen" id="dev-screen"></div></div>
        <aside class="side side-right" id="side-r" aria-label="Screen notes"></aside></div>`;
      bindDevice($('#dev-screen'), S.mode === 'worker' ? {} : SACT);
      st.onclick = Shell.sideClick;
      Shell.renderSide();
      S.mode === 'worker' ? W.render() : Sup.render();
    } else {
      st.onclick = null;
      document.body.insertAdjacentHTML('beforeend', '<div class="toasts page" id="toasts-page"></div>');
      S.mode === 'admin' ? Admin.render(st) : DS.render(st);
    }
  },
  sideClick(e) {
    const b = e.target.closest('.side [data-side]');
    if (!b) return;
    const [k, v] = [b.dataset.side, b.dataset.v];
    if (k === 'net') { if (S.mode === 'worker') setOnline(v === 'on'); else { Sup.online = v === 'on'; Sup.render(); Shell.renderSide(); } }
    if (k === 'lang') { setLang(v); if (S.mode === 'worker') W.render(); else Sup.render(); Shell.renderSide(); }
    if (k === 'jump') {
      if (S.mode === 'worker') { const [scr, mod] = v.split(':'); if (scr === 'assess') WS.assess.state = null; if (['home', 'hub', 'certs', 'profile'].includes(scr)) W.tab(scr); else W.go(scr, mod ? { mod } : {}); }
      else Sup.go(v);
    }
    if (k === 'skip') AR.skip();
    if (k === 'reset') { location.reload(); }
  },
  renderSide() {
    const L1 = $('#side-l'); if (!L1) return;
    const seg = (key, opts, cur) => `<div class="seg">${opts.map(([v, l, i]) => `<button data-side="${key}" data-v="${v}" aria-pressed="${cur === v}">${i ? ic(i) : ''}${l}</button>`).join('')}</div>`;
    if (S.mode === 'worker') {
      const J = [['Onboarding', [['splash', 'Splash'], ['lang', 'Language'], ['reg1', 'Registration']]],
        ['Worker app', [['home', 'Home'], ['hub', 'Training hub'], ['certs', 'Certificates'], ['profile', 'Profile & settings']]],
        ['Fire & explosion', [['intro:fire', 'Mission briefing'], ['calib:fire', 'AR calibration'], ['ar:fire', 'AR simulation'], ['assess:fire', 'Assessment'], ['review:fire', 'Performance review'], ['certified:fire', 'Certification']]],
        ['Gas & confined space', [['intro:gas', 'Mission briefing'], ['ar:gas', 'AR simulation'], ['assess:gas', 'Assessment']]],
        ['Verification', [['verify', 'QR verification']]]];
      L1.innerHTML = `<div class="side-sec"><span class="eyebrow">Network</span>${seg('net', [['on', 'Online', 'wifi'], ['off', 'Offline', 'wifiOff']], S.online ? 'on' : 'off')}<span class="mono small muted">${S.syncing ? 'Synchronizing…' : `${S.pending} records pending · last sync ${S.lastSync}`}</span></div>
        <div class="side-sec"><span class="eyebrow">Language</span>${seg('lang', [['en', 'EN'], ['hi', 'हिंदी'], ['sat', 'ᱥᱟᱱᱛᱟᱲᱤ']], S.lang)}</div>
        <div class="side-sec"><span class="eyebrow">Jump to screen</span><div class="jump">${J.map(([g, items]) => `<div class="grp">${g}</div>${items.map(([k, l]) => `<button data-side="jump" data-v="${k}" data-cur="${k}">${l}</button>`).join('')}`).join('')}</div></div>
        <div class="side-sec"><span class="eyebrow">Simulation helper</span><button class="btn btn-secondary btn-sm" data-side="skip" id="skip-btn">${ic('arrowR')}Complete current step</button><span class="small muted">Performs the correct action for the current AR step.</span></div>`;
    } else {
      L1.innerHTML = `<div class="side-sec"><span class="eyebrow">Supervisor network</span>${seg('net', [['on', 'Online', 'wifi'], ['off', 'Offline', 'wifiOff']], Sup.online ? 'on' : 'off')}<span class="small muted">Offline scans verify the QR signature on-device against a cached revocation list.</span></div>
        <div class="side-sec"><span class="eyebrow">Jump to screen</span><div class="jump">${[['home', 'Verify (home)'], ['scan', 'QR scanner'], ['workers', 'Workers on shift'], ['certs', 'Certifications'], ['compliance', 'Site compliance']].map(([k, l]) => `<button data-side="jump" data-v="${k}" data-cur="${k}">${l}</button>`).join('')}</div></div>
        <div class="side-sec"><span class="eyebrow">Try this</span><p class="screen-note">Open the scanner and pick the <b>expired</b> or <b>revoked</b> samples to see how a supervisor is told to stop hazardous work.</p></div>`;
    }
    Shell.updateSide();
  },
  updateSide() {
    const L1 = $('#side-l'), R = $('#side-r'); if (!L1 || !R) return;
    if (S.mode === 'worker') {
      const cur = W.cur, mod = W.params.mod;
      $$('.jump button', L1).forEach(b => { const [k, m] = b.dataset.cur.split(':'); b.setAttribute('aria-current', k === cur && (!m || m === mod)); });
      const net = $$('[data-side="net"]', L1); net.forEach(b => b.setAttribute('aria-pressed', (b.dataset.v === 'on') === S.online));
      const note = L1.querySelector('.side-sec .mono'); if (note) note.textContent = S.syncing ? 'Synchronizing…' : `${S.pending} records pending · last sync ${S.lastSync}`;
      const sk = $('#skip-btn'); if (sk) sk.disabled = cur !== 'ar';
      const meta = SCREEN_META[cur] || {};
      let stage = meta.s;
      if (cur === 'ar' && AR.on) stage = (AR.mod === 'fire' ? AR.mi >= 2 : AR.mi >= 3) ? 'RESPOND' : 'SIMULATE';
      if (S.retraining && ['intro', 'calib', 'ar'].includes(cur)) stage = 'RETRAIN';
      const si = LOOP.indexOf(stage);
      R.innerHTML = `<div class="side-sec"><span class="eyebrow">Training → compliance loop</span><ul class="loop">${LOOP.map((l, i) => `<li class="${i === si ? 'now' : si > -1 && i < si ? 'done' : ''}"><i>${i < si && si > -1 ? '✓' : i + 1}</i>${l}</li>`).join('')}</ul></div>
        <div class="side-sec"><span class="eyebrow">This screen</span><b class="disp d-s">${esc(meta.t || cur)}</b><p class="screen-note">${esc(meta.n || '')}</p></div>
        <div class="side-sec"><span class="eyebrow">Requirements shown</span><div class="req-list">${(meta.r || []).map(r => `<span class="req">${esc(r)}</span>`).join('')}</div></div>
        ${S.lang === 'sat' ? '<div class="side-sec"><span class="eyebrow">Santali copy</span><p class="screen-note">Ol Chiki strings are draft translations pending native-speaker review. Untranslated strings fall back to English — the same gaps appear in Admin › Localization.</p></div>' : ''}`;
    } else {
      $$('.jump button', L1).forEach(b => b.setAttribute('aria-current', b.dataset.cur === Sup.cur));
      R.innerHTML = `<div class="side-sec"><span class="eyebrow">Supervisor experience</span><p class="screen-note">Tablet or phone. The fastest path is one tap from home to the scanner. A result is readable at arm's length: full-width colour band, icon and a plain instruction.</p></div>
        <div class="side-sec"><span class="eyebrow">Recent scans</span>${Sup.log.length ? `<div class="list">${Sup.log.slice(0, 5).map(l => `<div class="li" style="min-height:0;padding:8px 0">${ic(l.ok ? 'check' : 'x', l.ok ? 'c-green' : 'c-red')}<div class="lt"><b style="font-size:13px">${esc(l.who)}</b><span>${esc(l.r)} · ${l.t}</span></div></div>`).join('')}</div>` : '<p class="small muted">No scans yet this shift.</p>'}</div>
        <div class="side-sec"><span class="eyebrow">Requirements shown</span><div class="req-list">${['QR verification', 'Certification status', 'Compliance monitoring', 'Offline'].map(r => `<span class="req">${r}</span>`).join('')}</div></div>`;
    }
  }
};

/* ============================ SUPERVISOR ============================ */
const CREW = WORKERS.filter(w => w.site === 'Dhanbad Mine');
const Sup = {
  cur: 'home', stack: [], online: true,
  log: [{ who: 'Sunita Hansda', r: 'Verified', t: '08:12', ok: true }, { who: 'Mahesh Mahato', r: 'Expired', t: '07:55', ok: false }],
  filter: 'all', ctab: 'all',
  go(n) { if (Sup.cur !== n) Sup.stack.push(Sup.cur); Sup.cur = n; Sup.render(); },
  tab(n) { Sup.stack = []; Sup.cur = n; Sup.render(); },
  back() { Sup.cur = Sup.stack.pop() || 'home'; Sup.render(); },
  logScan(id, c, title) { Sup.log.unshift({ who: c ? c.worker : id, r: title.replace('✓ ', '').replace('CERTIFICATE ', '').toLowerCase().replace(/^\w/, x => x.toUpperCase()), t: clock(), ok: c && (c.status === 'valid' || c.status === 'expiring') }); Shell.updateSide(); },
  render() {
    const host = $('#dev-screen'); if (!host || S.mode !== 'supervisor') return;
    const sc = SS[Sup.cur] || SS.home;
    host.innerHTML = `<div class="sbar" aria-hidden="true"><span>${clock()}</span><span class="r">${Sup.online ? ic('wifi') : ic('wifiOff')}<span>${Sup.online ? 'Wi-Fi' : 'No network'}</span><span class="batt"><i></i></span></span></div>` + sc.render() + (sc.nav ? `<nav class="bnav" aria-label="Supervisor">${[['home', 'qr', 'Verify'], ['workers', 'users', 'Workers'], ['certs', 'cert', 'Certifications'], ['compliance', 'shield', 'Compliance']].map(([k, i, l]) => `<button data-tab="${k}" aria-current="${sc.nav === k}">${ic(i)}<span>${l}</span></button>`).join('')}</nav>` : '') + '<div class="toasts" id="toasts-dev"></div>';
    sc.mount && sc.mount();
    Shell.updateSide();
  }
};
const supPill = () => `<span class="net ${Sup.online ? 'on' : 'off'}"><span class="dot"></span>${Sup.online ? 'ONLINE' : 'OFFLINE'}</span>`;
const crewStatus = w => {
  const [tone, l, i] = w.cert === 'valid' ? ['ok', 'Cleared', 'check'] : w.cert === 'expiring' ? ['warn', 'Renew soon', 'clock'] : w.cert === 'expired' ? ['crit', 'Expired', 'x'] : w.cert === 'revoked' ? ['crit', 'Revoked', 'octa'] : w.cert === 'failed' ? ['haz', 'Not cleared', 'warn'] : ['neutral', 'In training', 'book'];
  return [tone, ic(i) + l];
};
const SS = {
  home: {
    nav: 'home',
    render: () => {
      const blocked = CREW.filter(w => !['valid', 'expiring'].includes(w.cert));
      return `${appbar({ title: 'Supervisor · Dhanbad Mine', sub: 'SHIFT B · 06:00–14:00 · S. HANSDA', right: supPill() })}
      <div class="scroll">
        <button class="sup-hero" data-go="scan"><svg class="grid-bg" viewBox="0 0 100 100" aria-hidden="true"><path d="M0 0h40v40H0zM60 0h40v40H60zM0 60h40v40H0z" fill="none" stroke="#1A1500" stroke-width="6"/><path d="M60 60h14v14H60zM86 60h14v14H86zM60 86h14v14H60zM86 86h14v14H86z" fill="#1A1500"/></svg>
          ${ic('qr', 'big')}<div><div class="t">Verify certificate</div><div class="s">SCAN WORKER QR · RESULT IN ~1 SECOND · WORKS OFFLINE</div></div></button>
        <div class="tiles">
          <button class="tile" data-tab="workers">${ic('users')}<span>${CREW.length} on shift</span><b>Workers</b></button>
          <button class="tile" data-tab="certs">${ic('cert')}<span>${CREW.filter(w => w.cert === 'valid').length} valid</span><b>Certifications</b></button>
          <button class="tile" data-tab="compliance">${ic('shield')}<span>91% site</span><b>Compliance</b></button>
        </div>
        ${blocked.length ? `<div class="banner crit">${ic('octa')}<div><b>${blocked.length} workers not cleared</b><p>Do not assign hazardous work until their certificates are current.</p></div></div>` : ''}
        <section><div class="eyebrow" style="margin-bottom:4px">Not cleared for hazardous work</div>
          ${blocked.slice(0, 4).map(w => { const [tone, l] = crewStatus(w); return `<div class="crew"><span class="avatar-i">${w.name.split(' ').map(x => x[0]).join('')}</span><div><b>${esc(w.name)}</b><div class="mono small muted">${w.id} · ${esc(w.role)}</div></div><span class="pill ${tone}">${l}</span></div>`; }).join('')}
        </section>
      </div>`;
    }
  },
  scan: {
    render: () => `${appbar({ back: true, title: 'Scan certificate', sub: 'DHANBAD MINE · GATE 2', right: supPill() })}<div class="scroll tight">${Scanner.markup()}</div>`,
    mount: () => Scanner.mount()
  },
  workers: {
    nav: 'workers',
    render: () => {
      const f = Sup.filter;
      const list = CREW.filter(w => f === 'all' ? true : f === 'ok' ? ['valid', 'expiring'].includes(w.cert) : !['valid', 'expiring'].includes(w.cert));
      return `${appbar({ title: 'Workers on shift', sub: `${CREW.length} WORKERS · SHIFT B`, right: supPill() })}
      <div class="scroll tight">
        <div class="seg">${[['all', 'All'], ['ok', 'Cleared'], ['no', 'Not cleared']].map(([k, l]) => `<button data-act="sfilter" data-v="${k}" aria-pressed="${f === k}">${l}</button>`).join('')}</div>
        <div>${list.map(w => { const [tone, l] = crewStatus(w); return `<div class="crew"><span class="avatar-i">${w.name.split(' ').map(x => x[0]).join('')}</span><div style="min-width:0"><b>${esc(w.name)}</b><div class="mono small muted">${w.id} · ${esc(w.role)}</div>
          <div class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap"><span class="chip" style="height:24px">${ic('fire')}${w.fire ?? '—'}${w.fire ? '%' : ''}</span><span class="chip" style="height:24px">${ic('gas')}${w.gas ?? '—'}${w.gas ? '%' : ''}</span>${w.sync === 'pending' ? `<span class="chip" style="height:24px">${ic('sync')}sync pending</span>` : ''}</div></div><span class="pill ${tone}">${l}</span></div>`; }).join('')}</div>
      </div>`;
    }
  },
  certs: {
    nav: 'certs',
    render: () => {
      const tab = Sup.ctab;
      const rows = CREW.filter(w => w.cert !== 'pending' && w.cert !== 'failed').filter(w => tab === 'all' || w.cert === tab);
      return `${appbar({ title: 'Certifications', sub: 'DHANBAD MINE', right: supPill() })}
      <div class="scroll tight">
        <div class="tabs" role="tablist">${[['all', 'All'], ['valid', 'Valid'], ['expiring', 'Expiring'], ['expired', 'Expired'], ['revoked', 'Revoked']].map(([k, l]) => `<button role="tab" data-act="ctab" data-v="${k}" aria-selected="${tab === k}">${l}</button>`).join('')}</div>
        ${rows.length ? rows.map(w => { const [tone, l] = crewStatus(w); return `<div class="crew"><span class="avatar-i">${ic(w.fire >= (w.gas || 0) ? 'fire' : 'gas')}</span><div><b>${esc(w.name)}</b><div class="mono small muted">${w.fire >= (w.gas || 0) ? 'Fire & Explosion' : 'Gas & Confined Space'} · ${w.score}%</div></div><span class="pill ${tone}">${w.cert === 'valid' ? ic('check') + 'Valid' : l}</span></div>`; }).join('') : '<p class="empty">No certificates in this state.</p>'}
      </div>`;
    }
  },
  compliance: {
    nav: 'compliance',
    render: () => `${appbar({ title: 'Site compliance', sub: 'DHANBAD MINE · LAST 30 DAYS', right: supPill() })}
      <div class="scroll">
        <div class="gauge-row"><svg viewBox="0 0 110 110" width="110" height="110" aria-label="91 percent certified"><circle cx="55" cy="55" r="46" fill="none" stroke="var(--panel-3)" stroke-width="12"/><circle cx="55" cy="55" r="46" fill="none" stroke="var(--green)" stroke-width="12" stroke-dasharray="${(2 * Math.PI * 46 * .91).toFixed(1)} 999" transform="rotate(-90 55 55)"/><text x="55" y="62" text-anchor="middle" font-family="Barlow Condensed" font-weight="700" font-size="28" fill="var(--text)">91%</text></svg>
          <div><div class="disp d-m">1,676 / 1,842 certified</div><p class="small t2" style="margin-top:6px">Above the 85% state target. 4 expired and 18 expiring certificates need action.</p></div></div>
        <section class="stack">${[['Fire & Explosion', 92], ['Gas & Confined Space', 86], ['Orientation', 97]].map(([l, v]) => `<div class="score-line"><span>${l}</span><b class="tnum" style="font-size:18px">${v}%</b><div class="bar ${v >= 85 ? 'ok' : 'haz'}"><i style="width:${v}%"></i></div></div>`).join('')}</section>
        <section><div class="eyebrow" style="margin-bottom:4px">Action needed</div><div class="list">
          <div class="li">${ic('x', 'c-red')}<div class="lt"><b>4 certificates expired</b><span>Remove from hazardous tasks until renewed</span></div><span class="pill crit">Critical</span></div>
          <div class="li">${ic('clock', 'c-yellow')}<div class="lt"><b>18 expire within 30 days</b><span>Refresher sessions booked for 9</span></div><span class="pill warn">Attention</span></div>
          <div class="li">${ic('book', 'c-blue')}<div class="lt"><b>12 orientation incomplete</b><span>New joiners this month</span></div><span class="pill info">Training</span></div>
        </div></section>
        <button class="btn btn-secondary btn-block" data-act="remind">${ic('bell')}Send renewal reminders (18)</button>
      </div>`
  }
};
const SACT = {
  sfilter: el => { Sup.filter = el.dataset.v; Sup.render(); },
  ctab: el => { Sup.ctab = el.dataset.v; Sup.render(); },
  remind: () => toast('Reminders queued', '18 workers will get an in-app reminder and SMS at the next sync.', 'ok')
};

/* ============================ CHARTS ============================ */
const MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
const RATE = [52.4, 55.1, 57.9, 60.2, 62.8, 65.0, 67.3, 69.9, 72.2, 74.6, 76.9, 78.7];
function lineChart(id, vals, { target = 85, lo = 40, hi = 100, unit = '%' } = {}) {
  const W = 640, H = 240, pl = 38, pr = 56, pt = 14, pb = 28;
  const x = i => pl + i * (W - pl - pr) / (vals.length - 1), y = v => pt + (hi - v) / (hi - lo) * (H - pt - pb);
  const ticks = []; for (let v = lo; v <= hi; v += 20) ticks.push(v);
  const pts = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const last = vals.length - 1;
  return `<div class="chart-wrap" id="${id}"><svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Certification rate by month, latest ${vals[last]}${unit}">
    <defs><linearGradient id="${id}-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#88A9C4" stop-opacity=".28"/><stop offset="1" stop-color="#88A9C4" stop-opacity="0"/></linearGradient></defs>
    <g class="grid">${ticks.map(v => `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}"/><text x="${pl - 8}" y="${y(v) + 4}" text-anchor="end">${v}${unit}</text>`).join('')}</g>
    ${MONTHS.map((m, i) => i % 2 === 0 || i === last ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${m}</text>` : '').join('')}
    <line x1="${pl}" x2="${W - pr}" y1="${y(target)}" y2="${y(target)}" stroke="#EDEAE3" stroke-opacity=".5" stroke-dasharray="5 5"/>
    <text x="${W - pr + 6}" y="${y(target) + 4}" style="fill:var(--text-2)">TARGET ${target}${unit}</text>
    <polygon points="${x(0)},${y(lo)} ${pts} ${x(last)},${y(lo)}" fill="url(#${id}-g)"/>
    <polyline points="${pts}" fill="none" stroke="#88A9C4" stroke-width="2.2" stroke-linejoin="round"/>
    <circle cx="${x(last)}" cy="${y(vals[last])}" r="5" fill="#88A9C4" stroke="var(--panel)" stroke-width="2"/>
    <text x="${x(last) + 9}" y="${y(vals[last]) + 4}" style="fill:var(--text);font-weight:600;font-size:12px">${vals[last]}${unit}</text>
    <line class="xh" x1="0" x2="0" y1="${pt}" y2="${H - pb}" stroke="#EDEAE3" stroke-opacity=".35" visibility="hidden"/>
    <circle class="xd" r="4.5" fill="#88A9C4" stroke="var(--panel)" stroke-width="2" visibility="hidden"/>
    <rect x="${pl}" y="${pt}" width="${W - pl - pr}" height="${H - pt - pb}" fill="transparent" class="hit"/>
  </svg><div class="tip" hidden></div></div>`;
}
function bindLine(id, vals, lbl = MONTHS, unit = '%') {
  const wrap = $('#' + id); if (!wrap) return;
  const svg = $('svg', wrap), hit = $('.hit', svg), xh = $('.xh', svg), xd = $('.xd', svg), tip = $('.tip', wrap);
  const W = 640, pl = 38, pr = 56, pt = 14, pb = 28, H = 240, lo = 40, hi = 100;
  const move = e => {
    const r = svg.getBoundingClientRect(), sx = (e.clientX - r.left) / r.width * W;
    const i = clamp(Math.round((sx - pl) / ((W - pl - pr) / (vals.length - 1))), 0, vals.length - 1);
    const cx = pl + i * (W - pl - pr) / (vals.length - 1), cy = pt + (hi - vals[i]) / (hi - lo) * (H - pt - pb);
    xh.setAttribute('x1', cx); xh.setAttribute('x2', cx); xh.setAttribute('visibility', 'visible');
    xd.setAttribute('cx', cx); xd.setAttribute('cy', cy); xd.setAttribute('visibility', 'visible');
    tip.hidden = false; tip.style.left = (cx / W * r.width) + 'px'; tip.style.top = (cy / H * r.height) + 'px';
    tip.innerHTML = `<b>${vals[i]}${unit}</b><span>${lbl[i]} ${i < 3 ? '2025' : '2026'} · certified</span>`;
  };
  hit.addEventListener('pointermove', move);
  hit.addEventListener('pointerleave', () => { tip.hidden = true; xh.setAttribute('visibility', 'hidden'); xd.setAttribute('visibility', 'hidden'); });
}
function hbars(rows, { threshold = 75, click } = {}) {
  return rows.map(r => `<div class="hbar" ${click ? `data-a="${click}" data-v="${r.key || ''}" style="cursor:pointer"` : ''} title="${esc(r.l)}: ${r.v}%">
    <div class="n">${esc(r.l)}${r.s ? `<small>${esc(r.s)}</small>` : ''}</div>
    <div class="bar ${r.v >= threshold ? 'info' : 'haz'}" style="position:relative;overflow:visible"><i style="width:${r.v}%"></i><span class="threshold" style="left:${threshold}%"></span></div>
    <div class="v">${r.v}%</div></div>`).join('');
}
function histogram(buckets) {
  const W = 520, H = 200, pl = 30, pb = 26, pt = 10, max = Math.max(...buckets.map(b => b.n));
  const bw = (W - pl) / buckets.length;
  const yv = v => pt + (1 - v / max) * (H - pt - pb);
  return `<div class="chart-wrap"><svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Score distribution">
    <g class="grid">${[0, .5, 1].map(f => `<line x1="${pl}" x2="${W}" y1="${yv(max * f)}" y2="${yv(max * f)}"/><text x="${pl - 6}" y="${yv(max * f) + 4}" text-anchor="end">${Math.round(max * f)}</text>`).join('')}</g>
    ${buckets.map((b, i) => `<g><title>${b.l}: ${b.n} workers</title><rect x="${pl + i * bw + 2}" y="${yv(b.n)}" width="${bw - 4}" height="${H - pb - yv(b.n)}" rx="3" fill="${b.pass ? '#88A9C4' : '#5B6670'}"/><text x="${pl + i * bw + bw / 2}" y="${H - 8}" text-anchor="middle">${b.l}</text></g>`).join('')}
    <line x1="${pl + 3 * bw}" x2="${pl + 3 * bw}" y1="${pt}" y2="${H - pb}" stroke="#EDEAE3" stroke-opacity=".6" stroke-dasharray="4 4"/><text x="${pl + 3 * bw + 6}" y="${pt + 12}" style="fill:var(--text-2)">PASS 70</text>
  </svg></div>`;
}

/* ============================ ADMIN ============================ */
const QPERF = {
  fire: [['Exit identification', 94], ['Extinguisher selection', 81], ['Evacuation sequence', 67], ['Assembly point', 91], ['Hazard identification', 96]],
  gas: [['Hazard boundary', 78], ['Unsafe entry', 84], ['PPE selection', 72], ['Buddy system', 88], ['Emergency response', 69]],
  mach: [['Lock-out / tag-out', 71], ['Guard inspection', 77], ['Safe distance', 74]],
  elec: [['Isolation procedure', 88], ['Arc-flash boundary', 82], ['PPE rating', 87]],
  ppe: [['PPE selection', 95], ['PPE inspection', 90], ['Donning order', 93]]
};
const MODPASS = [{ key: 'fire', l: 'Fire Safety', v: 89, s: 'AR · 9,406 assessed' }, { key: 'gas', l: 'Gas Safety', v: 81, s: 'AR · 8,112 assessed' }, { key: 'mach', l: 'Machinery', v: 74, s: 'Pilot · 2D · 612 assessed' }, { key: 'elec', l: 'Electrical', v: 86, s: 'Pilot · 2D · 540 assessed' }, { key: 'ppe', l: 'PPE', v: 93, s: 'Pilot · 2D · 1,204 assessed' }];
const ALERTS = [
  { sev: 'crit', n: 42, t: 'Certificates expired', d: 'Workers must be removed from hazardous tasks until renewed.', pill: 'Critical', a: 'View workers', by: [4, 9, 8, 11, 6, 4] },
  { sev: 'warn', n: 137, t: 'Expire within 30 days', d: 'Renewal reminders go out automatically at 30, 14 and 3 days.', pill: 'Attention', a: 'Send reminders', by: [18, 31, 27, 22, 21, 18] },
  { sev: 'info', n: 218, t: 'Mandatory orientation not completed', d: 'Mostly new joiners in the last 45 days.', pill: 'Training', a: 'Assign orientation', by: [12, 40, 51, 48, 39, 28] },
  { sev: 'haz', n: 37, t: 'Workers failed assessment', d: 'Retraining assigned automatically; supervisors notified.', pill: 'Failures', a: 'Review attempts', by: [3, 7, 8, 9, 6, 4] }
];
const SYNC_FEED = [
  { t: '09:38', w: 'Sunita Hansda', s: 'Dhanbad Mine', r: 'Fire drill log · 2 records' },
  { t: '09:31', w: 'Birsa Oraon', s: 'Bokaro Steel', r: 'Gas assessment · passed 84%' },
  { t: '09:12', w: 'Phulmani Soren', s: 'Mica Processing', r: 'Orientation completed' }
];

const Admin = {
  page: 'overview', site: 'all', detail: null, q: '', f: { site: 'all', mod: 'all', cert: 'all', date: 'all', res: 'all' },
  amod: 'fire', loc: 'sat', report: 'completion', ctab: 'all', cq: '',
  nav: [['overview', 'grid', 'Overview'], ['workers', 'users', 'Workers'], ['sites', 'building', 'Sites'], ['training', 'book', 'Training'], ['assessments', 'check', 'Assessments'], ['certifications', 'cert', 'Certifications'], ['compliance', 'bell', 'Compliance', 42], ['analytics', 'chart', 'Analytics'], ['localization', 'globe', 'Localization'], ['reports', 'file', 'Reports'], ['settings', 'sliders', 'Settings']],
  render(st) {
    st.innerHTML = `<div class="admin"><aside class="a-side" aria-label="Admin navigation"><span class="eyebrow">Command center</span>
      ${Admin.nav.map(([k, i, l, c]) => `<button data-page="${k}" aria-current="${Admin.page === k}">${ic(i)}<span>${l}</span>${c ? `<span class="count">${c}</span>` : ''}</button>`).join('')}
      <div class="sys">Field sync <b>● LIVE</b><br>Last batch 09:41 IST<br>Build 1.4.0 · 6 sites</div></aside>
      <main class="a-main"><header class="a-head"><div class="ttl"><small>JHARKHAND SAFETY</small>Compliance command center</div>
        <div class="ctrls">
          <select class="ctl" id="a-org" aria-label="Organisation"><option>All organisations</option><option>Dhanbad Coal Operations</option><option>Bokaro Steel Works</option><option>Jamshedpur Manufacturing</option><option>Koderma Mica Cluster</option></select>
          <select class="ctl" id="a-site" aria-label="Site"><option value="all">All sites</option>${SITES.map(s => `<option value="${s.key}" ${Admin.site === s.key ? 'selected' : ''}>${s.name}</option>`).join('')}</select>
          <select class="ctl" id="a-range" aria-label="Date range"><option>Last 30 days</option><option>Last 90 days</option><option>Last 12 months</option><option>FY 2026–27</option></select>
          <div class="admin-me"><span class="avatar-i">AT</span><div>A. Tirkey<span>State safety admin</span></div></div>
        </div></header>
        <div class="a-body" id="a-body"></div></main></div>`;
    const root = st.firstElementChild;
    root.addEventListener('click', Admin.click);
    root.addEventListener('input', Admin.input);
    root.addEventListener('change', Admin.change);
    Admin.draw();
  },
  go(p, detail = null) { Admin.page = p; Admin.detail = detail; $$('.a-side [data-page]').forEach(b => b.setAttribute('aria-current', b.dataset.page === p)); Admin.draw(); $('.a-main')?.scrollTo(0, 0); window.scrollTo(0, 0); },
  draw() { const b = $('#a-body'); if (!b) return; b.innerHTML = (AP[Admin.page] || AP.overview)(); (AP[Admin.page + 'Mount'] || (() => {}))(); },
  click(e) {
    const p = e.target.closest('[data-page]'); if (p) { Admin.go(p.dataset.page); return; }
    const a = e.target.closest('[data-a]'); if (!a) return;
    const v = a.dataset.v;
    switch (a.dataset.a) {
      case 'worker': Admin.go('workers', v); break;
      case 'site': Admin.go('sites', v); break;
      case 'back': Admin.go(Admin.page); break;
      case 'amod': Admin.amod = v; Admin.draw(); break;
      case 'loc': Admin.loc = v; Admin.draw(); break;
      case 'report': Admin.report = v; Admin.draw(); break;
      case 'ctab': Admin.ctab = v; Admin.draw(); break;
      case 'cert': Admin.certDrawer(v); break;
      case 'module': Admin.moduleDrawer(v); break;
      case 'close': $('.drawer')?.remove(); break;
      case 'goto': Admin.go(v); break;
      case 'toast': toast(a.dataset.t, a.dataset.m || '', a.dataset.tone || 'ok'); break;
      case 'export': toast(`Export prepared · ${v}`, 'Prototype: file downloads are disabled in this preview.', 'info'); break;
    }
  },
  input(e) {
    if (e.target.id === 'w-q') { Admin.q = e.target.value; Admin.drawTable(); }
    if (e.target.id === 'c-q') { Admin.cq = e.target.value; Admin.drawCerts(); }
  },
  change(e) {
    if (e.target.id === 'a-site') { Admin.site = e.target.value; Admin.f.site = Admin.site; Admin.draw(); return; }
    if (e.target.dataset.f) { Admin.f[e.target.dataset.f] = e.target.value; Admin.drawTable(); }
  },
  siteObj() { return SITES.find(s => s.key === Admin.site); },
  kpis() {
    const s = Admin.siteObj();
    if (!s) return { w: 12482, c: 9821, tr: 1734, p: 927 };
    const c = Math.round(s.workers * s.cert / 100), rest = s.workers - c, tr = Math.round(rest * .65);
    return { w: s.workers, c, tr, p: rest - tr };
  },
  filtered() {
    const f = Admin.f, q = Admin.q.trim().toLowerCase();
    return WORKERS.filter(w => {
      if (q && !(`${w.name} ${w.id} ${w.role}`.toLowerCase().includes(q))) return false;
      if (f.site !== 'all' && w.site !== (SITES.find(s => s.key === f.site) || {}).name) return false;
      if (f.mod === 'fire' && w.fire == null) return false;
      if (f.mod === 'gas' && w.gas == null) return false;
      if (f.cert !== 'all' && w.cert !== f.cert) return false;
      if (f.date === '7' && w.lastN > 7) return false;
      if (f.date === '1' && w.lastN > 1) return false;
      if (f.res === 'pass' && !(w.score >= 70)) return false;
      if (f.res === 'fail' && !(w.score != null && w.score < 70)) return false;
      return true;
    });
  },
  drawTable() {
    const tb = $('#w-tbody'); if (!tb) return;
    const rows = Admin.filtered();
    $('#w-count').textContent = `${rows.length} of ${WORKERS.length} sample records`;
    tb.innerHTML = rows.length ? rows.map(w => `<tr class="click" data-a="worker" data-v="${w.id}">
      <td><div class="who"><span class="avatar-i">${w.name.split(' ').map(x => x[0]).join('')}</span><b style="font-weight:600">${esc(w.name)}</b>${w.live ? '<span class="pill info" style="height:20px">Live demo</span>' : ''}</div></td>
      <td class="mono">${w.id}</td><td>${esc(w.site)}</td><td>${esc(w.role)}</td>
      <td><span class="mini"><span class="bar thin ${w.training === 100 ? 'ok' : 'info'}"><i style="width:${w.training}%"></i></span></span><span class="mono small">${w.training}%</span></td>
      <td class="r">${w.score != null ? `<b>${w.score}%</b>` : '<span class="muted">—</span>'}</td>
      <td>${certPill(w.cert)}</td><td class="muted">${w.last}</td>
      <td>${w.sync === 'pending' ? `<span class="pill haz">${ic('wifiOff')}Sync pending</span>` : `<span class="pill neutral">${ic('check')}Synced</span>`}</td></tr>`).join('') : '<tr><td colspan="9" class="empty">No workers match these filters.</td></tr>';
  },
  allCerts() {
    const out = [];
    S.certs.forEach(c => out.push({ id: c.id, worker: c.worker, mod: c.mod, score: c.score, issued: c.issued, expires: c.expires, status: c.status }));
    Object.entries(REGISTRY).forEach(([id, c]) => { if (!out.find(o => o.id === id)) out.push({ id, ...c }); });
    let n = 300;
    WORKERS.slice(4).forEach(w => {
      if (w.score >= 70 && ['valid', 'expiring', 'expired'].includes(w.cert)) {
        const mod = (w.fire || 0) >= (w.gas || 0) ? 'fire' : 'gas';
        const d = 1 + (n % 27);
        out.push({ id: `JH-${mod === 'fire' ? 'FR' : 'GS'}-${w.cert === 'expired' ? 2025 : 2026}-${String(n).padStart(5, '0')}`, worker: w.name, mod, score: w.score, issued: `${pad2(d)} ${w.cert === 'expired' ? 'Aug 2025' : ['Jan', 'Mar', 'May', 'Jul', 'Sep'][n % 5] + ' 2026'}`, expires: `${pad2(d)} ${w.cert === 'expired' ? 'Aug 2026' : w.cert === 'expiring' ? 'Oct 2026' : ['Jan', 'Mar', 'May', 'Jul', 'Sep'][n % 5] + ' 2027'}`, status: w.cert });
        n += 7;
      }
    });
    return out;
  },
  drawCerts() {
    const tb = $('#c-tbody'); if (!tb) return;
    const q = Admin.cq.trim().toUpperCase();
    const rows = Admin.allCerts().filter(c => (Admin.ctab === 'all' || c.status === Admin.ctab || (Admin.ctab === 'valid' && c.status === 'provisional')) && (!q || c.id.includes(q) || c.worker.toUpperCase().includes(q)));
    tb.innerHTML = rows.length ? rows.map(c => `<tr class="click" data-a="cert" data-v="${c.id}"><td class="mono">${c.id}</td><td>${esc(c.worker)}</td><td>${esc(certTitle(c.mod))}</td><td class="r"><b>${c.score}%</b></td><td>${c.issued}</td><td>${c.expires}</td><td>${certPill(c.status)}</td></tr>`).join('') : `<tr><td colspan="7" class="empty">No certificate matches “${esc(Admin.cq)}”.</td></tr>`;
  },
  certDrawer(id) {
    const c = Admin.allCerts().find(x => x.id === id); if (!c) return;
    const full = { ...c, wid: (WORKERS.find(w => w.name === c.worker) || {}).id || '—' };
    $('.drawer')?.remove();
    document.body.insertAdjacentHTML('beforeend', `<aside class="drawer" role="dialog" aria-label="Certificate ${id}"><div class="dh"><div class="grow"><div class="eyebrow">Certificate</div><b class="mono">${id}</b></div><button class="icon-btn" data-a="close" aria-label="Close">${ic('x')}</button></div>
      <div class="db">${certPaper(full)}<dl class="kv"><dt>Status</dt><dd>${certPill(c.status)}</dd><dt>Verification scans</dt><dd>7 · last at Gate 2, 08:12</dd><dt>Issued by</dt><dd>Training Authority · auto-issued on pass</dd></dl>
      <div class="btn-row"><button class="btn btn-secondary btn-sm" data-a="toast" data-t="Renewal reminder queued" data-m="${esc(c.worker)} gets it at next sync.">${ic('bell')}Send renewal reminder</button><button class="btn btn-danger btn-sm" data-a="toast" data-tone="warn" data-t="Revocation needs a second approver" data-m="Request sent to the site safety officer.">${ic('octa')}Request revocation</button></div></div></aside>`);
    $('.drawer').addEventListener('click', Admin.click);
  },
  moduleDrawer(k) {
    const m = TRAINING.find(x => x.key === k); if (!m) return;
    $('.drawer')?.remove();
    document.body.insertAdjacentHTML('beforeend', `<aside class="drawer" role="dialog" aria-label="${esc(m.l)}"><div class="dh"><div class="grow"><div class="eyebrow">Training module · ${m.n}</div><b class="disp d-s">${esc(m.l)}</b></div><button class="icon-btn" data-a="close" aria-label="Close">${ic('x')}</button></div>
      <div class="db"><dl class="kv"><dt>Status</dt><dd>${m.pub ? '<span class="pill ok">Published</span>' : '<span class="pill neutral">Draft</span>'}</dd><dt>Version</dt><dd class="mono">${m.ver}</dd><dt>Missions</dt><dd>${m.missions}</dd><dt>Package size</dt><dd>${m.size}</dd><dt>Assessment bank</dt><dd>${m.qs} questions · ${m.acts} AR actions</dd><dt>Min. device</dt><dd>Android 10 · ARCore · 3 GB RAM</dd></dl>
      <section><div class="eyebrow" style="margin-bottom:6px">Package contents</div><div class="list">${['Scenario script & mission logic', '3D asset bundle (glTF, LOD for mid-range GPUs)', 'Voice packs · EN / HI / SAT', 'Assessment bank & scoring weights', 'Offline cache manifest'].map((x, i) => `<div class="li" style="min-height:0;padding:10px 0">${ic(m.pub || i < 2 ? 'check' : 'clock', m.pub || i < 2 ? 'c-green' : 'c-yellow')}<div class="lt"><b style="font-weight:500">${x}</b></div></div>`).join('')}</div></section>
      <section><div class="eyebrow" style="margin-bottom:6px">Version history</div><div class="tl">${m.hist.map(([d, t, s]) => `<div class="tl-i"><span class="d">${d}</span><span class="dot"></span><div><b>${t}</b><span>${s}</span></div></div>`).join('')}</div></section></div></aside>`);
    $('.drawer').addEventListener('click', Admin.click);
  }
};
const certPill = s => ({ valid: `<span class="pill ok">${ic('check')}Valid</span>`, expiring: `<span class="pill warn">${ic('clock')}Expiring</span>`, expired: `<span class="pill crit">${ic('x')}Expired</span>`, revoked: `<span class="pill crit">${ic('octa')}Revoked</span>`, provisional: `<span class="pill info">${ic('sync')}Pending sync</span>`, failed: `<span class="pill haz">${ic('warn')}Failed</span>`, pending: `<span class="pill neutral">Not yet</span>` }[s] || s);
const TRAINING = [
  { key: 'fire', n: '01', l: 'Fire & Explosion', pub: true, ver: 'v2.3.0', missions: 4, size: '96 MB', qs: 24, acts: 5, upd: '18 Sep 2026', lang: ['ok', 'ok', 'ok'], hist: [['18 Sep', 'v2.3.0 published', 'Santali voice pack added'], ['02 Aug', 'v2.2.0', 'Scenario variant B (blocked Exit B)'], ['10 Jun', 'v2.0.0', 'AR evacuation path rebuilt']] },
  { key: 'gas', n: '02', l: 'Gas & Confined Space', pub: true, ver: 'v1.8.2', missions: 5, size: '118 MB', qs: 21, acts: 5, upd: '09 Sep 2026', lang: ['ok', 'ok', 'part'], hist: [['09 Sep', 'v1.8.2 published', 'Buddy-system drag interaction'], ['21 Jul', 'v1.7.0', 'Critical-gas emergency sequence'], ['30 May', 'v1.5.0', 'PPE avatar station']] },
  { key: 'mach', n: '03', l: 'Machinery Safety', pub: false, ver: 'v0.6.0', missions: 4, size: '—', qs: 12, acts: 4, upd: '20 Sep 2026', lang: ['ok', 'part', 'miss'], hist: [['20 Sep', 'v0.6.0 draft', 'LOTO mission blocked out'], ['01 Sep', 'v0.4.0 draft', '3D press-brake asset']] },
  { key: 'elec', n: '04', l: 'Electrical Safety', pub: false, ver: 'v0.4.1', missions: 3, size: '—', qs: 10, acts: 3, upd: '12 Sep 2026', lang: ['ok', 'part', 'miss'], hist: [['12 Sep', 'v0.4.1 draft', 'Arc-flash boundary overlay'], ['14 Aug', 'v0.2.0 draft', 'Scenario script']] },
  { key: 'ppe', n: '05', l: 'PPE & General Safety', pub: false, ver: 'v0.7.3', missions: 3, size: '—', qs: 18, acts: 3, upd: '22 Sep 2026', lang: ['ok', 'ok', 'part'], hist: [['22 Sep', 'v0.7.3 draft', 'Reuses gas-module PPE station'], ['05 Sep', 'v0.5.0 draft', 'Donning-order interaction']] }
];
const LOC = {
  en: { fire: ['ok', 'ok', 'ok', 'ok'], gas: ['ok', 'ok', 'ok', 'ok'], mach: ['ok', 'part', 'ok', 'ok'], elec: ['ok', 'part', 'ok', 'ok'], ppe: ['ok', 'ok', 'ok', 'ok'] },
  hi: { fire: ['ok', 'ok', 'ok', 'ok'], gas: ['ok', 'ok', 'ok', 'ok'], mach: ['part', 'miss', 'part', 'ok'], elec: ['part', 'miss', 'miss', 'ok'], ppe: ['ok', 'part', 'ok', 'ok'] },
  sat: { fire: ['ok', 'ok', 'miss', 'ok'], gas: ['ok', 'part', 'miss', 'ok'], mach: ['miss', 'miss', 'miss', 'part'], elec: ['miss', 'miss', 'miss', 'part'], ppe: ['part', 'miss', 'miss', 'ok'] }
};
const locCell = s => s === 'ok' ? `<span class="loc-cell c-green">${ic('check')}Complete</span>` : s === 'part' ? `<span class="loc-cell c-yellow">${ic('clock')}In review</span>` : `<span class="loc-cell c-orange">${ic('warn')}Missing</span>`;

const AP = {};
AP.overview = () => {
  const k = Admin.kpis(), s = Admin.siteObj();
  const rate = (k.c / k.w * 100).toFixed(1);
  const vals = s ? RATE.map((v, i) => +(clamp(v + (s.cert - 78.7) * (.4 + .6 * i / 11), 30, 99)).toFixed(1)) : RATE;
  vals[11] = +rate;
  return `<div class="a-h"><div><h2>Overview</h2><p>${s ? s.name + ' · ' + s.type : 'State-wide · 6 sites · mining, steel, manufacturing, mica'} · field data synced 09:41 IST</p></div>
    <button class="btn btn-secondary btn-sm" data-a="goto" data-v="reports">${ic('file')}Reports</button></div>
  <div class="kpis">
    ${[['Workers', k.w, 'var(--text-2)', '+312 this month'], ['Certified', k.c, 'var(--green)', `${rate}% of workforce`], ['In training', k.tr, 'var(--orange)', 'Active in the last 14 days'], ['Pending', k.p, 'var(--muted)', 'Not started']].map(([l, v, c, d]) => `<div class="kpi"><div class="k"><i style="background:${c}"></i>${l}</div><div class="v">${fmt(v)}</div><div class="d">${d}</div></div>`).join('')}
  </div>
  <div class="grid-2">
    <section class="card"><div class="card-h"><div><h3>Certification rate</h3><span class="eyebrow">12 months · share of workforce holding a valid certificate</span></div><b class="disp d-m tnum">${rate}%</b></div><div class="card-b">${lineChart('lc1', vals)}</div></section>
    <section class="card"><div class="card-h"><h3>Compliance alerts</h3><button class="back-link" data-a="goto" data-v="compliance">Open alert center ${ic('chevR')}</button></div>
      <div class="card-b" style="padding-top:4px">${ALERTS.map(a => `<div class="alert-row" style="padding:12px 0;grid-template-columns:4px 64px 1fr"><span class="sev ${a.sev}"></span><span class="n" style="font-size:30px">${s ? a.by[SITES.indexOf(s)] : a.n}</span><div><b style="font-weight:600">${a.t}</b><div class="small muted">${a.pill}</div></div></div>`).join('')}</div></section>
  </div>
  <div class="card"><div class="card-h"><h3>Workforce status</h3><span class="eyebrow">${fmt(k.w)} workers</span></div><div class="card-b" style="display:flex;flex-direction:column;gap:10px">
    <div style="display:flex;height:22px;gap:2px">${[[k.c, 'var(--green)', 'Certified'], [k.tr, 'var(--orange)', 'In training'], [k.p, 'var(--panel-3)', 'Pending']].map(([v, c, l]) => `<div title="${l}: ${fmt(v)}" style="flex:${v};background:${c};border-radius:2px"></div>`).join('')}</div>
    <div class="row mono small" style="gap:18px;flex-wrap:wrap">${[[k.c, 'var(--green)', 'Certified'], [k.tr, 'var(--orange)', 'In training'], [k.p, 'var(--line-2)', 'Pending']].map(([v, c, l]) => `<span class="row" style="gap:6px"><i style="width:10px;height:10px;background:${c};display:inline-block"></i>${l} <b>${fmt(v)}</b> <span class="muted">${(v / k.w * 100).toFixed(1)}%</span></span>`).join('')}</div></div></div>
  <div class="grid-2">
    <section class="card"><div class="card-h"><h3>Site performance</h3><span class="eyebrow">Click a site for details</span></div><div class="card-b flush tbl-wrap"><table class="tbl"><thead><tr><th>Site</th><th>Type</th><th class="r">Workers</th><th>Certified</th><th class="r">Expired</th></tr></thead><tbody>
      ${SITES.map((x, i) => `<tr class="click" data-a="site" data-v="${x.key}" ${s && s.key === x.key ? 'style="background:var(--panel-2)"' : ''}><td><b style="font-weight:600">${x.name}</b></td><td class="muted">${x.type}</td><td class="r">${fmt(x.workers)}</td><td><span class="mini"><span class="bar thin ${x.cert >= 85 ? 'ok' : x.cert >= 70 ? 'info' : 'haz'}"><i style="width:${x.cert}%"></i></span></span><b>${x.cert}%</b></td><td class="r">${ALERTS[0].by[i]}</td></tr>`).join('')}
    </tbody></table></div></section>
    <section class="card"><div class="card-h"><h3>Module pass rate</h3><button class="back-link" data-a="goto" data-v="analytics">Analytics ${ic('chevR')}</button></div><div class="card-b">${hbars(MODPASS)}<p class="mono small muted" style="margin-top:8px">| marker = 75% competency threshold</p></div></section>
  </div>
  <section class="card"><div class="card-h"><h3>Live field sync</h3><span class="pill ok">${ic('sync')}Auto-sync on</span></div><div class="card-b flush tbl-wrap"><table class="tbl"><tbody>${SYNC_FEED.map(f => `<tr><td class="mono muted">${f.t}</td><td><b style="font-weight:600">${esc(f.w)}</b></td><td class="muted">${esc(f.s)}</td><td>${esc(f.r)}</td></tr>`).join('')}</tbody></table></div></section>`;
};
AP.overviewMount = () => bindLine('lc1', (() => { const s = Admin.siteObj(); const k = Admin.kpis(); const v = s ? RATE.map((x, i) => +(clamp(x + (s.cert - 78.7) * (.4 + .6 * i / 11), 30, 99)).toFixed(1)) : RATE.slice(); v[11] = +(k.c / k.w * 100).toFixed(1); return v; })());

AP.workers = () => {
  if (Admin.detail) return AP.workerDetail(Admin.detail);
  const f = Admin.f;
  const sel = (k, opts) => `<select class="ctl" data-f="${k}" aria-label="${k}">${opts.map(([v, l]) => `<option value="${v}" ${f[k] === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  return `<div class="a-h"><div><h2>Workers</h2><p>Search and filter the workforce. Click a worker for training history, attempts and certificates.</p></div><button class="btn btn-secondary btn-sm" data-a="export" data-v="workers.csv">${ic('download')}Export</button></div>
  <div class="filters"><div class="search-wrap">${ic('search')}<input class="ctl-input" id="w-q" placeholder="Search name, ID or role" value="${esc(Admin.q)}"></div>
    <span class="lbl">FILTER</span>${sel('site', [['all', 'All sites'], ...SITES.map(s => [s.key, s.name])])}${sel('mod', [['all', 'Any module'], ['fire', 'Fire & Explosion'], ['gas', 'Gas & Confined Space']])}${sel('cert', [['all', 'Any certification'], ['valid', 'Valid'], ['expiring', 'Expiring'], ['expired', 'Expired'], ['revoked', 'Revoked'], ['failed', 'Failed'], ['pending', 'Not yet']])}${sel('date', [['all', 'Any activity date'], ['1', 'Active since yesterday'], ['7', 'Active in 7 days']])}${sel('res', [['all', 'Pass / fail'], ['pass', 'Passed'], ['fail', 'Failed']])}</div>
  <section class="card"><div class="card-h"><h3>Worker register</h3><span class="eyebrow" id="w-count"></span></div><div class="card-b flush tbl-wrap"><table class="tbl"><thead><tr><th>Worker</th><th>Worker ID</th><th>Site</th><th>Role</th><th>Training</th><th class="r">Score</th><th>Certification</th><th>Last activity</th><th>Status</th></tr></thead><tbody id="w-tbody"></tbody></table></div></section>`;
};
AP.workersMount = () => { if (!Admin.detail) Admin.drawTable(); };
AP.workerDetail = id => {
  const w = WORKERS.find(x => x.id === id) || WORKERS[0];
  const live = w.live;
  const mods = [['fire', 'Fire & Explosion', w.fire], ['gas', 'Gas & Confined Space', w.gas], ['mach', 'Machinery Safety', null], ['elec', 'Electrical Safety', null], ['ppe', 'PPE & General Safety', null]];
  const certs = live ? S.certs : Admin.allCerts().filter(c => c.worker === w.name);
  const tl = live ? S.activity : [{ d: '26 Sep', t: 'Fire Safety', s: w.fire ? `Passed — ${w.fire}%` : 'Not started', tone: 'ok' }, { d: '25 Sep', t: 'Gas Safety', s: w.gas ? `${w.gas >= 70 ? 'Passed' : 'Failed'} — ${w.gas}%` : 'Not started' }, { d: '23 Sep', t: 'Orientation', s: 'Completed' }];
  const ok = ['valid', 'expiring'].includes(w.cert);
  return `<button class="back-link" data-a="back">${ic('chevL')}All workers</button>
  <div class="a-h"><div class="row" style="gap:16px"><span class="avatar-i" style="width:60px;height:60px;font-size:18px">${w.name.split(' ').map(x => x[0]).join('')}</span><div><h2>${esc(w.name)}</h2><p class="mono">${w.id} · ${esc(w.role)} · ${esc(w.site)}</p></div></div>
    <div class="row">${ok ? `<span class="pill ok" style="height:32px">${ic('shield')}Compliant</span>` : `<span class="pill crit" style="height:32px">${ic('octa')}Not compliant</span>`}${live ? `<span class="pill info" style="height:32px">Linked to worker app demo</span>` : ''}</div></div>
  <div class="kpis">
    <div class="kpi"><div class="k">Training progress</div><div class="v">${live ? doneCount() : (w.fire ? 1 : 0) + (w.gas ? 1 : 0)} / 5</div><div class="bar thin ok"><i style="width:${w.training}%"></i></div></div>
    <div class="kpi"><div class="k">Best score</div><div class="v">${w.score ?? '—'}${w.score ? '%' : ''}</div><div class="d">Pass mark 70</div></div>
    <div class="kpi"><div class="k">Certificates</div><div class="v">${certs.length}</div><div class="d">${certs.filter(c => c.status === 'expiring').length} expiring</div></div>
    <div class="kpi"><div class="k">Last synchronization</div><div class="v" style="font-size:26px">${live ? esc(S.lastSync) : w.sync === 'pending' ? 'Pending' : w.last}</div><div class="d">${live ? `${S.pending} records waiting on device` : w.sync === 'pending' ? 'Device offline' : 'Up to date'}</div></div>
  </div>
  <div class="grid-2">
    <section class="card"><div class="card-h"><h3>Module scores</h3><span class="eyebrow">Latest attempt</span></div><div class="card-b">${mods.map(([k, l, v]) => { const sc = live && S.modules[k].score != null ? S.modules[k].score : v; return `<div class="hbar"><div class="n">${l}<small>${['mach', 'elec', 'ppe'].includes(k) ? 'Module in development' : sc == null ? 'Not started' : sc >= 70 ? 'Passed' : 'Failed'}</small></div><div class="bar ${sc >= 70 ? 'info' : 'haz'}"><i style="width:${sc || 0}%"></i></div><div class="v">${sc != null ? sc + '%' : '—'}</div></div>`; }).join('')}</div></section>
    <section class="card"><div class="card-h"><h3>Training history</h3></div><div class="card-b"><div class="tl">${tl.map(a => `<div class="tl-i"><span class="d">${a.d}</span><span class="dot" style="border-color:${a.tone === 'warn' ? 'var(--yellow)' : a.tone === 'info' ? 'var(--blue)' : 'var(--green)'}"></span><div><b>${esc(a.t)}</b><span>${esc(a.s)}</span></div></div>`).join('')}</div></div></section>
  </div>
  <div class="grid-2">
    <section class="card"><div class="card-h"><h3>Assessment attempts</h3></div><div class="card-b flush tbl-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Module</th><th class="r">Knowledge</th><th class="r">AR actions</th><th class="r">Total</th><th>Result</th></tr></thead><tbody>
      ${[w.gas != null ? ['25 Sep', 'Gas & Confined Space', Math.round(w.gas * .3), Math.round(w.gas * .4), w.gas] : null, w.fire != null ? ['26 Sep', 'Fire & Explosion', Math.round(w.fire * .3), Math.round(w.fire * .4), w.fire] : null].filter(Boolean).map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td class="r">${r[2]} / 30</td><td class="r">${r[3]} / 40</td><td class="r"><b>${r[4]}</b></td><td>${r[4] >= 70 ? '<span class="pill ok">Pass</span>' : '<span class="pill crit">Fail</span>'}</td></tr>`).join('') || '<tr><td colspan="6" class="empty">No attempts yet.</td></tr>'}
    </tbody></table></div></section>
    <section class="card"><div class="card-h"><h3>Certificates & compliance</h3></div><div class="card-b" style="display:flex;flex-direction:column;gap:10px">
      ${certs.length ? certs.map(c => `<div class="row between" style="padding-bottom:10px;border-bottom:1px solid var(--line)"><div><b style="font-weight:600">${esc(certTitle(c.mod))}</b><div class="mono small muted">${c.id} · expires ${c.expires}</div></div>${certPill(c.status)}</div>`).join('') : '<p class="muted">No certificates.</p>'}
      <div class="list">${[['Orientation', true], ['Fire & Explosion certificate', !!(live ? S.modules.fire.score : w.fire >= 70)], ['Gas & Confined Space certificate', !!(live ? S.modules.gas.score : w.gas >= 70)], ['No expired certificates', w.cert !== 'expired']].map(([l, v]) => `<div class="li" style="min-height:0;padding:8px 0">${ic(v ? 'check' : 'x', v ? 'c-green' : 'c-red')}<div class="lt">${l}</div></div>`).join('')}</div>
    </div></section>
  </div>`;
};

AP.sites = () => {
  if (Admin.detail) {
    const s = SITES.find(x => x.key === Admin.detail), i = SITES.indexOf(s);
    const ws = WORKERS.filter(w => w.site === s.name);
    return `<button class="back-link" data-a="back">${ic('chevL')}All sites</button>
    <div class="a-h"><div><h2>${s.name}</h2><p>${s.type} · ${s.dist} district · ${fmt(s.workers)} workers</p></div><span class="pill ${s.cert >= 85 ? 'ok' : s.cert >= 70 ? 'warn' : 'crit'}" style="height:32px">${s.cert}% certified</span></div>
    <div class="kpis">${ALERTS.map(a => `<div class="kpi"><div class="k"><i style="background:var(--${a.sev === 'crit' ? 'red' : a.sev === 'warn' ? 'yellow' : a.sev === 'haz' ? 'orange' : 'blue'})"></i>${a.t}</div><div class="v">${a.by[i]}</div></div>`).join('')}</div>
    <div class="grid-2e"><section class="card"><div class="card-h"><h3>Module pass rate · site</h3></div><div class="card-b">${hbars(MODPASS.slice(0, 2).map(m => ({ ...m, v: clamp(Math.round(m.v + (s.cert - 78.7) * .7), 40, 99), s: '' })))}</div></section>
    <section class="card"><div class="card-h"><h3>Weakest step</h3></div><div class="card-b"><div class="insight">${ic('warn', 'c-yellow')}<div><b>Evacuation sequence · ${clamp(Math.round(67 + (s.cert - 78.7) * .9), 40, 95)}%</b><p>Most errors come from choosing the route through the hazard zone. Assign the 8-minute evacuation refresher.</p></div></div></div></section></div>
    <section class="card"><div class="card-h"><h3>Workers at this site</h3><span class="eyebrow">${ws.length} sample records</span></div><div class="card-b flush tbl-wrap"><table class="tbl"><thead><tr><th>Worker</th><th>Role</th><th class="r">Score</th><th>Certification</th><th>Last activity</th></tr></thead><tbody>${ws.map(w => `<tr class="click" data-a="worker" data-v="${w.id}"><td><b style="font-weight:600">${esc(w.name)}</b></td><td>${esc(w.role)}</td><td class="r">${w.score ?? '—'}</td><td>${certPill(w.cert)}</td><td class="muted">${w.last}</td></tr>`).join('')}</tbody></table></div></section>`;
  }
  return `<div class="a-h"><div><h2>Sites</h2><p>Certification coverage per facility. Click a site for details.</p></div></div>
  <div class="grid-3">${SITES.map((s, i) => `<button class="site-card" data-a="site" data-v="${s.key}"><div class="row between"><span class="eyebrow">${s.type} · ${s.dist}</span>${ic('chevR', 'muted')}</div>
    <b class="disp d-s">${s.name}</b><div class="row between" style="align-items:flex-end"><div><div class="big tnum">${s.cert}%</div><div class="mono small muted">certified</div></div><div style="text-align:right"><div class="disp d-s tnum">${fmt(s.workers)}</div><div class="mono small muted">workers</div></div></div>
    <div class="bar ${s.cert >= 85 ? 'ok' : s.cert >= 70 ? 'info' : 'haz'}"><i style="width:${s.cert}%"></i></div>
    <div class="row mono small" style="gap:14px"><span class="c-red">${ALERTS[0].by[i]} expired</span><span class="c-yellow">${ALERTS[1].by[i]} expiring</span></div></button>`).join('')}</div>`;
};

AP.training = () => `<div class="a-h"><div><h2>Training content</h2><p>Five safety domains share one module architecture: scenario script + 3D asset bundle + voice packs + assessment bank, all cached for offline use.</p></div><button class="btn btn-primary btn-sm" data-a="toast" data-t="New module draft" data-m="Choose a domain template to start from." data-tone="info">${ic('plus')}New module</button></div>
  <section class="card"><div class="card-b flush tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Module</th><th>Status</th><th>Version</th><th>English</th><th>Hindi</th><th>Santali</th><th class="r">Missions</th><th>Package</th><th>Updated</th></tr></thead><tbody>
  ${TRAINING.map(m => `<tr class="click" data-a="module" data-v="${m.key}"><td class="mono muted">${m.n}</td><td><b style="font-weight:600">${m.l}</b></td><td>${m.pub ? `<span class="pill ok">${ic('check')}Published</span>` : '<span class="pill neutral">Draft</span>'}</td><td class="mono">${m.ver}</td>${m.lang.map(l => `<td>${l === 'ok' ? `<span class="loc-cell c-green">${ic('check')}</span>` : l === 'part' ? `<span class="loc-cell c-yellow">${ic('clock')}Partial</span>` : `<span class="loc-cell c-orange">${ic('warn')}Missing</span>`}</td>`).join('')}<td class="r">${m.missions}</td><td>${m.size}</td><td class="muted">${m.upd}</td></tr>`).join('')}
  </tbody></table></div></section>
  <div class="grid-3">${[['layers', 'One architecture', 'Every domain plugs into the same AR engine, HUD, scoring and certificate pipeline.'], ['download', 'Offline packages', 'Modules download once over Wi-Fi and run with no network. Delta updates only.'], ['phone', 'Mid-range Android', 'Assets ship with levels of detail for 3 GB RAM phones running Android 10+.']].map(([i, t, d]) => `<div class="card"><div class="card-b" style="display:flex;flex-direction:column;gap:8px">${ic(i, 'c-yellow')}<b class="disp d-xs">${t}</b><p class="small t2">${d}</p></div></div>`).join('')}</div>`;

AP.assessments = () => {
  const m = Admin.amod;
  return `<div class="a-h"><div><h2>Assessments</h2><p>Scores combine knowledge (30), AR practical actions (40), safety procedure (20) and response time (10). Pass mark 70.</p></div></div>
  <div class="kpis">${[['Attempts (30 days)', '4,318'], ['First-time pass rate', '72%'], ['Average score', '81'], ['Avg. attempts to pass', '1.3']].map(([l, v]) => `<div class="kpi"><div class="k">${l}</div><div class="v">${v}</div></div>`).join('')}</div>
  <div class="tabs" role="tablist">${[['fire', 'Fire & Explosion'], ['gas', 'Gas & Confined Space']].map(([k, l]) => `<button role="tab" data-a="amod" data-v="${k}" aria-selected="${m === k}">${l}</button>`).join('')}</div>
  <div class="grid-2e">
    <section class="card"><div class="card-h"><h3>Step-level performance</h3><span class="eyebrow">% correct on first try</span></div><div class="card-b">${hbars(QPERF[m].map(([l, v]) => ({ l, v })))}</div></section>
    <section class="card"><div class="card-h"><h3>Score distribution</h3><span class="eyebrow">Last 30 days · workers</span></div><div class="card-b">${histogram([{ l: '<50', n: 64 }, { l: '50s', n: 138 }, { l: '60s', n: 311 }, { l: '70s', n: 842, pass: true }, { l: '80s', n: 1290, pass: true }, { l: '90+', n: 973, pass: true }])}</div></section>
  </div>
  <section class="card"><div class="card-h"><h3>Weighting</h3></div><div class="card-b"><div class="weights">${[['Knowledge', 30], ['AR practical actions', 40], ['Safety procedure', 20], ['Response time', 10]].map(([l, v]) => `<div style="flex:${v}"><i style="width:100%;background:var(--panel-3)"></i><span style="color:var(--text)">${l} · ${v}%</span></div>`).join('')}</div></div></section>`;
};

AP.certifications = () => `<div class="a-h"><div><h2>Certifications</h2><p>Every certificate carries a signed QR. Search by certificate ID or worker name.</p></div><button class="btn btn-secondary btn-sm" data-a="export" data-v="certificates.csv">${ic('download')}Export</button></div>
  <div class="filters"><div class="search-wrap">${ic('search')}<input class="ctl-input" id="c-q" placeholder="Search certificate ID, e.g. JH-FR-2026-00421" value="${esc(Admin.cq)}"></div></div>
  <div class="tabs" role="tablist">${[['all', 'All'], ['valid', 'Valid'], ['expiring', 'Expiring'], ['expired', 'Expired'], ['revoked', 'Revoked']].map(([k, l]) => `<button role="tab" data-a="ctab" data-v="${k}" aria-selected="${Admin.ctab === k}">${l}</button>`).join('')}</div>
  <section class="card"><div class="card-b flush tbl-wrap"><table class="tbl"><thead><tr><th>Certificate ID</th><th>Worker</th><th>Module</th><th class="r">Score</th><th>Issued</th><th>Expires</th><th>Status</th></tr></thead><tbody id="c-tbody"></tbody></table></div></section>`;
AP.certificationsMount = () => Admin.drawCerts();

AP.compliance = () => `<div class="a-h"><div><h2>Compliance alerts</h2><p>Ranked by severity. Red is reserved for conditions that stop work.</p></div></div>
  <section class="card"><div class="card-b" style="padding-top:0;padding-bottom:0">${ALERTS.map(a => `<div class="alert-row"><span class="sev ${a.sev}"></span><div class="row" style="gap:18px;align-items:center"><span class="n">${a.n}</span><div><div class="row" style="gap:8px"><b style="font-weight:600;font-size:16px">${a.t}</b><span class="pill ${a.sev === 'crit' ? 'crit' : a.sev === 'warn' ? 'warn' : a.sev === 'haz' ? 'haz' : 'info'}">${a.pill}</span></div><p class="small t2" style="margin-top:4px">${a.d}</p></div></div>
    <button class="btn btn-secondary btn-sm" data-a="toast" data-t="${a.a}" data-m="${a.n} workers · prototype action">${a.a}</button></div>`).join('')}</div></section>
  <section class="card"><div class="card-h"><h3>By site</h3><span class="eyebrow">Counts per alert type</span></div><div class="card-b flush tbl-wrap"><table class="tbl"><thead><tr><th>Site</th>${ALERTS.map(a => `<th class="r">${a.t}</th>`).join('')}</tr></thead><tbody>
    ${SITES.map((s, i) => `<tr class="click" data-a="site" data-v="${s.key}"><td><b style="font-weight:600">${s.name}</b></td>${ALERTS.map(a => `<td class="r ${a.sev === 'crit' && a.by[i] >= 9 ? 'c-red' : ''}">${a.by[i]}</td>`).join('')}</tr>`).join('')}
  </tbody></table></div></section>`;

AP.analytics = () => {
  const m = Admin.amod;
  const heat = SITES.map(s => ({ s, v: MODPASS.slice(0, 2).map(x => clamp(Math.round(x.v + (s.cert - 78.7) * .8), 40, 99)) }));
  return `<div class="a-h"><div><h2>Analytics</h2><p>Where workers are struggling, by module, step and site.</p></div></div>
  <div class="grid-2e">
    <section class="card"><div class="card-h"><h3>Module pass rate</h3><span class="eyebrow">Click a module</span></div><div class="card-b">${hbars(MODPASS.map(x => ({ ...x, l: x.l + (x.key === m ? ' ◂' : '') })), { click: 'amod' })}</div></section>
    <section class="card"><div class="card-h"><h3>${esc(MODPASS.find(x => x.key === m).l)} · step performance</h3></div><div class="card-b">${hbars(QPERF[m].map(([l, v]) => ({ l: l.toUpperCase(), v })))}</div></section>
  </div>
  <div class="grid-2">
    <section class="card"><div class="card-h"><h3>Training performance insights</h3></div><div class="card-b" style="padding-top:0;padding-bottom:0">
      <div class="insight">${ic('warn', 'c-yellow')}<div><b>Evacuation sequence is the weakest step (67%)</b><p>71% of errors pick the route through the hazard zone next to Exit A. Hazaribagh and Ramgarh are lowest. Recommend the 8-minute evacuation refresher for 312 workers.</p></div></div>
      <div class="insight">${ic('clock', 'c-yellow')}<div><b>Gas emergency reactions are slow on night shift</b><p>Median 00:41 versus 00:24 on day shift. Schedule a drill before the next confined-space job.</p></div></div>
      <div class="insight">${ic('globe', 'c-blue')}<div><b>Santali learners score 6 points higher with voice on</b><p>Complete the Santali voice pack for the gas module (in review) to extend this.</p></div></div>
      <div class="insight">${ic('check', 'c-green')}<div><b>PPE selection improved +11 points</b><p>Since the avatar station was added in Gas v1.5.</p></div></div>
    </div></section>
    <section class="card"><div class="card-h"><h3>Pass rate by site</h3><span class="eyebrow">Darker = higher</span></div><div class="card-b flush tbl-wrap"><table class="tbl"><thead><tr><th>Site</th><th class="r">Fire</th><th class="r">Gas</th></tr></thead><tbody>
      ${heat.map(h => `<tr><td>${h.s.name}</td>${h.v.map(v => `<td class="r" style="background:rgba(136,169,196,${((v - 40) / 60 * .55).toFixed(2)});font-weight:600">${v}%</td>`).join('')}</tr>`).join('')}
    </tbody></table></div></section>
  </div>`;
};
AP.analyticsMount = () => { $$('#a-body .hbar[data-a="amod"]').forEach(h => { h.setAttribute('role', 'button'); h.tabIndex = 0; }); };

AP.localization = () => {
  const l = Admin.loc, D = LOC[l];
  const cells = Object.values(D).flat(), cov = Math.round(cells.filter(c => c === 'ok').length / cells.length * 100);
  const names = { en: 'English', hi: 'हिंदी · Hindi', sat: 'ᱥᱟᱱᱛᱟᱲᱤ · Santali' };
  return `<div class="a-h"><div><h2>Localization</h2><p>Text, voice, assessment and safety instructions per module and language. Workers fall back to English where a string is missing.</p></div></div>
  <div class="tabs" role="tablist">${['en', 'hi', 'sat'].map(k => `<button role="tab" data-a="loc" data-v="${k}" aria-selected="${l === k}">${names[k]}</button>`).join('')}</div>
  <div class="kpis">${[['Coverage', cov + '%'], ['Complete', cells.filter(c => c === 'ok').length], ['In review', cells.filter(c => c === 'part').length], ['Missing', cells.filter(c => c === 'miss').length]].map(([k, v]) => `<div class="kpi"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('')}</div>
  <section class="card"><div class="card-b flush tbl-wrap"><table class="tbl"><thead><tr><th>Module</th><th>Text translation</th><th>Voice instruction</th><th>Assessment questions</th><th>Safety instructions</th></tr></thead><tbody>
    ${TRAINING.map(m => `<tr><td><b style="font-weight:600">${m.l}</b>${m.pub ? '' : ' <span class="pill neutral" style="height:20px">Draft</span>'}</td>${D[m.key].map(locCell).join('')}</tr>`).join('')}
  </tbody></table></div></section>
  ${l === 'sat' ? `<section class="card"><div class="card-h"><h3>Review queue · Ol Chiki</h3><span class="pill warn">Native-speaker review</span></div><div class="card-b flush tbl-wrap"><table class="tbl"><thead><tr><th>Key</th><th>English</th><th>Santali (draft)</th><th>Status</th></tr></thead><tbody>
    ${[['choose_lang', 'Choose your language', 'ᱯᱟᱹᱨᱥᱤ ᱵᱟᱪᱷᱟᱣ ᱢᱮ'], ['m_fire', 'Fire & Explosion Response', 'ᱥᱮᱸᱜᱮᱞ ᱟᱨ ᱵᱤᱥᱯᱷᱚᱴ'], ['tagline', 'Learn. Practice. Respond. Stay Safe.', 'ᱪᱮᱫ ᱢᱮ᱾ ᱟᱵᱷᱭᱟᱥ ᱢᱮ᱾ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱛᱟᱦᱮᱸᱱ ᱢᱮ᱾'], ['quiz.gas.1', 'The safe oxygen range for confined-space entry is…', '—']].map(([k, e, s]) => `<tr><td class="mono small">${k}</td><td>${e}</td><td style="font-family:'Noto Sans Ol Chiki',var(--f-body)">${s}</td><td>${s === '—' ? '<span class="loc-cell c-orange">' + ic('warn') + 'Missing</span>' : '<span class="loc-cell c-yellow">' + ic('clock') + 'In review</span>'}</td></tr>`).join('')}
  </tbody></table></div></section>` : ''}`;
};

const REPORTS = [['completion', 'file', 'Training completion report', 'Who finished which module, by site and date'], ['cert', 'cert', 'Certification report', 'Issued, expiring, expired and revoked certificates'], ['site', 'building', 'Site compliance report', 'Coverage against the 85% target for each facility'], ['assess', 'chart', 'Assessment performance report', 'Scores, attempts and step-level weaknesses'], ['safety', 'shield', 'Worker safety report', 'Per-worker record for audits and inspections']];
AP.reports = () => {
  const r = REPORTS.find(x => x[0] === Admin.report);
  return `<div class="a-h"><div><h2>Reports</h2><p>Choose a report, set filters, preview and export.</p></div></div>
  <div class="grid-3" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">${REPORTS.map(([k, i, t, d]) => `<button class="report-card" data-a="report" data-v="${k}" aria-pressed="${Admin.report === k}">${ic(i)}<b class="disp d-xs">${t}</b><span class="small muted">${d}</span></button>`).join('')}</div>
  <section class="card"><div class="card-h"><h3>${r[2]}</h3><div class="row"><button class="btn btn-secondary btn-sm" data-a="toast" data-t="Preview refreshed" data-tone="info">${ic('eye')}View</button><button class="btn btn-secondary btn-sm" data-a="export" data-v="${r[0]}-sep-2026.csv">${ic('download')}CSV</button><button class="btn btn-primary btn-sm" data-a="export" data-v="${r[0]}-sep-2026.pdf">${ic('download')}PDF</button></div></div>
    <div class="card-b" style="display:flex;flex-direction:column;gap:14px">
      <div class="filters"><span class="lbl">DATE RANGE</span><select class="ctl"><option>1 – 26 Sep 2026</option><option>Last 90 days</option><option>FY 2026–27</option></select><span class="lbl">SITE</span><select class="ctl"><option>All sites</option>${SITES.map(s => `<option>${s.name}</option>`).join('')}</select><span class="lbl">MODULE</span><select class="ctl"><option>All modules</option><option>Fire & Explosion</option><option>Gas & Confined Space</option></select></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Site</th><th class="r">Workers</th><th class="r">Completed</th><th class="r">Certified</th><th class="r">Expiring</th><th class="r">Avg score</th></tr></thead><tbody>
        ${SITES.map((s, i) => `<tr><td>${s.name}</td><td class="r">${fmt(s.workers)}</td><td class="r">${fmt(Math.round(s.workers * (s.cert + 6) / 100))}</td><td class="r">${fmt(Math.round(s.workers * s.cert / 100))}</td><td class="r">${ALERTS[1].by[i]}</td><td class="r">${Math.round(70 + s.cert / 8)}</td></tr>`).join('')}
        <tr style="font-weight:600"><td>Total</td><td class="r">12,482</td><td class="r">${fmt(SITES.reduce((a, s) => a + Math.round(s.workers * (s.cert + 6) / 100), 0))}</td><td class="r">9,821</td><td class="r">137</td><td class="r">81</td></tr>
      </tbody></table></div></div></section>`;
};

AP.settings = () => `<div class="a-h"><div><h2>Settings</h2><p>Platform rules applied to every site. Changes are versioned and need a second approver.</p></div></div>
  <div class="grid-2e">
    <section class="card"><div class="card-h"><h3>Assessment & certification</h3></div><div class="card-b"><dl class="kv"><dt>Pass mark</dt><dd>70 / 100</dd><dt>Weights</dt><dd>30 · 40 · 20 · 10</dd><dt>Certificate validity</dt><dd>12 months</dd><dt>Renewal reminders</dt><dd>30 · 14 · 3 days before expiry</dd><dt>Retake cooldown</dt><dd>24 hours</dd><dt>Revocation</dt><dd>Two approvers</dd></dl></div></section>
    <section class="card"><div class="card-h"><h3>Sync & devices</h3></div><div class="card-b"><dl class="kv"><dt>Result sync</dt><dd>Automatic when online</dd><dt>Content packs</dt><dd>Wi-Fi only</dd><dt>Offline limit</dt><dd>30 days before re-sync required</dd><dt>Minimum OS</dt><dd>Android 10</dd><dt>AR runtime</dt><dd>ARCore · camera only · no headset</dd></dl></div></section>
    <section class="card"><div class="card-h"><h3>Languages</h3></div><div class="card-b"><div class="list">${[['English', 'Default'], ['हिंदी · Hindi', 'Enabled'], ['ᱥᱟᱱᱛᱟᱲᱤ · Santali (Ol Chiki)', 'Enabled · voice partial']].map(([l, s]) => `<div class="li"><div class="lt"><b>${l}</b><span>${s}</span></div><span class="toggle" aria-pressed="true" role="img" aria-label="Enabled"></span></div>`).join('')}</div></div></section>
    <section class="card"><div class="card-h"><h3>Roles & access</h3></div><div class="card-b"><dl class="kv"><dt>State admins</dt><dd>4</dd><dt>Site safety officers</dt><dd>11</dd><dt>Supervisors</dt><dd>186</dd><dt>Public verification</dt><dd>On · no login</dd></dl></div></section>
  </div>`;

/* ============================ DESIGN SYSTEM ============================ */
const DS = {
  render(st) {
    const sw = (n, v, role) => `<div class="sw"><i style="background:${v}"></i><div><b>${n}</b><span>${v} · ${role}</span></div></div>`;
    st.innerHTML = `<div class="ds">
      <div class="a-h"><div><div class="eyebrow">Jharkhand Safety AR</div><h2 class="disp d-xl" style="margin-top:8px">Design system</h2><p style="max-width:70ch">Industrial control-room foundation. Colour carries state, never decoration. Every component is sized for gloved hands, bright sun and low light on mid-range Android phones.</p></div></div>

      <section class="ds-sec"><header><h2>Every screen answers four questions</h2></header>
        <div class="q-list"><div><b>Where am I?</b><span>Mission counter, objective number, top bar title.</span></div><div><b>What is the hazard?</b><span>Anchored hazard markers with type and distance.</span></div><div><b>What do I need to do?</b><span>One objective at a time, icon + short text + Listen.</span></div><div><b>What happens next?</b><span>Feedback sheet always ends in one clear next action.</span></div></div></section>

      <section class="ds-sec"><header><h2>State colour</h2><p>Green safe · yellow caution/action · orange hazard/active · red danger only · blue information</p></header>
        <div class="swatches">${sw('Safe · verified', '#45B974', 'complete, valid, cleared')}${sw('Caution · action', '#F2C230', 'primary actions, attention')}${sw('Hazard · active', '#EF7C22', 'hazards, active training')}${sw('Danger · failure', '#E4493D', 'critical, expired, revoked')}${sw('Information', '#88A9C4', 'neutral data, charts')}</div>
        <div class="swatches">${sw('Graphite', '#0A0C0E', 'page ground')}${sw('Charcoal', '#161A1E', 'panels')}${sw('Steel', '#3A424A', 'borders')}${sw('Steel grey', '#858E97', 'secondary text')}${sw('Off-white', '#EDEAE3', 'primary text')}</div></section>

      <section class="ds-sec"><header><h2>Typography</h2><p>Barlow Condensed for signage-style headings · IBM Plex Sans for reading · IBM Plex Mono for data · Noto for Devanagari and Ol Chiki</p></header>
        <div>${[['Display 44', '<span class="disp d-xl">Fire response</span>'], ['Heading 26', '<span class="disp d-m">Mission objectives</span>'], ['Body 16', '<span style="font-size:16px">Electrical fires require a non-conductive extinguishing method.</span>'], ['Data / label', '<span class="eyebrow" style="color:var(--text)">H₂S 38 PPM · MISSION 2 / 5 · 03:42</span>'], ['Hindi', '<span style="font-size:22px;font-weight:600">आग के स्रोत की पहचान करें।</span>'], ['Santali', '<span style="font-size:22px;font-family:\'Noto Sans Ol Chiki\',var(--f-body)">ᱥᱮᱸᱜᱮᱞ ᱚᱠᱟ ᱠᱷᱚᱱ ᱮᱛᱦᱚᱵ ᱮᱱᱟ ᱪᱤᱱᱦᱟᱹᱣ ᱢᱮ᱾</span>']].map(([k, v]) => `<div class="type-row"><span class="eyebrow">${k}</span><div>${v}</div></div>`).join('')}</div></section>

      <section class="ds-sec"><header><h2>Actions</h2><p>56 px minimum height on worker screens · one primary action per view</p></header>
        <div class="ds-grid"><div class="ds-demo"><span class="eyebrow">Buttons</span><div class="ds-row"><button class="btn btn-primary">${ic('play')}Start AR training</button><button class="btn btn-secondary">${ic('speaker')}Listen</button></div><div class="ds-row"><button class="btn btn-ghost btn-sm">Ghost</button><button class="btn btn-safe btn-sm">${ic('check')}Confirm</button><button class="btn btn-danger btn-sm">${ic('octa')}Revoke</button><button class="btn btn-primary btn-sm" disabled>Disabled</button></div></div>
        <div class="ds-demo"><span class="eyebrow">Status pills · icon + label, never colour alone</span><div class="ds-row"><span class="pill ok">${ic('check')}Valid</span><span class="pill warn">${ic('clock')}Expiring</span><span class="pill haz">${ic('play')}In progress</span><span class="pill crit">${ic('x')}Expired</span><span class="pill crit">${ic('octa')}Revoked</span><span class="pill info">${ic('sync')}Pending sync</span><span class="pill neutral">${ic('lock')}Coming soon</span></div></div>
        <div class="ds-demo"><span class="eyebrow">Network & sync indicators</span><div class="ds-row"><span class="net on"><span class="dot"></span>ONLINE</span><span class="net off"><span class="dot"></span>OFFLINE</span><span class="net sync">${ic('sync')}SYNC</span></div><div class="banner off">${ic('wifiOff')}<div><b>Offline training enabled</b><p>Results sync automatically when connectivity returns.</p></div></div></div></div></section>

      <section class="ds-sec"><header><h2>Progress & assessment</h2></header>
        <div class="ds-grid"><div class="ds-demo"><span class="eyebrow">Module meter</span><div class="meter">${['done', 'prog', 'lock', 'lock', 'lock'].map((c, i) => `<div class="seg-cell ${c}">${c === 'prog' ? '<i style="width:87%"></i>' : '<i></i>'}</div>`).join('')}</div><div class="bar"><i style="width:62%"></i></div><div class="bar ok thin"><i style="width:100%"></i></div></div>
        <div class="ds-demo"><span class="eyebrow">Score breakdown</span><div class="weights">${[['KNOW', 30, 27], ['AR', 40, 36], ['PROC', 20, 18], ['TIME', 10, 8]].map(([l, m, g]) => `<div style="flex:${m}"><i style="width:${g / m * 100}%"></i><span>${l} ${g}/${m}</span></div>`).join('')}</div><div class="total"><span class="disp d-l">89 / 100</span><span class="pill ok">${ic('check')}Pass</span></div></div>
        <div class="ds-demo"><span class="eyebrow">Answer states</span><button class="q-opt right"><span class="k">A</span><span>CO₂</span>${ic('check', 'c-green')}</button><button class="q-opt wrong"><span class="k">B</span><span>Water</span>${ic('x', 'c-red')}</button></div></div></section>

      <section class="ds-sec"><header><h2>AR HUD</h2><p>Thin technical lines, translucent dark surfaces, state colour on markers. Only what the worker needs right now.</p></header>
        <div class="ds-grid"><div class="hud-demo">
          <div class="anc crit passive" style="left:30%;top:40%;--w:90px;--h:90px"><div class="box"><i></i><i></i><i></i><i></i></div><div class="lab">${ic('fire')}<span>Electrical fire</span><em>4.2 m</em></div></div>
          <div class="anc ok passive" style="left:76%;top:40%;--w:70px;--h:100px"><div class="box"><i></i><i></i><i></i><i></i></div><div class="lab">${ic('exit')}<span>Exit B</span><em>38 m</em></div></div>
          <div class="reticle hot" style="top:40%;left:52%;width:64px;height:64px"><svg viewBox="-40 -40 80 80"><circle r="30" fill="none" stroke="currentColor" stroke-opacity=".35"/><circle r="30" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="188.5" stroke-dashoffset="70" transform="rotate(-90)"/><path d="M-40 0h12M28 0h12M0-40v12M0 28v12" stroke="currentColor" stroke-width="2"/></svg></div>
          <svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true"><ellipse cx="120" cy="250" rx="100" ry="22" fill="rgba(239,124,34,.12)" stroke="#EF7C22" stroke-width="2" stroke-dasharray="8 6"/>${[0, 1, 2, 3].map(i => `<path class="chev" style="animation-delay:${i * .15}s" transform="translate(${210 + i * 30} ${270 - i * 20}) rotate(56) scale(${1 - i * .15})" d="M-14 6L0-6L14 6" fill="none" stroke="#45B974" stroke-width="5" stroke-linecap="round"/>`).join('')}</svg>
          <div class="hud-box objective" style="position:absolute;left:10px;right:10px;top:10px"><div><div class="ot">OBJECTIVE 01 · IDENTIFY HAZARD</div><div class="op">Identify the source of the fire.</div></div><span class="listen">${ic('speaker')}</span></div>
        </div>
        <div class="ds-demo" style="background:#050607"><span class="eyebrow">Feedback sheets</span>
          <div class="hud-box ar-sheet ok" style="animation:none"><div class="fb-head"><span class="mk ok">${ic('check')}</span><div><div class="ft c-green">✓ Hazard identified</div><div class="fs">Electrical fire · 415 V</div></div></div></div>
          <div class="hud-box ar-sheet bad" style="animation:none"><div class="fb-head"><span class="mk bad" style="animation:none">${ic('x')}</span><div><div class="ft c-red">✕ Incorrect</div><div class="fs">Water · conducts electricity</div></div></div></div>
          <div class="gasmeter"><div class="s"><span>O₂ %</span><b>20.9</b></div><div class="d"><span>H₂S ppm</span><b>38</b></div><div class="w"><span>CO ppm</span><b>42</b></div><div class="w"><span>LEL %</span><b>6</b></div></div></div></div></section>

      <section class="ds-sec"><header><h2>Alerts, toasts & dialogs</h2></header>
        <div class="ds-grid"><div class="ds-demo"><div class="banner crit">${ic('octa')}<div><b>42 certificates expired</b><p>Remove from hazardous tasks until renewed.</p></div></div><div class="banner warn">${ic('clock')}<div><b>Renewal due in 18 days</b><p>Book a refresher with your safety officer.</p></div></div><div class="banner info">${ic('info')}<div><b>Information</b><p>Neutral system messages.</p></div></div></div>
        <div class="ds-demo"><span class="eyebrow">Toasts & modal</span><div class="ds-row"><button class="btn btn-secondary btn-sm" data-ds="toast-ok">Sync toast</button><button class="btn btn-secondary btn-sm" data-ds="toast-warn">Warning toast</button><button class="btn btn-secondary btn-sm" data-ds="modal">Open modal</button></div>
          <span class="eyebrow" style="margin-top:8px">Tooltip</span><span class="chip" title="Certificates are valid for 12 months" style="width:max-content">${ic('info')}Hover for tooltip</span></div></div></section>

      <section class="ds-sec"><header><h2>Certificate & verification</h2></header>
        <div class="ds-grid"><div>${certPaper({ id: 'JH-FR-2026-00421', mod: 'fire', worker: 'Rahul Kumar', wid: 'JH-DHN-04821', score: 89, issued: '26 Sep 2026', expires: '26 Sep 2027', status: 'valid' })}</div>
        <div class="ds-demo"><span class="eyebrow">QR scanner frame</span><div class="scanner" style="height:260px"><div class="frame"><i></i><i></i><i></i><i></i><div class="line"></div></div></div>
          <div class="verdict ok"><div class="vh">${ic('check')}<div><b>✓ Certificate verified</b><span>Signature valid · not revoked</span></div></div></div></div></div></section>

      <section class="ds-sec"><header><h2>Navigation</h2></header>
        <div class="ds-grid"><div class="ds-demo"><span class="eyebrow">Worker bottom navigation</span><div class="bnav" style="border:1px solid var(--line)">${[['home', 'Home', true], ['helmet', 'Training'], ['cert', 'Certificates'], ['user', 'Profile']].map(([i, l, a]) => `<button aria-current="${!!a}">${ic(i)}<span>${l}</span></button>`).join('')}</div>
          <span class="eyebrow">Supervisor</span><div class="bnav" style="border:1px solid var(--line)">${[['qr', 'Verify', true], ['users', 'Workers'], ['cert', 'Certifications'], ['shield', 'Compliance']].map(([i, l, a]) => `<button aria-current="${!!a}">${ic(i)}<span>${l}</span></button>`).join('')}</div></div>
        <div class="ds-demo"><span class="eyebrow">Admin sidebar</span><div class="a-side" style="border:1px solid var(--line);padding:8px">${Admin.nav.slice(0, 6).map(([k, i, l, c], j) => `<button aria-current="${j === 0}">${ic(i)}<span>${l}</span>${c ? `<span class="count">${c}</span>` : ''}</button>`).join('')}</div></div></div></section>

      <section class="ds-sec"><header><h2>Accessibility rules</h2></header>
        <div class="q-list">${[['Touch targets', '≥ 56 px on worker screens, ≥ 44 px everywhere else.'], ['Contrast', 'Off-white on graphite; state colours checked on dark panels.'], ['Not colour alone', 'Every state has an icon and a word.'], ['Minimal reading', 'Icon + short text + visual feedback + optional voice.'], ['Languages', 'English, Hindi, Santali in Ol Chiki — text and voice.'], ['Motion', 'Short, functional animations; reduced-motion respected.']].map(([b, s]) => `<div><b>${b}</b><span>${s}</span></div>`).join('')}</div></section>
    </div>`;
    st.onclick = e => {
      const b = e.target.closest('[data-ds]'); if (!b) return;
      if (b.dataset.ds === 'toast-ok') toast('✓ 3 records synchronized', 'Results are now on the compliance server.', 'ok');
      if (b.dataset.ds === 'toast-warn') toast('Renewal due', 'Site Induction expires in 18 days.', 'warn');
      if (b.dataset.ds === 'modal') {
        const el = document.createElement('div'); el.className = 'page-scrim';
        el.innerHTML = `<div class="modal" role="dialog" aria-label="Leave simulation"><h2 class="disp d-m">Leave simulation?</h2><p class="t2">This practical session won't be saved. You'll restart from Mission 1.</p><div class="btn-row"><button class="btn btn-secondary" data-close>Stay</button><button class="btn btn-danger" data-close>Leave</button></div></div>`;
        el.addEventListener('click', ev => { if (ev.target === el || ev.target.closest('[data-close]')) el.remove(); });
        document.body.appendChild(el);
      }
    };
  }
};

/* ============================ BOOT ============================ */
setLang(S.lang);
{ const h = location.hash.slice(1); if (['worker', 'supervisor', 'admin', 'system'].includes(h)) S.mode = h; }
Shell.init();
