'use strict';
/* =================================================================
   AR ENGINE — camera-view simulation with spatial anchors, reticle
   dwell detection, mission state machine and competency logging.
   Drag (or use ◀ ▶ / arrow keys) to "move the phone".
   ================================================================= */
Object.assign(ICONS, {
  mask: '<path d="M5 9c0-3 3-5 7-5s7 2 7 5v3c0 4-3 7-7 7s-7-3-7-7z"/><circle cx="8.5" cy="14.5" r="2"/><circle cx="15.5" cy="14.5" r="2"/><path d="M10 9h4"/>',
  boot: '<path d="M6 3h6v8l6 3c1.2.6 2 1.6 2 3v3H6z"/><path d="M6 17h14"/>',
  goggles: '<path d="M3 10h18v4a3 3 0 0 1-3 3h-2l-2-2h-4l-2 2H6a3 3 0 0 1-3-3z"/><path d="M3 10l2-3h14l2 3"/>',
  cmask: '<path d="M5 8h14v5a7 5 0 0 1-14 0z"/><path d="M2 9h3M19 9h3M8 11h8M8 14h8"/>',
  sandal: '<path d="M8 3c3 0 5 3 5 8v8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V8"/><path d="M7 9h6M7 13h6"/>',
  buds: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1"/><rect x="17" y="14" width="4" height="6" rx="1"/>'
});

const PPE_ITEMS = [
  { k: 'helmet', l: 'Helmet', i: 'helmet', req: true },
  { k: 'resp', l: 'Respiratory protection (SCBA)', i: 'mask', req: true },
  { k: 'gloves', l: 'Gloves', i: 'hand', req: true },
  { k: 'boots', l: 'Safety footwear', i: 'boot', req: true },
  { k: 'eye', l: 'Eye protection', i: 'goggles', req: true },
  { k: 'cotton', l: 'Cotton face mask', i: 'cmask', why: 'A cotton mask does not filter toxic gas.', viol: true },
  { k: 'sandals', l: 'Sandals', i: 'sandal', why: 'Sandals give no toe or sole protection.' },
  { k: 'buds', l: 'Music earphones', i: 'buds', why: 'Earphones block alarms and radio calls.' }
];

