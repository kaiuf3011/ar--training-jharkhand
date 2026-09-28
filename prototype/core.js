'use strict';
/* =================================================================
   CORE — helpers, icons, shared state, i18n, sample data, voice, QR
   ================================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Number(n).toLocaleString('en-IN');
const pad2 = n => String(n).padStart(2, '0');
const mmss = s => `${pad2(Math.floor(s / 60))}:${pad2(Math.floor(s % 60))}`;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const store = {
  get(k, d) { try { const v = localStorage.getItem('jsar.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('jsar.' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
};

const ICONS = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  helmet: '<path d="M3 18h18"/><path d="M5 18v-2a7 7 0 0 1 14 0v2"/><path d="M10 9.5V5.5h4v4"/>',
  cert: '<rect x="3.5" y="3" width="17" height="13" rx="1"/><path d="M7.5 7h9M7.5 10.5h5"/><circle cx="16" cy="16.5" r="2.8"/><path d="M14.4 18.8 13.8 22l2.2-1.1 2.2 1.1-.6-3.2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  speaker: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
  fire: '<path d="M12 22c4 0 7-2.7 7-6.8 0-3.2-2-5.6-3.6-7.2-.3 1.9-1.3 3.2-2.4 3.7C13.4 8 12.6 5 10 2.5c-.2 3.3-2 5.3-3.5 7.2C5.6 11 5 12.8 5 15.2 5 19.3 8 22 12 22z"/>',
  gas: '<path d="M6.5 18a4 4 0 0 1-.4-8A6 6 0 0 1 17.6 9a4.5 4.5 0 0 1-.1 9z"/><path d="M9 21h.01M12.5 21.5h.01M16 21h.01"/><path d="M12 11v3M12 16.2v.01"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/><circle cx="12" cy="12" r="7"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  vest: '<path d="M8.5 3 5 5v16h5.5v-7h3v7H19V5l-3.5-2L14 7h-4z"/><path d="M5 12h5.5M13.5 12H19"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  warn: '<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.5M12 17.2v.01"/>',
  octa: '<path d="M8 3h8l5 5v8l-5 5H8l-5-5V8z"/><path d="M12 8v5M12 16v.01"/>',
  wifi: '<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.2" r=".9"/>',
  wifiOff: '<path d="M2 9a15 15 0 0 1 5-3.2M11 5a15 15 0 0 1 11 4M5 12.5a10 10 0 0 1 4-2.2M15.5 10.8a10 10 0 0 1 3.5 1.7M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.2" r=".9"/><path d="M3 3l18 18"/>',
  sync: '<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4"/>',
  qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v.01M14 20.5h.01M17.5 17.5H21V21h-3.5z"/>',
  camera: '<path d="M3 7h4l2-3h6l2 3h4v13H3z"/><circle cx="12" cy="13" r="4"/>',
  chevR: '<path d="M9 5l7 7-7 7"/>',
  chevL: '<path d="M15 5l-7 7 7 7"/>',
  arrowR: '<path d="M4 12h16M14 6l6 6-6 6"/>',
  lock: '<rect x="4.5" y="11" width="15" height="10" rx="1"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pin: '<path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 13.5a7 7 0 0 1 4 6.5"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
  download: '<path d="M12 3v12M6 10l6 6 6-6M4 21h16"/>',
  bell: '<path d="M6 9a6 6 0 0 1 12 0c0 6 3 8 3 8H3s3-2 3-8"/><path d="M10 21a2 2 0 0 0 4 0"/>',
  chart: '<path d="M3 21h18"/><path d="M6 17v-6M11 17V6M16 17v-4M20.5 17V9"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  file: '<path d="M6 2h8l5 5v15H6z"/><path d="M14 2v5h5M9 13h7M9 17h7"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  radio: '<rect x="6" y="8" width="12" height="14" rx="1"/><path d="M9 8l6-6M9 13h6M9 17h2"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  mic: '<path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  hand: '<path d="M8 13V5a1.5 1.5 0 0 1 3 0v6M11 11V4a1.5 1.5 0 0 1 3 0v7M14 11V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7c-3 0-4.5-1.5-6-4l-2-4a1.5 1.5 0 0 1 2.5-1.5L8 15"/>',
  siren: '<path d="M6 18v-6a6 6 0 0 1 12 0v6"/><path d="M4 18h16v3H4zM12 2v2M4.2 5.2l1.4 1.4M19.8 5.2l-1.4 1.4"/>',
  exit: '<path d="M14 3h6v18h-6"/><path d="M3 12h12M11 8l4 4-4 4"/>',
  building: '<path d="M3 21h18M5 21V8l6-4v17M11 21V10l8 3v8"/><path d="M8 11v.01M8 15v.01M15 15v.01M15 18v.01"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
  book: '<path d="M4 4h6a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3"/><path d="M20 4v15h-7"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  layers: '<path d="M12 3 2 8l10 5 10-5z"/><path d="M2 13l10 5 10-5"/>',
  route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h8a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h8"/>',
  mapPin: '<path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
  save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
  logout: '<path d="M10 3H4v18h6"/><path d="M20 12H9M16 8l4 4-4 4"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  text: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
  edit: '<path d="M4 20h4L20 8l-4-4L4 16z"/>',
  more: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="1"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>'
};
const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

const BRAND_MARK = `<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="3" fill="#F2C230"/><path d="M6 22h20" stroke="#1A1500" stroke-width="2.4" stroke-linecap="round"/><path d="M8.5 22v-2.2a7.5 7.5 0 0 1 15 0V22" fill="none" stroke="#1A1500" stroke-width="2.4"/><path d="M14 13V9h4v4" fill="none" stroke="#1A1500" stroke-width="2.2"/><path d="M4 4h4M4 4v4M28 4h-4M28 4v4M4 28h4M4 28v-4M28 28h-4M28 28v-4" stroke="#1A1500" stroke-width="1.6"/></svg>`;

/* ---------------------------------------------------------------
   Shared product state (one connected system across all 3 apps)
   --------------------------------------------------------------- */
