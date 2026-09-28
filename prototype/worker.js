'use strict';
/* =================================================================
   WORKER ANDROID APP — screens + navigation
   ================================================================= */
const W = {
  cur: 'splash', params: {}, stack: [],
  go(name, params = {}, opts = {}) {
    if (!opts.replace && W.cur) W.stack.push([W.cur, W.params]);
    W.cur = name; W.params = params; W.render();
  },
  tab(name) { W.stack = []; W.cur = name; W.params = {}; W.render(); },
  back() { const p = W.stack.pop(); if (p) { W.cur = p[0]; W.params = p[1]; W.render(); } else W.tab('home'); },
  render() {
    AR.stop();
    const host = $('#dev-screen');
    if (!host || S.mode !== 'worker') return;
    const sc = WS[W.cur] || WS.home;
    const ch = sc.chrome || {};
    host.innerHTML = (ch.sbar === false ? '' : sbar()) + sc.render(W.params) + (ch.nav ? bnav(ch.nav) : '') + '<div class="toasts" id="toasts-dev"></div>';
    host.classList.toggle('large-text', S.largeText);
    sc.mount && sc.mount(host, W.params);
    Shell.updateSide();
  },
  refreshChrome() { // update the network pill without re-rendering the screen
    $$('#dev-screen [data-act="net"]').forEach(b => { b.outerHTML = netPill(); });
    const sb = $('#dev-screen .sbar'); if (sb) sb.outerHTML = sbar();
  }
};