const AR = {
  on: false,
  markup(mod) {
    const c = MOD_CONTENT[mod];
    return `<div class="ar" id="ar">
      <div class="ar-vp" id="ar-vp"><div class="ar-world" id="ar-world"><div class="scene-host" id="ar-scene"></div><svg class="overlay" id="ar-ov" viewBox="0 0 1800 800" preserveAspectRatio="none"></svg><div id="ar-anc" class="anc-layer"></div></div></div>
      <div class="ar-fx"></div><div id="ar-crit"></div>
      <div class="reticle" id="ar-ret"><svg viewBox="-40 -40 80 80"><circle r="30" fill="none" stroke="currentColor" stroke-opacity=".35" stroke-width="1"/><circle class="prog" id="ar-ring" r="30" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="188.5" stroke-dashoffset="188.5" transform="rotate(-90)"/><path d="M-40 0h12M28 0h12M0-40v12M0 28v12" stroke="currentColor" stroke-width="2"/><circle r="2.5" fill="currentColor"/></svg></div>
      <button class="pan-btn l" data-pan="-1" aria-label="Look left">${ic('chevL')}</button><button class="pan-btn r" data-pan="1" aria-label="Look right">${ic('chevR')}</button>
      <div class="edge-hint" id="ar-hint" hidden></div>
      <div class="hud hud-top">
        <div class="hud-bar"><button class="hud-box x" data-act="ar-exit" aria-label="Exit simulation">${ic('x')}</button><div class="hud-box mod">${ic(mod === 'fire' ? 'fire' : 'gas')}<span>${c.hud}</span></div><div class="hud-box"><span id="ar-mis">MISSION 1 / ${c.missions}</span></div><div class="hud-box tm" id="ar-tm">00:00</div></div>
        <div class="hud-box objective"><div><div class="ot" id="ar-ot"></div><div class="op" id="ar-op"></div></div><button class="listen" id="ar-listen" data-speak="" aria-label="${esc(t('listen'))}">${ic('speaker')}</button></div>
        <div id="ar-extra" style="display:flex;flex-direction:column;gap:6px"></div>
      </div>
      <div class="hud hud-bottom"><div id="ar-sheet"></div><div class="hud-box track"><span class="row trk" style="gap:6px">${ic('target')}<span>TRACKING <b>● STABLE</b> · 6DoF · 184 lx</span></span><span class="pips" id="ar-pips"></span></div></div>
    </div>`;
  },

  start(mod, host) {
    this.stop();
    const s = this;
    Object.assign(s, {
      on: true, mod, host, root: $('#ar', host), vp: $('#ar-vp', host), world: $('#ar-world', host), ov: $('#ar-ov', host), anc: $('#ar-anc', host),
      ret: $('#ar-ret', host), ring: $('#ar-ring', host), hintEl: $('#ar-hint', host), sheetEl: $('#ar-sheet', host), extra: $('#ar-extra', host),
      off: 0, offTarget: null, targets: [], hotT: null, lockT: 0, detect: true, res: {}, t0: performance.now(), lastT: performance.now(),
      variant: Math.random() < .5 ? 'A' : 'B', mi: -1, btns: [], solve: null, evac: 0, frozen: null, hold: null, gas: null, hintSide: null, tms: [],
      total: mod === 'fire' ? 4 : 5
    });
    s.setScene(mod === 'fire' ? sceneFire(s.variant) : sceneGas());
    s.layout();
    s.ro = new ResizeObserver(() => s.layout()); s.ro.observe(s.vp);
    s.bind();
    s.timer = setInterval(() => { const el = $('#ar-tm'); if (el) el.textContent = mmss(s.frozen ?? s.elapsed()); }, 250);
    s.tick = s._tick.bind(s);
    s.raf = requestAnimationFrame(s.tick);
    s.mission(0);
  },
  stop() {
    if (!this.on) return;
    this.on = false;
    cancelAnimationFrame(this.raf); clearInterval(this.timer);
    (this.tms || []).forEach(clearTimeout);
    this.ro && this.ro.disconnect();
    document.removeEventListener('keydown', this.key);
    try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) { /* no tts */ }
  },
  later(fn, ms) { this.tms.push(setTimeout(() => { if (this.on) fn(); }, ms)); },
  elapsed() { return (performance.now() - this.t0) / 1000; },
  haptic(p) { try { if (S.haptics && navigator.vibrate) navigator.vibrate(p); } catch (e) { /* unsupported */ } },
  setScene(svg) { $('#ar-scene', this.root).innerHTML = svg; },
  layout() {
    this.vpW = this.vp.clientWidth; this.vpH = this.vp.clientHeight || 700;
    this.k = this.vpH / 800; this.worldW = 1800 * this.k;
    this.world.style.width = this.worldW + 'px';
    this.maxOff = Math.max(0, this.worldW - this.vpW);
    this.root.style.setProperty('--arh', this.vpH + 'px');
    this.placeAnchors();
  },
  lookAt(x) { this.offTarget = clamp(x * this.k - this.vpW / 2, 0, this.maxOff); },

  bind() {
    const s = this, vp = s.vp;
    vp.addEventListener('pointerdown', e => {
      s.dragging = true; s.dx0 = e.clientX; s.off0 = s.off; s.moved = false; s.downAnc = e.target.closest('.anc');
      try { vp.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
      vp.classList.add('drag'); s.offTarget = null;
    });
    vp.addEventListener('pointermove', e => { if (!s.dragging) return; const dx = e.clientX - s.dx0; if (Math.abs(dx) > 6) s.moved = true; s.off = clamp(s.off0 - dx * 1.15, 0, s.maxOff); });
    const up = () => {
      if (!s.dragging) return;
      s.dragging = false; vp.classList.remove('drag');
      if (!s.moved && s.downAnc) {
        const tg = s.targets[+s.downAnc.dataset.ti];
        if (tg && !tg.passive && !tg.done && !tg.fired && s.detect) { tg.fired = true; s.lookAt(tg.x); tg.onLock && tg.onLock(tg); }
      }
    };
    vp.addEventListener('pointerup', up); vp.addEventListener('pointercancel', up);
    s.root.addEventListener('click', e => {
      const b = e.target.closest('[data-arbtn]');
      if (b) { const fn = s.btns[+b.dataset.arbtn]; if (fn) fn(b); return; }
      const p = e.target.closest('[data-pan]');
      if (p) s.offTarget = clamp((s.offTarget ?? s.off) + (+p.dataset.pan) * s.vpW * .55, 0, s.maxOff);
    });
    s.key = e => {
      if (!s.on || S.mode !== 'worker') return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { s.offTarget = clamp((s.offTarget ?? s.off) + (e.key === 'ArrowLeft' ? -1 : 1) * s.vpW * .4, 0, s.maxOff); e.preventDefault(); }
    };
    document.addEventListener('keydown', s.key);
  },

  _tick(now) {
    if (!this.on) return;
    const dt = Math.min(.1, (now - this.lastT) / 1000); this.lastT = now;
    if (this.offTarget != null && !this.dragging) {
      this.off += (this.offTarget - this.off) * .14;
      if (Math.abs(this.offTarget - this.off) < 1) { this.off = this.offTarget; this.offTarget = null; }
    }
    this.off = clamp(this.off, 0, this.maxOff);
    const sx = Math.sin(now / 900) * 2, sy = Math.cos(now / 1100) * 1.5;
    this.world.style.transform = `translate3d(${(-this.off + sx).toFixed(1)}px,${sy.toFixed(1)}px,0)`;
    const cx = this.off + this.vpW / 2;

    let hot = null;
    if (this.detect) {
      for (const tg of this.targets) {
        if (tg.passive || tg.done || tg.fired) continue;
        const tol = Math.max(34, (tg.w || 90) * this.k * .5);
        if (Math.abs(tg.x * this.k - cx) < tol) { hot = tg; break; }
      }
    }
    if (hot && hot === this.hotT) this.lockT += dt;
    else { this.hotT = hot; this.lockT = 0; this.targets.forEach(tg => tg.el && tg.el.classList.toggle('hot', tg === hot)); }
    const p = hot ? clamp(this.lockT / (hot.dwell || 1), 0, 1) : 0;
    this.ring.style.strokeDashoffset = (188.5 * (1 - p)).toFixed(1);
    this.ret.classList.toggle('hot', !!hot);
    if (hot && p >= 1 && !hot.fired) {
      hot.fired = true; this.ret.classList.add('lock'); this.later(() => this.ret.classList.remove('lock'), 700);
      this.haptic(30); hot.onLock && hot.onLock(hot);
    }

    // extinguisher discharge
    if (this.hold && !this.hold.finished) {
      const aimed = Math.abs(900 * this.k - cx) < 130 * this.k;
      const st = $('#ar-aim');
      if (st) { st.textContent = aimed ? '● AIM: ON TARGET' : '○ AIM AT THE FIRE'; st.style.color = aimed ? 'var(--green)' : 'var(--yellow)'; }
      if (this.hold.down && aimed) this.hold.p = Math.min(1, this.hold.p + dt / 2.4);
      this.setDischarge(this.hold.p, this.hold.down && aimed);
      if (this.hold.p >= 1) this.hold.finish();
    }
    // live gas readings by proximity to the leak
    if (this.gas && this.gas.live) {
      const f = 1 - Math.min(1, Math.abs(1060 * this.k - cx) / (900 * this.k));
      this.gas.v = { o2: 20.9 - f * 1.8, h2s: 3 + f * 35, co: 4 + f * 38, lel: 1 + f * 5 };
      if (!this.gas.last || now - this.gas.last > 250) { this.gas.last = now; this.drawGas(); }
    }
    // off-screen objective hint
    const pr = this.targets.find(tg => tg.primary && !tg.done && !tg.fired);
    let side = null;
    if (pr && now - (this.mStart || 0) > 4000 && this.detect) { const px = pr.x * this.k - this.off; side = px < 0 ? 'l' : px > this.vpW ? 'r' : null; }
    if (side !== this.hintSide) {
      this.hintSide = side;
      if (!side) this.hintEl.hidden = true;
      else { this.hintEl.hidden = false; this.hintEl.className = 'edge-hint ' + side; this.hintEl.innerHTML = side === 'l' ? ic('chevL') + esc(pr.hint || 'LOOK') : esc(pr.hint || 'LOOK') + ic('chevR'); }
    }
    this.raf = requestAnimationFrame(this.tick);
  },

  /* ---------- anchors ---------- */
  setTargets(list) {
    this.targets = list; this.hotT = null; this.lockT = 0; this.mStart = performance.now();
    this.anc.innerHTML = list.map((tg, i) => `<div class="anc ${tg.tone || 'dim'} ${tg.passive ? 'passive' : ''}" data-ti="${i}">${tg.nobox ? '' : '<div class="box"><i></i><i></i><i></i><i></i></div>'}<div class="lab">${this.labHTML(tg)}</div></div>`).join('');
    list.forEach((tg, i) => { tg.el = this.anc.children[i]; });
    this.placeAnchors();
  },
  labHTML: tg => `${tg.icon ? ic(tg.icon) : ''}<span>${esc(tg.label)}</span>${tg.dist ? `<em>${esc(tg.dist)}</em>` : ''}`,
  updateTarget(tg, o) {
    Object.assign(tg, o);
    if (!tg.el) return;
    tg.el.className = `anc ${tg.tone || 'dim'} ${tg.passive ? 'passive' : ''}`;
    tg.el.querySelector('.lab').innerHTML = this.labHTML(tg);
  },
  placeAnchors() {
    for (const tg of this.targets || []) {
      if (!tg.el) continue;
      tg.el.style.left = tg.x * this.k + 'px'; tg.el.style.top = tg.y * this.k + 'px';
      tg.el.style.setProperty('--w', (tg.w || 90) * this.k + 'px'); tg.el.style.setProperty('--h', (tg.h || 90) * this.k + 'px');
    }
  },

  /* ---------- HUD ---------- */
  mission(i) {
    this.mi = i;
    $('#ar-mis').textContent = `MISSION ${i + 1} / ${this.total}`;
    $('#ar-pips').innerHTML = Array.from({ length: this.total }, (_, j) => `<i class="${j < i ? 'done' : j === i ? 'now' : ''}"></i>`).join('');
    this.sheet(''); this.detect = true;
    (this.mod === 'fire' ? FIRE_M : GAS_M)[i].call(this);
    Shell.updateSide();
  },
  setPrompt(ot, op) {
    $('#ar-ot').textContent = ot;
    $('#ar-op').textContent = L(op);
    $('#ar-listen').dataset.speak = L(op);
  },
  bi(fn) { this.btns.push(fn); return this.btns.length - 1; },
  btn(label, fn, cls = 'btn-primary', icon) { return `<button class="btn ${cls}" data-arbtn="${this.bi(fn)}">${icon ? ic(icon) : ''}${esc(label)}</button>`; },
  sheet(html, tone = '', detect = false) {
    this.sheetEl.innerHTML = html ? `<div class="hud-box ar-sheet ${tone}">${html}</div>` : '';
    this.detect = !html || detect;
  },
  feedback({ tone, title, sub, text, extra = '', btns = [] }) {
    const mk = { ok: 'check', bad: 'x', warn: 'warn' }[tone];
    const col = { ok: 'c-green', bad: 'c-red', warn: 'c-orange' }[tone];
    const primary = btns[0];
    this.solve = primary ? primary.fn : null;
    this.haptic(tone === 'ok' ? 25 : [60, 40, 60]);
    this.sheet(`<div class="fb-head"><span class="mk ${tone}">${ic(mk)}</span><div><div class="ft ${col}">${esc(title)}</div>${sub ? `<div class="fs">${esc(sub)}</div>` : ''}</div></div>
      ${text ? `<p class="fb-text">${esc(text)}</p>` : ''}${extra}
      <div class="btn-row">${text ? `<button class="listen" style="flex:0 0 auto;height:56px" data-speak="${esc(title + '. ' + text)}" aria-label="${esc(t('listen'))}">${ic('speaker')}</button>` : ''}${btns.map((b, i) => this.btn(b.label, b.fn, b.cls || (i ? 'btn-secondary' : tone === 'ok' ? 'btn-primary' : 'btn-secondary'), b.icon)).join('')}</div>`,
      tone === 'ok' ? 'ok' : tone === 'bad' ? 'bad' : 'warn');
  },
  attempt(key, label, ok, o = {}) {
    const r = this.res[key] || (this.res[key] = { label, tries: 0, viol: 0, done: false, reasons: [] });
    if (r.done) return;
    r.tries++;
    if (o.viol) r.viol++;
    if (!ok && o.why) r.reasons.push({ why: o.why, viol: !!o.viol });
    if (ok) r.done = true;
  },
  skip() { if (this.on && this.solve) this.solve(); },
  confirmExit() {
    const el = document.createElement('div');
    el.className = 'scrim center';
    el.innerHTML = `<div class="modal" role="dialog" aria-label="Leave simulation"><h2 class="disp d-m">Leave simulation?</h2><p class="t2">This practical session won't be saved. You'll restart from Mission 1.</p><div class="btn-row"><button class="btn btn-secondary" data-x="stay">Stay</button><button class="btn btn-danger" data-x="leave">Leave</button></div></div>`;
    el.addEventListener('click', e => { const b = e.target.closest('[data-x]'); if (!b) return; el.remove(); if (b.dataset.x === 'leave') W.back(); });
    this.root.appendChild(el);
  },
  complete(headline) {
    const s = this;
    s.frozen = s.elapsed(); s.detect = false;
    const keys = Object.keys(s.res);
    const correct = keys.filter(k => s.res[k].done && s.res[k].tries === 1).length;
    const viol = keys.reduce((a, k) => a + s.res[k].viol, 0);
    S.lastResult = { mod: s.mod, elapsed: s.frozen, res: s.res, evac: s.evac };
    if (S.modules[s.mod].status !== 'done') S.modules[s.mod].progress = Math.max(S.modules[s.mod].progress || 0, 95);
    $('#ar-pips').innerHTML = Array.from({ length: s.total }, () => '<i class="done"></i>').join('');
    const stat = (k, v, cls = '') => `<div style="padding:10px;border:1px solid var(--hud-line);border-radius:3px"><div class="eyebrow" style="font-size:9.5px">${k}</div><div class="disp d-m tnum ${cls}" style="margin-top:6px">${v}</div></div>`;
    s.solve = go;
    function go() { WS.assess.state = null; W.go('assess', { mod: s.mod }, { replace: true }); }
    s.haptic([30, 60, 30]);
    s.sheet(`<div class="fb-head"><span class="mk ok">${ic('check')}</span><div><div class="ft c-green">Mission complete</div><div class="fs">${esc(headline)}</div></div></div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">${stat('Response time', mmss(s.frozen))}${stat('Correct actions', `${correct} / ${keys.length}`, correct === keys.length ? 'c-green' : 'c-yellow')}${stat('Safety violations', viol, viol ? 'c-red' : 'c-green')}</div>
      <p class="small t2">Practical actions are recorded on the phone${S.online ? ' and synced.' : ' and will sync when the network returns.'}</p>
      ${s.btn('Continue to assessment', go, 'btn-primary', 'arrowR')}`, 'ok');
  },

  /* ---------- fire helpers ---------- */
  setDischarge(p, spraying) {
    const fg = $('.fire-grp', this.root);
    if (fg) { fg.style.transform = `scale(${(1 - p * .92).toFixed(3)})`; fg.style.opacity = (1 - p * .8).toFixed(2); }
    const co = $('#co2', this.root); if (co) co.style.opacity = spraying ? .85 : 0;
    const f = $('#ar-hold .fill'); if (f) f.style.width = (p * 100).toFixed(1) + '%';
    $$('.pass-steps div', this.root).forEach((d, i) => d.classList.toggle('on', p > [0, .2, .45, .75][i] || (i === 0 && this.hold && this.hold.pulled)));
  },
  plan(sel, state) {
    const v = this.variant;
    const F = v === 'A' ? [192, 62] : [215, 160];
    const R = {
      r1: v === 'A' ? '70,150 130,110 240,72 300,70 312,70 312,232 296,232' : '70,150 100,60 250,40 300,48 312,48 312,232 296,232',
      r2: '70,150 120,178 250,178 251,190 251,232 280,232',
      r3: '70,150 40,112 12,112'
    };
    const col = k => sel !== k ? '#6b737b' : state === 'ok' ? '#45B974' : '#E4493D';
    return `<svg class="plan" viewBox="0 0 320 250" aria-label="Evacuation floor plan">
      <defs><pattern id="pg" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="rgba(255,255,255,.05)"/></pattern></defs>
      <rect width="320" height="250" fill="url(#pg)"/>
      <path d="M10 10h290v50M300 80v110H262M240 190H10v-70M10 104V10" fill="none" stroke="#9aa2aa" stroke-width="2.5"/>
      <rect x="28" y="28" width="64" height="12" fill="#2f353b"/><rect x="28" y="52" width="64" height="12" fill="#2f353b"/><text x="30" y="84" fill="#858E97" font-family="IBM Plex Mono,monospace" font-size="8">RACKS</text>
      <rect x="170" y="16" width="46" height="16" fill="#3a4148"/><text x="173" y="27" fill="#B9BEC3" font-family="IBM Plex Mono,monospace" font-size="8">MCC-3</text>
      <circle cx="${F[0]}" cy="${F[1]}" r="48" fill="rgba(239,124,34,.14)" stroke="#EF7C22" stroke-width="1.5" stroke-dasharray="4 3"/>
      <text x="${F[0]}" y="${F[1] + 62}" fill="#EF7C22" font-family="IBM Plex Mono,monospace" font-size="8" text-anchor="middle">HAZARD ZONE</text>
      <path d="M${F[0]} ${F[1] + 10}c-8 0-11-6-9-12 2-5 5-6 4-12 5 3 6 7 6 10 2-2 3-4 2-7 5 4 7 9 6 14-1 4-4 7-9 7z" fill="#EF7C22"/>
      <text x="${F[0] + 12}" y="${F[1] + 2}" fill="#EF7C22" font-family="IBM Plex Mono,monospace" font-size="8" font-weight="600">FIRE</text>
      <rect x="298" y="58" width="6" height="24" fill="#45B974"/><text x="262" y="96" fill="#45B974" font-family="IBM Plex Mono,monospace" font-size="8" font-weight="600">EXIT A</text>
      <rect x="240" y="187" width="22" height="6" fill="#45B974"/><text x="232" y="206" fill="#45B974" font-family="IBM Plex Mono,monospace" font-size="8" font-weight="600">EXIT B</text>
      <rect x="7" y="104" width="6" height="16" fill="#858E97"/><text x="16" y="132" fill="#858E97" font-family="IBM Plex Mono,monospace" font-size="8">STORE (NO EXIT)</text>
      <rect x="282" y="222" width="30" height="20" fill="none" stroke="#45B974" stroke-width="1.5"/><text x="286" y="235" fill="#45B974" font-family="IBM Plex Mono,monospace" font-size="7.5" font-weight="600">AP-02</text>
      ${['r1', 'r2', 'r3'].map((k, i) => `<g data-arbtn="${this.bi(() => this.pickRoute(k))}" style="cursor:pointer"><polyline points="${R[k]}" fill="none" stroke="transparent" stroke-width="16"/><polyline points="${R[k]}" fill="none" stroke="${col(k)}" stroke-width="${sel === k ? 3.5 : 2}" stroke-dasharray="${sel === k && state === 'ok' ? '10 6' : '5 4'}" class="${sel === k && state === 'ok' ? 'dashflow' : ''}" stroke-linejoin="round"/>
        <g transform="translate(${R[k].split(' ')[2].split(',').map(Number).join(',')})"><circle r="8" fill="#101316" stroke="${col(k)}" stroke-width="1.5"/><text y="3" fill="#EDEAE3" font-family="IBM Plex Mono,monospace" font-size="9" text-anchor="middle" font-weight="600">${i + 1}</text></g></g>`).join('')}
      <circle cx="70" cy="150" r="7" fill="#F2C230"/><circle cx="70" cy="150" r="12" fill="none" stroke="#F2C230" stroke-width="1" opacity=".6"/>
      <text x="44" y="172" fill="#F2C230" font-family="IBM Plex Mono,monospace" font-size="8" font-weight="600">YOU ARE HERE</text>
      <text x="12" y="246" fill="#858E97" font-family="IBM Plex Mono,monospace" font-size="7">SCENARIO ${v} · N↑</text>
    </svg>`;
  },
  routeInfo(k) {
    const v = this.variant, safe = v === 'A' ? 'r2' : 'r1';
    return {
      safe: k === safe, dead: k === 'r3',
      exit: k === 'r1' ? 'Exit A' : 'Exit B', dist: k === 'r1' ? '34 m' : '38 m',
      why: k === 'r3' ? 'The store room is a dead end — smoke would trap you there.'
        : v === 'A' ? 'This route passes through the hazard zone next to the burning MCC panel. Heat and smoke block Exit A.'
          : 'Burning cable trench near Exit B — this route crosses the hazard zone.'
    };
  },
  showPlan() {
    const s = this;
    s.solve = () => s.pickRoute(s.variant === 'A' ? 'r2' : 'r1');
    s.sheet(`<div class="row between"><span class="disp d-xs">AR floor overlay · choose a route</span><span class="pill info">Scenario ${s.variant}</span></div>
      ${s.plan()}
      <div class="route-opts">${['r1', 'r2', 'r3'].map((k, i) => { const ri = s.routeInfo(k); return `<button data-arbtn="${s.bi(() => s.pickRoute(k))}">Route ${i + 1}<small>${k === 'r3' ? 'via store room' : `via ${ri.exit} · ${ri.dist}`}</small></button>`; }).join('')}</div>`, 'act');
  },
  pickRoute(k) {
    const s = this, ri = s.routeInfo(k);
    if (ri.safe) {
      s.attempt('route', 'Exit & route selection', true);
      s.feedback({ tone: 'ok', title: '✓ Safe evacuation path', sub: `${ri.exit} · ${ri.dist} · assembly point AP-02`, text: L({ en: 'Stay low under the smoke. Walk, do not run. Never use the lift.', hi: 'धुएँ के नीचे झुककर चलें। दौड़ें नहीं, चलें। लिफ़्ट का उपयोग कभी न करें।' }), extra: s.plan(k, 'ok'), btns: [{ label: 'Start evacuation', fn: () => s.mission(3), icon: 'exit' }] });
    } else {
      s.attempt('route', 'Exit & route selection', false, { viol: !ri.dead, why: ri.why });
      s.feedback({ tone: ri.dead ? 'warn' : 'bad', title: '⚠ Unsafe route', sub: k === 'r3' ? 'Dead end' : 'Crosses the hazard zone', text: ri.why, extra: s.plan(k, 'bad'), btns: [{ label: 'Choose another route', fn: () => s.showPlan(), icon: 'route', cls: 'btn-primary' }] });
    }
  },

  /* ---------- gas helpers ---------- */
  drawGas(banner) {
    if (banner !== undefined) this.gas.banner = banner;
    const v = this.gas.v, c3 = (x, w, d) => (x >= d ? 'd' : x >= w ? 'w' : 's');
    const o2 = v.o2 < 18 ? 'd' : v.o2 < 19.5 ? 'w' : 's';
    this.extra.innerHTML = `${this.gas.banner || ''}<div class="gasmeter" aria-label="Gas detector readings"><div class="${o2}"><span>O₂ %</span><b>${v.o2.toFixed(1)}</b></div><div class="${c3(v.h2s, 5, 10)}"><span>H₂S ppm</span><b>${Math.round(v.h2s)}</b></div><div class="${c3(v.co, 25, 50)}"><span>CO ppm</span><b>${Math.round(v.co)}</b></div><div class="${c3(v.lel, 5, 10)}"><span>LEL %</span><b>${Math.round(v.lel)}</b></div></div>`;
  },
  setGasSpread(x) { const g = $('.gas-cloud', this.root); if (g) g.style.transform = `scale(${x})`; },
  critBanner: (txt, tone = 'crit') => `<div class="hud-box" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-color:${tone === 'crit' ? 'var(--red)' : 'var(--orange)'};background:${tone === 'crit' ? 'rgba(120,20,14,.78)' : 'rgba(110,50,8,.75)'}">${ic(tone === 'crit' ? 'siren' : 'warn')}<b style="font:700 17px/1.1 var(--f-disp);letter-spacing:.06em">${txt}</b></div>`,
  avatar(sel) {
    const on = k => sel.has(k) ? '' : 'display:none';
    return `<svg class="avatar" viewBox="0 0 116 220" aria-label="Worker PPE preview">
      <g fill="#3a4148"><circle cx="58" cy="42" r="16"/><rect x="52" y="56" width="12" height="9"/><path d="M34 64h48l6 72H28z"/><rect x="18" y="66" width="13" height="60" rx="6"/><rect x="85" y="66" width="13" height="60" rx="6"/><rect x="36" y="134" width="19" height="64" rx="3"/><rect x="61" y="134" width="19" height="64" rx="3"/></g>
      <path d="M34 64h48l3 30H31z" fill="#EF7C22" opacity=".5"/><path d="M34 80h48" stroke="#d8d2c2" stroke-width="3"/>
      <g style="${on('helmet')}"><path d="M40 38a18 17 0 0 1 36 0z" fill="#F2C230"/><rect x="37" y="36" width="42" height="5" rx="2" fill="#F2C230"/></g>
      <g style="${on('eye')}"><rect x="44" y="40" width="28" height="7" rx="3" fill="#88A9C4" stroke="#0f1113"/></g>
      <g style="${on('resp')}"><path d="M47 48h22v7a11 8 0 0 1-22 0z" fill="#c9ccc7"/><circle cx="49" cy="58" r="4" fill="#5a6166"/><circle cx="67" cy="58" r="4" fill="#5a6166"/><rect x="84" y="70" width="10" height="40" rx="4" fill="#c9ccc7" opacity=".8"/></g>
      <g style="${on('cotton')}"><rect x="47" y="48" width="22" height="11" rx="4" fill="#f4f1ea"/></g>
      <g style="${on('buds')}"><path d="M41 38a17 17 0 0 1 34 0" fill="none" stroke="#e8e5dd" stroke-width="2.5"/></g>
      <g style="${on('gloves')}" fill="#EF7C22"><rect x="16" y="118" width="17" height="18" rx="6"/><rect x="83" y="118" width="17" height="18" rx="6"/></g>
      <g style="${on('boots')}"><path d="M35 184h21v16H30v-6z" fill="#15181a"/><path d="M60 184h21v16H56v-6z" fill="#15181a"/><rect x="30" y="195" width="9" height="5" fill="#F2C230"/><rect x="56" y="195" width="9" height="5" fill="#F2C230"/></g>
      <g style="${on('sandals')}" fill="#8a6a44"><rect x="31" y="197" width="26" height="4"/><rect x="57" y="197" width="26" height="4"/></g>
    </svg>`;
  },
  showPPE(errs = {}) {
    const s = this, sel = s.ppeSel;
    s.solve = () => { s.ppeSel = new Set(PPE_ITEMS.filter(p => p.req).map(p => p.k)); s.checkPPE(); };
    s.sheet(`<div class="row between"><span class="disp d-xs">PPE station · confined space</span><span class="mono small muted">${sel.size} selected</span></div>
      <div class="ppe-wrap">${s.avatar(sel)}<div class="ppe-grid">${PPE_ITEMS.map(p => `<button class="ppe ${errs.bad && errs.bad.includes(p.k) ? 'bad' : errs.miss && errs.miss.includes(p.k) ? 'miss' : ''}" aria-pressed="${sel.has(p.k)}" data-arbtn="${s.bi(() => { sel.has(p.k) ? sel.delete(p.k) : sel.add(p.k); s.showPPE(); })}">${ic(p.i)}<span>${esc(p.l)}</span></button>`).join('')}</div></div>
      ${s.btn('Confirm PPE', () => s.checkPPE(), 'btn-primary', 'shield')}`, 'act');
  },
  checkPPE() {
    const s = this, sel = s.ppeSel;
    const miss = PPE_ITEMS.filter(p => p.req && !sel.has(p.k));
    const bad = PPE_ITEMS.filter(p => !p.req && sel.has(p.k));
    if (!miss.length && !bad.length) {
      s.attempt('ppe', 'PPE selection', true);
      s.feedback({ tone: 'ok', title: 'PPE ready', sub: 'PPE check · 5 / 5', extra: `<div class="checklist">${PPE_ITEMS.filter(p => p.req).map(p => `<div>${ic('check', 'c-green')}${esc(p.l)}</div>`).join('')}</div><div class="mono small">STATUS: <b class="c-green">PPE READY</b></div>`, btns: [{ label: t('cont_btn'), fn: () => s.mission(3) }] });
      return;
    }
    const viol = bad.some(p => p.viol) || miss.some(p => p.k === 'resp');
    const why = [...bad.map(p => p.why), ...(miss.length ? [`Missing: ${miss.map(p => p.l).join(', ')}.`] : [])];
    s.attempt('ppe', 'PPE selection', false, { viol, why: why.join(' ') });
    s.feedback({ tone: 'bad', title: '✕ PPE not safe', sub: `${miss.length} missing · ${bad.length} unsuitable`, text: why.join(' '), btns: [{ label: 'Fix selection', fn: () => s.showPPE({ miss: miss.map(p => p.k), bad: bad.map(p => p.k) }), cls: 'btn-primary' }] });
  },
  buddyPlan() {
    return `<svg class="plan" id="bd-svg" viewBox="0 0 320 230" aria-label="Top view: place your buddy">
      <defs><pattern id="bg" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="rgba(255,255,255,.05)"/></pattern></defs>
      <rect width="320" height="230" fill="url(#bg)"/>
      <circle cx="220" cy="80" r="97" fill="rgba(69,185,116,.08)" stroke="#45B974" stroke-width="1.5" stroke-dasharray="6 4"/>
      <circle cx="220" cy="80" r="58" fill="rgba(239,124,34,.16)" stroke="#EF7C22" stroke-width="1.5" stroke-dasharray="4 3"/>
      <rect x="160" y="60" width="130" height="62" rx="30" fill="#2a3036" stroke="#4a5158"/><text x="248" y="96" fill="#858E97" font-family="IBM Plex Mono,monospace" font-size="8">CS-07</text>
      <circle cx="220" cy="80" r="9" fill="#0a0c0d" stroke="#9aa2aa"/>
      <text x="220" y="36" fill="#EF7C22" font-family="IBM Plex Mono,monospace" font-size="8" text-anchor="middle">HAZARD ZONE · 9 m</text>
      <text x="96" y="30" fill="#45B974" font-family="IBM Plex Mono,monospace" font-size="8" font-weight="600">SAFE COMMUNICATION ZONE</text>
      <text x="96" y="40" fill="#45B974" font-family="IBM Plex Mono,monospace" font-size="7.5">outside hazard · ≤ 15 m · line of sight</text>
      <text x="8" y="16" fill="#858E97" font-family="IBM Plex Mono,monospace" font-size="8">WIND →</text>
      <line id="bd-line" x1="40" y1="195" x2="220" y2="80" stroke="#858E97" stroke-width="1.5" stroke-dasharray="3 4"/>
      <g><circle cx="220" cy="80" r="6" fill="#F2C230"/><text x="232" y="74" fill="#F2C230" font-family="IBM Plex Mono,monospace" font-size="8" font-weight="600">YOU</text></g>
      <g id="bd" transform="translate(40 195)" style="cursor:grab"><circle r="18" fill="transparent"/><circle r="12" fill="#88A9C4" stroke="#EDEAE3" stroke-width="1.5"/><text y="4" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="11" font-weight="700" fill="#0f1113">B</text><text y="26" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="8" font-weight="600" fill="#88A9C4">BUDDY</text></g>
    </svg>`;
  },
  showBuddy() {
    const s = this;
    s.bd = { x: 40, y: 195 };
    s.solve = () => { s.bd = { x: 160, y: 130 }; s.checkBuddy(); };
    s.sheet(`<div class="row between"><span class="disp d-xs">AR top view · drag the buddy</span><span class="mono small" id="bd-d">—</span></div>${s.buddyPlan()}${s.btn('Confirm position', () => s.checkBuddy(), 'btn-primary', 'pin')}`, 'act');
    const svg = $('#bd-svg', s.root), g = $('#bd', svg), line = $('#bd-line', svg), dEl = $('#bd-d', s.root);
    const upd = () => {
      g.setAttribute('transform', `translate(${s.bd.x} ${s.bd.y})`); line.setAttribute('x1', s.bd.x); line.setAttribute('y1', s.bd.y);
      const d = Math.hypot(s.bd.x - 220, s.bd.y - 80), zone = d < 58 ? 'haz' : d > 97 ? 'far' : 'ok';
      line.setAttribute('stroke', zone === 'ok' ? '#45B974' : zone === 'haz' ? '#E4493D' : '#858E97');
      dEl.textContent = `${(d * .155).toFixed(1)} m · ${zone === 'ok' ? 'IN ZONE' : zone === 'haz' ? 'IN HAZARD' : 'OUT OF RANGE'}`;
      dEl.style.color = zone === 'ok' ? 'var(--green)' : zone === 'haz' ? 'var(--red)' : 'var(--muted)';
    };
    upd();
    let drag = false;
    const pt = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const m = svg.getScreenCTM(); return m ? p.matrixTransform(m.inverse()) : p; };
    g.addEventListener('pointerdown', e => { drag = true; try { g.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ } e.stopPropagation(); });
    g.addEventListener('pointermove', e => { if (!drag) return; const p = pt(e); s.bd = { x: clamp(p.x, 12, 308), y: clamp(p.y, 12, 218) }; upd(); });
    g.addEventListener('pointerup', () => { drag = false; });
    svg.addEventListener('click', e => { if (e.target.closest('#bd')) return; const p = pt(e); s.bd = { x: clamp(p.x, 12, 308), y: clamp(p.y, 12, 218) }; upd(); });
  },
  checkBuddy() {
    const s = this, d = Math.hypot(s.bd.x - 220, s.bd.y - 80);
    if (d < 58) { s.attempt('buddy', 'Buddy system', false, { viol: true, why: 'Buddy placed inside the hazard zone.' }); s.feedback({ tone: 'bad', title: '✕ Inside hazard zone', text: 'Your buddy must stay outside the hazard zone — otherwise there are two casualties instead of one.', btns: [{ label: 'Reposition buddy', fn: () => s.showBuddy(), cls: 'btn-primary' }] }); return; }
    if (d > 97) { s.attempt('buddy', 'Buddy system', false, { why: 'Buddy placed out of communication range.' }); s.feedback({ tone: 'bad', title: '✕ Out of range', text: 'Too far — your buddy cannot see you or reach you quickly. Stay within 15 m and in line of sight.', btns: [{ label: 'Reposition buddy', fn: () => s.showBuddy(), cls: 'btn-primary' }] }); return; }
    s.feedback({ tone: 'ok', title: '✓ Buddy position confirmed', sub: `${(d * .155).toFixed(1)} m from entry · line of sight`, text: 'Your buddy stays outside, watches you continuously and can raise the alarm.', btns: [{ label: 'Confirm communication method', fn: () => s.showComm(), icon: 'radio' }] });
  },
  showComm() {
    const s = this;
    s.setPrompt('OBJECTIVE 05 · COMMUNICATION', { en: 'Confirm communication method.', hi: 'संचार का तरीका पुष्टि करें।', sat: 'ᱜᱟᱞᱢᱟᱨᱟᱣ ᱦᱚᱨ ᱴᱷᱤᱠ ᱢᱮ᱾' });
    const opt = (k, i, l, d) => `<button data-arbtn="${s.bi(() => s.pickComm(k))}"><span class="k">${ic(i)}</span><span>${l}<br><small class="mono muted" style="font-weight:500;font-size:11px">${d}</small></span></button>`;
    s.solve = () => s.pickComm('radio');
    s.sheet(`<span class="disp d-xs">How will you and your buddy stay in contact?</span><div class="seq">${opt('radio', 'radio', 'Radio', 'Two-way radio · channel check')}${opt('visual', 'eye', 'Visual', 'Hand signals')}${opt('verbal', 'mic', 'Verbal', 'Calling out')}</div>`, 'act');
  },
  pickComm(k) {
    const s = this;
    if (k === 'radio') {
      s.attempt('buddy', 'Buddy system', true);
      s.feedback({ tone: 'ok', title: '✓ Communication confirmed', sub: 'Radio · channel 4 · check-in every 2 min', text: 'Radio is primary. Agreed hand signals are the backup if the radio fails.', btns: [{ label: t('cont_btn'), fn: () => s.mission(4) }] });
    } else {
      const why = k === 'visual' ? 'Hand signals need constant line of sight and fail in smoke or darkness. Use them only as a backup to a radio.' : 'Calling out fails in plant noise and when wearing a respirator. Use a radio.';
      s.attempt('buddy', 'Buddy system', false, { why });
      s.feedback({ tone: 'warn', title: k === 'visual' ? '⚠ Backup only' : '⚠ Not reliable', text: why, btns: [{ label: 'Choose again', fn: () => s.showComm(), cls: 'btn-primary' }] });
    }
  },
  showSeq(msg) {
    const s = this;
    const O = { alert: ['radio', 'Alert supervisor on the radio'], move: ['exit', 'Move to the safe zone, upwind'], comm: ['users', 'Maintain buddy communication'], hold: ['octa', 'Do not enter the hazard zone — wait for the SCBA rescue team'], rescue: ['hand', 'Enter the space to pull your buddy out'] };
    s.solve = () => s.pickSeq(s.seqOrder[s.seqI]);
    s.sheet(`<div class="row between"><span class="disp d-xs">Tap in the correct order</span><span class="mono small">${s.seqI} / 4</span></div>
      <div class="seq">${s.seqShuffle.map(k => { const di = s.seqOrder.indexOf(k); const done = di > -1 && di < s.seqI; return `<button class="${done ? 'done' : ''} ${msg && msg.k === k ? 'wrong' : ''}" data-arbtn="${s.bi(() => s.pickSeq(k))}" ${done ? 'disabled' : ''}><span class="k">${done ? di + 1 : ic(O[k][0])}</span><span>${O[k][1]}</span></button>`; }).join('')}</div>
      ${msg ? `<div class="row small" style="color:${msg.viol ? 'var(--red)' : 'var(--yellow)'};gap:8px;align-items:flex-start">${ic(msg.viol ? 'octa' : 'warn')}<span>${esc(msg.text)}</span></div>` : ''}`, msg && msg.viol ? 'bad' : 'act');
  },
  pickSeq(k) {
    const s = this, want = s.seqOrder[s.seqI];
    if (k === want) {
      s.seqI++; s.haptic(20);
      if (s.seqI === 4) {
        s.attempt('emergency', 'Emergency response', true);
        s.evac = (performance.now() - s.critAt) / 1000;
        $('#ar-crit', s.root).innerHTML = '';
        s.gas.v = { o2: 20.4, h2s: 2, co: 3, lel: 0 };
        s.drawGas(s.critBanner('YOU ARE IN THE SAFE ZONE · RESCUE TEAM ALERTED', 'haz'));
        s.feedback({ tone: 'ok', title: '✓ Emergency response complete', sub: `Reaction ${mmss(s.evac)} · buddy safe · zone closed`, text: 'You raised the alarm, moved upwind, kept radio contact and kept everyone out of the hazard zone.', btns: [{ label: 'See mission summary', fn: () => s.complete('Gas leak & confined space') }] });
        return;
      }
      s.showSeq();
      return;
    }
    if (k === 'rescue') { s.attempt('emergency', 'Emergency response', false, { viol: true, why: 'Chose to enter the confined space without SCBA.' }); s.haptic([80, 40, 80]); s.showSeq({ k, viol: true, text: 'Never enter without SCBA — most confined-space deaths are would-be rescuers.' }); return; }
    const hint = { alert: 'Raise the alarm first — the supervisor starts the rescue plan.', move: 'Next, get out of danger: move upwind to the safe zone.', comm: 'Keep talking to your buddy so you know their condition.', hold: 'Finally, keep everyone out until the SCBA rescue team arrives.' }[want];
    s.attempt('emergency', 'Emergency response', false, { why: 'Emergency actions were taken out of order.' });
    s.showSeq({ k, text: hint });
  }
};