const TODAY = new Date(2026, 8, 26);
const S = {
  mode: store.get('mode', 'worker'),
  lang: store.get('lang', 'en'),
  online: false,               // worker starts underground — offline
  pending: 3,
  lastSync: 'Yesterday, 18:42',
  voice: true,
  largeText: false,
  haptics: true,
  worker: { name: 'Rahul Kumar', first: 'Rahul', id: 'JH-DHN-04821', site: 'Dhanbad Mine', role: 'Mine Operator', exp: '3–5 years', shift: 'Shift B' },
  modules: {
    fire: { status: 'progress', progress: 87, score: null, attempts: 0 },
    gas: { status: 'done', progress: 100, score: 92, attempts: 1 },
    mach: { status: 'locked' }, elec: { status: 'locked' }, ppe: { status: 'locked' }
  },
  certs: [
    { id: 'JH-GS-2026-00398', mod: 'gas', worker: 'Rahul Kumar', wid: 'JH-DHN-04821', score: 92, issued: '25 Sep 2026', expires: '25 Sep 2027', status: 'valid', daysLeft: 364 },
    { id: 'JH-IN-2025-11873', mod: 'induction', worker: 'Rahul Kumar', wid: 'JH-DHN-04821', score: 81, issued: '14 Oct 2025', expires: '14 Oct 2026', status: 'expiring', daysLeft: 18 }
  ],
  activity: [
    { d: '25 Sep', t: 'Gas Leak & Confined Space', s: 'Passed — 92%', tone: 'ok' },
    { d: '24 Sep', t: 'Fire & Explosion — practice run', s: 'Missions 1–3 · offline', tone: 'info' },
    { d: '23 Sep', t: 'Orientation', s: 'Completed', tone: 'ok' }
  ],
  lastResult: null
};

const MODS = [
  { key: 'fire', n: '01', icon: 'fire', dur: 12, level: 'Intermediate', live: true },
  { key: 'gas', n: '02', icon: 'gas', dur: 14, level: 'Intermediate', live: true },
  { key: 'mach', n: '03', icon: 'gear', dur: 10, level: 'Foundation', live: false },
  { key: 'elec', n: '04', icon: 'bolt', dur: 11, level: 'Intermediate', live: false },
  { key: 'ppe', n: '05', icon: 'vest', dur: 8, level: 'Foundation', live: false }
];

/* ---------------------------------------------------------------
   i18n — English · हिंदी · ᱥᱟᱱᱛᱟᱲᱤ (Ol Chiki)
   Santali strings are draft copy pending native-speaker review;
   anything untranslated falls back to English (mirrors Admin ›
   Localization coverage).
   --------------------------------------------------------------- */
