(() => {
  'use strict';

  const K = {
    coins:'planner-coins-v1',
    owned:'planner-owned-skins-v1',
    active:'planner-active-skin-v1',
    extraOwned:'planner-extra-owned-skins-v1',
    extraActive:'planner-extra-active-skin-v1',
    infinite:'planner-infinite-coins-debug-v1'
  };
  const REWARD = 20;
  const MORT_PRICE = 130;
  const PRICES = {default:0,canarias:90,lgbt:100,tuna:110,aston:120,mort:MORT_PRICE};
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  const BONUS = [
    ['b01','¿Qué país tiene forma aproximada de bota?',['Portugal','Italia','Croacia','Grecia'],1],
    ['b02','¿Cuál es el símbolo químico del oro?',['Ag','Au','O','Or'],1],
    ['b03','¿Cuántos grados tiene un ángulo llano?',['90°','120°','180°','360°'],2],
    ['b04','¿Quién compuso Las cuatro estaciones?',['Mozart','Vivaldi','Bach','Beethoven'],1],
    ['b05','¿Cuál es la capital de Nueva Zelanda?',['Auckland','Wellington','Christchurch','Hamilton'],1],
    ['b06','¿Qué planeta es el más grande del sistema solar?',['Saturno','Júpiter','Neptuno','Tierra'],1],
    ['b07','¿Cuántos huesos tiene normalmente un adulto?',['186','206','226','246'],1],
    ['b08','¿Qué río atraviesa París?',['Támesis','Danubio','Sena','Rin'],2],
    ['b09','¿En qué unidad se mide la frecuencia?',['Pascal','Hercio','Julio','Newton'],1],
    ['b10','¿Quién escribió La metamorfosis?',['Kafka','Camus','Borges','Dante'],0],
    ['b11','¿Qué órgano produce insulina?',['Hígado','Páncreas','Riñón','Bazo'],1],
    ['b12','¿Cuál es la capital de Marruecos?',['Casablanca','Marrakech','Rabat','Fez'],2],
    ['b13','¿Qué metal es líquido a temperatura ambiente?',['Mercurio','Aluminio','Cobre','Plomo'],0],
    ['b14','¿Cuántos jugadores tiene un equipo de fútbol en el campo?',['9','10','11','12'],2],
    ['b15','¿Qué lengua tiene más hablantes nativos?',['Inglés','Español','Mandarín','Hindi'],2],
    ['b16','¿Cuál es el resultado de 7 × 8?',['54','56','58','64'],1],
    ['b17','¿Qué gas es más abundante en la atmósfera terrestre?',['Oxígeno','Nitrógeno','Argón','CO₂'],1],
    ['b18','¿Qué pintor español creó Guernica?',['Dalí','Sorolla','Picasso','Miró'],2]
  ].map(([id,q,o,a]) => ({id,q,o,a}));

  function dateKey(){
    const d=new Date(),p=n=>String(n).padStart(2,'0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
  }
  const firstKey=()=>`planner-quiz-completed:${dateKey()}`;
  const bonusKey=()=>`planner-quiz-bonus-completed:${dateKey()}`;
  function arr(key,fallback=[]){try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v:fallback}catch{return fallback}}
  function saveArr(key,v){localStorage.setItem(key,JSON.stringify(v))}
  function infinite(){return localStorage.getItem(K.infinite)==='1'}
  function coins(){return Math.max(0,parseInt(localStorage.getItem(K.coins)||'0',10)||0)}
  function setCoins(v){localStorage.setItem(K.coins,String(Math.max(0,Math.floor(v))))}
  function mortOwned(){return arr(K.extraOwned).includes('mort')}
  function mortActive(){return localStorage.getItem(K.extraActive)==='mort' && mortOwned()}
  function esc(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')}
  function tell(msg){const n=$('#status');if(!n)return;n.textContent=msg;n.classList.remove('hidden');clearTimeout(tell.t);tell.t=setTimeout(()=>n.classList.add('hidden'),2200)}

  function injectCSS(){
    if($('#extraSkinStylesV2'))return;
    const s=document.createElement('style');s.id='extraSkinStylesV2';s.textContent=`
      body[data-skin='canarias'] #skinPatternLayer{opacity:.19!important;filter:saturate(1.08)}
      body[data-skin='canarias'] #skinPatternLayer span{filter:drop-shadow(0 1px 0 rgba(255,255,255,.45))}
      .skin-preview.mort{background:radial-gradient(circle at 28% 34%,#f6d7a1 0 8%,#70452b 9% 14%,#17100d 15% 19%,transparent 20%),radial-gradient(circle at 68% 34%,#f6d7a1 0 8%,#70452b 9% 14%,#17100d 15% 19%,transparent 20%),linear-gradient(135deg,#aaa29d,#e8d8c5 50%,#8f7565);color:#402e26}
      .skin-preview.mort::after{content:'👀  💖  🐾  👀';position:absolute;right:8px;top:12px;font-size:20px;opacity:.75;letter-spacing:7px}
      body[data-skin='mort']{--bg:#e9dfd2;--panel:#fff9f0;--panel-2:#f4e8d8;--text:#40312a;--muted:#806e64;--border:#c8aa8c;--accent:#8a5e42;--accent-soft:#efd6b5;--danger:#c44f5e}
      body[data-skin='mort'] .topbar{padding:10px;border-radius:16px;background:linear-gradient(110deg,rgba(255,249,240,.94),rgba(232,211,188,.9))}
      body[data-skin='mort'] .card{box-shadow:0 10px 28px rgba(88,62,47,.08)}
      body[data-skin='mort'] #skinPatternLayer{opacity:.10!important;display:grid!important;grid-template-columns:repeat(10,1fr);gap:28px 34px;background:none!important;font-size:25px}
      body[data-skin='mort'] .btn.primary,body[data-skin='mort'] .view-tab.active{background:linear-gradient(135deg,#f6d6a8,#f2c8bb)}
      .bonus-gate{padding:16px;text-align:center;border-style:dashed;color:var(--muted);font-size:12px;font-weight:750}
      .bonus-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:16px 2px 10px}.bonus-heading h3{margin:0;font-size:14px}.bonus-heading span{font-size:10px;color:var(--muted);font-weight:800}
      .bonus-missions-block{display:grid;gap:10px}.bonus-mission-card{padding:14px}.bonus-mission-card.done{opacity:.78}.bonus-mission-card .mission-option.correct{border-color:#22a06b;background:color-mix(in srgb,#22a06b 14%,var(--panel));color:#168455}
    `;document.head.appendChild(s);
  }

  function bonusQuestions(){
    let seed=2166136261;for(const ch of dateKey()+':bonus'){seed^=ch.charCodeAt(0);seed=Math.imul(seed,16777619)>>>0}
    const a=[...BONUS];for(let i=a.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a.slice(0,6);
  }

  function patchSummary(){
    const s=$('#missionSummary');if(!s)return;
    const first=Math.min(6,arr(firstKey()).length), second=Math.min(6,arr(bonusKey()).length), unlocked=first>=6;
    const sig=`${first}-${second}-${unlocked}`;
    if(s.dataset.extraSig===sig && s.textContent.includes('/12'))return;
    s.dataset.extraSig=sig;
    s.innerHTML=`<div class="mission-stat"><strong>${first+second}/12</strong><span>hechas</span></div><div class="mission-stat"><strong>${REWARD}</strong><span>🪙 por acierto</span></div><div class="mission-stat"><strong>${unlocked?'240':'120 → 240'}</strong><span>máximo hoy</span></div>`;
  }

  function renderBonus(){
    const list=$('#missionList');if(!list)return;
    const unlocked=arr(firstKey()).length>=6, done=arr(bonusKey()), sig=`${unlocked}:${done.join(',')}`;
    const existing=unlocked?list.querySelector('.bonus-missions-block'):list.querySelector('.bonus-gate');
    if(list.dataset.bonusSig===sig && existing){patchSummary();return}
    list.dataset.bonusSig=sig;
    list.querySelector('.bonus-gate')?.remove();list.querySelector('.bonus-heading')?.remove();list.querySelector('.bonus-missions-block')?.remove();
    if(!unlocked){const g=document.createElement('section');g.className='card bonus-gate';g.textContent='🔒 Completa las 6 primeras misiones para desbloquear otros 6 retos.';list.appendChild(g);patchSummary();return}
    const h=document.createElement('div');h.className='bonus-heading';h.innerHTML='<h3>Segunda tanda desbloqueada</h3><span>Retos 7–12</span>';list.appendChild(h);
    const b=document.createElement('div');b.className='bonus-missions-block';
    b.innerHTML=bonusQuestions().map((q,i)=>{const d=done.includes(q.id);return `<article class="card bonus-mission-card${d?' done':''}" data-bonus-id="${q.id}"><div class="mission-top"><div><span class="mission-number">Misión ${i+7}</span><h3>${esc(q.q)}</h3></div><span class="mission-reward">+${REWARD} 🪙</span></div><div class="mission-options">${q.o.map((o,j)=>`<button type="button" class="mission-option${d&&j===q.a?' correct':''}" data-bonus-answer="${j}"${d?' disabled':''}>${esc(o)}</button>`).join('')}</div><p class="mission-feedback ${d?'good':''}">${d?'✓ Completada. Monedas cobradas.':''}</p></article>`}).join('');
    list.appendChild(b);patchSummary();
  }

  function answerBonus(btn){
    const card=btn.closest('[data-bonus-id]'), q=bonusQuestions().find(x=>x.id===card?.dataset.bonusId);if(!q)return;
    const done=arr(bonusKey());if(done.includes(q.id))return;
    const fb=card.querySelector('.mission-feedback');
    if(Number(btn.dataset.bonusAnswer)!==q.a){if(fb){fb.className='mission-feedback bad';fb.textContent='Esa no era. Prueba otra.'}return}
    done.push(q.id);saveArr(bonusKey(),done);if(!infinite())setCoins(coins()+REWARD);listRefresh();tell(infinite()?'Correcta. Sigues con monedas infinitas ∞':`Respuesta correcta. +${REWARD} monedas.`)
  }

  function listRefresh(){renderBonus();syncWallet();patchShop();applyLanguage()}
  function syncWallet(){const v=infinite()?'∞':String(coins());['#coinBalance','#shopCoins'].forEach(sel=>{const n=$(sel);if(n&&n.textContent!==v)n.textContent=v})}

  function baseOwned(){const a=arr(K.owned,['default']);if(!a.includes('default'))a.unshift('default');return a}
  function isOwned(id){return id==='mort'?mortOwned():baseOwned().includes(id)}
  function buyEquip(id){
    if(!(id in PRICES))return;const price=PRICES[id];
    if(!isOwned(id)&&!infinite()&&coins()<price){tell('No tienes suficientes monedas. Completa más retos.');return}
    if(!isOwned(id)){
      if(!infinite())setCoins(coins()-price);
      if(id==='mort'){const a=arr(K.extraOwned);a.push('mort');saveArr(K.extraOwned,[...new Set(a)])}
      else{const a=baseOwned();a.push(id);saveArr(K.owned,[...new Set(a)])}
    }
    if(id==='mort'){localStorage.setItem(K.extraActive,'mort');localStorage.setItem(K.active,'default')}
    else{localStorage.removeItem(K.extraActive);localStorage.setItem(K.active,id)}
    location.reload();
  }

  function patchShop(){
    const grid=$('#skinGrid');if(!grid)return;
    const tuna=grid.querySelector('[data-skin-action="tuna"]')?.closest('.skin-card');if(tuna){const h=tuna.querySelector('h3'),p=tuna.querySelector('.skin-preview span');if(h&&h.textContent!=='Tuna')h.textContent='Tuna';if(p&&p.textContent!=='🎸 Tuna')p.textContent='🎸 Tuna'}
    if(!grid.querySelector('[data-skin-action="mort"]')){
      const active=mortActive(),owned=mortOwned(),c=document.createElement('article');c.className='card skin-card';c.innerHTML=`<div class="skin-preview mort"><span>👀 Mort</span></div><div class="skin-card-head"><div><h3>Mort</h3><p>Crema, pelito suave, ojazos y una energía pequeñita, intensa y adorable.</p></div><span class="skin-price">${owned?'Comprada':'🪙 '+MORT_PRICE}</span></div><button class="skin-action ${active?'active':owned?'':'buy'}" type="button" data-skin-action="mort"${active?' disabled':''}>${active?'Activa':owned?'Equipar':'Comprar'}</button>`;grid.appendChild(c)
    }
    if(mortActive()){$$('#skinGrid .skin-action.active').forEach(b=>{if(b.dataset.skinAction==='mort')return;b.classList.remove('active');b.disabled=false;b.textContent=isOwned(b.dataset.skinAction)?'Equipar':'Comprar'})}
  }

  function setTxt(sel,text){$$(sel).forEach(n=>{if(n.textContent!==text)n.textContent=text})}
  function inclusive(){
    const map=[['h1','Planificadore'],['#editorHeading','Bloque seleccionade'],['#addMonthEventBtn','+ Nueve evente'],['#eventModalTitle','Nueve evente'],['#newScheduleBtn','Nueve horarie'],['#shopHeading','Tienda de skins inclusives'],['#shopIntro','Consigue monedes completando misiones y desbloquea aspectos para todes.'],['#missionsHeading','Misiones del día para todes'],['#missionsIntro','Responde preguntes tipo test. Cada acierte da monedes y después se desbloquea otra tanda.']];map.forEach(x=>setTxt(...x));
    const t=$('#mobileEditToggle'),l=$('#mobileEditToggle .mobile-edit-label');if(t&&l)l.textContent=t.getAttribute('aria-pressed')==='true'?'Editande':'Bloqueade';
    const opts={'Todos':'Todes','Todas':'Todes','Completados':'Completades','Con cualquier marco':'Con cualquier marque','Sin marco':'Sin marque'};$$('option').forEach(o=>{if(opts[o.textContent.trim()])o.textContent=opts[o.textContent.trim()]});
    $$('.mission-card.done .mission-feedback,.bonus-mission-card.done .mission-feedback').forEach(n=>n.textContent='✓ Completade. Monedes cobrades.');$$('.skin-action.active').forEach(n=>n.textContent='Active');$$('.mission-stat span').forEach(n=>{if(n.textContent.trim()==='hechas')n.textContent='heches';if(n.textContent.includes('por acierto'))n.textContent='🪙 por acierte';if(n.textContent.includes('máximo hoy'))n.textContent='máxime hoy'})
  }
  function mortCopy(){
    const map=[['h1','¡Mi horario precioso!'],['.view-tab[data-view="week"]','Semanita'],['.view-tab[data-view="month"]','Mesecito'],['.view-tab[data-view="shop"]','¡Tesoooros!'],['.view-tab[data-view="missions"]','¡Preguntitas!'],['#settingsBtn span:last-child','Cositas'],['#mobileFiltersBtn','Mirar cositas'],['#todayMonthBtn','¡Hoy, hoy!'],['#addMonthEventBtn','+ ¡Otra cosita!'],['#settingsTitle','Mis cositas'],['#shopHeading','¡Skins preciosas!'],['#shopIntro','Son tan bonitas... quiero mirarlas todas, toditas.'],['#missionsHeading','¡Preguntitas para mí!'],['#missionsIntro','Yo contesto, gano moneditas y luego compro cosas preciosas. ¡Sí, sí, sí!']];map.forEach(x=>setTxt(...x));
    const t=$('#mobileEditToggle'),l=$('#mobileEditToggle .mobile-edit-label');if(t&&l)l.textContent=t.getAttribute('aria-pressed')==='true'?'¡Sí, editemos!':'No tocar, porfi';
  }
  function mortSkin(){
    if(!mortActive())return;document.body.dataset.skin='mort';const layer=$('#skinPatternLayer');if(layer&&!layer.dataset.mort){layer.dataset.mort='1';layer.className='skin-pattern-layer mort';const icons=['👀','💖','🐾','✨'];layer.innerHTML=Array.from({length:140},(_,i)=>`<span>${icons[i%icons.length]}</span>`).join('')}
  }
  function applyLanguage(){if(mortActive()){mortSkin();mortCopy()}else if(document.body.dataset.skin==='lgtb')inclusive()}

  document.addEventListener('submit',e=>{
    if(e.target?.id!=='secretCodeForm')return;const input=$('#secretCodeInput');if(String(input?.value||'').trim().toLowerCase()!=='retitos')return;e.preventDefault();e.stopImmediatePropagation();localStorage.setItem(K.infinite,'1');setCoins(999999999);if(input)input.value='';sessionStorage.setItem('planner-debug-money','1');location.reload();
  },true);

  document.addEventListener('click',e=>{
    const skin=e.target.closest('[data-skin-action]');if(skin){e.preventDefault();e.stopImmediatePropagation();buyEquip(skin.dataset.skinAction);return}
    const bonus=e.target.closest('[data-bonus-answer]');if(bonus){e.preventDefault();e.stopImmediatePropagation();answerBonus(bonus)}
  },true);

  function refresh(){patchShop();renderBonus();syncWallet();mortSkin();applyLanguage()}
  injectCSS();refresh();setInterval(refresh,500);
  if(sessionStorage.getItem('planner-debug-money')==='1'){sessionStorage.removeItem('planner-debug-money');setTimeout(()=>tell('Modo debug: monedas infinitas ∞'),250)}
})();