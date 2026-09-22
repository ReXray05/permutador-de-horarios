(() => {
  'use strict';

  const DAY_KEY = 'planner-mobile-day-v1';
  const VIEW_KEY = 'planner-active-view-v1';

  const $ = sel => document.querySelector(sel);
  const $$ = sel => [...document.querySelectorAll(sel)];

  let selectedMonthDate = null;
  let sheetRestore = null;
  let editUnlocked = false;

  function isMobile() {
    return window.matchMedia('(max-width: 700px)').matches;
  }

  function currentView() {
    return $('#monthView')?.classList.contains('hidden') ? 'week' : 'month';
  }

  function createMobileUI() {
    if (!$('#mobileEditToggle')) {
      const editToggle = document.createElement('button');
      editToggle.id = 'mobileEditToggle';
      editToggle.className = 'mobile-edit-toggle';
      editToggle.type = 'button';
      editToggle.setAttribute('aria-pressed','false');
      editToggle.innerHTML = '<span class="mobile-edit-icon">🔒</span><span class="mobile-edit-label">Bloqueado</span>';
      $('.schedule-switcher')?.insertAdjacentElement('afterend',editToggle);
    }

    if (!$('#mobileWeekTools')) {
      const weekTools = document.createElement('div');
      weekTools.id = 'mobileWeekTools';
      weekTools.className = 'mobile-week-tools';
      weekTools.innerHTML =
        '<div class="mobile-day-tabs" role="tablist" aria-label="Día de la semana">' +
        ['L','M','X','J','V'].map((day,index) =>
          '<button type="button" class="mobile-day-tab" data-mobile-day="' + index +
          '" aria-label="' + ['Lunes','Martes','Miércoles','Jueves','Viernes'][index] + '">' + day + '</button>'
        ).join('') +
        '</div>' +
        '<button id="mobileFiltersBtn" class="mobile-tool-btn" type="button">Filtros</button>';

      const calendarCard = $('.calendar-card');
      calendarCard?.parentElement?.insertBefore(weekTools, calendarCard);
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
      const sheet = document.createElement('div');
      sheet.id = 'mobileSheetBackdrop';
      sheet.className = 'mobile-sheet-backdrop hidden';
      sheet.innerHTML =
        '<section class="mobile-sheet" role="dialog" aria-modal="true" aria-labelledby="mobileSheetTitle">' +
          '<div class="mobile-sheet-handle"></div>' +
          '<div class="mobile-sheet-head">' +
            '<h2 id="mobileSheetTitle">Añadir asignatura</h2>' +
            '<button id="closeMobileSheet" class="icon-btn" type="button" aria-label="Cerrar">×</button>' +
          '</div>' +
          '<div id="mobileSheetContent" class="mobile-sheet-content"></div>' +
        '</section>';
      document.body.appendChild(sheet);
    }

    bindMobileUI();
  }

  function notify(message) {
    const node = $('#status');
    if (!node) return;
    node.textContent = message;
    node.classList.remove('hidden');
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => node.classList.add('hidden'), 1800);
  }

  function syncEditLockUI() {
    const button = $('#mobileEditToggle');
    if (!button) return;

    button.setAttribute('aria-pressed',String(editUnlocked));
    button.classList.toggle('is-unlocked',editUnlocked);
    button.querySelector('.mobile-edit-icon').textContent = editUnlocked ? '🔓' : '🔒';
    button.querySelector('.mobile-edit-label').textContent = editUnlocked ? 'Editando' : 'Bloqueado';

    document.body.classList.toggle('mobile-edit-unlocked',editUnlocked);
    document.body.classList.toggle('mobile-edit-locked',!editUnlocked);

    const addNav = $('[data-mobile-nav="add"]');
    if (addNav) {
      addNav.toggleAttribute('disabled',!editUnlocked);
      addNav.setAttribute('aria-disabled',String(!editUnlocked));
    }

    $('#mobileAgendaAdd')?.toggleAttribute('disabled',!editUnlocked);

    if (!editUnlocked) {
      closeSheet();
      $('#cancelEventBtn')?.click();
    }
  }

  function setEditUnlocked(value) {
    editUnlocked = Boolean(value);
    syncEditLockUI();
    notify(editUnlocked ? 'Edición activada.' : 'Edición bloqueada.');
  }

  function setMobileDay(day) {
    const normalized = Math.max(0,Math.min(4,Number(day) || 0));
    localStorage.setItem(DAY_KEY,String(normalized));

    const calendar = $('#calendar');
    calendar?.classList.add('mobile-single-day');

    $$('.day-head').forEach((head,index) => {
      head.classList.toggle('mobile-active',index === normalized);
      head.dataset.mobileDay = index;
    });

    $$('.day-column').forEach((column,index) => {
      column.classList.toggle('mobile-active',index === normalized);
    });

    $$$('.mobile-day-tab').forEach(button => {
      const active = Number(button.dataset.mobileDay) === normalized;
      button.classList.toggle('active',active);
      button.setAttribute('aria-selected',String(active));
    });
  }

  function initialMobileDay() {
    const saved = Number(localStorage.getItem(DAY_KEY));
    if (Number.isInteger(saved) && saved >= 0 && saved <= 4) return saved;
    const weekday = new Date().getDay() - 1;
    return weekday >= 0 && weekday <= 4 ? weekday : 0;
  }

  function openSheet(node,title) {
    if (!node) return;
    closeSheet();

    const backdrop = $('#mobileSheetBackdrop');
    const content = $('#mobileSheetContent');
    const titleNode = $('#mobileSheetTitle');

    const placeholder = document.createComment('mobile-sheet-placeholder');
    node.parentNode.insertBefore(placeholder,node);
    content.appendChild(node);

    sheetRestore = () => {
      placeholder.parentNode?.insertBefore(node,placeholder);
      placeholder.remove();
    };

    titleNode.textContent = title;
    backdrop.classList.remove('hidden');
    document.body.classList.add('mobile-sheet-open');
  }

  function closeSheet() {
    const backdrop = $('#mobileSheetBackdrop');
    if (!backdrop || backdrop.classList.contains('hidden')) return;

    if (sheetRestore) {
      sheetRestore();
      sheetRestore = null;
    }

    backdrop.classList.add('hidden');
    document.body.classList.remove('mobile-sheet-open');
  }

  function syncBottomNav() {
    const view = currentView();
    $$('.mobile-nav-btn').forEach(btn => {
      const key = btn.dataset.mobileNav;
      btn.classList.toggle('active',key === view);
    });
  }

  function closeTransientPanels() {
    closeSheet();

    const eventBackdrop = $('#eventModalBackdrop');
    if (eventBackdrop && !eventBackdrop.classList.contains('hidden')) {
      $('#cancelEventBtn')?.click();
      eventBackdrop.classList.add('hidden');
      eventBackdrop.setAttribute('aria-hidden','true');
    }

    const settingsBackdrop = $('#settingsBackdrop');
    if (settingsBackdrop && !settingsBackdrop.classList.contains('hidden')) {
      $('#closeSettingsBtn')?.click();
      settingsBackdrop.classList.add('hidden');
      settingsBackdrop.setAttribute('aria-hidden','true');
    }
  }

  function forceView(view) {
    const normalized = view === 'month' ? 'month' : 'week';

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

  function switchView(view) {
    const normalized = view === 'month' ? 'month' : 'week';
    closeTransientPanels();

    const tab = $('.view-tab[data-view="' + normalized + '"]');
    tab?.click();

    requestAnimationFrame(() => {
      const target = normalized === 'week' ? $('#weekView') : $('#monthView');
      if (!target || target.classList.contains('hidden')) {
        forceView(normalized);
      }

      syncBottomNav();
      window.scrollTo({top:0,behavior:'smooth'});
    });
  }

  function currentSelectedMonthDate() {
    if (selectedMonthDate && $('.month-day[data-date="' + selectedMonthDate + '"]')) {
      return selectedMonthDate;
    }

    const today = new Date();
    const iso = [
      today.getFullYear(),
      String(today.getMonth()+1).padStart(2,'0'),
      String(today.getDate()).padStart(2,'0')
    ].join('-');

    if ($('.month-day[data-date="' + iso + '"]')) return iso;

    return $('.month-day:not(.outside-month)')?.dataset.date ||
           $('.month-day[data-date]')?.dataset.date ||
           iso;
  }

  function formatAgendaDate(iso) {
    const parts = iso.split('-').map(Number);
    return new Date(parts[0],parts[1]-1,parts[2]).toLocaleDateString('es-ES',{
      weekday:'long',
      day:'numeric',
      month:'long'
    });
  }

  function selectMonthDate(iso) {
    if (!iso) return;
    selectedMonthDate = iso;

    $$('.month-day').forEach(cell => {
      cell.classList.toggle('mobile-selected-day',cell.dataset.date === iso);
    });

    renderMobileAgenda();
  }

  function renderMobileAgenda() {
    if (!isMobile()) return;

    const iso = currentSelectedMonthDate();
    selectedMonthDate = iso;

    const title = $('#mobileAgendaTitle');
    const list = $('#mobileAgendaList');
    if (!title || !list) return;

    title.textContent = formatAgendaDate(iso);

    const sourceCell = $('.month-day[data-date="' + iso + '"]');
    const chips = sourceCell ? [...sourceCell.querySelectorAll('.month-event-chip')] : [];

    if (!chips.length) {
      list.innerHTML =
        '<button type="button" class="mobile-agenda-empty" data-mobile-add-date="' + iso + '">' +
        'Nada apuntado. Toca para añadir algo.' +
        '</button>';
      return;
    }

    list.innerHTML = '';
    for (const chip of chips) {
      const clone = chip.cloneNode(true);
      clone.removeAttribute('draggable');
      clone.classList.add('mobile-agenda-event');
      clone.addEventListener('click',() => {
        const original = $('.month-event-chip[data-month-event-id="' + chip.dataset.monthEventId + '"]');
        original?.click();
      });
      list.appendChild(clone);
    }
  }

  function openAddForSelectedMonthDay() {
    const iso = currentSelectedMonthDate();
    const button = $('[data-add-date="' + iso + '"]');
    if (button) button.click();
    else $('#addMonthEventBtn')?.click();
  }

  function bindMobileUI() {
    $('#mobileEditToggle')?.addEventListener('click',() => {
      setEditUnlocked(!editUnlocked);
    });

    document.addEventListener('pointerdown',event => {
      if (!isMobile() || editUnlocked) return;

      const blocked = event.target.closest(
        '.event, .resize-handle, .subject-chip, .mobile-agenda-event, #addMonthEventBtn, #mobileAgendaAdd'
      );

      if (!blocked) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },true);

    document.addEventListener('contextmenu',event => {
      if (!isMobile() || editUnlocked) return;
      if (!event.target.closest('.event')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },true);

    document.addEventListener('click',event => {
      if (!isMobile() || editUnlocked) return;

      const blocked = event.target.closest(
        '.day-column, .subject-chip, .mobile-agenda-event, #addMonthEventBtn, #mobileAgendaAdd, [data-mobile-add-date]'
      );

      if (!blocked) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      notify('Activa la edición arriba para modificar el horario.');
    },true);

    $$('.mobile-day-tab').forEach(btn => {
      btn.addEventListener('click',() => setMobileDay(btn.dataset.mobileDay));
    });

    $('#mobileFiltersBtn')?.addEventListener('click',() => {
      openSheet($('.filters-card'),'Filtros');
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
        switchView(action);
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

        if (currentView() === 'month') {
          openAddForSelectedMonthDay();
        } else {
          const subjectCard = $('#subjectList')?.closest('.side-card');
          openSheet(subjectCard,'Añadir asignatura');
        }
      }
    });

    $('#mobileAgendaAdd')?.addEventListener('click',openAddForSelectedMonthDay);

    $('#mobileDayAgenda')?.addEventListener('click',event => {
      const empty = event.target.closest('[data-mobile-add-date]');
      if (!empty) return;
      selectedMonthDate = empty.dataset.mobileAddDate;
      openAddForSelectedMonthDay();
    });

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

    const monthObserver = new MutationObserver(() => {
      if (!isMobile()) return;
      requestAnimationFrame(() => {
        selectMonthDate(currentSelectedMonthDate());
      });
    });

    if ($('#monthGrid')) {
      monthObserver.observe($('#monthGrid'),{childList:true,subtree:true});
    }

    document.addEventListener('keydown',event => {
      if (event.key === 'Escape') closeSheet();
    });

    window.addEventListener('resize',applyResponsiveState,{passive:true});
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

  createMobileUI();
  applyResponsiveState();
})();