const I18N = {
  en: {
    tagline: 'Learn. Practice. Respond. Stay Safe.', sys: 'INDUSTRIAL SAFETY\nTRAINING SYSTEM', offline_first: 'OFFLINE-FIRST TRAINING',
    choose_lang: 'Choose your language', listen: 'Listen', listen_instr: 'Listen to instructions', cont: 'Continue',
    home: 'Home', training: 'Training', certificates: 'Certificates', profile: 'Profile',
    online: 'ONLINE', offline: 'OFFLINE',
    gm: 'Good morning, {n}.', ga: 'Good afternoon, {n}.', ge: 'Good evening, {n}.',
    training_progress: 'Training progress', modules_complete: 'modules complete', continue_training: 'Continue training', all_modules: 'All safety modules',
    m_fire: 'Fire & Explosion Response', m_gas: 'Gas Leak & Confined Space', m_mach: 'Machinery Safety', m_elec: 'Electrical Safety', m_ppe: 'PPE & General Safety', m_induction: 'Site Induction (Classroom)',
    d_fire: 'Identify fire hazards, select the right extinguisher and evacuate safely.',
    d_gas: 'Recognise toxic gas zones, wear the right PPE and never enter alone.',
    d_mach: 'Lock-out/tag-out, guarding and safe distances around moving machinery.',
    d_elec: 'Isolation, arc-flash boundaries and safe work on electrical systems.',
    d_ppe: 'Choosing, checking and wearing PPE for every task on site.',
    st_done: 'Completed', st_progress: 'In progress', st_locked: 'Coming soon', st_new: 'Not started',
    start_training: 'Start training', review: 'Review', score: 'Score', min: 'min', cont_btn: 'Continue',
    start_ar: 'Start AR training', mission: 'Mission', objectives: 'Mission objectives', est_time: 'Estimated time', difficulty: 'Difficulty', assessment: 'Assessment',
    offline_enabled: 'Offline training enabled', offline_msg: 'Training results will be synchronized automatically when connectivity returns.',
    pending_sync: 'Pending sync', last_sync: 'Last synchronization', records: 'records',
    prepare_env: 'Prepare your environment', calib_msg: 'Move your phone slowly and scan the floor and surrounding surfaces.',
    begin_sim: 'Begin simulation', ar_ready: 'AR environment ready',
    certified: 'Certified', view_cert: 'View certificate', verify_qr: 'Verify QR', save_cert: 'Save certificate',
    verify_title: 'Verify safety certificate', verify_msg: 'Point the camera at the certificate QR code.',
    practice_again: 'Practice again', view_certification: 'View certification', your_perf: 'Your performance',
    settings: 'Settings', language: 'Language', voice: 'Voice instructions', access: 'Accessibility',
    correct: 'Correct', incorrect: 'Incorrect', retry: 'Try again', valid: 'Valid'
  },
  hi: {
    tagline: 'सीखें। अभ्यास करें। प्रतिक्रिया दें। सुरक्षित रहें।', sys: 'औद्योगिक सुरक्षा\nप्रशिक्षण प्रणाली', offline_first: 'ऑफ़लाइन-फ़र्स्ट प्रशिक्षण',
    choose_lang: 'भाषा चुनें', listen: 'सुनें', listen_instr: 'निर्देश सुनें', cont: 'आगे बढ़ें',
    home: 'होम', training: 'प्रशिक्षण', certificates: 'प्रमाणपत्र', profile: 'प्रोफ़ाइल',
    online: 'ऑनलाइन', offline: 'ऑफ़लाइन',
    gm: 'सुप्रभात, {n}।', ga: 'नमस्ते, {n}।', ge: 'शुभ संध्या, {n}।',
    training_progress: 'प्रशिक्षण प्रगति', modules_complete: 'मॉड्यूल पूर्ण', continue_training: 'प्रशिक्षण जारी रखें', all_modules: 'सभी सुरक्षा मॉड्यूल',
    m_fire: 'आग और विस्फोट प्रतिक्रिया', m_gas: 'गैस रिसाव और सीमित स्थान', m_mach: 'मशीनरी सुरक्षा', m_elec: 'विद्युत सुरक्षा', m_ppe: 'पीपीई और सामान्य सुरक्षा', m_induction: 'साइट इंडक्शन (कक्षा)',
    d_fire: 'आग के खतरे पहचानें, सही अग्निशामक चुनें और सुरक्षित निकलें।',
    d_gas: 'ज़हरीली गैस का क्षेत्र पहचानें, सही पीपीई पहनें और कभी अकेले प्रवेश न करें।',
    d_mach: 'लॉक-आउट/टैग-आउट, गार्डिंग और चलती मशीनों से सुरक्षित दूरी।',
    d_elec: 'आइसोलेशन, आर्क-फ़्लैश सीमा और बिजली पर सुरक्षित काम।',
    d_ppe: 'हर काम के लिए पीपीई चुनना, जाँचना और पहनना।',
    st_done: 'पूर्ण', st_progress: 'जारी', st_locked: 'जल्द आ रहा है', st_new: 'शुरू नहीं',
    start_training: 'प्रशिक्षण शुरू करें', review: 'समीक्षा', score: 'अंक', min: 'मिनट', cont_btn: 'आगे बढ़ें',
    start_ar: 'AR प्रशिक्षण शुरू करें', mission: 'मिशन', objectives: 'मिशन उद्देश्य', est_time: 'अनुमानित समय', difficulty: 'कठिनाई', assessment: 'मूल्यांकन',
    offline_enabled: 'ऑफ़लाइन प्रशिक्षण चालू है', offline_msg: 'नेटवर्क वापस आने पर प्रशिक्षण परिणाम अपने-आप सिंक हो जाएंगे।',
    pending_sync: 'सिंक बाकी', last_sync: 'पिछला सिंक', records: 'रिकॉर्ड',
    prepare_env: 'अपना वातावरण तैयार करें', calib_msg: 'फ़ोन को धीरे-धीरे घुमाएँ और फ़र्श व आसपास की सतहों को स्कैन करें।',
    begin_sim: 'सिमुलेशन शुरू करें', ar_ready: 'AR वातावरण तैयार',
    certified: 'प्रमाणित', view_cert: 'प्रमाणपत्र देखें', verify_qr: 'QR सत्यापित करें', save_cert: 'प्रमाणपत्र सहेजें',
    verify_title: 'सुरक्षा प्रमाणपत्र सत्यापित करें', verify_msg: 'कैमरे को प्रमाणपत्र के QR कोड पर रखें।',
    practice_again: 'फिर से अभ्यास करें', view_certification: 'प्रमाणपत्र देखें', your_perf: 'आपका प्रदर्शन',
    settings: 'सेटिंग्स', language: 'भाषा', voice: 'आवाज़ निर्देश', access: 'सुगम्यता',
    correct: 'सही', incorrect: 'गलत', retry: 'फिर से कोशिश करें', valid: 'मान्य'
  },
  sat: {
    tagline: 'ᱪᱮᱫ ᱢᱮ᱾ ᱟᱵᱷᱭᱟᱥ ᱢᱮ᱾ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱛᱟᱦᱮᱸᱱ ᱢᱮ᱾', offline_first: 'ᱚᱯᱷᱞᱟᱭᱤᱱ ᱥᱮᱪᱮᱫ',
    choose_lang: 'ᱯᱟᱹᱨᱥᱤ ᱵᱟᱪᱷᱟᱣ ᱢᱮ', listen: 'ᱟᱸᱡᱚᱢ ᱢᱮ', listen_instr: 'ᱦᱩᱠᱩᱢ ᱟᱸᱡᱚᱢ ᱢᱮ', cont: 'ᱞᱟᱦᱟᱜ ᱢᱮ',
    home: 'ᱚᱲᱟᱜ', training: 'ᱥᱮᱪᱮᱫ', certificates: 'ᱥᱟᱹᱠᱷᱭᱟᱹᱛ', profile: 'ᱯᱨᱚᱯᱷᱟᱭᱤᱞ',
    online: 'ᱚᱱᱞᱟᱭᱤᱱ', offline: 'ᱚᱯᱷᱞᱟᱭᱤᱱ',
    gm: 'ᱥᱮᱛᱟᱜ ᱡᱚᱦᱟᱨ, {n}᱾', ga: 'ᱡᱚᱦᱟᱨ, {n}᱾', ge: 'ᱟᱭᱩᱵ ᱡᱚᱦᱟᱨ, {n}᱾',
    training_progress: 'ᱥᱮᱪᱮᱫ ᱞᱟᱦᱟᱱᱛᱤ', modules_complete: 'ᱢᱳᱰᱩᱞ ᱯᱩᱨᱟᱹᱣ', continue_training: 'ᱥᱮᱪᱮᱫ ᱞᱟᱦᱟᱜ ᱢᱮ', all_modules: 'ᱡᱚᱛᱚ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱢᱳᱰᱩᱞ',
    m_fire: 'ᱥᱮᱸᱜᱮᱞ ᱟᱨ ᱵᱤᱥᱯᱷᱚᱴ', m_gas: 'ᱜᱮᱥ ᱞᱤᱠ ᱟᱨ ᱵᱚᱸᱫ ᱡᱟᱭᱜᱟ', m_mach: 'ᱢᱥᱤᱱ ᱨᱩᱠᱷᱤᱭᱟᱹ', m_elec: 'ᱵᱤᱡᱞᱤ ᱨᱩᱠᱷᱤᱭᱟᱹ', m_ppe: 'PPE ᱟᱨ ᱥᱟᱫᱷᱟᱨᱚᱬ ᱨᱩᱠᱷᱤᱭᱟᱹ',
    st_done: 'ᱯᱩᱨᱟᱹᱣ', st_progress: 'ᱪᱟᱹᱞᱩ', st_locked: 'ᱡᱟᱞᱫᱤ ᱦᱤᱡᱩᱜ-ᱟ',
    start_training: 'ᱥᱮᱪᱮᱫ ᱮᱛᱦᱚᱵ ᱢᱮ', review: 'ᱧᱮᱞ ᱨᱩᱣᱟᱹᱲ', score: 'ᱱᱟᱢᱵᱚᱨ', min: 'ᱴᱤᱯᱤᱡ', cont_btn: 'ᱞᱟᱦᱟᱜ ᱢᱮ',
    start_ar: 'AR ᱥᱮᱪᱮᱫ ᱮᱛᱦᱚᱵ ᱢᱮ', mission: 'ᱢᱤᱥᱚᱱ',
    offline_enabled: 'ᱚᱯᱷᱞᱟᱭᱤᱱ ᱥᱮᱪᱮᱫ ᱪᱟᱹᱞᱩ ᱢᱮᱱᱟᱜ-ᱟ',
    begin_sim: 'ᱥᱤᱢᱩᱞᱮᱥᱚᱱ ᱮᱛᱦᱚᱵ ᱢᱮ',
    certified: 'ᱥᱟᱹᱠᱷᱭᱟᱹᱛ ᱧᱟᱢ ᱮᱱᱟ', view_cert: 'ᱥᱟᱹᱠᱷᱭᱟᱹᱛ ᱧᱮᱞ ᱢᱮ',
    settings: 'ᱥᱟᱡᱟᱣ', language: 'ᱯᱟᱹᱨᱥᱤ',
    correct: 'ᱴᱷᱤᱠ', incorrect: 'ᱵᱷᱩᱞ', retry: 'ᱫᱚᱦᱲᱟ ᱠᱩᱨᱩᱢᱩᱴᱩ ᱢᱮ', valid: 'ᱴᱷᱤᱠ ᱜᱮᱭᱟ'
  }
};
function t(k, vars) {
  let s = (I18N[S.lang] && I18N[S.lang][k]) ?? I18N.en[k] ?? k;
  if (vars) for (const v in vars) s = s.replace('{' + v + '}', vars[v]);
  return s;
}
/* L() picks a localized string from an inline {en, hi, sat} object */
const L = o => (typeof o === 'string' ? o : (o[S.lang] ?? o.en));
function setLang(l) { S.lang = l; store.set('lang', l); document.documentElement.lang = l === 'hi' ? 'hi' : l === 'sat' ? 'sat' : 'en'; }

