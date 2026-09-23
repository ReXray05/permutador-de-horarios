(() => {
  'use strict';

  const DAY_KEY = 'planner-mobile-day-v1';
  const VIEW_KEY = 'planner-active-view-v1';
  const MOBILE_QUERY = '(max-width: 700px)';

  const $ = sel => document.querySelector(sel);
  const $$ = sel => [...document.querySelectorAll(sel)];

  let selectedMonthDate = null;
  let sheetRestore = null;
  let editUnlocked = false;

  function isMobile() {
    return window.matchMedia(MOBILE_QUERY).matches;
  }

  function currentView() {
    if ($('#shopView') && !$('#shopView').classList.contains('hidden')) return 'shop';
    if ($('#missionsView') && !$('#missionsView').classList.contains('hidden')) return 'missions';
    if ($('#monthView') && !$('#monthView').classList.contains('hidden')) return 'month';
    return 'week';
  }

  function notify(message) {
    const node = $('#status');
    if (!node) return;
    node.textContent = message;
    node.classList.remove('hidden');
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => node.classList.add('hidden'),1800);
  }

  function ensureMobileUI() {
    if (!$('#mobileEditToggle')) {
      const button = document.createElement('button');
      button.id = 'mobileEditToggle';
      button.className = 'mobile-edit-toggle';
      button.type = 'button';
      button.setAttribute('aria-pressed','false');
      button.innerHTML = '<span class="mobile-edit-icon">🔒</span><span class="mobile-edit-label">Bloqueado</span>';
      $('.schedule-switcher')?.insertAdjacentElement('afterend',button);
    }

    if (!$('#mobileWeekTools')) {
      const tools = document.createElement('div');
      tools.id = 'mobileWeekTools';
      tools.className = 'mobile-week-tools';
      tools.innerHTML =
        '<div class="mobile-day-tabs" role="tablist" aria-label="Día de la semana">' +
        ['L','M','X','J','V'].map((label,index) =>
          '<button type="button" class="mobile-day-tab" data-mobile-day="' + index + '" aria-label="' +
          ['Lunes','Martes','Miércoles','Jueves','Viernes'][index] + '">' + label + '</button>'
        ).join('') +
        '</div>' +
        '<button id="mobileFiltersBtn" class="mobile-tool-btn" type="button">Filtros</button>';
      $('.calendar-card')?.parentElement?.insertBefore(tools,$('.calendar-card'));
    }

    if (!$('#mobileDayAgenda')) {
      const agenda = document.createElement('section');
      agenda.id = 'mobileDayAgenda';
      agenda.className = 'mobile-day-agenda card';
      agenda.innerHTML =
        '<div class="mobile-agenda-head">' +
          '<div><span class="mobile-agenda-kicker">Día seleccionado</span><strong id="mobileAgendaTitle"></strong></div>' +
          '<button id="mobileAgendaAdd" class="mobile-agenda-add" type="button">+ Añadir</button>' +
        '</div>' +
        '<div id="mobileAgendaList" class="mobile-agenda-list"></div>';
      $('.month-card')?.appendChild(agenda);
    }

    if (!$('#mobileBottomNav')) {
      const nav = document.createElement('nav');
      nav.id = 'mobileBottomNav';
      nav.className = 'mobile-bottom-nav';
      nav.setAttribute('aria-label','Navegación principal');
      nav.innerHTML =
        '<button type="button" class="mobile-nav-btn" data-mobile-nav="week"><span class="mobile-nav-icon">▦</span><span>Semana</span></button>' +
        '<button type="button" class="mobile-nav-btn" data-mobile-nav="month"><span class="mobile-nav-icon">□</span><span>Mes</span></button>' +
        '<button type="button" class="mobile-nav-btn mobile-nav-add" data-mobile-nav="add"><span class="mobile-nav-plus">+</span><span>Añadir</span></button>' +
        '<button type="button" class="mobile-nav-btn" data-mobile-nav="settings"><span class="mobile-nav-icon">⚙</span><span>Ajustes</span></button>';
      document.body.appendChild(nav);
    }

    if (!$('#mobileSheetBackdrop')) {
      const backdrop = document.createElement('div');
      backdrop.id = 'mobileSheetBackdrop';
      backdrop.className = 'mobile-sheet-backdrop hidden';
      backdrop.setAttribute('aria-hidden','true');
      backdrop.innerHTML =
        '<section class="mobile-sheet" role="dialog" aria-modal="true" aria-labelledby="mobileSheetTitle">' +
          '<div class="mobile-sheet-handle"></div>' +
          '<div class="mobile-sheet-head">' +
            '<h2 id="mobileSheetTitle">Panel</h2>' +
            '<button id="closeMobileSheet" class="icon-btn" type="button" aria-label="Cerrar">×</button>' +
          '</div>' +
          '<div id="mobileSheetContent" class="mobile-sheet-content"></div>' +
        '</section>';
      document.body.appendChild(backdrop);
    }
  }

  function initialMobileDay() {
    const saved = Number(localStorage.getItem(DAY_KEY));
    if (Number.isInteger(saved) && saved >= 0 && saved <= 4) return saved;
    const today = new Date().getDay() - 1;
    return today >= 0 && today <= 4 ? today : 0;
  }

  function setMobileDay(day) {
    const normalized = Math.max(0,Math.min(4,Number(day) || 0));
    localStorage.setItem(DAY_KEY,String(normalized));

    $('#calendar')?.classList.add('mobile-single-day');

    $$('.day-head').forEach((node,index) => {
      node.classList.toggle('mobile-active',index === normalized);
      node.dataset.mobileDay = index;
    });

    $$('.day-column').forEach((node,index) => {
      node.classList.toggle('mobile-active',index === normalized);
    });

    $$('.mobile-day-tab').forEach(button => {
      const active = Number(button.dataset.mobileDay) === normalized;
      button.classList.toggle('active',active);
      button.setAttribute('aria-selected',String(active));
    });
  }

  function openSheet(node,title) {
    if (!node) return;
    closeSheet();

    const backdrop = $('#mobileSheetBackdrop');
    const content = $('#mobileSheetContent');
    if (!backdrop || !content) return;

    const placeholder = document.createComment('mobile-sheet-placeholder');
    node.parentNode?.insertBefore(placeholder,node);
    content.appendChild(node);

    sheetRestore = () => {
      if (placeholder.parentNode) placeholder.parentNode.insertBefore(node,placeholder);
      placeholder.remove();
    };

    $('#mobileSheetTitle').textContent = title;
    backdrop.classList.remove('hidden');
    backdrop.setAttribute('aria-hidden','false');
    document.body.classList.add('mobile-sheet-open');
  }

  function closeSheet() {
    const backdrop = $('#mobileSheetBackdrop');
    if (!backdrop) return;

    if (sheetRestore) {
      sheetRestore();
      sheetRestore = null;
    }

    backdrop.classList.add('hidden');
    backdrop.setAttribute('aria-hidden','true');
    document.body.classList.remove('mobile-sheet-open');
  }

  function syncEditLockUI() {
    const button = $('#mobileEditToggle');
    if (button) {
      button.setAttribute('aria-pressed',String(editUnlocked));
      button.classList.toggle('is-unlocked',editUnlocked);
      const icon = button.querySelector('.mobile-edit-icon');
      const label = button.querySelector('.mobile-edit-label');
      if (icon) icon.textContent = editUnlocked ? '🔓' : '🔒';
      if (label) label.textContent = editUnlocked ? 'Editando' : 'Bloqueado';
    }

    document.body.classList.toggle('mobile-edit-unlocked',editUnlocked);
    document.body.classList.toggle('mobile-edit-locked',!editUnlocked);

    const controls = [
      '[data-mobile-nav="add"]',
      '#mobileAgendaAdd',
      '#earlierBtn','#laterBtn','#shorterBtn','#longerBtn','#deleteSelectedBtn'
    ];

    controls.forEach(selector => {
      const control = $(selector);
      if (!control) return;
      control.toggleAttribute('disabled',!editUnlocked);
      control.setAttribute('aria-disabled',String(!editUnlocked));
    });

    $('#editor')?.classList.toggle('mobile-editor-locked',!editUnlocked);

    if (!editUnlocked) {
      closeSheet();
      if ($('#eventModalBackdrop') && !$('#eventModalBackdrop').classList.contains('hidden')) {
        $('#cancelEventBtn')?.click();
      }
    }
  }

  function setEditUnlocked(value) {
    editUnlocked = Boolean(value);
    syncEditLockUI();
    notify(editUnlocked ? 'Edición activada.' : 'Edición bloqueada.');
  }

  function closeTransientPanels() {
    closeSheet();

    if ($('#eventModalBackdrop') && !$('#eventModalBackdrop').classList.contains('hidden')) {
      $('#cancelEventBtn')?.click();
    }

    if ($('#settingsBackdrop') && !$('#settingsBackdrop').classList.contains('hidden')) {
      $('#closeSettingsBtn')?.click();
    }
  }

  function forceBaseView(view) {
    const normalized = view === 'month' ? 'month' : 'week';
    $('#shopView')?.classList.add('hidden');
    $('#missionsView')?.classList.add('hidden');
    $('#weekView')?.classList.toggle('hidden',normalized !== 'week');
    $('#monthView')?.classList.toggle('hidden',normalized !== 'month');

    $$('.view-tab').forEach(button => {
      const active = button.dataset.view === normalized;
      button.classList.toggle('active',active);
      button.setAttribute('aria-selected',String(active));
    });

    $$('.week-only-action').forEach(node => {
      node.classList.toggle('hidden',normalized !== 'week');
    });

    localStorage.setItem(VIEW_KEY,normalized);
  }

  function switchBaseView(view) {
    const normalized = view === 'month' ? 'month' : 'week';
    closeTransientPanels();
    const tab = $('.view-tab[data-view="' + normalized + '"]');
    tab?.click();

    requestAnimationFrame(() => {
      forceBaseView(normalized);
      syncBottomNav();
      window.scrollTo({top:0,behavior:'smooth'});
    });
  }

  function syncBottomNav() {
    const view = currentView();
    $$('.mobile-nav-btn').forEach(button => {
      const key = button.dataset.mobileNav;
      button.classList.toggle('active',key === view && (key === 'week' || key === 'month'));
    });
  }

  function todayISO() {
    const now = new Date();
    const pad = n => String(n).padStart(2,'0');
    return now.getFullYear() + '-' + pad(now.getMonth()+1) + '-' + pad(now.getDate());
  }

  function currentSelectedMonthDate() {
    if (selectedMonthDate && $('.month-day[data-date="' + selectedMonthDate + '"]')) return selectedMonthDate;
    const today = todayISO();
    if ($('.month-day[data-date="' + today + '"]')) return today;
    return $('.month-day:not(.outside-month)')?.dataset.date || $('.month-day[data-date]')?.dataset.date || today;
  }

  function formatAgendaDate(iso) {
    const [y,m,d] = String(iso).split('-').map(Number);
    return new Date(y,m-1,d).toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'});
  }

  function selectMonthDate(iso) {
    if (!iso) return;
    selectedMonthDate = iso;
    $$('.month-day').forEach(cell => cell.classList.toggle('mobile-selected-day',cell.dataset.date === iso));
    renderMobileAgenda();
  }

  function renderMobileAgenda() {
    if (!isMobile()) return;
    const iso = currentSelectedMonthDate();
    selectedMonthDate = iso;

    if ($('#mobileAgendaTitle')) $('#mobileAgendaTitle').textContent = formatAgendaDate(iso);
    const list = $('#mobileAgendaList');
    if (!list) return;

    const source = $('.month-day[data-date="' + iso + '"]');
    const chips = source ? [...source.querySelectorAll('.month-event-chip')] : [];

    if (!chips.length) {
      list.innerHTML = '<button type="button" class="mobile-agenda-empty" data-mobile-add-date="' + iso + '">Nada apuntado. Toca para añadir algo.</button>';
      return;
    }

    list.innerHTML = '';
    chips.forEach(chip => {
      const clone = chip.cloneNode(true);
      clone.removeAttribute('draggable');
      clone.classList.add('mobile-agenda-event');
      clone.addEventListener('click',() => {
        if (!editUnlocked) {
          notify('Activa la edición arriba para modificar eventos.');
          return;
        }
        $('.month-event-chip[data-month-event-id="' + chip.dataset.monthEventId + '"]')?.click();
      });
      list.appendChild(clone);
    });
  }

  function openAddForSelectedMonthDay() {
    if (!editUnlocked) {
      notify('Activa la edición arriba para añadir elementos.');
      return;
    }
    const iso = currentSelectedMonthDate();
    const add = $('[data-add-date="' + iso + '"]');
    if (add) add.click();
    else $('#addMonthEventBtn')?.click();
  }

  function bindUI() {
    $('#mobileEditToggle')?.addEventListener('click',() => setEditUnlocked(!editUnlocked));

    $$('.mobile-day-tab').forEach(button => {
      button.addEventListener('click',() => setMobileDay(button.dataset.mobileDay));
    });

    $('#mobileFiltersBtn')?.addEventListener('click',() => {
      const filters = currentView() === 'month' ? $('#monthView .filters-card') : $('#weekView .filters-card');
      openSheet(filters,'Filtros');
    });

    $('#closeMobileSheet')?.addEventListener('click',closeSheet);
    $('#mobileSheetBackdrop')?.addEventListener('click',event => {
      if (event.target === $('#mobileSheetBackdrop')) closeSheet();
    });

    $('#mobileBottomNav')?.addEventListener('click',event => {
      const button = event.target.closest('[data-mobile-nav]');
      if (!button) return;
      const action = button.dataset.mobileNav;

      if (action === 'week' || action === 'month') {
        switchBaseView(action);
        return;
      }

      if (action === 'settings') {
        closeSheet();
        $('#settingsBtn')?.click();
        return;
      }

      if (action === 'add') {
        if (!editUnlocked) {
          notify('Activa la edición arriba para añadir elementos.');
          return;
        }

        const view = currentView();
        if (view === 'month') openAddForSelectedMonthDay();
        else if (view === 'week') openSheet($('#weekView .side-card'),'Añadir asignatura');
        else notify('Vuelve a Semana o Mes para añadir elementos.');
      }
    });

    $('#mobileAgendaAdd')?.addEventListener('click',openAddForSelectedMonthDay);
    $('#mobileDayAgenda')?.addEventListener('click',event => {
      const empty = event.target.closest('[data-mobile-add-date]');
      if (!empty) return;
      selectedMonthDate = empty.dataset.mobileAddDate;
      openAddForSelectedMonthDay();
    });

    document.addEventListener('pointerdown',event => {
      if (!isMobile() || editUnlocked) return;
      const blocked = event.target.closest(
        '.event,.resize-handle,.subject-chip,.mobile-agenda-event,#addMonthEventBtn,#mobileAgendaAdd,#earlierBtn,#laterBtn,#shorterBtn,#longerBtn,#deleteSelectedBtn'
      );
      if (!blocked) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },true);

    document.addEventListener('contextmenu',event => {
      if (!isMobile() || editUnlocked || !event.target.closest('.event')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },true);

    document.addEventListener('click',event => {
      if (!isMobile() || editUnlocked) return;
      const blocked = event.target.closest(
        '.day-column,.subject-chip,.mobile-agenda-event,#addMonthEventBtn,#mobileAgendaAdd,#earlierBtn,#laterBtn,#shorterBtn,#longerBtn,#deleteSelectedBtn,[data-mobile-add-date]'
      );
      if (!blocked) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      notify('Activa la edición arriba para modificar el horario.');
    },true);

    $('#monthGrid')?.addEventListener('click',event => {
      if (!isMobile()) return;
      if (event.target.closest('[data-add-date]')) return;
      const chip = event.target.closest('[data-month-event-id]');
      if (chip && editUnlocked) return;
      const cell = event.target.closest('.month-day[data-date]');
      if (!cell) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      selectMonthDate(cell.dataset.date);
    },true);

    if ($('#monthGrid')) {
      const observer = new MutationObserver(() => {
        if (!isMobile()) return;
        requestAnimationFrame(() => selectMonthDate(currentSelectedMonthDate()));
      });
      observer.observe($('#monthGrid'),{childList:true,subtree:true});
    }

    document.addEventListener('keydown',event => {
      if (event.key === 'Escape') closeSheet();
    });

    window.addEventListener('resize',applyResponsiveState,{passive:true});
    document.addEventListener('planner:skinchange',syncEditLockUI);
  }

  function applyResponsiveState() {
    document.body.classList.toggle('mobile-ui',isMobile());

    if (isMobile()) {
      setMobileDay(initialMobileDay());
      selectMonthDate(currentSelectedMonthDate());
    } else {
      $('#calendar')?.classList.remove('mobile-single-day');
      $$('.day-head,.day-column').forEach(node => node.classList.remove('mobile-active'));
      closeSheet();
    }

    syncBottomNav();
    syncEditLockUI();
  }

  function loadGameSystem() {
    if ($('#plannerGameScript')) return;
    const game = document.createElement('script');
    game.id = 'plannerGameScript';
    game.src = './game.js?v=16';
    game.onload = () => {
      if ($('#plannerGameFixes')) return;
      const fixes = document.createElement('script');
      fixes.id = 'plannerGameFixes';
      fixes.src = './game-fixes.js?v=16';
      document.head.appendChild(fixes);
    };
    document.head.appendChild(game);
  }

  ensureMobileUI();
  bindUI();
  applyResponsiveState();
  loadGameSystem();
})();