const clock = () => { const d = new Date(); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
const sbar = () => `<div class="sbar" aria-hidden="true"><span>${clock()}</span><span class="r">${S.online ? ic('wifi') : ic('wifiOff')}<span>${S.online ? '4G' : 'No network'}</span><span class="batt"><i></i></span></span></div>`;
const netPill = () => S.syncing
  ? `<button class="net sync" data-act="net" aria-label="Synchronizing">${ic('sync')}SYNC</button>`
  : `<button class="net ${S.online ? 'on' : 'off'}" data-act="net" aria-label="Network status: ${S.online ? 'online' : 'offline'}"><span class="dot"></span>${t(S.online ? 'online' : 'offline')}</button>`;
const appbar = ({ back, title, sub, right }) => `<div class="appbar">${back ? `<button class="icon-btn" data-back aria-label="Back">${ic('chevL')}</button>` : ''}<div class="title">${title}${sub ? `<small>${sub}</small>` : ''}</div>${right ?? netPill()}</div>`;
const bnav = cur => `<nav class="bnav" aria-label="Main">${[['home', 'home', 'home'], ['hub', 'helmet', 'training'], ['certs', 'cert', 'certificates'], ['profile', 'user', 'profile']].map(([k, i, l]) => `<button data-tab="${k}" aria-current="${cur === k}">${ic(i)}<span>${t(l)}</span></button>`).join('')}</nav>`;
const foot = inner => `<div style="padding:12px 16px 18px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:10px;flex:none;background:var(--ground)">${inner}</div>`;
const greet = () => { const h = new Date().getHours(); return t(h < 12 ? 'gm' : h < 17 ? 'ga' : 'ge', { n: S.worker.first }); };
const doneCount = () => Object.values(S.modules).filter(m => m.status === 'done').length;

function statusPill(key) {
  const m = S.modules[key];
  if (m.status === 'done') return `<span class="pill ok">${ic('check')}${t('st_done')}</span>`;
  if (m.status === 'progress') return `<span class="pill haz">${ic('play')}${t('st_progress')}</span>`;
  if (m.status === 'locked') return `<span class="pill neutral">${ic('lock')}${t('st_locked')}</span>`;
  return `<span class="pill info">${t('st_new')}</span>`;
}

/* ---------- content per live module ---------- */
const MOD_CONTENT = {
  fire: {
    mission: 'MISSION 01', hud: 'FIRE RESPONSE', missions: 4, est: '08', diff: 'INTERMEDIATE',
    scenario: { en: 'An electrical fire has been detected inside an industrial workspace.', hi: 'एक औद्योगिक कार्यस्थल के अंदर बिजली की आग का पता चला है।', sat: 'ᱢᱤᱫᱴᱟᱹᱝ ᱠᱟᱹᱢᱤ ᱴᱷᱟᱶ ᱵᱷᱤᱛᱨᱤ ᱵᱤᱡᱞᱤ ᱥᱮᱸᱜᱮᱞ ᱧᱟᱢ ᱮᱱᱟ᱾' },
    where: 'MCC Room 3 · Workshop Block B · Dhanbad Mine', alarm: 'Smoke detector ZD-12 · 09:14',
    objectives: [
      { en: 'Identify the hazard', hi: 'खतरे की पहचान करें', sat: 'ᱠᱷᱟᱛᱟᱨᱟ ᱪᱤᱱᱦᱟᱹᱣ ᱢᱮ' },
      { en: 'Locate the emergency exit', hi: 'आपातकालीन निकास खोजें', sat: 'ᱵᱟᱦᱨᱮ ᱚᱰᱚᱠ ᱦᱚᱨ ᱯᱟᱱᱛᱮ ᱢᱮ' },
      { en: 'Select the appropriate extinguisher', hi: 'सही अग्निशामक चुनें', sat: 'ᱴᱷᱤᱠ ᱮᱠᱥᱴᱤᱝᱜᱩᱤᱥᱚᱨ ᱵᱟᱪᱷᱟᱣ ᱢᱮ' },
      { en: 'Follow the evacuation sequence', hi: 'निकासी क्रम का पालन करें', sat: 'ᱵᱟᱦᱨᱮ ᱚᱰᱚᱠ ᱨᱮᱭᱟᱜ ᱛᱷᱟᱨ ᱯᱟᱧᱡᱟ ᱢᱮ' },
      { en: 'Reach the assembly point', hi: 'असेंबली पॉइंट तक पहुँचें', sat: 'ᱡᱟᱹᱨᱩᱢ ᱴᱷᱟᱶ ᱥᱮᱱ ᱥᱮᱴᱮᱨ ᱢᱮ' }
    ]
  },
  gas: {
    mission: 'MISSION 02', hud: 'GAS & CONFINED SPACE', missions: 5, est: '10', diff: 'INTERMEDIATE',
    scenario: { en: 'A possible gas leak has been reported near a confined space.', hi: 'एक सीमित स्थान के पास संभावित गैस रिसाव की सूचना मिली है।', sat: 'ᱢᱤᱫᱴᱟᱹᱝ ᱵᱚᱸᱫ ᱡᱟᱭᱜᱟ ᱥᱟᱢᱟᱝ ᱨᱮ ᱜᱮᱥ ᱞᱤᱠ ᱨᱮᱭᱟᱜ ᱠᱷᱚᱵᱚᱨ ᱮᱱᱟ᱾' },
    where: 'Pump House 2 · Vessel CS-07 · Dhanbad Mine', alarm: 'Fixed H₂S detector GD-07 · 09:32',
    objectives: [
      { en: 'Detect hazard zone', hi: 'खतरे का क्षेत्र पहचानें', sat: 'ᱠᱷᱟᱛᱟᱨᱟ ᱴᱚᱴᱷᱟ ᱪᱤᱱᱦᱟᱹᱣ ᱢᱮ' },
      { en: 'Identify unsafe entry', hi: 'असुरक्षित प्रवेश पहचानें', sat: 'ᱵᱟᱝ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱵᱚᱞᱚ ᱪᱤᱱᱦᱟᱹᱣ ᱢᱮ' },
      { en: 'Select correct PPE', hi: 'सही पीपीई चुनें', sat: 'ᱴᱷᱤᱠ PPE ᱵᱟᱪᱷᱟᱣ ᱢᱮ' },
      { en: 'Establish buddy system', hi: 'बडी सिस्टम बनाएँ', sat: 'ᱜᱟᱛᱮ ᱥᱟᱶ ᱠᱟᱹᱢᱤ ᱢᱮ' },
      { en: 'Follow safe communication protocol', hi: 'सुरक्षित संचार प्रोटोकॉल अपनाएँ', sat: 'ᱨᱩᱠᱷᱤᱭᱟᱹ ᱜᱟᱞᱢᱟᱨᱟᱣ ᱱᱤᱭᱚᱢ ᱯᱟᱧᱡᱟ ᱢᱮ' }
    ]
  }
};

/* ---------- knowledge questions ---------- */
const QUIZ = {
  fire: [
    { q: { en: 'Which extinguisher is preferred for a fire on energized electrical equipment?', hi: 'चालू बिजली उपकरण की आग के लिए कौन-सा अग्निशामक सबसे उपयुक्त है?' },
      o: [{ en: 'CO₂', hi: 'CO₂' }, { en: 'Water', hi: 'पानी' }, { en: 'Foam', hi: 'फ़ोम' }, { en: 'Sand bucket', hi: 'रेत की बाल्टी' }], a: 0,
      why: { en: 'CO₂ does not conduct electricity and leaves no residue on equipment.', hi: 'CO₂ बिजली का संचालन नहीं करता और उपकरण पर अवशेष नहीं छोड़ता।' } },
    { q: { en: 'You discover a fire. What do you do first?', hi: 'आपको आग दिखती है। सबसे पहले क्या करेंगे?' },
      o: [{ en: 'Collect your belongings', hi: 'अपना सामान इकट्ठा करें' }, { en: 'Raise the alarm — shout "Fire" and press the call point', hi: 'अलार्म बजाएँ — "आग" चिल्लाएँ और कॉल पॉइंट दबाएँ' }, { en: 'Open windows for ventilation', hi: 'हवा के लिए खिड़कियाँ खोलें' }, { en: 'Keep working until told', hi: 'कहे जाने तक काम करते रहें' }], a: 1,
      why: { en: 'Raising the alarm first gets everyone moving and starts the emergency response.', hi: 'पहले अलार्म बजाने से सभी सुरक्षित निकलते हैं और आपात प्रतिक्रिया शुरू होती है।' } },
    { q: { en: 'During evacuation you should…', hi: 'निकासी के दौरान आपको…' },
      o: [{ en: 'Use the lift to get out faster', hi: 'जल्दी निकलने के लिए लिफ़्ट का उपयोग करें' }, { en: 'Go back for your tools', hi: 'अपने औज़ार लेने वापस जाएँ' }, { en: 'Use the nearest safe exit and go to the assembly point', hi: 'निकटतम सुरक्षित निकास से निकलें और असेंबली पॉइंट जाएँ' }, { en: 'Wait at your workstation', hi: 'अपने कार्यस्थल पर प्रतीक्षा करें' }], a: 2,
      why: { en: 'Never use lifts or return for belongings. Report at the assembly point for the head count.', hi: 'लिफ़्ट का उपयोग न करें, सामान के लिए वापस न जाएँ। गिनती के लिए असेंबली पॉइंट पर रिपोर्ट करें।' } }
  ],
  gas: [
    { q: { en: 'The safe oxygen range for confined-space entry is…', hi: 'सीमित स्थान में प्रवेश के लिए सुरक्षित ऑक्सीजन स्तर है…' },
      o: [{ en: '15 – 19 %', hi: '15 – 19 %' }, { en: '19.5 – 23.5 %', hi: '19.5 – 23.5 %' }, { en: '10 – 15 %', hi: '10 – 15 %' }, { en: 'Above 25 %', hi: '25 % से अधिक' }], a: 1,
      why: { en: 'Below 19.5 % is oxygen-deficient; above 23.5 % is an enrichment fire risk.', hi: '19.5 % से कम ऑक्सीजन की कमी है; 23.5 % से अधिक आग का खतरा है।' } },
    { q: { en: 'Before entering a confined space you must have…', hi: 'सीमित स्थान में प्रवेश से पहले आपके पास होना चाहिए…' },
      o: [{ en: 'Only a helmet', hi: 'केवल हेलमेट' }, { en: 'Verbal OK from anyone nearby', hi: 'पास के किसी व्यक्ति की मौखिक अनुमति' }, { en: 'A valid permit, a gas test and an attendant outside', hi: 'वैध परमिट, गैस परीक्षण और बाहर एक अटेंडेंट' }, { en: 'Nothing, if the job is short', hi: 'कुछ नहीं, अगर काम छोटा है' }], a: 2,
      why: { en: 'Permit-to-work, atmospheric testing and a trained attendant are mandatory for every entry.', hi: 'हर प्रवेश के लिए परमिट, गैस परीक्षण और प्रशिक्षित अटेंडेंट अनिवार्य हैं।' } },
    { q: { en: 'Your buddy collapses inside a confined space. You should…', hi: 'आपका साथी सीमित स्थान के अंदर गिर जाता है। आपको…' },
      o: [{ en: 'Raise the alarm and do not enter without SCBA', hi: 'अलार्म बजाएँ और SCBA के बिना प्रवेश न करें' }, { en: 'Enter immediately and pull them out', hi: 'तुरंत अंदर जाकर उन्हें बाहर खींचें' }, { en: 'Wait and watch', hi: 'प्रतीक्षा करें और देखें' }, { en: 'Pour water into the space', hi: 'अंदर पानी डालें' }], a: 0,
      why: { en: 'Most confined-space deaths are would-be rescuers. Only a trained team with SCBA enters.', hi: 'सीमित स्थान में अधिकतर मौतें बचाने वालों की होती हैं। केवल SCBA वाली प्रशिक्षित टीम प्रवेश करती है।' } }
  ]
};

/* ---------- screens ---------- */
const WS = {};

WS.splash = {
  chrome: { sbar: false },
  render: () => `<div class="splash" data-act="splash-next">
    <svg class="lines" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs><pattern id="sgrid" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0V26" fill="none" stroke="rgba(237,234,227,.035)"/></pattern></defs>
      <rect width="390" height="844" fill="url(#sgrid)"/>
      <g fill="none" stroke="rgba(237,234,227,.13)" stroke-width="1.2">
        <path d="M232 760 290 420 348 760M290 420 380 700M246 680h88M258 610h64M270 540h40M282 470h16M246 680 322 610M258 610l52-70M270 540l24-70"/>
        <rect x="262" y="410" width="56" height="10"/><circle cx="290" cy="392" r="26"/><circle cx="290" cy="392" r="4"/>
        <path d="M290 366v52M264 392h52M272 374l36 36M308 374l-36 36"/>
        <path d="M268 396v364M312 396v364" stroke-dasharray="3 5"/>
        <path d="M0 760h390"/><path d="M252 760v84M328 760v84" stroke-dasharray="6 6"/>
        <path d="M206 392v368M200 392h12M200 760h12"/>
        <path d="M40 120h120M40 116v8M160 116v8M40 780l30 30M70 780l30 30M100 780l30 30M130 780l30 30M160 780l30 30M190 780l30 30"/>
      </g>
      <text x="198" y="580" transform="rotate(-90 198 580)" fill="rgba(237,234,227,.3)" font-family="IBM Plex Mono,monospace" font-size="10" letter-spacing="1.5">HEADFRAME · 36.0 m</text>
      <g stroke="rgba(242,194,48,.45)" stroke-width="1.2"><path d="M290 352v-14M290 432v14M250 392h-14M330 392h14"/></g>
    </svg>
    <div class="top">
      <div class="logo">${BRAND_MARK.replace('class="brand-mark"', 'width="64" height="64"')}</div>
      <h1>JHARKHAND<br><span>SAFETY AR</span></h1>
      <div class="sys">${esc(t('sys')).replace('\n', '<br>')}</div>
      <p class="tag">${esc(t('tagline'))}</p>
    </div>
    <div class="bottom">
      <span class="pill info">${ic('wifiOff')}${esc(t('offline_first'))}</span>
      <div class="loadbar"><i></i></div>
      <div class="row between mono small muted" style="margin-top:10px"><span>Loading offline pack · 2 AR modules · EN / HI / SAT</span><span>v1.4.0</span></div>
    </div></div>`,
  mount: () => { setTimeout(() => { if (W.cur === 'splash' && S.mode === 'worker') W.go('lang', {}, { replace: true }); }, 2900); }
};

WS.lang = {
  render: () => `${appbar({ title: 'JHARKHAND SAFETY AR', sub: 'SETUP · LANGUAGE', right: '' })}
  <div class="scroll">
    <div><h1 class="disp d-l">Choose your language</h1><p class="t2" style="font-size:19px;margin-top:8px">भाषा चुनें &nbsp;·&nbsp; <span lang="sat">ᱯᱟᱹᱨᱥᱤ ᱵᱟᱪᱷᱟᱣ ᱢᱮ</span></p></div>
    <div class="stack">${[['en', 'English', 'English'], ['hi', 'हिंदी', 'Hindi · Devanagari'], ['sat', 'ᱥᱟᱱᱛᱟᱲᱤ', 'Santali · Ol Chiki']].map(([k, big, sub]) =>
      `<button class="lang-opt ${k}" data-act="set-lang" data-lang="${k}" aria-pressed="${S.lang === k}"><div><div class="big">${big}</div><div class="sub">${sub}</div></div><span class="radio"></span></button>`).join('')}</div>
    <div>${listenBtn({ en: 'Choose your language. Tap English, Hindi or Santali.', hi: 'अपनी भाषा चुनें। अंग्रेज़ी, हिंदी या संताली पर टैप करें।', sat: '' }[S.lang] || 'Choose your language', t('listen_instr'))}</div>
    <p class="small muted">Text, voice instructions and assessments follow this choice. Change it any time in Profile › Settings.</p>
  </div>
  ${foot(`<button class="btn btn-primary btn-block" data-go="reg1">${esc(t('cont'))}${ic('arrowR')}</button>`)}`
};

WS.reg1 = {
  render: () => `${appbar({ back: true, title: 'Create safety profile', sub: 'STEP 1 / 2 · WORKER DETAILS' })}
  <div class="scroll">
    <div class="steps"><i class="on"></i><i></i></div>
    <div class="field"><label for="f-name">Full name</label><input class="input" id="f-name" value="${esc(S.worker.name)}" autocomplete="name"></div>
    <div class="field"><label for="f-id">Worker ID</label><div class="row"><input class="input mono" id="f-id" value="${esc(S.worker.id)}"><button class="icon-btn" style="height:54px;width:54px" data-act="toast" data-title="ID card scan" data-msg="Point the camera at the barcode on your employer ID card." aria-label="Scan ID card">${ic('qr')}</button></div></div>
    <div class="field"><label for="f-site">Facility / Site</label><select class="select" id="f-site">${SITES.map(s => `<option ${s.name === S.worker.site ? 'selected' : ''}>${s.name}</option>`).join('')}</select></div>
    <div class="field"><label for="f-role">Role</label><select class="select" id="f-role">${ROLES.map(r => `<option ${r === S.worker.role ? 'selected' : ''}>${r}</option>`).join('')}</select></div>
    <p class="small muted row">${ic('lock')}<span>Stored on this phone. Shared only with your site safety office.</span></p>
  </div>
  ${foot(`<button class="btn btn-primary btn-block" data-act="reg1-next">${esc(t('cont'))}${ic('arrowR')}</button>`)}`
};

WS.reg2 = {
  render: () => `${appbar({ back: true, title: 'Create safety profile', sub: 'STEP 2 / 2 · EXPERIENCE' })}
  <div class="scroll">
    <div class="steps"><i class="on"></i><i class="on"></i></div>
    <div class="field"><label>Experience</label><div class="choice-grid">${['< 1 year', '1–3 years', '3–5 years', '5+ years'].map(e => `<button class="choice" data-act="exp" data-v="${e}" aria-pressed="${S.worker.exp === e}">${e}</button>`).join('')}</div></div>
    <div class="field"><label>Language</label><div class="choice-grid" style="grid-template-columns:repeat(3,1fr)">${[['en', 'English'], ['hi', 'हिंदी'], ['sat', 'ᱥᱟᱱᱛᱟᱲᱤ']].map(([k, l]) => `<button class="choice" data-act="set-lang" data-lang="${k}" aria-pressed="${S.lang === k}">${l}</button>`).join('')}</div></div>
    <div class="panel pad corner" style="display:flex;flex-direction:column;gap:12px">
      <div class="eyebrow">Safety profile preview</div>
      <div class="row"><span class="avatar-i" style="width:48px;height:48px">${S.worker.name.split(' ').map(x => x[0]).join('').slice(0, 2)}</span><div class="grow"><div class="disp d-s">${esc(S.worker.name)}</div><div class="mono small muted">${esc(S.worker.id)}</div></div></div>
      <dl class="kv"><dt>Site</dt><dd>${esc(S.worker.site)}</dd><dt>Role</dt><dd>${esc(S.worker.role)}</dd><dt>Experience</dt><dd>${esc(S.worker.exp)}</dd></dl>
    </div>
  </div>
  ${foot(`<button class="btn btn-primary btn-block" data-act="reg-done">${ic('check')}Create profile</button>`)}`
};

WS.home = {
  chrome: { nav: 'home' },
  render: () => {
    const f = S.modules.fire, dc = doneCount();
    const exp = S.certs.find(c => c.status === 'expiring');
    return `${appbar({ title: 'JHARKHAND SAFETY AR', sub: `${S.worker.site.toUpperCase()} · ${S.worker.shift.toUpperCase()}` })}
    <div class="scroll">
      <div><div class="eyebrow">Sat · 26 Sep 2026</div><h1 class="disp d-l" style="margin-top:8px">${esc(greet())}</h1></div>
      ${S.online ? '' : offlineBanner()}
      <section class="panel pad" style="display:flex;flex-direction:column;gap:12px">
        <div class="row between"><span class="eyebrow">${esc(t('training_progress'))}</span><span class="mono small muted">${Math.round(dc / 5 * 100)}%</span></div>
        <div class="row" style="align-items:baseline;gap:10px"><span class="disp d-xl tnum">${dc} / 5</span><span class="disp d-xs t2">${esc(t('modules_complete'))}</span></div>
        <div><div class="meter">${MODS.map(m => { const s = S.modules[m.key]; return `<div class="seg-cell ${s.status === 'done' ? 'done' : s.status === 'progress' ? 'prog' : 'lock'}">${s.status === 'progress' ? `<i style="width:${s.progress}%"></i>` : '<i></i>'}</div>`; }).join('')}</div>
        <div class="meter-lbl"><span>FIRE</span><span>GAS</span><span>MACH</span><span>ELEC</span><span>PPE</span></div></div>
      </section>
      ${f.status !== 'done' ? `<section style="display:flex;flex-direction:column;gap:10px">
        <div class="eyebrow">${esc(t('continue_training'))}</div>
        <div class="feature"><div class="hazard-edge"></div>
          <svg class="art" viewBox="0 0 150 120" aria-hidden="true"><g fill="none" stroke="#EF7C22" stroke-width="1.2"><rect x="40" y="20" width="70" height="90"/><path d="M40 50h70M40 80h70M75 20v90"/><circle cx="75" cy="50" r="30" stroke-dasharray="4 4"/><path d="M75 10v10M75 80v10M35 50h10M105 50h10"/></g></svg>
          <div class="body">
            <div class="row">${ic('fire', 'c-orange')}<span class="eyebrow" style="color:var(--orange)">Module 01 · AR simulation</span></div>
            <h2 class="disp d-m" style="max-width:80%">${esc(t('m_fire'))}</h2>
            <div class="chips"><span class="chip">${ic('camera')}AR</span><span class="chip">${ic('clock')}12 ${esc(t('min'))}</span><span class="chip">${ic('chart')}Intermediate</span></div>
            <div><div class="row between mono small" style="margin-bottom:6px"><span class="muted">PROGRESS</span><span>${f.progress}%</span></div><div class="bar haz"><i style="width:${f.progress}%"></i></div></div>
            <button class="btn btn-primary btn-block" data-go="intro" data-mod="fire">${esc(t('cont_btn'))}${ic('arrowR')}</button>
          </div></div></section>` : `<div class="banner ok">${ic('shield')}<div><b>All available AR modules complete</b><p>Machinery Safety opens in the next content release. Keep your certificates valid with refreshers.</p></div></div>`}
      ${exp ? `<button class="banner warn" style="text-align:left" data-go="certs">${ic('clock')}<div><b>Renewal due in ${exp.daysLeft} days</b><p>${esc(certTitle(exp.mod))} expires ${exp.expires}. Book a refresher with your safety officer.</p></div></button>` : ''}
      <section style="display:flex;flex-direction:column;gap:10px">
        <div class="eyebrow">${esc(t('all_modules'))}</div>
        <div class="mod-list">${MODS.map(modRow).join('')}</div>
      </section>
    </div>`;
  }
};

function offlineBanner() {
  return `<div class="banner off">${ic('wifiOff')}<div><b>${esc(t('offline_enabled'))}</b><p>${esc(t('offline_msg'))}</p>
  <div class="row mono small" style="margin-top:10px;gap:16px;flex-wrap:wrap"><span>${esc(t('pending_sync'))}: <b style="display:inline;font:600 13px var(--f-mono);color:var(--text)">${S.pending} ${esc(t('records'))}</b></span><span class="muted">${esc(t('last_sync'))}: ${esc(S.lastSync)}</span></div></div></div>`;
}

function modRow(m) {
  const s = S.modules[m.key];
  const locked = s.status === 'locked';
  const meta = [
    `<span>${ic('clock')} ${m.dur} ${esc(t('min'))}</span>`,
    s.score != null ? `<span>${esc(t('score'))} <b style="color:var(--text)">${s.score}%</b></span>` : s.status === 'progress' ? `<span>${s.progress}%</span>` : '',
    locked ? '<span>AR · Q1 2027</span>' : '<span>AR</span>'
  ].join('');
  return `<button class="mod-row ${locked ? 'locked' : ''}" ${locked ? 'data-act="locked"' : `data-go="intro" data-mod="${m.key}"`}>
    <span class="mod-ico"><span class="n">${m.n}</span>${ic(m.icon)}</span>
    <span class="grow"><span class="disp d-xs" style="display:block">${esc(t('m_' + m.key))}</span><span class="meta">${statusPill(m.key)}${meta}</span></span>
    ${locked ? ic('lock', 'muted') : ic('chevR', 'muted')}</button>`;
}

WS.hub = {
  chrome: { nav: 'hub' },
  render: () => `${appbar({ title: t('training'), sub: '5 SAFETY DOMAINS · 2 AR LIVE · 3 IN DEVELOPMENT' })}
  <div class="scroll tight">
    <p class="t2 small">Every module follows the same loop: learn the scenario, practise in AR, respond to the emergency, then pass the assessment to earn a QR-verifiable certificate.</p>
    ${MODS.map(m => {
      const s = S.modules[m.key], locked = s.status === 'locked';
      const cta = locked ? `<button class="btn btn-ghost btn-block btn-sm" data-act="locked">${ic('lock')}${esc(t('st_locked'))}</button>`
        : s.status === 'done' ? `<div class="btn-row"><button class="btn btn-secondary btn-sm" data-go="intro" data-mod="${m.key}">${esc(t('review'))}</button><button class="btn btn-ghost btn-sm" data-go="certs">${ic('cert')}Certificate</button></div>`
        : `<button class="btn btn-primary btn-block btn-sm" data-go="intro" data-mod="${m.key}">${s.status === 'progress' ? esc(t('cont_btn')) : esc(t('start_training'))}${ic('arrowR')}</button>`;
      return `<article class="panel pad" style="display:flex;flex-direction:column;gap:12px;${locked ? 'border-style:dashed;' : ''}">
        <div class="row between"><div class="row"><span class="disp d-l ${locked ? 'muted' : m.key === 'fire' ? 'c-orange' : 'c-yellow'}">${m.n}</span>${ic(m.icon, locked ? 'muted' : '')}</div>${statusPill(m.key)}</div>
        <div><h2 class="disp d-s">${esc(t('m_' + m.key))}</h2><p class="t2 small" style="margin-top:6px">${esc(t('d_' + m.key))}</p></div>
        <div class="row mono small muted" style="gap:14px;flex-wrap:wrap"><span>${esc(t('score')).toUpperCase()}: <b style="color:var(--text)">${s.score != null ? s.score + '%' : '—'}</b></span><span>${m.dur} ${esc(t('min')).toUpperCase()}</span><span>${m.level.toUpperCase()}</span>${!locked ? `<span class="c-green">${ic('download')} OFFLINE</span>` : ''}</div>
        ${locked ? `<div class="row mono small muted" style="gap:12px;flex-wrap:wrap"><span>Scenario ✓</span><span>3D assets ${m.key === 'ppe' ? '✓' : '◐'}</span><span>HI/SAT ◐</span><span>Pilot Q1 2027</span></div>` : ''}
        ${cta}</article>`;
    }).join('')}
  </div>`
};

WS.intro = {
  render: p => {
    const c = MOD_CONTENT[p.mod], m = MODS.find(x => x.key === p.mod);
    const txt = `${L(c.scenario)} ${c.objectives.map(o => L(o)).join('. ')}.`;
    return `${appbar({ back: true, title: t('m_' + p.mod), sub: c.mission + ' · BRIEFING' })}
    <div class="scroll">
      <div><div class="eyebrow" style="color:${p.mod === 'fire' ? 'var(--orange)' : 'var(--yellow)'}">${c.mission}</div><h1 class="disp d-l" style="margin-top:6px">${esc(t('m_' + p.mod))}</h1></div>
      <section class="panel corner" style="overflow:hidden">
        <div class="row between" style="padding:10px 14px;border-bottom:1px solid var(--line);background:var(--panel-2)"><span class="eyebrow">Incident briefing</span><span class="pill crit">${ic('siren')}Live scenario</span></div>
        <div class="pad" style="display:flex;flex-direction:column;gap:10px"><p style="font-size:19px;font-weight:600;line-height:1.35">${esc(L(c.scenario))}</p>
        <div class="mono small muted" style="display:flex;flex-direction:column;gap:4px"><span>${ic('pin')} ${esc(c.where)}</span><span>${ic('bell')} ${esc(c.alarm)}</span></div></div>
      </section>
      <section><div class="eyebrow" style="margin-bottom:8px">${esc(t('objectives'))}</div>
        <ol style="list-style:none;margin:0;padding:0;border-top:1px solid var(--line)">${c.objectives.map((o, i) => `<li class="row" style="padding:12px 0;border-bottom:1px solid var(--line);gap:14px"><span class="mono" style="color:var(--yellow);font-weight:600">${pad2(i + 1)}</span><span style="font-size:16px;font-weight:500">${esc(L(o))}</span></li>`).join('')}</ol></section>
      <section class="panel" style="display:grid;grid-template-columns:repeat(3,1fr)">
        ${[[t('est_time'), c.est + ' MIN'], [t('difficulty'), c.diff], [t('assessment'), 'PRACTICAL + KNOWLEDGE']].map(([k, v], i) => `<div style="padding:12px;${i ? 'border-left:1px solid var(--line)' : ''}"><div class="eyebrow" style="font-size:10px">${esc(k)}</div><div class="disp d-xs" style="margin-top:6px">${v}</div></div>`).join('')}
      </section>
      <div class="banner info">${ic('phone')}<div><b>Phone camera AR · no headset</b><p>Android 10+ · clear 2 × 2 m floor space · works offline. The practical must be completed in one session.</p></div></div>
    </div>
    ${foot(`<div class="btn-row"><button class="btn btn-secondary" style="flex:0 0 auto" data-speak="${esc(txt)}">${ic('speaker')}${esc(t('listen'))}</button><button class="btn btn-primary" data-go="calib" data-mod="${p.mod}">${esc(t('start_ar'))}</button></div>`)}`;
  }
};

WS.calib = {
  render: p => `${appbar({ back: true, title: t('prepare_env'), sub: MOD_CONTENT[p.mod].mission + ' · AR CALIBRATION' })}
  <div class="scroll tight">
    <div class="calib-cam" id="calib-cam">${p.mod === 'fire' ? sceneFire('A') : sceneGas()}
      <div class="dots">${Array.from({ length: 34 }, (_, i) => `<i style="left:${8 + (i * 37) % 84}%;top:${58 + (i * 13) % 34}%;animation-delay:${(0.2 + i * 0.05).toFixed(2)}s"></i>`).join('')}</div>
      <div class="plane" id="c-plane"></div><div class="phone" id="c-phone"></div>
      <div class="reticle" style="top:40%;width:56px;height:56px"><svg viewBox="-40 -40 80 80"><circle r="26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 6"/><path d="M-36 0h14M22 0h14M0-36v14M0 22v14" stroke="currentColor" stroke-width="2"/></svg></div>
      <div class="hud-box" style="position:absolute;left:8px;top:8px;padding:6px 8px;font:600 10.5px var(--f-mono);letter-spacing:.08em">SIMULATED CAMERA FEED</div>
    </div>
    <p style="font-size:17px;font-weight:500">${esc(t('calib_msg'))}</p>
    <div class="calib-steps" id="c-steps">
      ${[['scan', 'Scanning…', ''], ['surf', 'Surface detected', '3 planes'], ['env', 'Environment ready', '6 anchors'], ['light', 'Lighting acceptable', '184 lx']].map(([k, l, v]) => `<div data-k="${k}">${ic('sync')}<b style="font-weight:600">${l}</b><span>${v}</span></div>`).join('')}
    </div>
    <div class="mono small muted">ARCore 1.44 · Android 13 · 6 GB RAM · Camera 30 fps · Headset: not required</div>
    <div id="c-ready"></div>
  </div>
  ${foot(`<button class="btn btn-primary btn-block" id="c-begin" data-go="ar" data-mod="${p.mod}" disabled>${ic('play')}${esc(t('begin_sim'))}</button>`)}`,
  mount: () => {
    const steps = $$('#c-steps > div');
    const set = (i, cls) => { const d = steps[i]; if (!d) return; d.className = cls; d.querySelector('svg').outerHTML = cls === 'ok' ? ic('check') : ic('sync'); };
    set(0, 'run');
    const tl = [[900, () => { set(0, 'ok'); steps[0].querySelector('b').textContent = 'Floor scanned'; set(1, 'run'); }],
      [1700, () => { set(1, 'ok'); $('#c-plane')?.classList.add('on'); set(2, 'run'); }],
      [2600, () => { set(2, 'ok'); set(3, 'run'); }],
      [3300, () => { set(3, 'ok'); $('#c-phone')?.classList.add('hide'); const r = $('#c-ready'); if (r) r.innerHTML = `<div class="banner ok">${ic('check')}<div><b>✓ ${esc(t('ar_ready'))}</b><p>Floor plane locked. Virtual hazards will stay anchored as you move.</p></div></div>`; const b = $('#c-begin'); if (b) b.disabled = false; }]];
    const cur = W.cur;
    tl.forEach(([ms, fn]) => setTimeout(() => { if (W.cur === cur) fn(); }, ms));
  }
};

WS.ar = {
  chrome: { sbar: false },
  render: p => AR.markup(p.mod),
  mount: (host, p) => AR.start(p.mod, host)
};

/* ---------- assessment ---------- */
WS.assess = {
  render: p => {
    const A = WS.assess.state;
    if (!A || A.mod !== p.mod) WS.assess.state = { mod: p.mod, q: 0, picks: [], phase: 'quiz' };
    return `${appbar({ back: false, title: 'Assessment', sub: `${t('m_' + p.mod).toUpperCase()}` })}<div class="scroll" id="as-body"></div><div id="as-foot"></div>`;
  },
  mount: () => WS.assess.draw()
};
WS.assess.draw = function () {
  const A = WS.assess.state, body = $('#as-body'), ft = $('#as-foot');
  if (!body) return;
  const qs = QUIZ[A.mod];
  if (A.phase === 'quiz') {
    const q = qs[A.q], pick = A.picks[A.q];
    body.innerHTML = `<div class="row between"><span class="eyebrow">Part 1 · Knowledge check</span><span class="mono small">${A.q + 1} / ${qs.length}</span></div>
      <div class="steps">${qs.map((_, i) => `<i class="${i <= A.q ? 'on' : ''}"></i>`).join('')}</div>
      <h2 style="font-size:21px;font-weight:600;line-height:1.3">${esc(L(q.q))}</h2>
      <div>${listenBtn(L(q.q) + ' ' + q.o.map(o => L(o)).join(', '))}</div>
      <div class="stack">${q.o.map((o, i) => {
        const cls = pick == null ? '' : i === q.a ? 'right' : i === pick ? 'wrong' : '';
        return `<button class="q-opt ${cls}" data-act="q-pick" data-i="${i}" ${pick != null ? 'disabled' : ''}><span class="k">${'ABCD'[i]}</span><span>${esc(L(o))}</span>${cls === 'right' ? ic('check', 'c-green') : cls === 'wrong' ? ic('x', 'c-red') : ''}</button>`;
      }).join('')}</div>
      ${pick != null ? `<div class="banner ${pick === q.a ? 'ok' : 'crit'}">${ic(pick === q.a ? 'check' : 'x')}<div><b>${pick === q.a ? esc(t('correct')) : esc(t('incorrect'))}</b><p>${esc(L(q.why))}</p></div></div>` : ''}`;
    ft.innerHTML = foot(`<button class="btn btn-primary btn-block" data-act="q-next" ${pick == null ? 'disabled' : ''}>${A.q < qs.length - 1 ? 'Next question' : 'See results'}${ic('arrowR')}</button>`);
  } else {
    const R = A.result;
    body.innerHTML = `<div class="row between"><span class="eyebrow">Assessment result</span><span class="mono small muted">Attempt ${S.modules[A.mod].attempts}</span></div>
      <div class="total"><div><div class="eyebrow">Total</div><div class="disp d-xl tnum" style="margin-top:6px">${R.total}<span class="muted" style="font-size:24px"> / 100</span></div></div>
        ${R.pass ? `<span class="pill ok" style="height:36px;font-size:15px;padding:0 14px">${ic('check')}PASS</span>` : `<span class="pill crit" style="height:36px;font-size:15px;padding:0 14px">${ic('x')}NOT YET</span>`}</div>
      <div><div class="eyebrow" style="margin-bottom:8px">Weighting — practical actions carry the most</div>
        <div class="weights">${R.parts.map(pt => `<div style="flex:${pt.max}"><i style="width:${pt.got / pt.max * 100}%;background:${pt.got / pt.max >= .7 ? 'var(--green)' : 'var(--orange)'}"></i><span>${pt.short} ${pt.max}%</span></div>`).join('')}</div></div>
      <div class="stack" style="gap:14px">${R.parts.map(pt => `<div class="score-line"><span class="disp d-xs">${pt.label}</span><b class="tnum">${pt.got}<small> / ${pt.max}</small></b><div class="bar ${pt.got / pt.max >= .7 ? 'ok' : 'haz'}"><i style="width:${pt.got / pt.max * 100}%"></i></div></div>`).join('')}</div>
      <section><div class="eyebrow" style="margin-bottom:6px">Mistakes explained</div>
        ${R.mistakes.length ? `<div class="list">${R.mistakes.map(m => `<div class="li" style="align-items:flex-start">${ic(m.viol ? 'octa' : 'warn', m.viol ? 'c-red' : 'c-yellow')}<div class="lt"><b>${esc(m.title)}</b><span>${esc(m.why)}</span></div></div>`).join('')}</div>` : `<p class="t2">No mistakes recorded. Every action was correct on the first attempt.</p>`}
      </section>
      <p class="mono small muted">Pass mark 70 / 100 · Knowledge 30 · AR practical actions 40 · Safety procedure 20 · Response time 10</p>`;
    ft.innerHTML = foot(`<button class="btn btn-primary btn-block" data-go="review" data-mod="${A.mod}">View performance review${ic('arrowR')}</button>`);
  }
  body.scrollTop = 0;
};

function scoreAttempt(mod, picks) {
  const r = S.lastResult && S.lastResult.mod === mod ? S.lastResult : simulatedResult(mod);
  const qs = QUIZ[mod];
  const kn = picks.reduce((a, p, i) => a + (p === qs[i].a ? 10 : 0), 0);
  const keys = Object.keys(r.res);
  const arPts = keys.reduce((a, k) => a + (r.res[k].done ? (r.res[k].tries === 1 ? 8 : 4) : 0), 0);
  const viol = keys.reduce((a, k) => a + r.res[k].viol, 0);
  const proc = Math.max(0, 20 - viol * 6);
  const target = mod === 'fire' ? 150 : 210;
  const rt = r.elapsed <= target ? 10 : r.elapsed <= target * 1.5 ? 7 : 4;
  const total = kn + arPts + proc + rt;
  const mistakes = [];
  qs.forEach((q, i) => { if (picks[i] !== q.a) mistakes.push({ title: 'Knowledge: ' + L(q.q), why: L(q.why), viol: false }); });
  keys.forEach(k => r.res[k].reasons.forEach(x => mistakes.push({ title: 'AR: ' + r.res[k].label, why: x.why, viol: x.viol })));
  if (rt < 10) mistakes.push({ title: 'Response time ' + mmss(r.elapsed), why: `Target is under ${mmss(target)} for this scenario.`, viol: false });
  return {
    total, pass: total >= 70, run: r, mistakes,
    parts: [
      { label: 'Knowledge', short: 'KNOW', got: kn, max: 30 },
      { label: 'AR actions', short: 'AR', got: arPts, max: 40 },
      { label: 'Procedure', short: 'PROC', got: proc, max: 20 },
      { label: 'Response time', short: 'TIME', got: rt, max: 10 }
    ]
  };
}
function simulatedResult(mod) { // used when a reviewer jumps straight to the assessment
  const labels = mod === 'fire' ? ['Hazard identification', 'Extinguisher selection', 'Exit & route selection', 'Evacuation sequence', 'Assembly point reporting'] : ['Hazard boundary', 'Unsafe entry', 'PPE selection', 'Buddy system', 'Emergency response'];
  const res = {}; labels.forEach((l, i) => { res['k' + i] = { label: l, tries: i === 2 && mod === 'fire' ? 2 : 1, viol: 0, done: true, reasons: [] }; });
  if (mod === 'fire') res.k2.reasons.push({ why: 'Route 1 passes through the hazard zone next to Exit A.', viol: false });
  return { mod, elapsed: mod === 'fire' ? 222 : 240, res, evac: mod === 'fire' ? 41 : 18, sim: true };
}

function finishAssessment(mod, picks) {
  const R = scoreAttempt(mod, picks);
  S.retraining = false;
  const m = S.modules[mod];
  m.attempts = (m.attempts || 0) + 1;
  if (R.pass) {
    m.status = 'done'; m.progress = 100; m.score = R.total;
    const id = mod === 'fire' ? 'JH-FR-2026-00421' : 'JH-GS-2026-00457';
    S.certs = S.certs.filter(c => c.mod !== mod);
    const c = { id, mod, worker: S.worker.name, wid: S.worker.id, score: R.total, issued: '26 Sep 2026', expires: '26 Sep 2027', status: S.online ? 'valid' : 'provisional', daysLeft: 365, fresh: true };
    S.certs.unshift(c);
    S.activity.unshift({ d: '26 Sep', t: t('m_' + mod), s: `Passed — ${R.total}%`, tone: 'ok' });
    const wk = WORKERS[0]; if (mod === 'fire') wk.fire = R.total; else wk.gas = R.total;
    wk.score = Math.max(wk.fire || 0, wk.gas || 0);
  } else {
    m.status = 'progress';
    S.activity.unshift({ d: '26 Sep', t: t('m_' + mod), s: `Not yet passed — ${R.total}%`, tone: 'warn' });
  }
  if (S.online) { WORKERS[0].last = 'Today'; WORKERS[0].lastN = 0; }
  else { S.pending += R.pass ? 2 : 1; WORKERS[0].sync = 'pending'; }
  return R;
}

WS.review = {
  render: p => {
    const A = WS.assess.state && WS.assess.state.mod === p.mod && WS.assess.state.result;
    const R = A || scoreAttempt(p.mod, QUIZ[p.mod].map(q => q.a));
    const run = R.run, keys = Object.keys(run.res);
    const evacTarget = p.mod === 'fire' ? 30 : 20;
    const slow = run.evac > evacTarget;
    const items = keys.map(k => ({ l: run.res[k].label, ok: run.res[k].tries === 1 && run.res[k].viol === 0 }));
    items.push({ l: p.mod === 'fire' ? 'Evacuation speed' : 'Emergency reaction speed', ok: !slow, speed: true });
    const weak = items.filter(i => !i.ok);
    return `${appbar({ back: true, title: t('your_perf'), sub: t('m_' + p.mod).toUpperCase() })}
    <div class="scroll">
      <div class="row between"><div><div class="eyebrow">Result</div><div class="disp d-xl tnum" style="margin-top:6px">${R.total}%</div></div>${R.pass ? `<span class="pill ok">${ic('check')}Competent</span>` : `<span class="pill crit">${ic('x')}Retrain required</span>`}</div>
      <section><div class="eyebrow" style="margin-bottom:4px">${esc(t('your_perf'))}</div>
      <div class="list">${items.map(i => `<div class="li">${i.ok ? ic('check', 'c-green') : ic('warn', 'c-yellow')}<div class="lt"><b>${esc(i.l)}</b>${i.speed ? `<span>${mmss(run.evac)} · target ${mmss(evacTarget)}</span>` : ''}</div><span class="pill ${i.ok ? 'ok' : 'warn'}">${i.ok ? 'OK' : 'Improve'}</span></div>`).join('')}</div></section>
      ${slow ? `<div class="banner warn">${ic('clock')}<div><b>${p.mod === 'fire' ? 'Evacuation was slow' : 'Reaction was slow'}</b><p>${p.mod === 'fire' ? 'Your evacuation response was slower than the recommended target.' : 'Your emergency response took longer than the recommended target.'}</p></div></div>` : ''}
      ${weak.length ? `<div class="banner info">${ic('refresh')}<div><b>Recommendation</b><p>${p.mod === 'fire' ? 'Repeat the evacuation scenario.' : 'Repeat the emergency-response drill.'} A 3-minute refresher is available offline.</p></div></div>` : `<div class="banner ok">${ic('shield')}<div><b>Field ready</b><p>All competencies met on the first attempt.</p></div></div>`}
      <p class="mono small muted">${run.sim ? 'Sample run shown — complete the AR simulation to see your own data.' : `Recorded on device · ${S.online ? 'synced' : 'queued for sync'}`}</p>
    </div>
    ${foot(`<div class="btn-row"><button class="btn btn-secondary" data-act="practice" data-mod="${p.mod}">${ic('refresh')}${esc(t('practice_again'))}</button>${R.pass ? `<button class="btn btn-primary" data-go="certified" data-mod="${p.mod}">${esc(t('view_certification'))}</button>` : `<button class="btn btn-primary" data-act="retake" data-mod="${p.mod}">Retake</button>`}</div>`)}`;
  }
};

function certPaper(c) {
  const title = certTitle(c.mod);
  const prov = c.status === 'provisional';
  return `<div class="cert-paper"><div class="band"></div><div class="in">
    <div class="hd"><div><div class="org">JHARKHAND SAFETY AR</div><div class="lbl" style="margin-top:4px">Industrial safety training system</div></div>${BRAND_MARK.replace('class="brand-mark"', 'width="34" height="34"')}</div>
    <div class="ttl">Safety training certificate</div>
    <div class="grid">
      <div><div class="lbl">Worker</div><div class="val">${esc(c.worker)}</div></div>
      <div><div class="lbl">Worker ID</div><div class="val mono" style="font-size:13px">${esc(c.wid)}</div></div>
      <div style="grid-column:1/-1"><div class="lbl">Module</div><div class="val">${esc(title)}</div></div>
      <div><div class="lbl">Score</div><div class="val">${c.score}%</div></div>
      <div><div class="lbl">Issue date</div><div class="val">${esc(c.issued)}</div></div>
    </div>
    <div class="foot"><div class="qr">${qrSvg('JSAR:CERT:' + c.id)}</div>
      <div style="display:flex;flex-direction:column;gap:8px;min-width:0"><div><div class="lbl">Certificate ID</div><div class="val mono" style="font-size:13px">${esc(c.id)}</div></div>
      <div><div class="lbl">Valid until</div><div class="val">${esc(c.expires)}</div></div>
      <span class="stamp ${prov ? 'prov' : 'valid'}" style="animation:${c.fresh ? 'stampIn .5s cubic-bezier(.2,1.4,.4,1) both' : 'none'};transform:rotate(-3deg)">${prov ? 'PROVISIONAL' : '✓ VALID'}</span></div></div>
  </div><span class="wm">PROTOTYPE · SAMPLE DATA</span></div>`;
}

WS.certified = {
  render: p => {
    const c = S.certs.find(x => x.mod === p.mod) || S.certs[0];
    const prov = c.status === 'provisional';
    return `${appbar({ back: true, title: t('certified'), sub: c.id })}
    <div class="scroll">
      <div class="big-state"><div class="ring">${ic('check')}</div><div class="disp d-xl">✓ ${esc(t('certified'))}</div><p class="t2">${esc(t('m_' + p.mod))} · ${c.score}%</p></div>
      ${certPaper(c)}
      <dl class="kv panel pad"><dt>Status</dt><dd>${prov ? `<span class="pill warn">${ic('sync')}Pending sync</span>` : `<span class="pill ok">${ic('check')}${esc(t('valid'))}</span>`}</dd><dt>Valid until</dt><dd>${c.expires}</dd><dt>Stored</dt><dd>On device · offline</dd></dl>
      ${prov ? `<div class="banner off">${ic('wifiOff')}<div><b>Issued offline</b><p>Your result is saved. The certificate is registered and becomes verifiable as soon as the phone reconnects.</p></div></div>` : ''}
    </div>
    ${foot(`<button class="btn btn-primary btn-block" data-go="certview" data-id="${c.id}">${ic('cert')}${esc(t('view_cert'))}</button><div class="btn-row"><button class="btn btn-secondary btn-sm" data-go="verify" data-id="${c.id}">${ic('qr')}${esc(t('verify_qr'))}</button><button class="btn btn-secondary btn-sm" data-act="save-cert">${ic('save')}${esc(t('save_cert'))}</button></div>`)}`;
  },
  mount: () => { S.certs.forEach(c => { c.fresh = false; }); }
};

WS.certview = {
  render: p => {
    const c = S.certs.find(x => x.id === p.id) || S.certs[0];
    return `${appbar({ back: true, title: t('certificates'), sub: c.id })}
    <div class="scroll">${certPaper(c)}
      <p class="small t2">Anyone can check this certificate by scanning the QR code with the Jharkhand Safety AR app or the public verification page — no login needed.</p>
    </div>
    ${foot(`<div class="btn-row"><button class="btn btn-secondary btn-sm" data-go="verify" data-id="${c.id}">${ic('qr')}${esc(t('verify_qr'))}</button><button class="btn btn-secondary btn-sm" data-act="save-cert">${ic('save')}${esc(t('save_cert'))}</button></div>`)}`;
  }
};

WS.verify = {
  render: p => `${appbar({ back: true, title: t('verify_title'), sub: 'PUBLIC CHECK · NO LOGIN REQUIRED' })}
    <div class="scroll tight">${Scanner.markup(p.id)}</div>`,
  mount: (h, p) => Scanner.mount(p.id)
};

WS.certs = {
  chrome: { nav: 'certs' },
  render: () => `${appbar({ title: t('certificates'), sub: `${S.certs.length} EARNED · QR VERIFIABLE` })}
  <div class="scroll tight">
    ${S.certs.map(c => {
      const pill = c.status === 'valid' ? `<span class="pill ok">${ic('check')}${esc(t('valid'))}</span>` : c.status === 'expiring' ? `<span class="pill warn">${ic('clock')}Expiring</span>` : c.status === 'provisional' ? `<span class="pill info">${ic('sync')}Pending sync</span>` : `<span class="pill crit">${ic('x')}Expired</span>`;
      const pct = clamp(c.daysLeft / 365 * 100, 2, 100);
      return `<button class="cert-row" data-go="certview" data-id="${c.id}">
        <div><div class="disp d-s">${esc(certTitle(c.mod))}</div><div class="mono small muted" style="margin-top:4px">${c.id}</div></div>
        <div style="text-align:right">${pill}<div class="disp d-m tnum" style="margin-top:6px">${c.score}%</div></div>
        <div class="validity"><div class="row between mono small" style="margin-bottom:6px"><span class="muted">Issued ${c.issued}</span><span>${c.status === 'expiring' ? `<b class="c-yellow">${c.daysLeft} days left</b>` : `Expires ${c.expires}`}</span></div><div class="bar thin ${c.status === 'expiring' ? '' : 'ok'}"><i style="width:${pct}%"></i></div></div>
      </button>`;
    }).join('')}
    <div class="banner info">${ic('refresh')}<div><b>Renewal</b><p>Certificates are valid for 12 months. You'll get a reminder 30 days before expiry, and your supervisor sees it too.</p></div></div>
    <button class="btn btn-secondary btn-block" data-go="verify">${ic('qr')}Verify someone else's certificate</button>
  </div>`
};

WS.profile = {
  chrome: { nav: 'profile' },
  render: () => {
    const w = S.worker, dc = doneCount();
    return `${appbar({ title: t('profile'), sub: w.id })}
    <div class="scroll">
      <div class="row"><span class="avatar-i" style="width:64px;height:64px;font-size:20px;background:var(--yellow);color:var(--yellow-ink);border:0;font-weight:700">${w.name.split(' ').map(x => x[0]).join('').slice(0, 2)}</span>
        <div class="grow"><div class="disp d-m">${esc(w.name)}</div><div class="mono small muted" style="margin-top:4px">${esc(w.role)} · ${esc(w.site)}</div></div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="panel pad"><div class="eyebrow">Training</div><div class="disp d-l tnum" style="margin-top:6px">${dc} / 5</div><div class="bar thin ok" style="margin-top:8px"><i style="width:${dc * 20}%"></i></div></div>
        <div class="panel pad"><div class="eyebrow">Certificates</div><div class="disp d-l tnum" style="margin-top:6px">${S.certs.length}</div><div class="mono small muted" style="margin-top:6px">${S.certs.filter(c => c.status === 'expiring').length} expiring</div></div>
      </div>
      <dl class="kv"><dt>Worker ID</dt><dd class="mono">${esc(w.id)}</dd><dt>Facility</dt><dd>${esc(w.site)}</dd><dt>Role</dt><dd>${esc(w.role)}</dd><dt>Experience</dt><dd>${esc(w.exp)}</dd><dt>Language</dt><dd>${{ en: 'English', hi: 'हिंदी', sat: 'ᱥᱟᱱᱛᱟᱲᱤ' }[S.lang]}</dd></dl>
      <section class="panel pad" style="display:flex;flex-direction:column;gap:10px">
        <div class="row between"><span class="eyebrow">Offline sync</span>${netPill()}</div>
        <div class="row between small"><span class="muted">${esc(t('pending_sync'))}</span><b class="tnum">${S.pending} ${esc(t('records'))}</b></div>
        <div class="row between small"><span class="muted">${esc(t('last_sync'))}</span><b>${esc(S.lastSync)}</b></div>
        <div class="row between small"><span class="muted">Offline content</span><b>2 modules · 214 MB</b></div>
      </section>
      <section><div class="eyebrow" style="margin-bottom:4px">Recent activity</div><div class="list">${S.activity.slice(0, 4).map(a => `<div class="li">${ic(a.tone === 'ok' ? 'check' : a.tone === 'warn' ? 'warn' : 'info', a.tone === 'ok' ? 'c-green' : a.tone === 'warn' ? 'c-yellow' : 'c-blue')}<div class="lt"><b>${esc(a.t)}</b><span>${esc(a.s)}</span></div><span class="mono small muted">${a.d}</span></div>`).join('')}</div></section>
      <section><div class="eyebrow" style="margin-bottom:8px">${esc(t('settings'))}</div>
        <div class="field" style="margin-bottom:6px"><label>${esc(t('language'))}</label><div class="choice-grid" style="grid-template-columns:repeat(3,1fr)">${[['en', 'English'], ['hi', 'हिंदी'], ['sat', 'ᱥᱟᱱᱛᱟᱲᱤ']].map(([k, l]) => `<button class="choice" data-act="set-lang" data-lang="${k}" aria-pressed="${S.lang === k}">${l}</button>`).join('')}</div></div>
        <div class="list">
          ${[['voice', 'speaker', t('voice'), 'Spoken instructions in every mission'], ['largeText', 'text', t('access') + ' · Large text', 'Bigger text in lists and AR prompts'], ['haptics', 'phone', 'Haptic feedback', 'Vibrate on hazard detection and errors']].map(([k, i, l, d]) => `<div class="li">${ic(i)}<div class="lt"><b>${esc(l)}</b><span>${d}</span></div><button class="toggle" data-act="toggle" data-k="${k}" aria-pressed="${S[k]}" aria-label="${esc(l)}"></button></div>`).join('')}
        </div></section>
    </div>`;
  }
};

/* ---------- sync sheet ---------- */
function openSyncSheet() {
  const host = $('#dev-screen'); if (!host) return;
  const el = document.createElement('div');
  el.className = 'scrim';
  el.innerHTML = `<div class="sheet-panel" role="dialog" aria-label="Sync status"><div class="grab"></div>
    <div class="row between"><h2 class="disp d-m">${S.online ? 'Connected' : esc(t('offline_enabled'))}</h2>${netPill()}</div>
    <p class="t2">${S.online ? 'Results and certificates sync automatically in the background.' : esc(t('offline_msg'))}</p>
    <dl class="kv panel pad"><dt>${esc(t('pending_sync'))}</dt><dd>${S.pending} ${esc(t('records'))}</dd><dt>${esc(t('last_sync'))}</dt><dd>${esc(S.lastSync)}</dd><dt>Training content</dt><dd class="c-green">Available offline</dd></dl>
    ${S.pending ? `<div class="list">${Array.from({ length: Math.min(S.pending, 4) }, (_, i) => `<div class="li" style="min-height:48px;padding:8px 0">${ic('file')}<div class="lt"><b style="font-size:14px">${['Assessment result · Fire & Explosion', 'Certificate · Fire & Explosion', 'Practice run log · 24 Sep', 'Profile update'][i]}</b></div><span class="pill ${S.online ? 'info' : 'haz'}">${S.online ? 'Queued' : 'Waiting'}</span></div>`).join('')}</div>` : ''}
    <button class="btn ${S.online ? 'btn-secondary' : 'btn-primary'} btn-block" data-act="sheet-net">${S.online ? ic('wifiOff') + 'Simulate network loss' : ic('wifi') + 'Simulate network return'}</button>
    <button class="btn btn-ghost btn-block btn-sm" data-act="close-sheet">Close</button></div>`;
  el.addEventListener('click', e => { if (e.target === el) el.remove(); });
  host.appendChild(el);
}

function setOnline(v) {
  if (v === S.online) return;
  S.online = v;
  if (v && S.pending > 0) {
    S.syncing = true;
    refreshNet();
    setTimeout(() => {
      const n = S.pending;
      S.syncing = false; S.pending = 0; S.lastSync = 'Today, ' + clock();
      S.certs.forEach(c => { if (c.status === 'provisional') c.status = 'valid'; });
      WORKERS[0].sync = 'synced'; WORKERS[0].last = 'Today'; WORKERS[0].lastN = 0;
      SYNC_FEED.unshift({ t: clock(), w: S.worker.name, s: S.worker.site, r: `${n} records · results & certificates` });
      toast(`✓ ${n} records synchronized`, 'Results and certificates are now on the compliance server.', 'ok');
      refreshNet(true);
    }, 1800);
  } else {
    toast(v ? 'Back online' : 'Offline — training continues', v ? 'Nothing waiting to sync.' : 'Results are stored on this phone and sync later.', v ? 'ok' : 'haz');
  }
  refreshNet(true);
}
function refreshNet(full) {
  Shell.updateSide();
  if (S.mode !== 'worker') return;
  const sheet = $('#dev-screen .scrim');
  if (AR.on) return;
  if (full && !sheet && ['home', 'profile', 'certs', 'certified'].includes(W.cur)) { const st = $('#dev-screen .scroll')?.scrollTop; W.render(); const sc = $('#dev-screen .scroll'); if (sc && st) sc.scrollTop = st; return; }
  W.refreshChrome();
  if (sheet) { sheet.remove(); openSyncSheet(); }
}

/* ---------- worker actions ---------- */
const WACT = {
  'splash-next': () => { if (W.cur === 'splash') W.go('lang', {}, { replace: true }); },
  'set-lang': el => { setLang(el.dataset.lang); W.render(); Shell.renderSide(); },
  'reg1-next': () => {
    S.worker.name = $('#f-name').value.trim() || S.worker.name;
    S.worker.first = S.worker.name.split(' ')[0];
    S.worker.id = $('#f-id').value.trim() || S.worker.id;
    S.worker.site = $('#f-site').value; S.worker.role = $('#f-role').value;
    W.go('reg2');
  },
  exp: el => { S.worker.exp = el.dataset.v; W.render(); },
  'reg-done': () => { W.tab('home'); toast('Safety profile created', S.online ? 'Synced to your site safety office.' : 'Saved on this phone — syncs when online.', 'ok'); },
  locked: () => toast('Coming soon', 'This safety domain is in development. Classroom version available from your safety officer.', 'info'),
  net: () => openSyncSheet(),
  'sheet-net': () => { $('#dev-screen .scrim')?.remove(); setOnline(!S.online); },
  'close-sheet': () => $('#dev-screen .scrim')?.remove(),
  toggle: el => { const k = el.dataset.k; S[k] = !S[k]; el.setAttribute('aria-pressed', S[k]); if (k === 'largeText') $('#dev-screen').classList.toggle('large-text', S.largeText); },
  toast: el => toast(el.dataset.title, el.dataset.msg, 'info'),
  'q-pick': el => { const A = WS.assess.state; A.picks[A.q] = +el.dataset.i; WS.assess.draw(); },
  'q-next': () => {
    const A = WS.assess.state;
    if (A.q < QUIZ[A.mod].length - 1) { A.q++; WS.assess.draw(); return; }
    A.result = finishAssessment(A.mod, A.picks); A.phase = 'result'; WS.assess.draw(); Shell.updateSide();
    toast(A.result.pass ? 'Assessment passed' : 'Assessment not passed', A.result.pass ? (S.online ? 'Certificate issued.' : 'Certificate issued offline — pending sync.') : 'Review your mistakes and practise again.', A.result.pass ? 'ok' : 'warn');
  },
  practice: el => { S.lastResult = null; S.retraining = true; W.go('calib', { mod: el.dataset.mod }); },
  retake: el => { WS.assess.state = null; W.go('assess', { mod: el.dataset.mod }, { replace: true }); },
  'save-cert': () => toast('Certificate saved', 'Stored in the app and in Downloads as a PDF. Available offline.', 'ok'),
  'ar-exit': () => AR.confirmExit()
};

function bindDevice(host, acts) {
  host.addEventListener('click', e => {
    const sp = e.target.closest('[data-speak]');
    if (sp) { speak(sp.dataset.speak, sp); return; }
    const a = e.target.closest('[data-act]');
    if (a && host.contains(a)) { const fn = acts[a.dataset.act] || WACT[a.dataset.act]; if (fn) { fn(a, e); return; } }
    const g = e.target.closest('[data-go]');
    if (g && !g.disabled) {
      const p = { ...g.dataset }; delete p.go;
      if (S.mode === 'worker') { if (g.dataset.go === 'assess') WS.assess.state = null; W.go(g.dataset.go, p); }
      else Sup.go(g.dataset.go, p);
      return;
    }
    const tb = e.target.closest('[data-tab]');
    if (tb) { S.mode === 'worker' ? W.tab(tb.dataset.tab) : Sup.tab(tb.dataset.tab); return; }
    if (e.target.closest('[data-back]')) { S.mode === 'worker' ? W.back() : Sup.back(); }
  });
}

/* ---------- QR scanner (shared by worker + supervisor) ---------- */
const Scanner = {
  samples() {
    const own = S.certs.filter(c => c.mod !== 'induction').map(c => ({ id: c.id, b: c.worker, s: certTitle(c.mod) }));
    return [...own,
      { id: 'JH-FR-2026-00377', b: 'Sunita Hansda', s: 'Fire · valid' },
      { id: 'JH-FR-2025-01144', b: 'Mahesh Mahato', s: 'Fire · expired' },
      { id: 'JH-GS-2026-00212', b: 'Arjun Tudu', s: 'Gas · revoked' },
      { id: 'JH-XX-0000-99999', b: 'Unknown code', s: 'Not in registry' }];
  },
  markup(pre) {
    return `<div class="row between"><h1 class="disp d-m">${esc(t('verify_title'))}</h1><span class="pill ok">${ic('lock')}No login</span></div>
      <div class="scanner" id="scn"><div class="target" id="scn-t"></div><div class="frame"><i></i><i></i><i></i><i></i><div class="line"></div></div><div class="cap">${esc(t('verify_msg'))}</div></div>
      <div class="eyebrow">Simulate a scan — choose a certificate</div>
      <div class="scan-samples">${this.samples().map(s => `<button data-scan="${s.id}" aria-pressed="${s.id === pre}"><b>${esc(s.b)}</b><span>${esc(s.s)}</span></button>`).join('')}</div>
      <form class="row" id="scn-form" autocomplete="off"><input class="input mono" id="scn-id" placeholder="Or type certificate ID" style="height:48px;font-size:15px"><button class="btn btn-secondary btn-sm" style="min-height:48px">Check</button></form>
      <div id="scn-out"></div>`;
  },
  mount(pre) {
    const root = $('#scn')?.closest('.scroll'); if (!root) return;
    root.addEventListener('click', e => { const b = e.target.closest('[data-scan]'); if (b) { $$('[data-scan]', root).forEach(x => x.setAttribute('aria-pressed', x === b)); this.run(b.dataset.scan); } });
    $('#scn-form').addEventListener('submit', e => { e.preventDefault(); const v = $('#scn-id').value.trim().toUpperCase(); if (v) this.run(v); });
    if (pre) setTimeout(() => this.run(pre), 400);
  },
  lookup(id) {
    const own = S.certs.find(c => c.id === id);
    if (own) return { ...own, site: S.worker.site };
    return REGISTRY[id] ? { id, ...REGISTRY[id] } : null;
  },
  run(id) {
    const sc = $('#scn'), tg = $('#scn-t'), out = $('#scn-out');
    if (!sc) return;
    sc.classList.remove('hit'); tg.innerHTML = qrSvg('JSAR:CERT:' + id); out.innerHTML = `<div class="row mono small muted">${ic('sync')} Reading code…</div>`;
    clearTimeout(this.tm);
    this.tm = setTimeout(() => {
      sc.classList.add('hit');
      const c = this.lookup(id);
      let tone, title, sub, icon;
      if (!c) { tone = 'warn'; icon = 'warn'; title = 'NOT FOUND'; sub = 'This code is not in the certificate registry. Do not allow site access on this certificate.'; }
      else if (c.status === 'revoked') { tone = 'bad'; icon = 'octa'; title = 'CERTIFICATE REVOKED'; sub = c.reason || 'Revoked by the issuing safety office.'; }
      else if (c.status === 'expired') { tone = 'bad'; icon = 'x'; title = 'CERTIFICATE EXPIRED'; sub = `Expired ${c.expires}. Worker must renew before hazardous work.`; }
      else if (c.status === 'provisional') { tone = 'warn'; icon = 'sync'; title = 'PENDING SYNC'; sub = 'Issued offline on the worker’s phone. Registry confirmation arrives after sync.'; }
      else { tone = 'ok'; icon = 'check'; title = '✓ CERTIFICATE VERIFIED'; sub = c.status === 'expiring' ? `Valid · expires in ${c.daysLeft} days` : 'Signature valid · not revoked'; }
      const via = (S.mode === 'worker' ? S.online : Sup.online) ? 'Online registry check' : 'Offline signature check · revocation list 2 h old';
      out.innerHTML = `<div class="verdict ${tone}"><div class="vh">${ic(icon)}<div><b>${title}</b><span>${esc(sub)}</span></div></div>
        ${c ? `<dl class="kv"><dt>Worker</dt><dd>${esc(c.worker)}</dd><dt>Worker ID</dt><dd class="mono">${esc(c.wid)}</dd><dt>Training</dt><dd>${esc(certTitle(c.mod))}</dd><dt>Score</dt><dd>${c.score}%</dd><dt>Issue date</dt><dd>${esc(c.issued)}</dd><dt>Valid until</dt><dd>${esc(c.expires)}</dd><dt>Certificate ID</dt><dd class="mono">${esc(c.id)}</dd><dt>Status</dt><dd>${{ valid: '<span class="pill ok">Valid</span>', expiring: '<span class="pill warn">Expiring</span>', expired: '<span class="pill crit">Expired</span>', revoked: '<span class="pill crit">Revoked</span>', provisional: '<span class="pill info">Pending sync</span>' }[c.status]}</dd><dt>Issuer</dt><dd>Jharkhand Safety AR · Training Authority</dd><dt>Checked</dt><dd class="mono small">${via}</dd></dl>` : `<dl class="kv"><dt>Scanned ID</dt><dd class="mono">${esc(id)}</dd><dt>Checked</dt><dd class="mono small">${via}</dd></dl>`}</div>`;
      if (S.mode === 'supervisor') Sup.logScan(id, c, title);
    }, 1100);
  }
};