/* ---------------------------------------------------------------
   Toasts
   --------------------------------------------------------------- */
function toast(title, msg = '', tone = 'info', host) {
  host = host || $('#toasts-dev') || $('#toasts-page');
  if (!host) return;
  const icon = { ok: 'check', warn: 'warn', haz: 'warn', crit: 'octa', info: 'info' }[tone] || 'info';
  const el = document.createElement('div');
  el.className = 'toast ' + tone;
  el.setAttribute('role', 'status');
  el.innerHTML = `${ic(icon)}<div><b>${esc(title)}</b>${msg ? `<span>${esc(msg)}</span>` : ''}</div>`;
  host.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 260); }, 3400);
}

/* ---------------------------------------------------------------
   Voice instructions — Web Speech for EN/HI; Santali ships as
   recorded audio in the offline pack (visual waveform in prototype)
   --------------------------------------------------------------- */
let speakingBtn = null;
function speak(text, btn) {
  if (speakingBtn) { speakingBtn.classList.remove('playing'); speakingBtn.querySelector('.wave')?.remove(); }
  speakingBtn = btn || null;
  if (btn) { btn.classList.add('playing'); btn.insertAdjacentHTML('beforeend', '<span class="wave"><i></i><i></i><i></i><i></i></span>'); }
  const done = () => { if (btn) { btn.classList.remove('playing'); btn.querySelector('.wave')?.remove(); } };
  if (!S.voice) { toast('Voice instructions are off', 'Turn them on in Profile › Settings.', 'info'); done(); return; }
  if (S.lang === 'sat') {
    toast('ᱥᱟᱱᱛᱟᱲᱤ voice-over', 'Plays from the recorded offline audio pack on device.', 'info');
    setTimeout(done, 3200); return;
  }
  try {
    const ss = window.speechSynthesis;
    if (!ss) throw new Error('no tts');
    ss.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = S.lang === 'hi' ? 'hi-IN' : 'en-IN';
    u.rate = .95;
    u.onend = done; u.onerror = done;
    ss.speak(u);
    setTimeout(done, Math.min(12000, 1500 + text.length * 70));
  } catch (e) { setTimeout(done, 2500); }
}
const listenBtn = (text, label) => `<button class="listen" data-speak="${esc(text)}">${ic('speaker')}<span>${esc(label || t('listen'))}</span></button>`;

/* ---------------------------------------------------------------
   QR — qrcode-generator (cdnjs); fallback pattern if unavailable
   --------------------------------------------------------------- */
function qrSvg(text) {
  try {
    const q = qrcode(0, 'M'); q.addData(text); q.make();
    const n = q.getModuleCount(); let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    return `<svg viewBox="-1 -1 ${n + 2} ${n + 2}" shape-rendering="crispEdges"><rect x="-1" y="-1" width="${n + 2}" height="${n + 2}" fill="#fff"/><path d="${d}" fill="#111"/></svg>`;
  } catch (e) {
    let d = ''; let h = 0; for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    for (let r = 0; r < 25; r++) for (let c = 0; c < 25; c++) { h = (h * 1103515245 + 12345) >>> 0; if ((h >> 16) & 1) d += `M${c} ${r}h1v1h-1z`; }
    const f = (x, y) => `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z`;
    return `<svg viewBox="-1 -1 27 27"><rect x="-1" y="-1" width="27" height="27" fill="#fff"/><path d="${d}" fill="#111"/><path d="${f(0, 0)}${f(18, 0)}${f(0, 18)}" fill="#111" fill-rule="evenodd"/></svg>`;
  }
}

/* ---------------------------------------------------------------
   Certificate registry used by QR verification (worker + supervisor)
   --------------------------------------------------------------- */
