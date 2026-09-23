(() => {
  'use strict';

  const COINS_KEY = 'planner-coins-v1';
  const OWNED_KEY = 'planner-owned-skins-v1';
  const ACTIVE_SKIN_KEY = 'planner-active-skin-v1';
  const EXTRA_OWNED_KEY = 'planner-extra-owned-skins-v1';
  const EXTRA_ACTIVE_KEY = 'planner-extra-active-skin-v1';
  const INFINITE_KEY = 'planner-infinite-coins-debug-v1';
  const BONUS_REWARD = 20;
  const MORT_PRICE = 130;

  const $ = sel => document.querySelector(sel);
  const $$ = sel => [...document.querySelectorAll(sel)];

  const PRICES = {
    default:0,
    canarias:90,
    lgbt:100,
    tuna:110,
    aston:120,
    mort:MORT_PRICE
  };

  const BONUS_QUESTIONS = [
    {id:'b01',q:'¿Qué país tiene forma aproximada de bota?',o:['Portugal','Italia','Croacia','Grecia'],a:1},
    {id:'b02',q:'¿Cuál es el símbolo químico del oro?',o:['Ag','Au','O','Or'],a:1},
    {id:'b03',q:'¿Cuántos grados tiene un ángulo llano?',o:['90°','120°','180°','360°'],a:2},
    {id:'b04',q:'¿Quién compuso Las cuatro estaciones?',o:['Mozart','Vivaldi','Bach','Beethoven'],a:1},
    {id:'b05',q:'¿Cuál es la capital de Nueva Zelanda?',o:['Auckland','Wellington','Christchurch','Hamilton'],a:1},
    {id:'b06',q:'¿Qué planeta es el más grande del sistema solar?',o:['Saturno','Júpiter','Neptuno','Tierra'],a:1},
    {id:'b07',q:'¿Cuántos huesos tiene normalmente un adulto?',o:['186','206','226','246'],a:1},
    {id:'b08',q:'¿Qué río atraviesa París?',o:['Támesis','Danubio','Sena','Rin'],a:2},
    {id:'b09',q:'¿En qué unidad se mide la frecuencia?',o:['Pascal','Hercio','Julio','Newton'],a:1},
    {id:'b10',q:'¿Quién escribió La metamorfosis?',o:['Kafka','Camus','Borges','Dante'],a:0},
    {id:'b11',q:'¿Qué órgano produce insulina?',o:['Hígado','Páncreas','Riñón','Bazo'],a:1},
    {id:'b12',q:'¿Cuál es la capital de Marruecos?',o:['Casablanca','Marrakech','Rabat','Fez'],a:2},
    {id:'b13',q:'¿Qué metal es líquido a temperatura ambiente?',o:['Mercurio','Aluminio','Cobre','Plomo'],a:0},
    {id:'b14',q:'¿Cuántos jugadores tiene un equipo de fútbol en el campo?',o:['9','10','11','12'],a:2},
    {id:'b15',q:'¿Cuál es la lengua con más hablantes nativos del mundo?',o:['Inglés','Español','Mandarín','Hindi'],a:2},
    {id:'b16',q:'¿Cuál es el resultado de 7 × 8?',o:['54','56','58','64'],a:1},
    {id:'b17',q:'¿Qué gas es el más abundante en la atmósfera terrestre?',o:['Oxígeno','Nitrógeno','Argón','CO₂'],a:1},
    {id:'b18',q:'¿Qué pintor español creó Guernica?',o:['Dalí','Sorolla','Picasso','Miró'],a:2}
  ];

  function todayKey() {
    const d = new Date();
    const p = n => String(n).padStart(2,'0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
  }

  function firstCompletionKey() {
    return 'planner-quiz-completed:' + todayKey();
  }

  function bonusCompletionKey() {
    return 'planner-quiz-bonus-completed:' + todayKey();
  }

  function readArray(key, fallback=[]) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  function writeArray(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function isInfinite() {
    return localStorage.getItem(INFINITE_KEY) === '1';
  }

  function getCoins() {
    return Math.max(0, parseInt(localStorage.getItem(COINS_KEY) || '0',10) || 0);
  }

  function setCoins(value) {
    localStorage.setItem(COINS_KEY, String(Math.max(0, Math.floor(value))));
  }

  function activeExtraSkin() {
    return localStorage.getItem(EXTRA_ACTIVE_KEY) || '';
  }

  function ownsMort() {
    return readArray(EXTRA_OWNED_KEY).includes('mort');
  }

  function esc(value) {
    return String(value ?? '')
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  function announce(message) {
    const node = $('#status');
    if (!node) return;
    node.textContent = message;
    node.classList.remove('hidden');
    clearTimeout(announce.timer);
    announce.timer = setTimeout(() => node.classList.add('hidden'),2200);
  }

  function injectExtraStyles() {
    if ($('#gameExtraStyles')) return;
    const style = document.createElement('style');
    style.id = 'gameExtraStyles';
    style.textContent = `
      body[data-skin='canarias'] #skinPatternLayer{opacity:.17!important;filter:saturate(1.08)}
      body[data-skin='canarias'] #skinPatternLayer span{filter:drop-shadow(0 1px 0 rgba(255,255,255,.45))}

      .skin-preview.mort{background:radial-gradient(circle at 28% 33%,#f7d9a9 0 8%,#5a341f 9% 14%,#17100d 15% 19%,transparent 20%),radial-gradient(circle at 67% 33%,#f7d9a9 0 8%,#5a341f 9% 14%,#17100d 15% 19%,transparent 20%),linear-gradient(135deg,#b9afa5,#e9d8c3 48%,#876f61);color:#3f2d26}
      .skin-preview.mort::after{content:'👀  💖  🐾  👀  💖';position:absolute;right:8px;top:12px;font-size:20px;opacity:.72;letter-spacing:7px}
      body[data-skin='mort']{--bg:#eadfce;--panel:#fff8ee;--panel-2:#f4e7d6;--text:#3e302a;--muted:#806d63;--border:#c8aa8c;--accent:#8a5d3e;--accent-soft:#efd3ae;--danger:#c54b5a}
      body[data-skin='mort'] .topbar{padding:10px;border-radius:16px;background:linear-gradient(110deg,rgba(255,249,238,.92),rgba(231,210,187,.88))}
      body[data-skin='mort'] .card{box-shadow:0 10px 28px rgba(88,62,47,.08)}
      body[data-skin='mort'] #skinPatternLayer{opacity:.095!important;display:grid!important;grid-template-columns:repeat(10,1fr);gap:28px 34px;background:none!important;font-size:25px}
      body[data-skin='mort'] .btn.primary,body[data-skin='mort'] .view-tab.active{background:linear-gradient(135deg,#f6d6a8,#f2c8bb)}

      .bonus-gate{padding:16px;text-align:center;border-style:dashed;color:var(--muted);font-size:12px;font-weight:750}
      .bonus-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:16px 2px 10px}
      .bonus-heading h3{margin:0;font-size:14px}.bonus-heading span{font-size:10px;color:var(--muted);font-weight:800}
      .bonus-missions-block{display:grid;gap:10px}
      .bonus-mission-card{padding:14px}.bonus-mission-card.done{opacity:.78}
      .bonus-mission-card .mission-option.correct{border-color:#22a06b;background:color-mix(in srgb,#22a06b 14%,var(--panel));color:#168455}
      .debug-infinite{letter-spacing:.04em}
    `;
    document.head.appendChild(style);
  }

  function dailyBonusQuestions() {
    let seed = 2166136261;
    for (const ch of todayKey() + ':bonus') {
      seed ^= ch.charCodeAt(0);
      seed = Math.imul(seed,16777619) >>> 0;
    }
    const list = [...BONUS_QUESTIONS];
    for (let i=list.length-1;i>0;i--) {
      seed = (Math.imul(seed,1664525) + 1013904223) >>> 0;
      const j = seed % (i+1);
      [list[i],list[j]] = [list[j],list[i]];
    }
    return list.slice(0,6);
  }

  function firstStageDone() {
    return readArray(firstCompletionKey()).length >= 6;
  }

  function renderBonusMissions() {
    const missionList = $('#missionList');
    if (!missionList) return;

    missionList.querySelector('.bonus-gate')?.remove();
    missionList.querySelector('.bonus-heading')?.remove();
    missionList.querySelector('.bonus-missions-block')?.remove();

    if (!firstStageDone()) {
      const gate = document.createElement('section');
      gate.className = 'card bonus-gate';
      gate.innerHTML = '🔒 Completa las 6 primeras misiones para desbloquear otros 6 retos.';
      missionList.appendChild(gate);
      patchMissionSummary();
      return;
    }

    const completed = readArray(bonusCompletionKey());
    const questions = dailyBonusQuestions();

    const heading = document.createElement('div');
    heading.className = 'bonus-heading';
    heading.innerHTML = '<h3>Segunda tanda desbloqueada</h3><span>Retos 7–12</span>';
    missionList.appendChild(heading);

    const block = document.createElement('div');
    block.className = 'bonus-missions-block';
    block.innerHTML = questions.map((item,index) => {
      const done = completed.includes(item.id);
      return `
        <article class="card bonus-mission-card${done ? ' done' : ''}" data-bonus-id="${item.id}">
          <div class="mission-top">
            <div><span class="mission-number">Misión ${index+7}</span><h3>${esc(item.q)}</h3></div>
            <span class="mission-reward">+${BONUS_REWARD} 🪙</span>
          </div>
          <div class="mission-options">
            ${item.o.map((option,optIndex) => `<button type="button" class="mission-option${done && optIndex === item.a ? ' correct' : ''}" data-bonus-answer="${optIndex}"${done ? ' disabled' : ''}>${esc(option)}</button>`).join('')}
          </div>
          <p class="mission-feedback ${done ? 'good' : ''}">${done ? '✓ Completada. Monedas cobradas.' : ''}</p>
        </article>`;
    }).join('');
    missionList.appendChild(block);
    patchMissionSummary();
    applyLanguageSkin();
  }

  function patchMissionSummary() {
    const summary = $('#missionSummary');
    if (!summary) return;
    const firstDone = Math.min(6, readArray(firstCompletionKey()).length);
    const bonusDone = Math.min(6, readArray(bonusCompletionKey()).length);
    const unlocked = firstDone >= 6;
    summary.innerHTML = `
      <div class="mission-stat"><strong>${firstDone + bonusDone}/12</strong><span>hechas</span></div>
      <div class="mission-stat"><strong>${BONUS_REWARD}</strong><span>🪙 por acierto</span></div>
      <div class="mission-stat"><strong>${unlocked ? '240' : '120 → 240'}</strong><span>máximo hoy</span></div>`;
  }

  function answerBonus(card, answerIndex) {
    const id = card?.dataset.bonusId;
    const q = dailyBonusQuestions().find(item => item.id === id);
    if (!q) return;

    const completed = readArray(bonusCompletionKey());
    if (completed.includes(id)) return;

    const feedback = card.querySelector('.mission-feedback');
    if (Number(answerIndex) !== q.a) {
      if (feedback) {
        feedback.className = 'mission-feedback bad';
        feedback.textContent = 'Esa no era. Prueba otra.';
      }
      return;
    }

    completed.push(id);
    writeArray(bonusCompletionKey(), completed);
    if (!isInfinite()) setCoins(getCoins() + BONUS_REWARD);
    syncInfiniteUI();
    renderBonusMissions();
    announce(isInfinite() ? 'Correcta. El dinero sigue siendo infinito.' : `Respuesta correcta. +${BONUS_REWARD} monedas.`);
  }

  function syncInfiniteUI() {
    const value = isInfinite() ? '∞' : String(getCoins());
    ['#coinBalance','#shopCoins'].forEach(selector => {
      const node = $(selector);
      if (node) {
        node.textContent = value;
        node.classList.toggle('debug-infinite',isInfinite());
      }
    });
  }

  function skinOwned(id) {
    if (id === 'mort') return ownsMort();
    return readArray(OWNED_KEY,['default']).includes(id);
  }

  function purchaseOrEquip(id) {
    if (!(id in PRICES)) return;

    const owned = skinOwned(id);
    const price = PRICES[id];
    if (!owned && !isInfinite() && getCoins() < price) {
      announce('No tienes suficientes monedas. Completa más retos.');
      return;
    }

    if (!owned) {
      if (!isInfinite()) setCoins(getCoins() - price);
      if (id === 'mort') {
        const extra = readArray(EXTRA_OWNED_KEY);
        if (!extra.includes('mort')) extra.push('mort');
        writeArray(EXTRA_OWNED_KEY,extra);
      } else {
        const base = readArray(OWNED_KEY,['default']);
        if (!base.includes('default')) base.unshift('default');
        if (!base.includes(id)) base.push(id);
        writeArray(OWNED_KEY,base);
      }
    }

    if (id === 'mort') {
      localStorage.setItem(EXTRA_ACTIVE_KEY,'mort');
      localStorage.setItem(ACTIVE_SKIN_KEY,'default');
    } else {
      localStorage.removeItem(EXTRA_ACTIVE_KEY);
      localStorage.setItem(ACTIVE_SKIN_KEY,id);
    }

    location.reload();
  }

  function patchShop() {
    const grid = $('#skinGrid');
    if (!grid) return;

    const tunaBtn = grid.querySelector('[data-skin-action="tuna"]');
    const tunaCard = tunaBtn?.closest('.skin-card');
    if (tunaCard) {
      const h3 = tunaCard.querySelector('h3');
      const preview = tunaCard.querySelector('.skin-preview span');
      if (h3 && h3.textContent !== 'Tuna') h3.textContent = 'Tuna';
      if (preview && !preview.textContent.includes('🎸 Tuna')) preview.textContent = '🎸 Tuna';
    }

    if (!grid.querySelector('[data-skin-action="mort"]')) {
      const active = activeExtraSkin() === 'mort';
      const owned = ownsMort();
      const card = document.createElement('article');
      card.className = 'card skin-card';
      card.innerHTML = `
        <div class="skin-preview mort"><span>👀 Mort</span></div>
        <div class="skin-card-head">
          <div><h3>Mort</h3><p>Crema, pelito suave, ojazos y una energía pequeñita, intensa y adorable.</p></div>
          <span class="skin-price">${owned ? 'Comprada' : '🪙 ' + MORT_PRICE}</span>
        </div>
        <button class="skin-action ${active ? 'active' : owned ? '' : 'buy'}" type="button" data-skin-action="mort"${active ? ' disabled' : ''}>${active ? 'Activa' : owned ? 'Equipar' : 'Comprar'}</button>`;
      grid.appendChild(card);
    }

    if (activeExtraSkin() === 'mort') {
      $$('#skinGrid .skin-action.active').forEach(button => {
        if (button.dataset.skinAction === 'mort') return;
        button.classList.remove('active');
        button.disabled = false;
        button.textContent = skinOwned(button.dataset.skinAction) ? 'Equipar' : 'Comprar';
      });
    }

    syncInfiniteUI();
    applyLanguageSkin();
  }

  const LGBT_COPY = [
    ['h1','Planificadore'],
    ['#mobileEditToggle .mobile-edit-label','Bloqueade'],
    ['#editorHeading','Bloque seleccionade'],
    ['#addMonthEventBtn','+ Nueve evente'],
    ['#eventModalTitle','Nueve evente'],
    ['#newScheduleBtn','Nueve horarie'],
    ['#deleteSelectedBtn','Eliminar selección seleccionade'],
    ['#shopHeading','Tienda de skins inclusives'],
    ['#shopIntro','Consigue monedes completando misiones y desbloquea aspectos para todes.'],
    ['#missionsHeading','Misiones del día para todes'],
    ['#missionsIntro','Responde preguntes tipo test. Cada acierto da monedes y después se desbloquea otra tanda.']
  ];

  const MORT_COPY = [
    ['h1','¡Mi horario precioso!'],
    ['.view-tab[data-view="week"]','Semanita'],
    ['.view-tab[data-view="month"]','Mesecito'],
    ['.view-tab[data-view="shop"]','¡Tesoooros!'],
    ['.view-tab[data-view="missions"]','¡Preguntitas!'],
    ['#settingsBtn span:last-child','Cositas'],
    ['#mobileFiltersBtn','Mirar cositas'],
    ['#todayMonthBtn','¡Hoy, hoy!'],
    ['#addMonthEventBtn','+ ¡Otra cosita!'],
    ['#settingsTitle','Mis cositas'],
    ['#shopHeading','¡Skins preciosas!'],
    ['#shopIntro','Son tan bonitas... quiero mirarlas todas, toditas.'],
    ['#missionsHeading','¡Preguntitas para mí!'],
    ['#missionsIntro','Yo contesto, gano moneditas y luego compro cosas preciosas. ¡Sí, sí, sí!']
  ];

  function setText(selector,text) {
    $$(selector).forEach(node => {
      if (node.textContent !== text) node.textContent = text;
    });
  }

  function applyInclusiveCopy() {
    LGBT_COPY.forEach(([selector,text]) => setText(selector,text));

    const lock = $('#mobileEditToggle .mobile-edit-label');
    const toggle = $('#mobileEditToggle');
    if (lock && toggle) lock.textContent = toggle.getAttribute('aria-pressed') === 'true' ? 'Editande' : 'Bloqueade';

    const optionMap = {
      'Todos':'Todes','Todas':'Todes','Solo 3.º':'Solo 3.º','Solo 4.º':'Solo 4.º',
      'Pendientes':'Pendientes','Completados':'Completades','Con cualquier marco':'Con cualquier marque','Sin marco':'Sin marque'
    };
    $$('option').forEach(option => {
      const mapped = optionMap[option.textContent.trim()];
      if (mapped && option.textContent !== mapped) option.textContent = mapped;
    });

    $$('.mission-card.done .mission-feedback,.bonus-mission-card.done .mission-feedback').forEach(node => {
      node.textContent = '✓ Completade. Monedes cobrades.';
    });
    $$('.skin-action.active').forEach(node => { if (node.textContent !== 'Active') node.textContent = 'Active'; });
    $$('.mission-stat span').forEach(node => {
      if (node.textContent.trim() === 'hechas') node.textContent = 'heches';
      if (node.textContent.includes('por acierto')) node.textContent = '🪙 por acierte';
      if (node.textContent.includes('máximo hoy')) node.textContent = 'máxime hoy';
    });
  }

  function applyMortCopy() {
    MORT_COPY.forEach(([selector,text]) => setText(selector,text));
    const lock = $('#mobileEditToggle .mobile-edit-label');
    const toggle = $('#mobileEditToggle');
    if (lock && toggle) lock.textContent = toggle.getAttribute('aria-pressed') === 'true' ? '¡Sí, editemos!' : 'No tocar, porfi';

    const editor = $('#editorHeading');
    if (editor) {
      const count = editor.textContent.match(/^(\d+)/)?.[1];
      editor.textContent = count ? `¡${count} bloquecitos preciosos!` : '¡Un bloquecito precioso!';
    }
  }

  function applyMortSkin() {
    if (activeExtraSkin() !== 'mort' || !ownsMort()) return;
    document.body.dataset.skin = 'mort';
    const layer = $('#skinPatternLayer');
    if (layer) {
      layer.className = 'skin-pattern-layer mort';
      const icons = ['👀','💖','🐾','✨'];
      layer.innerHTML = Array.from({length:140},(_,i) => `<span>${icons[i % icons.length]}</span>`).join('');
    }
  }

  function applyLanguageSkin() {
    if (activeExtraSkin() === 'mort') {
      applyMortSkin();
      applyMortCopy();
      return;
    }
    if (document.body.dataset.skin === 'lgtb') applyInclusiveCopy();
  }

  function bindDebugCode() {
    document.addEventListener('submit',event => {
      if (event.target?.id !== 'secretCodeForm') return;
      const input = $('#secretCodeInput');
      const code = String(input?.value || '').trim().toLowerCase();
      if (code !== 'retitos') return;

      event.preventDefault();
      event.stopImmediatePropagation();
      localStorage.setItem(INFINITE_KEY,'1');
      setCoins(999999999);
      if (input) input.value = '';
      sessionStorage.setItem('planner-debug-message','1');
      location.reload();
    },true);
  }

  function bindSkinPurchases() {
    document.addEventListener('click',event => {
      const button = event.target.closest('[data-skin-action]');
      if (!button) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      purchaseOrEquip(button.dataset.skinAction);
    },true);
  }

  function bindBonusMissions() {
    document.addEventListener('click',event => {
      const button = event.target.closest('[data-bonus-answer]');
      if (!button) return;
      answerBonus(button.closest('[data-bonus-id]'),button.dataset.bonusAnswer);
    },true);
  }

  function installObservers() {
    let scheduled = false;
    const refresh = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        patchShop();
        renderBonusMissions();
        applyLanguageSkin();
        syncInfiniteUI();
      });
    };

    const observer = new MutationObserver(refresh);
    observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-pressed','data-skin','class']});
  }

  injectExtraStyles();
  bindDebugCode();
  bindSkinPurchases();
  bindBonusMissions();
  patchShop();
  renderBonusMissions();
  applyMortSkin();
  applyLanguageSkin();
  syncInfiniteUI();
  installObservers();

  if (sessionStorage.getItem('planner-debug-message') === '1') {
    sessionStorage.removeItem('planner-debug-message');
    setTimeout(() => announce('Modo debug activado: monedas infinitas ∞'),250);
  }
})();