/* ============================ FIRE MISSIONS ============================ */
const FIRE_M = [
  function () { // 1 · identify hazard
    const s = this;
    s.setPrompt('OBJECTIVE 01 · IDENTIFY HAZARD', { en: 'Identify the source of the fire.', hi: 'आग के स्रोत की पहचान करें।', sat: 'ᱥᱮᱸᱜᱮᱞ ᱚᱠᱟ ᱠᱷᱚᱱ ᱮᱛᱦᱚᱵ ᱮᱱᱟ ᱪᱤᱱᱦᱟᱹᱣ ᱢᱮ᱾' });
    const fire = {
      x: 900, y: 320, w: 200, h: 210, label: 'Heat source?', icon: 'target', primary: true, hint: 'SMOKE', tone: 'dim',
      onLock: tg => {
        s.attempt('hazard', 'Hazard identification', true);
        s.updateTarget(tg, { tone: 'crit', label: 'Electrical fire · MCC-3', dist: '4.2 m', icon: 'fire', done: true, passive: true });
        s.ov.innerHTML = `<ellipse cx="900" cy="640" rx="330" ry="70" fill="rgba(239,124,34,.12)" stroke="#EF7C22" stroke-width="3" stroke-dasharray="14 10" class="dashflow"/><text x="900" y="738" fill="#EF7C22" font-family="IBM Plex Mono,monospace" font-size="18" font-weight="600" text-anchor="middle">HAZARD BOUNDARY · 3 m</text>`;
        s.feedback({ tone: 'ok', title: '✓ Hazard identified', sub: 'Electrical fire · MCC-3 panel · 415 V', text: L({ en: 'Electrical fires require an appropriate non-conductive extinguishing method. Do not touch the panel.', hi: 'बिजली की आग के लिए नॉन-कंडक्टिव (बिजली न चलाने वाला) अग्निशमन तरीका चाहिए। पैनल को न छुएँ।', sat: 'ᱵᱤᱡᱞᱤ ᱥᱮᱸᱜᱮᱞ ᱞᱟᱹᱜᱤᱫ ᱵᱤᱡᱞᱤ ᱵᱟᱝ ᱪᱟᱞᱟᱜ ᱦᱚᱨ ᱞᱟᱹᱠᱛᱤᱜ-ᱟ᱾ ᱯᱮᱱᱮᱞ ᱟᱞᱚᱢ ᱥᱟᱵᱽ ᱟ᱾' }), btns: [{ label: t('cont_btn'), fn: () => s.mission(1) }] });
      }
    };
    s.setTargets([fire, { x: 445, y: 470, w: 150, h: 110, label: 'Storage drums', passive: true, tone: 'dim' }]);
    s.solve = () => { if (!fire.fired) { fire.fired = true; s.lookAt(900); fire.onLock(fire); } };
  },
  function () { // 2 · select + use extinguisher
    const s = this;
    s.setPrompt('OBJECTIVE 03 · SELECT EXTINGUISHER', { en: 'Choose the right extinguisher for this fire.', hi: 'इस आग के लिए सही अग्निशामक चुनें।', sat: 'ᱱᱚᱶᱟ ᱥᱮᱸᱜᱮᱞ ᱞᱟᱹᱜᱤᱫ ᱴᱷᱤᱠ ᱮᱠᱥᱴᱤᱝᱜᱩᱤᱥᱚᱨ ᱵᱟᱪᱷᱟᱣ ᱢᱮ᱾' });
    s.lookAt(740);
    s.setTargets([{ x: 900, y: 320, w: 200, h: 210, label: 'Electrical fire', icon: 'fire', tone: 'crit', passive: true, dist: '4.2 m' }, { x: 578, y: 360, w: 110, h: 150, label: 'Fire point', icon: 'fire', tone: 'info', passive: true, dist: '1.5 m' }]);
    const E = [['co2', 'CO₂', 'Class B · Electrical', '#111'], ['water', 'Water', 'Class A', '#C0322A'], ['foam', 'Foam', 'Class A · B', '#E8D9A8'], ['powder', 'Dry powder', 'Class A · B · C', '#2F5DA8']];
    const show = () => {
      s.solve = () => pick('co2');
      s.sheet(`<div class="row between"><span class="disp d-xs">Fire point · 4 extinguishers</span><span class="mono small muted">Tap one</span></div><div class="ext-grid">${E.map(([k, n, c, b]) => `<button class="ext" data-arbtn="${s.bi(() => pick(k))}">${extSvg(b)}<b>${n}</b><span>${c}</span></button>`).join('')}</div>`, 'act');
    };
    const pick = k => {
      if (k === 'co2') {
        s.attempt('ext', 'Extinguisher selection', true);
        s.feedback({ tone: 'ok', title: '✓ ' + t('correct'), sub: 'CO₂ · Class B · Electrical', text: L({ en: 'CO₂ is suitable for energized electrical equipment. It does not conduct and leaves no residue.', hi: 'CO₂ चालू बिजली उपकरणों के लिए उपयुक्त है। यह बिजली नहीं चलाता और अवशेष नहीं छोड़ता।' }), btns: [{ label: 'Use CO₂ extinguisher', fn: discharge, icon: 'arrowR' }] });
      } else if (k === 'powder') {
        s.attempt('ext', 'Extinguisher selection', false, { why: 'Dry powder chosen — acceptable, but it damages the panel. CO₂ is preferred.' });
        s.feedback({ tone: 'warn', title: '⚠ Not preferred', sub: 'Dry powder · non-conductive', text: 'Dry powder can be used, but it damages the panel and blocks visibility indoors. CO₂ is preferred for energized electrical equipment.', btns: [{ label: 'Choose again', fn: show, cls: 'btn-primary' }] });
      } else {
        const why = k === 'water' ? L({ en: 'Water must not be used on energized electrical equipment. It conducts electricity — risk of electrocution.', hi: 'चालू बिजली उपकरणों पर पानी का उपयोग नहीं करना चाहिए। पानी बिजली चलाता है — करंट लगने का खतरा।' }) : 'Foam is water-based and conducts electricity. Never use it on live electrical equipment.';
        s.attempt('ext', 'Extinguisher selection', false, { viol: true, why: `${k === 'water' ? 'Water' : 'Foam'} selected for an energized electrical fire.` });
        s.feedback({ tone: 'bad', title: '✕ ' + t('incorrect'), sub: `${k === 'water' ? 'Water' : 'Foam'} · conducts electricity`, text: why, btns: [{ label: t('retry'), fn: show, cls: 'btn-primary', icon: 'refresh' }] });
      }
    };
    const discharge = () => {
      s.setPrompt('OBJECTIVE 03 · USE EXTINGUISHER', { en: 'Aim at the base of the fire, then hold to discharge.', hi: 'आग के आधार पर निशाना लगाएँ, फिर दबाकर रखें।', sat: 'ᱥᱮᱸᱜᱮᱞ ᱨᱮᱭᱟᱜ ᱞᱟᱛᱟᱨ ᱥᱮᱫ ᱧᱮᱞ ᱢᱮ, ᱟᱨ ᱛᱷᱤᱨ ᱫᱟᱵᱟᱣ ᱢᱮ᱾' });
      s.lookAt(900);
      s.ov.insertAdjacentHTML('beforeend', `<g id="co2" style="opacity:0;transition:opacity .2s"><defs><filter id="cb"><feGaussianBlur stdDeviation="10"/></filter></defs>${[[900, 700, 70], [900, 600, 90], [900, 480, 120], [900, 400, 140]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * .6}" fill="#e9eef2" opacity=".55" filter="url(#cb)"/>`).join('')}</g>`);
      s.hold = { p: 0, down: false, finished: false, pulled: false };
      s.hold.finish = () => {
        s.hold.finished = true; s.setDischarge(1, false); s.hold.down = false;
        const fg = $('.fire-grp', s.root); if (fg) fg.style.opacity = 0;
        s.feedback({ tone: 'ok', title: '✓ Fire suppressed', sub: 'CO₂ · 9 s discharge · PASS', text: 'Keep watching for re-ignition. Smoke is still spreading — evacuate now.', btns: [{ label: t('cont_btn'), fn: () => { s.hold = null; s.mission(2); } }] });
      };
      s.solve = () => { s.hold.p = 1; s.hold.finish(); };
      s.sheet(`<div class="row between"><span class="disp d-xs">PASS technique</span><span class="mono small" id="ar-aim">○ AIM AT THE FIRE</span></div>
        <div class="pass-steps"><div><b>P</b>Pull pin</div><div><b>A</b>Aim low</div><div><b>S</b>Squeeze</div><div><b>S</b>Sweep</div></div>
        <button class="btn btn-primary btn-block hold" id="ar-hold"><span class="fill"></span>${ic('hand')}Hold to discharge</button>
        <p class="mono small muted">Keep 2 m from the panel. Move the phone to keep the fire in the reticle.</p>`, 'act', false);
      const hb = $('#ar-hold', s.root);
      const dn = e => { e.preventDefault(); s.hold.down = true; s.hold.pulled = true; };
      const upf = () => { if (s.hold) s.hold.down = false; };
      hb.addEventListener('pointerdown', dn); hb.addEventListener('pointerup', upf); hb.addEventListener('pointerleave', upf); hb.addEventListener('pointercancel', upf);
      hb.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); s.hold.down = true; s.hold.pulled = true; } });
      hb.addEventListener('keyup', upf);
    };
    show();
  },
  function () { // 3 · evacuation route
    const s = this;
    s.evacStart = performance.now();
    s.setPrompt('OBJECTIVE 02 + 04 · EVACUATION ROUTE', { en: 'Smoke is spreading. Choose the safe route to the assembly point.', hi: 'धुआँ फैल रहा है। असेंबली पॉइंट तक सुरक्षित रास्ता चुनें।', sat: 'ᱫᱷᱩᱸᱣᱟᱹ ᱯᱟᱥᱱᱟᱣ ᱠᱟᱱᱟ᱾ ᱡᱟᱹᱨᱩᱢ ᱴᱷᱟᱶ ᱥᱮᱱ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱦᱚᱨ ᱵᱟᱪᱷᱟᱣ ᱢᱮ᱾' });
    const A = s.variant === 'A';
    s.setTargets([
      { x: 1200, y: 300, w: 130, h: 250, label: A ? 'Exit A · blocked' : 'Exit A', icon: 'exit', tone: A ? 'haz' : 'info', passive: true, dist: '34 m' },
      { x: 1585, y: 300, w: 140, h: 250, label: A ? 'Exit B' : 'Exit B · smoke', icon: 'exit', tone: A ? 'info' : 'haz', passive: true, dist: '38 m' }
    ]);
    s.showPlan();
  },
  function () { // 4 · follow path + assembly point
    const s = this, A = s.variant === 'A';
    const ex = A ? { x: 1585, l: 'Exit B' } : { x: 1200, l: 'Exit A' };
    s.setPrompt('OBJECTIVE 04 · EVACUATE', { en: `Follow the green path to ${ex.l}.`, hi: `हरे रास्ते पर चलते हुए ${ex.l} तक जाएँ।`, sat: `ᱦᱟᱹᱨᱭᱟᱹᱲ ᱦᱚᱨ ᱯᱟᱧᱡᱟ ᱠᱟᱛᱮ ${ex.l} ᱥᱮᱱ ᱪᱟᱞᱟᱜ ᱢᱮ᱾` });
    const x0 = 820, y0 = 780, x1 = ex.x, y1 = 590, n = 8;
    const ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI + 90;
    const chev = Array.from({ length: n }, (_, i) => { const f = i / (n - 1), x = x0 + (x1 - x0) * f, y = y0 + (y1 - y0) * f, sc = 1.5 - f * .9; return `<path class="chev" style="animation-delay:${(i * .12).toFixed(2)}s" transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(${ang.toFixed(0)}) scale(${sc.toFixed(2)})" d="M-28 12L0-12L28 12" fill="none" stroke="#45B974" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`; }).join('');
    s.ov.innerHTML = s.ov.innerHTML.replace(/<g id="co2"[\s\S]*<\/g>$/, '') + `<g>${chev}</g>`;
    const door = {
      x: ex.x, y: 300, w: 140, h: 250, label: ex.l + ' · safe exit', icon: 'exit', tone: 'ok', primary: true, hint: ex.l.toUpperCase(), dist: A ? '38 m' : '34 m',
      onLock: () => {
        s.attempt('exit', 'Evacuation sequence', true);
        s.evac = (performance.now() - s.evacStart) / 1000;
        s.sheet(''); s.detect = false;
        const fade = document.createElement('div');
        fade.style.cssText = 'position:absolute;inset:0;background:#000;opacity:0;transition:opacity .45s;z-index:3;pointer-events:none';
        s.root.appendChild(fade); requestAnimationFrame(() => { fade.style.opacity = 1; });
        s.later(() => {
          s.setScene(sceneAssembly()); s.ov.innerHTML = `<ellipse cx="1200" cy="640" rx="200" ry="40" fill="rgba(69,185,116,.14)" stroke="#45B974" stroke-width="3" stroke-dasharray="12 8" class="dashflow"/>`;
          s.off = 0; s.offTarget = null;
          s.setPrompt('OBJECTIVE 05 · ASSEMBLY POINT', { en: 'Go to assembly point AP-02.', hi: 'असेंबली पॉइंट AP-02 पर जाएँ।', sat: 'ᱡᱟᱹᱨᱩᱢ ᱴᱷᱟᱶ AP-02 ᱥᱮᱱ ᱪᱟᱞᱟᱜ ᱢᱮ᱾' });
          const ap = {
            x: 1200, y: 330, w: 220, h: 200, label: 'Assembly point AP-02', icon: 'users', tone: 'ok', primary: true, hint: 'AP-02', dist: '22 m',
            onLock: tg => {
              s.updateTarget(tg, { label: 'AP-02 · reached', dist: '0 m', done: true, passive: true });
              const report = () => { s.attempt('assembly', 'Assembly point reporting', true); s.complete('Fire & explosion response'); };
              s.solve = report;
              s.sheet(`<div class="fb-head"><span class="mk ok">${ic('check')}</span><div><div class="ft c-green">✓ Assembly point reached</div><div class="fs">AP-02 · fire warden: S. Hansda</div></div></div>
                <p class="fb-text">Report to the fire warden for the head count. Do not leave until the all-clear.</p>${s.btn('Report present to warden', report, 'btn-primary', 'users')}`, 'ok');
            }
          };
          s.setTargets([ap]); s.detect = true;
          s.solve = () => { if (!ap.fired) { ap.fired = true; s.lookAt(1200); ap.onLock(ap); } };
          fade.style.opacity = 0; s.later(() => fade.remove(), 500);
        }, 520);
      }
    };
    s.setTargets([door, { x: A ? 1200 : 1585, y: 300, w: 130, h: 250, label: A ? 'Exit A · blocked' : 'Exit B · smoke', icon: 'x', tone: 'haz', passive: true }]);
    s.solve = () => { if (!door.fired) { door.fired = true; s.lookAt(ex.x); door.onLock(door); } };
  }
];