const REGISTRY = {
  'JH-GS-2026-00398': { worker: 'Rahul Kumar', wid: 'JH-DHN-04821', mod: 'gas', score: 92, issued: '25 Sep 2026', expires: '25 Sep 2027', status: 'valid', site: 'Dhanbad Mine' },
  'JH-FR-2026-00377': { worker: 'Sunita Hansda', wid: 'JH-DHN-03310', mod: 'fire', score: 94, issued: '19 Sep 2026', expires: '19 Sep 2027', status: 'valid', site: 'Dhanbad Mine' },
  'JH-FR-2025-01144': { worker: 'Mahesh Mahato', wid: 'JH-DHN-02987', mod: 'fire', score: 76, issued: '12 Sep 2025', expires: '12 Sep 2026', status: 'expired', site: 'Dhanbad Mine' },
  'JH-GS-2026-00212': { worker: 'Arjun Tudu', wid: 'JH-DHN-04102', mod: 'gas', score: 71, issued: '02 Aug 2026', expires: '02 Aug 2027', status: 'revoked', site: 'Dhanbad Mine', reason: 'Revoked 14 Sep 2026 — confined-space entry without permit (incident IR-0917).' }
};
const certTitle = mod => mod === 'induction' ? t('m_induction') : t('m_' + mod);

/* ---------------------------------------------------------------
   Seeded sample data for supervisor/admin
   --------------------------------------------------------------- */
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const SITES = [
  { key: 'dhn', name: 'Dhanbad Mine', type: 'Coal mining', workers: 1842, cert: 91, dist: 'Dhanbad' },
  { key: 'bok', name: 'Bokaro Steel', type: 'Steel', workers: 3421, cert: 84, dist: 'Bokaro' },
  { key: 'jsr', name: 'Jamshedpur Facility', type: 'Manufacturing', workers: 2813, cert: 78, dist: 'East Singhbhum' },
  { key: 'mica', name: 'Mica Processing', type: 'Mica processing', workers: 1124, cert: 71, dist: 'Koderma' },
  { key: 'hzb', name: 'Hazaribagh Colliery', type: 'Coal mining', workers: 1796, cert: 58, dist: 'Hazaribagh' },
  { key: 'rmg', name: 'Ramgarh Washery', type: 'Coal washery', workers: 1486, cert: 60, dist: 'Ramgarh' }
];
const ROLES = ['Mine Operator', 'Fitter', 'Electrician', 'Welder', 'Crane Operator', 'Furnace Operator', 'Mica Sorter', 'Pump Operator', 'Helper', 'Shotfirer', 'Rigger', 'Shift Supervisor'];
const FIRST = ['Rahul', 'Sunita', 'Mahesh', 'Arjun', 'Priya', 'Suresh', 'Anita', 'Birsa', 'Salkhan', 'Phulmani', 'Raju', 'Deepak', 'Sita', 'Manoj', 'Lakshmi', 'Ramesh', 'Babulal', 'Sanjay', 'Kiran', 'Munni', 'Vikash', 'Rekha', 'Somra', 'Durga', 'Ajay', 'Geeta', 'Bhim', 'Pooja', 'Laxman', 'Chandmuni'];
const LAST = ['Kumar', 'Hansda', 'Mahato', 'Tudu', 'Murmu', 'Soren', 'Kisku', 'Marandi', 'Hembrom', 'Oraon', 'Munda', 'Singh', 'Yadav', 'Besra', 'Prasad', 'Das', 'Tirkey', 'Baskey', 'Gope', 'Minz'];
const WORKERS = (() => {
  const r = rng(42), out = [];
  const mk = (i, over = {}) => {
    const site = SITES[Math.floor(r() * 4.6) % SITES.length];
    const fire = r() < .78 ? Math.round(62 + r() * 36) : null;
    const gas = r() < .7 ? Math.round(58 + r() * 40) : null;
    const best = Math.max(fire || 0, gas || 0);
    let cert = best >= 70 ? (r() < .1 ? 'expiring' : r() < .06 ? 'expired' : 'valid') : (fire || gas ? 'failed' : 'pending');
    const training = fire && gas ? 100 : fire || gas ? Math.round(45 + r() * 40) : Math.round(r() * 35);
    const dAgo = Math.floor(r() * 20);
    const w = {
      name: FIRST[Math.floor(r() * FIRST.length)] + ' ' + LAST[Math.floor(r() * LAST.length)],
      id: `JH-${site.key.toUpperCase().slice(0, 3)}-${pad2(Math.floor(r() * 90) + 10)}${Math.floor(r() * 900 + 100)}`,
      site: site.name, role: ROLES[Math.floor(r() * ROLES.length)], training, fire, gas,
      score: best || null, cert, last: dAgo === 0 ? 'Today' : dAgo === 1 ? 'Yesterday' : `${dAgo} days ago`, lastN: dAgo,
      sync: r() < .12 ? 'pending' : 'synced', ...over
    };
    out.push(w);
  };
  mk(0, { name: 'Rahul Kumar', id: 'JH-DHN-04821', site: 'Dhanbad Mine', role: 'Mine Operator', training: 87, fire: null, gas: 92, score: 92, cert: 'valid', last: 'Yesterday', lastN: 1, sync: 'pending', live: true });
  mk(1, { name: 'Sunita Hansda', id: 'JH-DHN-03310', site: 'Dhanbad Mine', role: 'Shift Supervisor', training: 100, fire: 94, gas: 90, score: 94, cert: 'valid', last: 'Today', lastN: 0 });
  mk(2, { name: 'Mahesh Mahato', id: 'JH-DHN-02987', site: 'Dhanbad Mine', role: 'Pump Operator', training: 60, fire: 76, gas: null, score: 76, cert: 'expired', last: '14 days ago', lastN: 14 });
  mk(3, { name: 'Arjun Tudu', id: 'JH-DHN-04102', site: 'Dhanbad Mine', role: 'Helper', training: 70, fire: null, gas: 71, score: 71, cert: 'revoked', last: '12 days ago', lastN: 12 });
  for (let i = 4; i < 64; i++) mk(i);
  return out;
})();

/* ---------------------------------------------------------------
   Simulated AR camera scenes (SVG). In the Android build these are
   anchored 3D assets over the live ARCore camera feed.
   --------------------------------------------------------------- */
