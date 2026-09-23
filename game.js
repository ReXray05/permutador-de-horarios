(() => {
  'use strict';

  const COINS_KEY = 'planner-coins-v1';
  const OWNED_KEY = 'planner-owned-skins-v1';
  const ACTIVE_SKIN_KEY = 'planner-active-skin-v1';
  const VIEW_KEY = 'planner-active-view-v1';
  const DAILY_COUNT = 6;
  const REWARD = 20;

  const $ = sel => document.querySelector(sel);
  const $$ = sel => [...document.querySelectorAll(sel)];

  const SKINS = [
    {
      id:'default',
      name:'Clásico',
      price:0,
      icon:'◫',
      subtitle:'El aspecto original del planificador.',
      preview:'default'
    },
    {
      id:'canarias',
      name:'Canarias',
      price:90,
      icon:'🍌',
      subtitle:'Azul, blanco y amarillo, platanitos y habla canaria.',
      preview:'canarias'
    },
    {
      id:'lgbt',
      name:'LGTB+',
      price:100,
      icon:'🌈',
      subtitle:'Una piel clara con patrón arcoíris y detalles vivos.',
      preview:'lgbt'
    },
    {
      id:'tuna',
      name:'Tuna universitaria',
      price:110,
      icon:'🎸',
      subtitle:'Negro, rojo y blanco con motivos musicales.',
      preview:'tuna'
    },
    {
      id:'aston',
      name:'Aston Martin',
      price:120,
      icon:'🏁',
      subtitle:'British racing green, lima y acabado de paddock.',
      preview:'aston'
    }
  ];

  const QUESTIONS = [
    {id:'q01',q:'¿Cuál es la capital de Australia?',o:['Sídney','Canberra','Melbourne','Perth'],a:1},
    {id:'q02',q:'¿Qué elemento químico representa Fe?',o:['Flúor','Hierro','Fermio','Francio'],a:1},
    {id:'q03',q:'¿Quién escribió Don Quijote de la Mancha?',o:['Lope de Vega','Miguel de Cervantes','Quevedo','Góngora'],a:1},
    {id:'q04',q:'¿Cuál es el océano más grande?',o:['Atlántico','Índico','Pacífico','Ártico'],a:2},
    {id:'q05',q:'¿Qué planeta se conoce como el planeta rojo?',o:['Venus','Júpiter','Mercurio','Marte'],a:3},
    {id:'q06',q:'¿En qué año llegó el ser humano a la Luna?',o:['1965','1969','1972','1959'],a:1},
    {id:'q07',q:'¿Cuál es la capital de Canadá?',o:['Toronto','Vancouver','Ottawa','Montreal'],a:2},
    {id:'q08',q:'¿Qué sustancia es H₂O?',o:['Oxígeno','Agua','Hidrógeno','Sal'],a:1},
    {id:'q09',q:'Un triángulo rectángulo tiene catetos 3 y 4. ¿Hipotenusa?',o:['5','6','7','8'],a:0},
    {id:'q10',q:'¿Quién pintó la Mona Lisa?',o:['Miguel Ángel','Rafael','Leonardo da Vinci','Velázquez'],a:2},
    {id:'q11',q:'¿Cuál es el número primo más pequeño?',o:['0','1','2','3'],a:2},
    {id:'q12',q:'¿En qué país están las pirámides de Guiza?',o:['México','Egipto','Sudán','Grecia'],a:1},
    {id:'q13',q:'¿Aproximadamente a qué velocidad viaja la luz?',o:['30.000 km/s','300.000 km/s','3.000 km/s','3.000.000 km/s'],a:1},
    {id:'q14',q:'¿En qué continente está el Sáhara?',o:['Asia','África','América','Oceanía'],a:1},
    {id:'q15',q:'¿Cuántas cavidades tiene el corazón humano?',o:['2','3','4','5'],a:2},
    {id:'q16',q:'¿Cuál es la montaña más alta sobre el nivel del mar?',o:['K2','Everest','Aconcagua','Kilimanjaro'],a:1},
    {id:'q17',q:'¿Cuál es el idioma oficial de Brasil?',o:['Español','Portugués','Francés','Italiano'],a:1},
    {id:'q18',q:'¿Cuál es el mineral natural más duro de la escala de Mohs?',o:['Cuarzo','Diamante','Topacio','Granito'],a:1},
    {id:'q19',q:'¿A qué temperatura hierve el agua al nivel del mar?',o:['90 °C','95 °C','100 °C','110 °C'],a:2},
    {id:'q20',q:'¿Qué número representa XL en números romanos?',o:['30','40','50','60'],a:1},
    {id:'q21',q:'¿Cuántos lados tiene un hexágono?',o:['5','6','7','8'],a:1},
    {id:'q22',q:'¿Qué científico formuló la teoría de la relatividad?',o:['Newton','Einstein','Tesla','Curie'],a:1},
    {id:'q23',q:'¿Qué océano separa América de Europa y África?',o:['Pacífico','Atlántico','Índico','Antártico'],a:1},
    {id:'q24',q:'¿Cuál es el mamífero más grande del planeta?',o:['Elefante africano','Ballena azul','Tiburón ballena','Jirafa'],a:1},
    {id:'q25',q:'¿Cuál es la moneda de Japón?',o:['Won','Yuan','Yen','Rupia'],a:2},
    {id:'q26',q:'¿Qué gas absorben principalmente las plantas durante la fotosíntesis?',o:['Oxígeno','Nitrógeno','Dióxido de carbono','Helio'],a:2},
    {id:'q27',q:'¿Quién escribió 1984?',o:['George Orwell','Aldous Huxley','Tolkien','Kafka'],a:0},
    {id:'q28',q:'¿Cuál es la raíz cuadrada de 144?',o:['10','11','12','14'],a:2},
    {id:'q29',q:'¿Cuál es el país más grande del mundo por superficie?',o:['Canadá','China','Estados Unidos','Rusia'],a:3},
    {id:'q30',q:'¿Qué instrumento mide la presión atmosférica?',o:['Termómetro','Barómetro','Higrómetro','Anemómetro'],a:1}
  ];

  let coins = Math.max(0, parseInt(localStorage.getItem(COINS_KEY) || '0',10) || 0);
  let owned = loadOwned();
  let activeSkin = localStorage.getItem(ACTIVE_SKIN_KEY) || 'default';
  let feedback = {};
  let copyBusy = false;

  function loadOwned() {
    try {
      const parsed = JSON.parse(localStorage.getItem(OWNED_KEY) || '["default"]');
      const clean = Array.isArray(parsed) ? parsed.filter(id => SKINS.some(s => s.id === id)) : [];
      if (!clean.includes('default')) clean.unshift('default');
      return [...new Set(clean)];
    } catch {
      return ['default'];
    }
  }

  function saveState() {
    localStorage.setItem(COINS_KEY,String(coins));
    localStorage.setItem(OWNED_KEY,JSON.stringify(owned));
    localStorage.setItem(ACTIVE_SKIN_KEY,activeSkin);
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

  function localDateKey() {
    const d = new Date();
    const pad = n => String(n).padStart(2,'0');
    return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
  }

  function completionKey() {
    return 'planner-quiz-completed:' + localDateKey();
  }

  function completedToday() {
    try {
      const parsed = JSON.parse(localStorage.getItem(completionKey()) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function seededDailyQuestions() {
    const key = localDateKey();
    let seed = 2166136261;
    for (const ch of key) {
      seed ^= ch.charCodeAt(0);
      seed = Math.imul(seed,16777619) >>> 0;
    }

    const list = [...QUESTIONS];
    for (let i=list.length-1;i>0;i--) {
      seed = (Math.imul(seed,1664525) + 1013904223) >>> 0;
      const j = seed % (i+1);
      [list[i],list[j]] = [list[j],list[i]];
    }
    return list.slice(0,DAILY_COUNT);
  }

  function injectStyles() {
    if ($('#gamificationStyles')) return;
    const style = document.createElement('style');
    style.id = 'gamificationStyles';
    style.textContent = `
      .coin-wallet{display:inline-flex;align-items:center;gap:6px;min-height:34px;padding:5px 10px;border:1px solid var(--border);border-radius:999px;background:var(--panel);font-size:12px;font-weight:900;white-space:nowrap}
      .coin-wallet .coin-symbol{font-size:16px;line-height:1}.coin-wallet strong{font-variant-numeric:tabular-nums}
      .meta-view-tab{position:relative}.meta-view-tab::after{content:'';position:absolute;right:6px;top:6px;width:5px;height:5px;border-radius:50%;background:var(--accent);opacity:.45}
      .game-view{max-width:1180px;margin:0 auto}.game-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;padding:20px;margin-bottom:14px;overflow:hidden;position:relative}
      .game-hero h2{margin:3px 0 5px;font-size:24px}.game-hero p{margin:0;color:var(--muted);font-size:13px;line-height:1.45;max-width:700px}.game-eyebrow{font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}
      .hero-wallet{display:flex;align-items:center;gap:8px;padding:10px 13px;border:1px solid var(--border);border-radius:14px;background:var(--panel-2);font-weight:900;white-space:nowrap}
      .skin-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.skin-card{padding:12px;overflow:hidden;position:relative}.skin-preview{height:144px;border-radius:14px;border:1px solid rgba(255,255,255,.18);position:relative;overflow:hidden;display:flex;align-items:flex-end;padding:12px;font-weight:950;font-size:18px}
      .skin-preview.default{background:linear-gradient(135deg,#f6f7fb 0 50%,#eef0ff 50%);color:#172033}.skin-preview.canarias{background:linear-gradient(120deg,#0b5cc4 0 34%,#fff 34% 66%,#f6d51f 66%);color:#0b3d91}.skin-preview.canarias::after{content:'🍌  🍌  🍌  🍌  🍌';position:absolute;inset:14px -10px auto 0;transform:rotate(-12deg);font-size:22px;opacity:.72;letter-spacing:10px}
      .skin-preview.aston{background:linear-gradient(135deg,#042f2b,#0b5b4c 62%,#c8ff40 63% 67%,#071f1c 68%);color:#f5f4e8}.skin-preview.tuna{background:radial-gradient(circle at 80% 24%,rgba(210,25,40,.45),transparent 28%),linear-gradient(135deg,#080809,#231417);color:#fff}.skin-preview.tuna::after{content:'♪  ♫  🎸  🪘  ♫';position:absolute;top:16px;right:12px;font-size:21px;opacity:.7}.skin-preview.lgbt{background:repeating-linear-gradient(135deg,#e40303 0 16px,#ff8c00 16px 32px,#ffed00 32px 48px,#008026 48px 64px,#24408e 64px 80px,#732982 80px 96px);color:white;text-shadow:0 1px 4px rgba(0,0,0,.45)}
      .skin-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:12px 2px 8px}.skin-card h3{margin:0 0 3px;font-size:16px}.skin-card p{margin:0;color:var(--muted);font-size:11px;line-height:1.35}.skin-price{display:inline-flex;gap:4px;align-items:center;font-size:12px;font-weight:900;white-space:nowrap}.skin-action{width:100%;min-height:39px;border:1px solid var(--border);border-radius:11px;background:var(--panel-2);font-weight:850}.skin-action.buy{background:var(--accent-soft);border-color:var(--accent);color:var(--accent)}.skin-action.active{background:var(--accent);border-color:var(--accent);color:white}.skin-action:disabled{opacity:.5;cursor:not-allowed}
      .mission-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;min-width:300px}.mission-stat{padding:9px 11px;border:1px solid var(--border);border-radius:12px;background:var(--panel-2);text-align:center}.mission-stat strong{display:block;font-size:17px}.mission-stat span{font-size:9px;color:var(--muted);font-weight:800;text-transform:uppercase;letter-spacing:.06em}
      .mission-list{display:grid;gap:10px}.mission-card{padding:14px}.mission-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}.mission-number{display:block;margin-bottom:3px;color:var(--accent);font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.mission-card h3{margin:0;font-size:14px;line-height:1.35}.mission-reward{white-space:nowrap;padding:5px 8px;border-radius:999px;background:var(--accent-soft);color:var(--accent);font-size:10px;font-weight:900}.mission-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.mission-option{min-height:40px;padding:8px 10px;border:1px solid var(--border);border-radius:10px;background:var(--panel-2);text-align:left;font-size:11px;font-weight:720}.mission-option:hover{border-color:var(--accent)}.mission-card.done{opacity:.78}.mission-card.done .mission-option{pointer-events:none}.mission-card.done .mission-option.correct{border-color:#22a06b;background:color-mix(in srgb,#22a06b 14%,var(--panel));color:#168455}.mission-feedback{min-height:18px;margin:8px 0 0;font-size:10px;font-weight:800}.mission-feedback.good{color:#168455}.mission-feedback.bad{color:var(--danger)}
      .skin-pattern-layer{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;opacity:.075;display:grid;grid-template-columns:repeat(12,1fr);align-content:start;gap:28px 34px;padding:34px;font-size:25px;transform:rotate(-5deg) scale(1.08);transform-origin:center}.skin-pattern-layer.rainbow{display:block;opacity:.10;background:repeating-linear-gradient(135deg,#e40303 0 26px,#ff8c00 26px 52px,#ffed00 52px 78px,#008026 78px 104px,#24408e 104px 130px,#732982 130px 156px)}.skin-pattern-layer.aston{display:block;opacity:.08;background:repeating-linear-gradient(120deg,transparent 0 90px,#c8ff40 90px 94px,transparent 94px 180px)}
      #app{position:relative;z-index:1}
      body[data-skin='canarias']{--bg:#f5faff;--panel:#fffdf5;--panel-2:#eaf5ff;--text:#123d68;--muted:#56748d;--border:#d8c95c;--accent:#075bb5;--accent-soft:#fff2a8;--danger:#c73d3d}
      body[data-skin='canarias'] .topbar{padding:10px;border-radius:16px;background:linear-gradient(105deg,rgba(7,91,181,.12),rgba(255,255,255,.65),rgba(246,213,31,.18))}
      body[data-skin='aston']{--bg:#061b17;--panel:#0b2b25;--panel-2:#10382f;--text:#f2f5ed;--muted:#9bb9ae;--border:#2a5d50;--accent:#c8ff40;--accent-soft:#24473b;--danger:#ff6b6b}
      body[data-skin='aston'] .card,body[data-skin='aston'] .settings-panel,body[data-skin='aston'] .event-modal{box-shadow:0 16px 45px rgba(0,0,0,.18)}
      body[data-skin='tuna']{--bg:#0b0a0c;--panel:#171417;--panel-2:#241b1d;--text:#faf6f4;--muted:#c3b7b7;--border:#5b262d;--accent:#d02432;--accent-soft:#3b191e;--danger:#ff5b68}
      body[data-skin='tuna'] .topbar{border-bottom:1px solid #7c2832;padding-bottom:14px}
      body[data-skin='lgtb']{--bg:#faf8ff;--panel:#fff;--panel-2:#f7f2ff;--text:#281f35;--muted:#786b88;--border:#dfd4e8;--accent:#7b2dbf;--accent-soft:#f0e3ff;--danger:#d93b61}
      body[data-skin='lgtb'] .btn.primary,body[data-skin='lgtb'] .view-tab.active{background:linear-gradient(100deg,rgba(228,3,3,.13),rgba(255,140,0,.12),rgba(255,237,0,.12),rgba(0,128,38,.12),rgba(36,64,142,.12),rgba(115,41,130,.13))}
      @media(max-width:700px){
        .title-stack{grid-template-columns:1fr auto auto!important}.title-stack h1{grid-column:1;grid-row:1}.coin-wallet{grid-column:2;grid-row:1;padding:5px 8px}.mobile-edit-toggle{grid-column:3!important;grid-row:1!important}
        .view-tabs{display:grid!important;grid-template-columns:1fr 1fr;grid-column:1/-1;grid-row:2;width:100%;gap:4px}.view-tab[data-view='week'],.view-tab[data-view='month']{display:none}.view-tab[data-view='shop'],.view-tab[data-view='missions']{display:block}
        .schedule-switcher{grid-column:1/-1!important;grid-row:3!important}.game-view{padding:0}.game-hero{align-items:stretch;flex-direction:column;padding:14px}.game-hero h2{font-size:20px}.hero-wallet{align-self:flex-start}.skin-grid{grid-template-columns:1fr}.skin-preview{height:112px}.mission-summary{min-width:0;width:100%;grid-template-columns:repeat(3,1fr)}.mission-options{grid-template-columns:1fr}.skin-pattern-layer{grid-template-columns:repeat(7,1fr);gap:24px 20px;font-size:21px}
      }
    `;
    document.head.appendChild(style);
  }

  function createUI() {
    const tabs = $('.view-tabs');
    if (tabs && !$('.meta-view-tab')) {
      const shopTab = document.createElement('button');
      shopTab.className = 'view-tab meta-view-tab';
      shopTab.type = 'button';
      shopTab.dataset.view = 'shop';
      shopTab.setAttribute('role','tab');
      shopTab.setAttribute('aria-selected','false');
      shopTab.textContent = 'Tienda';

      const missionTab = document.createElement('button');
      missionTab.className = 'view-tab meta-view-tab';
      missionTab.type = 'button';
      missionTab.dataset.view = 'missions';
      missionTab.setAttribute('role','tab');
      missionTab.setAttribute('aria-selected','false');
      missionTab.textContent = 'Misiones';

      tabs.append(shopTab,missionTab);
    }

    if (!$('.coin-wallet')) {
      const wallet = document.createElement('div');
      wallet.className = 'coin-wallet';
      wallet.id = 'coinWallet';
      wallet.title = 'Monedas conseguidas en misiones';
      wallet.innerHTML = '<span class="coin-symbol">🪙</span><strong id="coinBalance">0</strong>';
      $('.view-tabs')?.insertAdjacentElement('afterend',wallet);
    }

    if (!$('#shopView')) {
      const shop = document.createElement('section');
      shop.id = 'shopView';
      shop.className = 'planner-view game-view hidden';
      shop.innerHTML = `
        <section class="card game-hero">
          <div>
            <span class="game-eyebrow">Personalización</span>
            <h2 id="shopHeading">Tienda de skins</h2>
            <p id="shopIntro">Consigue monedas completando misiones y desbloquea aspectos para todo el planificador.</p>
          </div>
          <div class="hero-wallet"><span>🪙</span><strong id="shopCoins">0</strong><span>monedas</span></div>
        </section>
        <div id="skinGrid" class="skin-grid"></div>`;
      $('#settingsBackdrop')?.insertAdjacentElement('beforebegin',shop);
    }

    if (!$('#missionsView')) {
      const missions = document.createElement('section');
      missions.id = 'missionsView';
      missions.className = 'planner-view game-view hidden';
      missions.innerHTML = `
        <section class="card game-hero">
          <div>
            <span class="game-eyebrow">Cultura general</span>
            <h2 id="missionsHeading">Misiones del día</h2>
            <p id="missionsIntro">Responde preguntas tipo test. Cada acierto da ${REWARD} monedas y mañana aparecerá otra tanda.</p>
          </div>
          <div id="missionSummary" class="mission-summary"></div>
        </section>
        <div id="missionList" class="mission-list"></div>`;
      $('#settingsBackdrop')?.insertAdjacentElement('beforebegin',missions);
    }

    if (!$('#skinPatternLayer')) {
      const pattern = document.createElement('div');
      pattern.id = 'skinPatternLayer';
      pattern.className = 'skin-pattern-layer';
      pattern.setAttribute('aria-hidden','true');
      document.body.prepend(pattern);
    }
  }

  function renderWallet() {
    $('#coinBalance') && ($('#coinBalance').textContent = String(coins));
    $('#shopCoins') && ($('#shopCoins').textContent = String(coins));
  }

  function renderShop() {
    const grid = $('#skinGrid');
    if (!grid) return;

    grid.innerHTML = SKINS.map(skin => {
      const isOwned = owned.includes(skin.id);
      const isActive = activeSkin === skin.id;
      let action = 'Comprar';
      let cls = 'buy';
      let disabled = '';

      if (isActive) {
        action = 'Activa';
        cls = 'active';
        disabled = ' disabled';
      } else if (isOwned) {
        action = 'Equipar';
        cls = '';
      }

      const price = skin.price === 0 ? 'Gratis' : '🪙 ' + skin.price;
      return `
        <article class="card skin-card">
          <div class="skin-preview ${esc(skin.preview)}"><span>${esc(skin.icon)} ${esc(skin.name)}</span></div>
          <div class="skin-card-head">
            <div><h3>${esc(skin.name)}</h3><p>${esc(skin.subtitle)}</p></div>
            <span class="skin-price">${price}</span>
          </div>
          <button class="skin-action ${cls}" type="button" data-skin-action="${esc(skin.id)}"${disabled}>${action}</button>
        </article>`;
    }).join('');
  }

  function renderMissions() {
    const list = $('#missionList');
    const summary = $('#missionSummary');
    if (!list || !summary) return;

    const daily = seededDailyQuestions();
    const completed = completedToday();
    const doneCount = daily.filter(item => completed.includes(item.id)).length;

    summary.innerHTML = `
      <div class="mission-stat"><strong>${doneCount}/${DAILY_COUNT}</strong><span>hechas</span></div>
      <div class="mission-stat"><strong>${REWARD}</strong><span>🪙 por acierto</span></div>
      <div class="mission-stat"><strong>${DAILY_COUNT * REWARD}</strong><span>máximo hoy</span></div>`;

    list.innerHTML = daily.map((item,index) => {
      const done = completed.includes(item.id);
      const note = feedback[item.id];
      return `
        <article class="card mission-card${done ? ' done' : ''}" data-mission-id="${item.id}">
          <div class="mission-top">
            <div><span class="mission-number">Misión ${index+1}</span><h3>${esc(item.q)}</h3></div>
            <span class="mission-reward">+${REWARD} 🪙</span>
          </div>
          <div class="mission-options">
            ${item.o.map((option,optIndex) => `<button type="button" class="mission-option${done && optIndex === item.a ? ' correct' : ''}" data-mission-answer="${optIndex}"${done ? ' disabled' : ''}>${esc(option)}</button>`).join('')}
          </div>
          <p class="mission-feedback ${note === 'good' ? 'good' : note === 'bad' ? 'bad' : ''}">${done ? '✓ Completada. Monedas cobradas.' : note === 'bad' ? 'Esa no era. Prueba otra.' : ''}</p>
        </article>`;
    }).join('');
  }

  function buyOrEquip(id) {
    const skin = SKINS.find(item => item.id === id);
    if (!skin) return;

    if (!owned.includes(id)) {
      if (coins < skin.price) {
        announce(activeSkin === 'canarias' ? 'Chacho, te faltan moneditas. Haz unos retitos primero.' : 'No tienes suficientes monedas. Completa algunas misiones.');
        return;
      }
      coins -= skin.price;
      owned.push(id);
    }

    activeSkin = id;
    saveState();
    applySkin();
    renderWallet();
    renderShop();
    announce(id === 'canarias' ? '¡Fuerte skin guapa, mi niño! Canarias activada.' : skin.name + ' activada.');
  }

  function answerMission(card,answerIndex) {
    const id = card?.dataset.missionId;
    const question = QUESTIONS.find(item => item.id === id);
    if (!question) return;

    const completed = completedToday();
    if (completed.includes(id)) return;

    if (Number(answerIndex) !== question.a) {
      feedback[id] = 'bad';
      renderMissions();
      return;
    }

    completed.push(id);
    localStorage.setItem(completionKey(),JSON.stringify(completed));
    coins += REWARD;
    localStorage.setItem(COINS_KEY,String(coins));
    feedback[id] = 'good';
    renderWallet();
    renderMissions();
    renderShop();
    announce(activeSkin === 'canarias' ? `¡Eso es, chacho! +${REWARD} moneditas.` : `Respuesta correcta. +${REWARD} monedas.`);
  }

  function setPattern() {
    const layer = $('#skinPatternLayer');
    if (!layer) return;
    layer.className = 'skin-pattern-layer';
    layer.innerHTML = '';

    if (activeSkin === 'canarias') {
      layer.innerHTML = Array.from({length:150},() => '<span>🍌</span>').join('');
    } else if (activeSkin === 'tuna') {
      const icons = ['🎸','🎶','🪘','♪','♫','🎼'];
      layer.innerHTML = Array.from({length:150},(_,i) => '<span>' + icons[i % icons.length] + '</span>').join('');
    } else if (activeSkin === 'lgtb') {
      layer.classList.add('rainbow');
    } else if (activeSkin === 'aston') {
      layer.classList.add('aston');
    }
  }

  const STATIC_COPY = [
    ['h1','Mi horario, chacho'],
    ['.view-tab[data-view="week"]','Semanita'],
    ['.view-tab[data-view="month"]','Mes'],
    ['.view-tab[data-view="shop"]','Tiendita'],
    ['.view-tab[data-view="missions"]','Retitos'],
    ['.schedule-switcher > span','Horario'],
    ['#settingsBtn span:last-child','Apaños'],
    ['#mobileFiltersBtn','Filtritos'],
    ['#todayMonthBtn','Pa’ hoy'],
    ['#monthIcsBtn','Sacar calendario'],
    ['#addMonthEventBtn','+ Apuntar cosita'],
    ['#earlierBtn','Empieza −30'],
    ['#laterBtn','Empieza +30'],
    ['#shorterBtn','Dura −30'],
    ['#longerBtn','Dura +30'],
    ['#deleteSelectedBtn','Quitar selección'],
    ['#settingsTitle','Apaños'],
    ['.settings-section:nth-of-type(1) h3','Pintita'],
    ['.settings-section:nth-of-type(2) h3','Código secreto'],
    ['.settings-section:nth-of-type(3) h3','Tus horarios'],
    ['.settings-section:nth-of-type(4) h3','Por si las moscas'],
    ['.settings-section:nth-of-type(5) h3','Pa’ tenerlo a mano'],
    ['.settings-section:nth-of-type(6) h3','Cómo va la movida']
  ];

  function applyCanaryCopy() {
    if (copyBusy) return;
    copyBusy = true;
    try {
      const canary = activeSkin === 'canarias';
      for (const [selector,canaryText] of STATIC_COPY) {
        $$(selector).forEach(node => {
          if (!node.dataset.baseCopy) node.dataset.baseCopy = node.textContent;
          const target = canary ? canaryText : node.dataset.baseCopy;
          if (node.textContent !== target) node.textContent = target;
        });
      }

      const lock = $('#mobileEditToggle .mobile-edit-label');
      const toggle = $('#mobileEditToggle');
      if (lock && toggle) {
        if (!lock.dataset.baseCopy) lock.dataset.baseCopy = lock.textContent;
        if (canary) {
          const target = toggle.getAttribute('aria-pressed') === 'true' ? 'Dándole' : 'Quietito';
          if (lock.textContent !== target) lock.textContent = target;
        } else if (lock.textContent === 'Dándole' || lock.textContent === 'Quietito') {
          lock.textContent = toggle.getAttribute('aria-pressed') === 'true' ? 'Editando' : 'Bloqueado';
        }
      }

      const heading = $('#editorHeading');
      if (heading && canary) {
        const match = heading.textContent.match(/^(\d+) bloques/);
        const target = match ? `${match[1]} bloques marcaos` : 'Bloque marcao';
        if (heading.textContent !== target) heading.textContent = target;
      }

      if ($('#shopHeading')) $('#shopHeading').textContent = canary ? 'Tiendita de skins, mi niño' : 'Tienda de skins';
      if ($('#shopIntro')) $('#shopIntro').textContent = canary ? 'Haz retitos, junta moneditas y ponte la pintita que más te mole.' : 'Consigue monedas completando misiones y desbloquea aspectos para todo el planificador.';
      if ($('#missionsHeading')) $('#missionsHeading').textContent = canary ? 'Retitos del día, chacho' : 'Misiones del día';
      if ($('#missionsIntro')) $('#missionsIntro').textContent = canary ? `Échate unas preguntitas. Cada acierto son ${REWARD} moneditas; mañana hay otra tanda.` : `Responde preguntas tipo test. Cada acierto da ${REWARD} monedas y mañana aparecerá otra tanda.`;
    } finally {
      copyBusy = false;
    }
  }

  function applySkin() {
    if (!owned.includes(activeSkin) || !SKINS.some(s => s.id === activeSkin)) activeSkin = 'default';
    if (activeSkin === 'default') delete document.body.dataset.skin;
    else document.body.dataset.skin = activeSkin;
    saveState();
    setPattern();
    applyCanaryCopy();
    document.dispatchEvent(new CustomEvent('planner:skinchange',{detail:{skin:activeSkin}}));
  }

  function hideMetaViews() {
    $('#shopView')?.classList.add('hidden');
    $('#missionsView')?.classList.add('hidden');
  }

  function showMetaView(view) {
    const target = view === 'missions' ? 'missions' : 'shop';
    $('#weekView')?.classList.add('hidden');
    $('#monthView')?.classList.add('hidden');
    $('#shopView')?.classList.toggle('hidden',target !== 'shop');
    $('#missionsView')?.classList.toggle('hidden',target !== 'missions');
    $$('.week-only-action').forEach(node => node.classList.add('hidden'));
    $$('.view-tab').forEach(tab => {
      const active = tab.dataset.view === target;
      tab.classList.toggle('active',active);
      tab.setAttribute('aria-selected',String(active));
    });
    $$('.mobile-nav-btn').forEach(btn => btn.classList.remove('active'));
    localStorage.setItem(VIEW_KEY,target);
    if (target === 'shop') renderShop();
    else renderMissions();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function bindUI() {
    $('.view-tab[data-view="shop"]')?.addEventListener('click',() => showMetaView('shop'));
    $('.view-tab[data-view="missions"]')?.addEventListener('click',() => showMetaView('missions'));

    $('.view-tab[data-view="week"]')?.addEventListener('click',() => {
      hideMetaViews();
      localStorage.setItem(VIEW_KEY,'week');
    });
    $('.view-tab[data-view="month"]')?.addEventListener('click',() => {
      hideMetaViews();
      localStorage.setItem(VIEW_KEY,'month');
    });

    $('#skinGrid')?.addEventListener('click',event => {
      const button = event.target.closest('[data-skin-action]');
      if (button) buyOrEquip(button.dataset.skinAction);
    });

    $('#missionList')?.addEventListener('click',event => {
      const button = event.target.closest('[data-mission-answer]');
      if (!button) return;
      answerMission(button.closest('[data-mission-id]'),button.dataset.missionAnswer);
    });

    document.addEventListener('click',event => {
      const nav = event.target.closest('[data-mobile-nav]');
      if (!nav) return;
      if (nav.dataset.mobileNav === 'week' || nav.dataset.mobileNav === 'month') {
        hideMetaViews();
      } else if (nav.dataset.mobileNav === 'add' && (!$('#shopView')?.classList.contains('hidden') || !$('#missionsView')?.classList.contains('hidden'))) {
        event.preventDefault();
        event.stopImmediatePropagation();
        announce(activeSkin === 'canarias' ? 'Vuelve a la semanita o al mes pa’ meter cosas, mi niño.' : 'Vuelve a Semana o Mes para añadir elementos.');
      }
    },true);

    const observer = new MutationObserver(() => {
      if (activeSkin === 'canarias') requestAnimationFrame(applyCanaryCopy);
    });
    observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-pressed']});
  }

  injectStyles();
  createUI();
  bindUI();
  renderWallet();
  renderShop();
  renderMissions();
  applySkin();

  const storedView = localStorage.getItem(VIEW_KEY);
  if (storedView === 'shop' || storedView === 'missions') showMetaView(storedView);
})();