/* ============================ GAS MISSIONS ============================ */
const GAS_M = [
  function () { // 1 · detect hazard zone + safe boundary
    const s = this;
    s.gas = { live: true, v: { o2: 20.9, h2s: 3, co: 4, lel: 1 } };
    s.setGasSpread(.8); s.drawGas('');
    s.setPrompt('OBJECTIVE 01 · DETECT HAZARD ZONE', { en: 'Your gas detector is alarming. Find the source.', hi: 'आपका गैस डिटेक्टर अलार्म दे रहा है। स्रोत खोजें।', sat: 'ᱟᱢᱟᱜ ᱜᱮᱥ ᱰᱤᱴᱮᱠᱴᱚᱨ ᱨᱚᱲ ᱠᱟᱱᱟ᱾ ᱚᱠᱟ ᱠᱷᱚᱱ ᱯᱟᱱᱛᱮ ᱢᱮ᱾' });
    const leak = {
      x: 1060, y: 280, w: 280, h: 240, label: 'Gas source?', icon: 'target', primary: true, hint: 'H₂S RISING', tone: 'dim',
      onLock: tg => {
        s.gas.live = false; s.gas.v = { o2: 19.1, h2s: 38, co: 42, lel: 6 };
        s.drawGas(s.critBanner('TOXIC GAS DETECTED · DO NOT ENTER'));
        s.updateTarget(tg, { tone: 'crit', label: 'Toxic gas · H₂S leak', icon: 'warn', done: true, passive: true });
        s.setGasSpread(1.22);
        s.ov.innerHTML = `<ellipse cx="1010" cy="640" rx="430" ry="95" fill="rgba(228,73,61,.08)" stroke="#EF7C22" stroke-width="3" stroke-dasharray="14 10" class="dashflow"/><text x="1010" y="752" fill="#EF7C22" font-family="IBM Plex Mono,monospace" font-size="18" font-weight="600" text-anchor="middle">HAZARD ZONE · ~9 m · SPREADING</text>`;
        s.feedback({ tone: 'warn', title: 'Toxic gas detected', sub: 'H₂S 38 ppm · O₂ 19.1 % · spreading', text: L({ en: 'Hydrogen sulphide is above the 10 ppm limit and the cloud is spreading. Do not enter. Next: identify the safe boundary.', hi: 'हाइड्रोजन सल्फ़ाइड 10 ppm सीमा से ऊपर है और गैस फैल रही है। प्रवेश न करें। अगला: सुरक्षित सीमा पहचानें।' }), btns: [{ label: t('cont_btn'), fn: boundary, cls: 'btn-primary' }] });
      }
    };
    s.setTargets([leak, { x: 1515, y: 280, w: 200, h: 130, label: 'Restricted zone', icon: 'octa', tone: 'crit', passive: true }, { x: 230, y: 390, w: 210, h: 300, label: 'PPE station', icon: 'shield', tone: 'info', passive: true }]);
    s.solve = () => { if (!leak.fired) { leak.fired = true; s.lookAt(1060); leak.onLock(leak); } };

    function boundary() {
      s.setPrompt('OBJECTIVE 01 · SAFE BOUNDARY', { en: 'Identify the safe boundary. Aim at a marker.', hi: 'सुरक्षित सीमा पहचानें। किसी मार्कर पर निशाना लगाएँ।', sat: 'ᱨᱩᱠᱷᱤᱭᱟᱹ ᱥᱤᱢᱟᱹ ᱪᱤᱱᱦᱟᱹᱣ ᱢᱮ᱾' });
      s.sheet('');
      const mk = (id, x, y, w, h, dist) => ({ id, x, y, w, h, label: id, dist, icon: 'mapPin', tone: 'dim', onLock: confirm });
      const st = [mk('B1', 1180, 590, 70, 100, '3 m'), mk('B2', 880, 640, 80, 110, '7 m'), mk('B3', 560, 700, 90, 130, '12 m')];
      s.setTargets([...st, { x: 1060, y: 280, w: 280, h: 240, label: 'H₂S leak', icon: 'warn', tone: 'crit', passive: true }]);
      s.lookAt(880);
      s.solve = () => { s.lookAt(560); set(st[2]); };
      function confirm(tg) {
        s.solve = () => set(st[2]);
        s.sheet(`<div class="row between"><span class="disp d-xs">Set barrier at ${tg.id}?</span><span class="pill info">${tg.dist} from source</span></div>
          <div class="btn-row">${s.btn('Keep scanning', () => { st.forEach(x => { x.fired = false; }); s.sheet(''); }, 'btn-secondary')}${s.btn('Confirm ' + tg.id, () => set(tg), 'btn-primary', 'pin')}</div>`, 'act', false);
      }
      function set(tg) {
        if (tg.id === 'B3') {
          s.attempt('boundary', 'Hazard boundary', true);
          s.updateTarget(tg, { tone: 'ok', label: 'B3 · safe boundary', done: true, passive: true });
          s.ov.insertAdjacentHTML('beforeend', `<line x1="380" y1="760" x2="760" y2="700" stroke="#45B974" stroke-width="5" stroke-dasharray="16 8"/><text x="570" y="790" fill="#45B974" font-family="IBM Plex Mono,monospace" font-size="17" font-weight="600" text-anchor="middle">SAFE BOUNDARY</text>`);
          s.feedback({ tone: 'ok', title: '✓ Safe distance identified', sub: 'B3 · 12 m from source · upwind', text: 'Outside the spreading cloud. Barriers and signs go here — nobody crosses without a permit.', btns: [{ label: t('cont_btn'), fn: () => s.mission(1) }] });
        } else {
          s.attempt('boundary', 'Hazard boundary', false, { viol: true, why: `Boundary set at ${tg.id} (${tg.dist}) — inside the gas cloud.` });
          s.updateTarget(tg, { tone: 'crit', label: tg.id + ' · too close' });
          s.feedback({ tone: 'bad', title: '✕ Too close', sub: `${tg.id} · ${tg.dist} · inside hazard zone`, text: L({ en: 'Move outside the hazard zone. The cloud now reaches about 9 m and is still spreading.', hi: 'खतरे के क्षेत्र से बाहर जाएँ। गैस अब लगभग 9 मीटर तक फैल चुकी है।' }), btns: [{ label: t('retry'), fn: () => { st.forEach(x => { x.fired = x.done; }); s.sheet(''); }, cls: 'btn-primary', icon: 'refresh' }] });
        }
      }
    }
  },
  function () { // 2 · unsafe entry
    const s = this;
    s.setPrompt('OBJECTIVE 02 · UNSAFE ENTRY', { en: 'A co-worker is about to enter CS-07. Look at the entry point.', hi: 'एक सहकर्मी CS-07 में प्रवेश करने वाला है। प्रवेश बिंदु को देखें।', sat: 'ᱢᱤᱫ ᱜᱟᱛᱮ CS-07 ᱵᱷᱤᱛᱨᱤ ᱵᱚᱞᱚᱜ ᱠᱟᱱᱟᱭ᱾ ᱵᱚᱞᱚ ᱴᱷᱟᱶ ᱧᱮᱞ ᱢᱮ᱾' });
    const cw = { x: 1110, y: 235, w: 90, h: 120, label: 'Co-worker at CS-07', icon: 'user', primary: true, hint: 'ENTRY POINT', tone: 'dim', onLock: () => ask() };
    s.setTargets([cw, { x: 560, y: 700, w: 90, h: 130, label: 'Safe boundary', icon: 'check', tone: 'ok', passive: true }]);
    s.solve = () => { if (!cw.fired) { cw.fired = true; s.lookAt(1110); ask(); } };
    function ask() {
      s.updateTarget(cw, { tone: 'haz', label: 'No permit · no gas test' });
      const o = [['a', 'Let him enter — it is a short job'], ['b', 'Stop the entry and report to the supervisor'], ['c', 'Give him your gloves and let him enter']];
      s.solve = () => ans('b');
      s.sheet(`<span class="disp d-xs">He has no entry permit, no gas test and no attendant. What do you do?</span><div class="seq">${o.map(([k, l], i) => `<button data-arbtn="${s.bi(() => ans(k))}"><span class="k">${'ABC'[i]}</span><span>${l}</span></button>`).join('')}</div>`, 'act');
    }
    function ans(k) {
      if (k === 'b') {
        s.attempt('entry', 'Unsafe entry', true);
        const c = $('.coworker', s.root); if (c) { c.style.transition = 'transform 1.2s'; c.style.transform = 'translate(-60px, 20px)'; }
        s.updateTarget(cw, { tone: 'ok', label: 'Entry stopped', done: true, passive: true });
        s.feedback({ tone: 'ok', title: '✓ Unsafe entry stopped', sub: 'Permit-to-work required', text: 'Entry needs a valid permit, a gas test (O₂ 19.5–23.5 %, H₂S under 10 ppm), ventilation and a trained attendant outside.', btns: [{ label: t('cont_btn'), fn: () => s.mission(2) }] });
      } else {
        s.attempt('entry', 'Unsafe entry', false, { viol: true, why: 'Allowed entry into a confined space without permit or gas test.' });
        s.feedback({ tone: 'bad', title: '✕ Unsafe', text: 'H₂S at 38 ppm can cause collapse within minutes. Gloves do not protect against gas. Stop the entry.', btns: [{ label: t('retry'), fn: ask, cls: 'btn-primary', icon: 'refresh' }] });
      }
    }
  },
  function () { // 3 · PPE
    const s = this;
    s.setPrompt('OBJECTIVE 03 · SELECT PPE', { en: 'Select the PPE required before approaching the confined-space area.', hi: 'सीमित स्थान क्षेत्र के पास जाने से पहले आवश्यक पीपीई चुनें।', sat: 'ᱵᱚᱸᱫ ᱡᱟᱭᱜᱟ ᱥᱟᱢᱟᱝ ᱪᱟᱞᱟᱜ ᱞᱟᱦᱟ ᱞᱟᱹᱠᱛᱤ PPE ᱵᱟᱪᱷᱟᱣ ᱢᱮ᱾' });
    s.lookAt(300);
    s.setTargets([{ x: 230, y: 390, w: 210, h: 300, label: 'PPE station', icon: 'shield', tone: 'info', passive: true, dist: '2 m' }]);
    s.ppeSel = new Set();
    s.showPPE();
  },
  function () { // 4 · buddy system + communication
    const s = this;
    s.setPrompt('OBJECTIVE 04 · BUDDY SYSTEM', { en: 'You must not enter a confined space alone. Place your buddy in the safe communication zone.', hi: 'सीमित स्थान में कभी अकेले प्रवेश न करें। अपने साथी को सुरक्षित संचार क्षेत्र में रखें।', sat: 'ᱵᱚᱸᱫ ᱡᱟᱭᱜᱟ ᱨᱮ ᱮᱥᱠᱟᱨ ᱟᱞᱚᱢ ᱵᱚᱞᱚᱜ ᱟ᱾ ᱟᱢᱟᱜ ᱜᱟᱛᱮ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱴᱷᱟᱶ ᱨᱮ ᱫᱚᱦᱚᱭ ᱢᱮ᱾' });
    s.lookAt(1010);
    s.setTargets([{ x: 1010, y: 250, w: 150, h: 90, label: 'CS-07 entry', icon: 'target', tone: 'haz', passive: true }]);
    s.showBuddy();
  },
  function () { // 5 · emergency response
    const s = this;
    s.critAt = performance.now();
    $('#ar-crit', s.root).innerHTML = '<div class="ar-crit"></div>';
    s.gas.v = { o2: 18.2, h2s: 92, co: 64, lel: 14 };
    s.drawGas(s.critBanner('GAS LEVEL CRITICAL · EVACUATE'));
    s.setGasSpread(1.5); s.haptic([200, 100, 200, 100, 200]);
    s.setPrompt('EMERGENCY RESPONSE', { en: 'Gas level critical! Tap the actions in the correct order.', hi: 'गैस स्तर गंभीर! सही क्रम में कार्यों पर टैप करें।', sat: 'ᱜᱮᱥ ᱵᱟᱹᱲᱛᱤ ᱠᱷᱟᱛᱟᱨᱟ! ᱴᱷᱤᱠ ᱛᱷᱟᱨ ᱛᱮ ᱴᱤᱯᱟᱹᱣ ᱢᱮ᱾' });
    s.setTargets([{ x: 465, y: 150, w: 90, h: 90, label: 'Alarm beacon', icon: 'siren', tone: 'crit', passive: true }]);
    s.lookAt(700);
    s.seqOrder = ['alert', 'move', 'comm', 'hold']; s.seqI = 0;
    s.seqShuffle = ['move', 'rescue', 'hold', 'alert', 'comm'];
    s.showSeq();
  }
];