function sceneFire(variant) {
  const racks = [60, 190, 320].map(x => `<rect x="${x}" y="250" width="10" height="310" fill="#3a4046"/>`).join('');
  const shelves = [330, 410, 490].map(y => `<rect x="60" y="${y}" width="270" height="8" fill="#4a5158"/>`).join('');
  const boxes = [[80, 290, 60, 40], [150, 300, 34, 30], [210, 280, 70, 50], [90, 370, 90, 40], [230, 365, 60, 45], [80, 450, 50, 40], [150, 440, 120, 50]].map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#5b4a33" stroke="#3b3024"/>`).join('');
  const seams = Array.from({ length: 13 }, (_, i) => `<line x1="${i * 150}" y1="46" x2="${i * 150}" y2="560"/>`).join('');
  const floorL = Array.from({ length: 15 }, (_, i) => { const x = i * 130 - 10; return `<line x1="${x}" y1="560" x2="${900 + (x - 900) * 2.3}" y2="800"/>`; }).join('');
  return `<svg class="scene" viewBox="0 0 1800 800" preserveAspectRatio="none" aria-hidden="true">
  <defs>
    <linearGradient id="fw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#121518"/><stop offset="1" stop-color="#262b30"/></linearGradient>
    <linearGradient id="ff" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#23272b"/><stop offset="1" stop-color="#0c0e0f"/></linearGradient>
    <radialGradient id="fg" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff8a2a" stop-opacity=".6"/><stop offset="1" stop-color="#ff8a2a" stop-opacity="0"/></radialGradient>
    <pattern id="hz" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="11" height="22" fill="#b8931f"/><rect x="11" width="11" height="22" fill="#111"/></pattern>
    <filter id="blur8"><feGaussianBlur stdDeviation="14"/></filter>
  </defs>
  <rect width="1800" height="560" fill="url(#fw)"/>
  <g stroke="#2d3237" stroke-width="2">${seams}</g>
  <rect width="1800" height="46" fill="#0b0d0e"/>
  <rect y="58" width="1800" height="16" fill="#3b4045"/><rect y="84" width="1800" height="10" fill="#4f3e24"/>
  ${[100, 400, 700, 1000, 1300, 1600].map(x => `<rect x="${x}" y="50" width="8" height="48" fill="#24282c"/>`).join('')}
  <rect x="730" y="150" width="340" height="14" fill="#30353a"/><g stroke="#1c1f22" stroke-width="3">${[750, 790, 830, 870, 910, 950, 990, 1030].map(x => `<line x1="${x}" y1="150" x2="${x}" y2="164"/>`).join('')}</g>
  <polygon points="0,560 1800,560 1800,800 0,800" fill="url(#ff)"/>
  <g stroke="#2b3034" stroke-width="2">${floorL}<line x1="0" y1="600" x2="1800" y2="600"/><line x1="0" y1="660" x2="1800" y2="660"/><line x1="0" y1="745" x2="1800" y2="745"/></g>
  <rect x="0" y="606" width="1800" height="9" fill="url(#hz)" opacity=".75"/>
  ${racks}${shelves}${boxes}
  <g><ellipse cx="410" cy="480" rx="32" ry="10" fill="#3d5a6e"/><rect x="378" y="480" width="64" height="80" fill="#2f4757"/><ellipse cx="410" cy="560" rx="32" ry="10" fill="#243844"/>
     <ellipse cx="480" cy="495" rx="30" ry="9" fill="#6e3d2a"/><rect x="450" y="495" width="60" height="66" fill="#57301f"/><ellipse cx="480" cy="561" rx="30" ry="9" fill="#40241a"/></g>
  <g><rect x="530" y="250" width="96" height="46" fill="#b3261e"/><text x="578" y="280" fill="#fff" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="700" font-size="22" text-anchor="middle">FIRE POINT</text>
     <rect x="540" y="330" width="26" height="90" rx="8" fill="#c0322a"/><rect x="540" y="352" width="26" height="10" fill="#111"/><rect x="584" y="340" width="26" height="80" rx="8" fill="#c0322a"/><rect x="584" y="360" width="26" height="10" fill="#e8d9a8"/>
     <rect x="530" y="420" width="96" height="6" fill="#555"/></g>
  <g><rect x="760" y="240" width="280" height="320" fill="#3c4348" stroke="#23272b" stroke-width="3"/>
     <line x1="853" y1="240" x2="853" y2="560" stroke="#23272b" stroke-width="3"/><line x1="946" y1="240" x2="946" y2="560" stroke="#23272b" stroke-width="3"/>
     ${[780, 873, 966].map(x => `<g fill="#2a2f33">${[270, 282, 294, 306].map(y => `<rect x="${x}" y="${y}" width="50" height="5"/>`).join('')}</g><rect x="${x + 60}" y="400" width="6" height="26" fill="#1c1f22"/>`).join('')}
     <rect x="790" y="470" width="70" height="26" fill="#d9d4c6"/><text x="825" y="488" font-family="IBM Plex Mono,monospace" font-size="12" text-anchor="middle" fill="#222">MCC-3</text>
     <rect x="880" y="470" width="90" height="26" fill="#d9d4c6"/><text x="925" y="488" font-family="IBM Plex Mono,monospace" font-size="12" text-anchor="middle" fill="#222">415 V AC</text>
     <polygon points="990,470 1015,510 965,510" fill="#F2C230" stroke="#111" stroke-width="2"/><path d="M990 480l-5 14h6l-4 12" stroke="#111" stroke-width="2.4" fill="none"/></g>
  <g class="fire-grp" style="transform-box:fill-box;transform-origin:50% 100%">
     <ellipse cx="900" cy="330" rx="190" ry="150" fill="url(#fg)"/>
     <g class="smoke"><ellipse cx="900" cy="170" rx="160" ry="50" fill="#555a5e" opacity=".45" filter="url(#blur8)"/><ellipse cx="1010" cy="130" rx="140" ry="40" fill="#4a4e52" opacity=".4" filter="url(#blur8)"/></g>
     <path class="flame" d="M900 380c-50 0-70-40-56-80 10-30 30-40 26-78 30 20 36 44 34 62 10-12 16-28 14-46 30 26 44 60 38 90-6 30-28 52-56 52z" fill="#EF7C22"/>
     <path class="flame b" d="M900 380c-30 0-44-26-36-50 6-20 20-28 18-50 20 14 26 30 24 44 8-8 12-18 10-30 18 18 26 40 22 58-4 18-18 28-38 28z" fill="#F2C230"/>
     <path class="flame c" d="M900 380c-14 0-22-12-18-24 3-10 10-14 10-26 10 8 14 16 13 24 4-4 6-8 5-14 9 10 12 20 10 28-2 8-9 12-20 12z" fill="#fff4c2"/>
     <ellipse cx="900" cy="382" rx="70" ry="10" fill="#1a0d05" opacity=".6"/></g>
  <g><rect x="1140" y="320" width="120" height="240" fill="#1a1d20" stroke="#4a5056" stroke-width="4"/><rect x="1150" y="330" width="100" height="100" fill="#22272b"/><rect x="1236" y="440" width="8" height="30" fill="#8a8f94"/>
     <rect x="1150" y="270" width="100" height="36" fill="#1e8a4c"/><text x="1200" y="296" fill="#fff" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="700" font-size="24" text-anchor="middle">EXIT A →</text></g>
  <g><rect x="1330" y="46" width="40" height="514" fill="#353b41"/><rect x="1316" y="46" width="68" height="12" fill="#2b3035"/><rect x="1316" y="548" width="68" height="12" fill="#2b3035"/>
     <rect x="1333" y="300" width="34" height="50" fill="#F2C230"/><path d="M1340 312h20M1340 324h20M1340 336h14" stroke="#111" stroke-width="3"/></g>
  <g><rect x="1520" y="320" width="130" height="240" fill="#1a1d20" stroke="#4a5056" stroke-width="4"/><line x1="1585" y1="320" x2="1585" y2="560" stroke="#4a5056" stroke-width="3"/><rect x="1560" y="420" width="50" height="8" fill="#8a8f94"/>
     <rect x="1535" y="270" width="100" height="36" fill="#1e8a4c"/><text x="1585" y="296" fill="#fff" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="700" font-size="24" text-anchor="middle">EXIT B →</text></g>
  <g><rect x="1690" y="140" width="110" height="200" fill="#1c2024"/>${[160, 190, 220, 250, 280, 310].map(y => `<rect x="1700" y="${y}" width="100" height="14" fill="#2b3136"/>`).join('')}</g>
  ${variant === 'B' ? `<g class="smoke"><ellipse cx="1585" cy="430" rx="190" ry="150" fill="#5a5e62" opacity=".55" filter="url(#blur8)"/><ellipse cx="1585" cy="520" rx="120" ry="60" fill="url(#fg)"/></g>` : ''}
  </svg>`;
}

function sceneAssembly() {
  return `<svg class="scene" viewBox="0 0 1800 800" preserveAspectRatio="none" aria-hidden="true">
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2530"/><stop offset="1" stop-color="#46505a"/></linearGradient>
  <linearGradient id="grd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3a33"/><stop offset="1" stop-color="#191a17"/></linearGradient></defs>
  <rect width="1800" height="520" fill="url(#sky)"/>
  <path d="M0 520V360h140v-60h90v60h120v-120h40v120h200v-40h160v40h100V250h60v-50h30v50h60v270z" fill="#15191d"/>
  <path d="M1250 520V300l60-40 60 40v220zM1400 520V380h260v140z" fill="#1a1f24"/>
  <rect x="1440" y="170" width="16" height="210" fill="#15191d"/><path d="M1448 170l-40 60h80z" fill="none" stroke="#15191d" stroke-width="8"/>
  <rect y="520" width="1800" height="280" fill="url(#grd)"/>
  <g stroke="#6f7478" stroke-width="3">${Array.from({ length: 37 }, (_, i) => `<line x1="${i * 50}" y1="470" x2="${i * 50}" y2="535"/>`).join('')}<line x1="0" y1="480" x2="1800" y2="480"/><line x1="0" y1="510" x2="1800" y2="510"/></g>
  <g stroke="#5e5f55" stroke-width="2" opacity=".6"><line x1="0" y1="600" x2="1800" y2="600"/><line x1="0" y1="690" x2="1800" y2="690"/></g>
  <g><rect x="1196" y="330" width="10" height="260" fill="#8b9095"/><rect x="1110" y="250" width="180" height="120" fill="#1e8a4c" stroke="#e9f5ee" stroke-width="4"/>
  <g fill="#fff">${[[1150, 290], [1200, 290], [1250, 290], [1175, 330], [1225, 330]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8"/><path d="M${x - 8} ${y + 26}v-10a8 8 0 0 1 16 0v10z"/>`).join('')}</g>
  <text x="1200" y="400" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="700" font-size="26" fill="#e9f5ee">AP-02</text></g>
  <g fill="#0f1113">${[[900, 560], [960, 570], [1020, 555]].map(([x, y]) => `<circle cx="${x}" cy="${y - 70}" r="14"/><rect x="${x - 16}" y="${y - 55}" width="32" height="70" rx="6"/>`).join('')}</g>
  <g fill="#F2C230">${[[900, 474], [960, 484], [1020, 469]].map(([x, y]) => `<path d="M${x - 16} ${y}a16 12 0 0 1 32 0z"/>`).join('')}</g>
  </svg>`;
}

function sceneGas() {
  const seams = Array.from({ length: 13 }, (_, i) => `<line x1="${i * 150}" y1="0" x2="${i * 150}" y2="560"/>`).join('');
  const bricks = Array.from({ length: 9 }, (_, i) => `<line x1="0" y1="${60 + i * 56}" x2="1800" y2="${60 + i * 56}"/>`).join('');
  const floorL = Array.from({ length: 15 }, (_, i) => { const x = i * 130 - 10; return `<line x1="${x}" y1="560" x2="${900 + (x - 900) * 2.3}" y2="800"/>`; }).join('');
  const stake = (x, y, s, lbl) => `<g><rect x="${x - 3 * s}" y="${y - 70 * s}" width="${6 * s}" height="${70 * s}" fill="#d8d2c2"/><rect x="${x - 3 * s}" y="${y - 70 * s}" width="${6 * s}" height="${14 * s}" fill="#EF7C22"/><rect x="${x - 3 * s}" y="${y - 42 * s}" width="${6 * s}" height="${14 * s}" fill="#EF7C22"/><ellipse cx="${x}" cy="${y}" rx="${16 * s}" ry="${5 * s}" fill="#000" opacity=".4"/><text x="${x}" y="${y + 24 * s}" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="${15 * s}" font-weight="600" fill="#d8d2c2">${lbl}</text></g>`;
  return `<svg class="scene" viewBox="0 0 1800 800" preserveAspectRatio="none" aria-hidden="true">
  <defs>
    <linearGradient id="gw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15191b"/><stop offset="1" stop-color="#262c2d"/></linearGradient>
    <linearGradient id="gf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#262a28"/><stop offset="1" stop-color="#0d0f0e"/></linearGradient>
    <linearGradient id="tank" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5d666b"/><stop offset=".5" stop-color="#434b50"/><stop offset="1" stop-color="#2a3034"/></linearGradient>
    <filter id="gblur"><feGaussianBlur stdDeviation="18"/></filter>
  </defs>
  <rect width="1800" height="560" fill="url(#gw)"/>
  <g stroke="#2c3234" stroke-width="2">${seams}${bricks}</g>
  <rect y="36" width="1800" height="18" fill="#3c4346"/><rect y="64" width="1800" height="12" fill="#2e5a3a"/>
  <polygon points="0,560 1800,560 1800,800 0,800" fill="url(#gf)"/>
  <g stroke="#2b302e" stroke-width="2">${floorL}<line x1="0" y1="610" x2="1800" y2="610"/><line x1="0" y1="690" x2="1800" y2="690"/></g>
  <g><rect x="130" y="250" width="200" height="290" fill="#2a2f31" stroke="#F2C230" stroke-width="5"/><rect x="130" y="250" width="200" height="44" fill="#F2C230"/>
     <text x="230" y="280" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="700" font-size="24" fill="#1A1500">PPE STATION</text>
     ${[[160, 320], [240, 320], [160, 420], [240, 420]].map(([x, y]) => `<rect x="${x}" y="${y}" width="60" height="80" fill="#1f2426" stroke="#454c4f"/>`).join('')}
     <path d="M170 360a20 18 0 0 1 40 0z" fill="#F2C230"/><rect x="255" y="335" width="30" height="45" rx="10" fill="#c9ccc7"/><path d="M170 450h40v34h-40z" fill="#EF7C22"/><path d="M252 450h36l-6 34h-24z" fill="#3a3f42"/></g>
  <g><rect x="450" y="120" width="30" height="440" fill="#3a4043"/><rect x="438" y="140" width="54" height="30" rx="4" fill="#2a2f31"/>
     <g class="beacon"><ellipse cx="465" cy="130" rx="24" ry="18" fill="#E4493D"/><ellipse cx="465" cy="130" rx="70" ry="50" fill="#E4493D" opacity=".18"/></g></g>
  <g><rect x="640" y="300" width="700" height="230" rx="115" fill="url(#tank)" stroke="#1b1f21" stroke-width="3"/>
     ${[720, 1260].map(x => `<rect x="${x}" y="520" width="40" height="40" fill="#2b3134"/>`).join('')}
     <rect x="960" y="250" width="100" height="60" fill="#4a5256" stroke="#1b1f21" stroke-width="3"/><ellipse cx="1010" cy="250" rx="58" ry="14" fill="#2a3033" stroke="#1b1f21" stroke-width="3"/><ellipse cx="1010" cy="250" rx="42" ry="9" fill="#0a0c0d"/>
     <rect x="740" y="380" width="200" height="70" fill="#e7e2d4"/><text x="840" y="408" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="700" font-size="22" fill="#B3261E">DANGER · CS-07</text><text x="840" y="432" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="12" fill="#222">CONFINED SPACE</text><text x="840" y="446" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="11" fill="#222">ENTRY BY PERMIT ONLY</text>
     <rect x="1100" y="160" width="240" height="18" fill="#56605f"/><rect x="1090" y="150" width="14" height="38" fill="#6b7472"/><rect x="1100" y="178" width="18" height="80" fill="#56605f"/></g>
  <g class="coworker"><circle cx="1110" cy="215" r="14" fill="#0f1113"/><rect x="1094" y="230" width="32" height="46" rx="6" fill="#0f1113"/><path d="M1094 212a16 12 0 0 1 32 0z" fill="#F2C230"/></g>
  <g><rect x="1420" y="220" width="190" height="120" fill="#e7e2d4"/><rect x="1420" y="220" width="190" height="36" fill="#B3261E"/><text x="1515" y="246" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="700" font-size="22" fill="#fff">RESTRICTED ZONE</text>
     <circle cx="1470" cy="298" r="24" fill="none" stroke="#B3261E" stroke-width="6"/><line x1="1453" y1="281" x2="1487" y2="315" stroke="#B3261E" stroke-width="6"/><text x="1555" y="296" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="12" fill="#222">H₂S AREA</text><text x="1555" y="314" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="12" fill="#222">SCBA REQ.</text></g>
  <g><rect x="1650" y="0" width="150" height="560" fill="#1b1f21"/><rect x="1680" y="200" width="90" height="360" fill="#101315" stroke="#394043" stroke-width="3"/></g>
  <g class="gas-cloud" style="transform:scale(var(--gas,1))">
     <g class="puff"><ellipse cx="1010" cy="300" rx="230" ry="150" fill="#b6a93d" opacity=".32" filter="url(#gblur)"/></g>
     <g class="puff"><ellipse cx="880" cy="420" rx="200" ry="110" fill="#a79a36" opacity=".28" filter="url(#gblur)"/></g>
     <g class="puff"><ellipse cx="1150" cy="430" rx="180" ry="110" fill="#b6a93d" opacity=".26" filter="url(#gblur)"/></g>
     <g class="puff"><ellipse cx="1010" cy="560" rx="300" ry="70" fill="#9c9131" opacity=".3" filter="url(#gblur)"/></g>
  </g>
  ${stake(1180, 640, 1, 'B1 · 3 m')}${stake(880, 700, 1.2, 'B2 · 7 m')}${stake(560, 770, 1.45, 'B3 · 12 m')}
  </svg>`;
}

/* extinguisher drawing (Indian colour-band convention: body red, band shows agent) */
const extSvg = band => `<svg viewBox="0 0 34 78" aria-hidden="true"><rect x="12" y="2" width="10" height="8" fill="#888"/><path d="M22 6h8v4" stroke="#888" stroke-width="3" fill="none"/><rect x="6" y="10" width="22" height="64" rx="8" fill="#C0322A"/><rect x="6" y="24" width="22" height="10" fill="${band}"/><rect x="10" y="44" width="14" height="16" fill="#e9e3d3" opacity=".85"/></svg>`;

/* sparkline-free mini SVG helpers used by admin charts live in console.js */
