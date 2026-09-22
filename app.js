(() => {
  'use strict';

  /* ==========================================================
     Configuración
  ========================================================== */

  const app = document.getElementById('app');

  const START_MIN = 8 * 60;
  const END_MIN = 21 * 60;
  const STEP = 30;
  const SLOT_COUNT = (END_MIN - START_MIN) / STEP;
  const DEFAULT_DURATION = 2;
  const LEGACY_STORAGE_KEY = 'weekly-planner-v10-subjects14';
  const SCHEDULE_INDEX_KEY = 'weekly-planner-schedules-index-v1';
  const ACTIVE_SCHEDULE_KEY = 'weekly-planner-active-schedule-v1';

  function loadScheduleIndex() {
    try {
      const raw = localStorage.getItem(SCHEDULE_INDEX_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {}

    const initial = [{ id:'principal', name:'Mi horario' }];
    localStorage.setItem(SCHEDULE_INDEX_KEY, JSON.stringify(initial));
    return initial;
  }

  let scheduleIndex = loadScheduleIndex();
  let activeScheduleId = localStorage.getItem(ACTIVE_SCHEDULE_KEY);

  if (!scheduleIndex.some(item => item.id === activeScheduleId)) {
    activeScheduleId = scheduleIndex[0].id;
    localStorage.setItem(ACTIVE_SCHEDULE_KEY, activeScheduleId);
  }

  let STORAGE_KEY = `weekly-planner-schedule:${activeScheduleId}`;

  // Migración transparente desde la versión anterior.
  if (localStorage.getItem(STORAGE_KEY) === null) {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy !== null) localStorage.setItem(STORAGE_KEY, legacy);
  }

  const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  const SUBJECTS = [
    { id:'materiales', name:'Ingeniería de Materiales', course:3, bg:'#fce7f3', fg:'#831843' },
    { id:'maquinas', name:'Máquinas Eléctricas', course:3, bg:'#e0e7ff', fg:'#312e81' },
    { id:'diseno_maquinas_1', name:'Diseño de Máquinas I', course:3, bg:'#f3e8ff', fg:'#6b21a8' },
    { id:'teoria', name:'Teoría de Máquinas y Mecanismos', course:3, bg:'#ffe4e6', fg:'#9f1239' },
    { id:'estructuras', name:'Teoría de Estructuras', course:3, bg:'#e2e8f0', fg:'#334155' },
    { id:'termica', name:'Ingeniería Térmica', course:3, bg:'#fae8ff', fg:'#86198f' },
    { id:'electronica', name:'Electrónica', course:3, bg:'#cffafe', fg:'#155e75' },
    { id:'diseno_mecanico', name:'Diseño Mecánico', course:4, bg:'#fef3c7', fg:'#92400e' },
    { id:'metrologia', name:'Metrología y Calidad', course:4, bg:'#dbeafe', fg:'#1d4ed8' },
    { id:'fabricacion', name:'Ingeniería de Fabricación', course:4, bg:'#dcfce7', fg:'#166534' },
    { id:'oficina', name:'Oficina Técnica', course:4, bg:'#e0f2fe', fg:'#0369a1' },
    { id:'sff', name:'Sistemas de Fabricación Flexible', course:4, bg:'#fef9c3', fg:'#854d0e' },
    { id:'motores', name:'Motores Alternativos', course:4, bg:'#ffedd5', fg:'#9a3412' },
    { id:'elementos', name:'Elementos Finitos y Vibraciones Mecánicas', course:4, bg:'#ede9fe', fg:'#5b21b6' }
  ];

  // Horario inicial mostrado la primera vez que se abre este archivo.
  const DEFAULT_EVENTS = [
    {
        "id": "d_mon_maquinas_lab",
        "subjectId": "maquinas",
        "day": 0,
        "startSlot": 3,
        "duration": 7,
        "lab": true,
        "frame": true,
        "frameColor": "#dc2626",
        "opacity": 100
    },
    {
        "id": "d_mon_sff",
        "subjectId": "sff",
        "day": 0,
        "startSlot": 8,
        "duration": 4,
        "lab": false,
        "frame": false,
        "frameColor": "#dc2626",
        "opacity": 100
    },
    {
        "id": "d_mon_motores",
        "subjectId": "motores",
        "day": 0,
        "startSlot": 8,
        "duration": 4,
        "lab": false,
        "frame": false,
        "frameColor": "#dc2626",
        "opacity": 100
    },
    {
        "id": "d_mon_sff_lab",
        "subjectId": "sff",
        "day": 0,
        "startSlot": 15,
        "duration": 4,
        "lab": true,
        "frame": false,
        "frameColor": "#dc2626",
        "opacity": 100
    },
    {
        "id": "d_mon_motores_lab1",
        "subjectId": "motores",
        "day": 0,
        "startSlot": 15,
        "duration": 4,
        "lab": true,
        "frame": false,
        "frameColor": "#dc2626",
        "opacity": 100
    },
    {
        "id": "d_mon_motores_lab2",
        "subjectId": "motores",
        "day": 0,
        "startSlot": 19,
        "duration": 4,
        "lab": true,
        "frame": false,
        "frameColor": "#dc2626",
        "opacity": 100
    },
    {
        "id": "d_tue_metrologia",
        "subjectId": "metrologia",
        "day": 1,
        "startSlot": 3,
        "duration": 4,
        "lab": false,
        "frame": false,
        "frameColor": "#dc2626",
        "opacity": 100
    },
    {
        "id": "d_tue_termica_lab",
        "subjectId": "termica",
        "day": 1,
        "startSlot": 7,
        "duration": 4,
        "lab": true,
        "frame": true,
        "frameColor": "#dc2626",
        "opacity": 100
    },
    {
        "id": "d_tue_oficina",
        "subjectId": "oficina",
        "day": 1,
        "startSlot": 8,
        "duration": 4,
        "lab": false,
        "frame": false,
        "frameColor": "#dc2626",
        "opacity": 100
    },
    {
        "id": "d_tue_elementos",
        "subjectId": "elementos",
        "day": 1,
        "startSlot": 15,
        "duration": 4,
        "lab": false,
        "frame": false,
        "frameColor": "#dc2626",
        "opacity": 100
    },
    {
        "id": "d_tue_oficina_lab",
        "subjectId": "oficina",
        "day": 1,
        "startSlot": 19,
        "duration": 4,
        "lab": true,
        "frame": false,
        "frameColor": "#dc2626",
        "opacity": 100
    },
    {
        "id": "d_wed_fabricacion",
        "subjectId": "fabricacion",
        "day": 2,
        "startSlot": 1,
        "duration": 2,
        "lab": false,
        "frame": false,
        "frameColor": "#dc2626",
        "opacity": 100
    },
    {
        "id": "d_wed_oficina_lab",
        "subjectId": "oficina",
        "day": 2,
        "startSlot": 3,
        "duration": 4,
        "lab": true,
        "frame": false,
        "frameColor": "#dc2626",
        "opacity": 100
    },
    {
        "id": "d_wed_teoria_lab",
        "subjectId": "teoria",
        "day": 2,
        "startSlot": 7,
        "duration": 4,
        "lab": true,
        "frame": true,
        "frameColor": "#dc2626",
        "opacity": 100
    },
    {
        "id": "d_wed_termica_lab",
        "subjectId": "termica",
        "day": 2,
        "startSlot": 7,
        "duration": 4,
        "lab": true,
        "frame": true,
        "frameColor": "#dc2626",
        "opacity": 100
    },
    {
        "id": "d_wed_sff",
        "subjectId": "sff",
        "day": 2,
        "startSlot": 8,
        "duration": 4,
        "lab": false,
        "frame": false,
        "frameColor": "#dc2626",
        "opacity": 100
    },
    {
        "id": "d_wed_metrologia_lab",
        "subjectId": "metrologia",
        "day": 2,
        "startSlot": 15,
        "duration": 8,
        "lab": true,
        "frame": false,
        "frameColor": "#dc2626",
        "opacity": 100
    },
    {
        "id": "d_wed_motores_lab",
        "subjectId": "motores",
        "day": 2,
        "startSlot": 15,
        "duration": 8,
        "lab": true,
        "frame": false,
        "frameColor": "#dc2626",
        "opacity": 100
    },
    {
        "id": "d_thu_maquinas_lab",
        "subjectId": "maquinas",
        "day": 3,
        "startSlot": 2,
        "duration": 4,
        "lab": true,
        "frame": true,
        "frameColor": "#dc2626",
        "opacity": 100
    },
    {
        "id": "d_thu_fabricacion_lab1",
        "subjectId": "fabricacion",
        "day": 3,
        "startSlot": 3,
        "duration": 4,
        "lab": true,
        "frame": false,
        "frameColor": "#dc2626",
        "opacity": 100
    },
    {
        "id": "d_thu_materiales_lab",
        "subjectId": "materiales",
        "day": 3,
        "startSlot": 6,
        "duration": 5,
        "lab": true,
        "frame": true,
        "frameColor": "#dc2626",
        "opacity": 100
    },
    {
        "id": "d_thu_motores",
        "subjectId": "motores",
        "day": 3,
        "startSlot": 8,
        "duration": 4,
        "lab": false,
        "frame": false,
        "frameColor": "#dc2626",
        "opacity": 100
    },
    {
        "id": "d_thu_fabricacion_lab2",
        "subjectId": "fabricacion",
        "day": 3,
        "startSlot": 15,
        "duration": 8,
        "lab": true,
        "frame": false,
        "frameColor": "#dc2626",
        "opacity": 100
    },
    {
        "id": "d_fri_electronica_lab",
        "subjectId": "electronica",
        "day": 4,
        "startSlot": 3,
        "duration": 8,
        "lab": true,
        "frame": true,
        "frameColor": "#dc2626",
        "opacity": 100
    },
    {
        "id": "d_fri_maquinas_lab",
        "subjectId": "maquinas",
        "day": 4,
        "startSlot": 3,
        "duration": 8,
        "lab": true,
        "frame": true,
        "frameColor": "#dc2626",
        "opacity": 100
    },
    {
        "id": "d_fri_motores",
        "subjectId": "motores",
        "day": 4,
        "startSlot": 3,
        "duration": 2,
        "lab": false,
        "frame": false,
        "frameColor": "#dc2626",
        "opacity": 100
    },
    {
        "id": "d_fri_elementos",
        "subjectId": "elementos",
        "day": 4,
        "startSlot": 15,
        "duration": 4,
        "lab": false,
        "frame": false,
        "frameColor": "#dc2626",
        "opacity": 100
    },
    {
        "id": "d_fri_elementos_lab",
        "subjectId": "elementos",
        "day": 4,
        "startSlot": 19,
        "duration": 4,
        "lab": true,
        "frame": false,
        "frameColor": "#dc2626",
        "opacity": 100
    },
    {
        "id": "d_fri_sff_lab",
        "subjectId": "sff",
        "day": 4,
        "startSlot": 19,
        "duration": 4,
        "lab": true,
        "frame": false,
        "frameColor": "#dc2626",
        "opacity": 100
    }
];


  /* ==========================================================
     Estado
  ========================================================== */

  let events = loadEvents();
  let history = [];
  let selectedIds = new Set();
  let selectedSubject = null;

  let previewEvent = null;
  let previewNode = null;

  let duplicateMode = null;
  let suppressClickUntil = 0;
  let opacitySnapshotTaken = false;
  let showCurrentTime = true;
  let nowTimer = null;
  let frameColorFilterValue = 'all';
  let toastTimer = null;

  /* ==========================================================
     DOM y utilidades
  ========================================================== */

  const $ = selector => app.querySelector(selector);
  const $$ = selector => [...app.querySelectorAll(selector)];

  const columns = $$('.day-column');
  const status = $('#status');
  const undoBtn = $('#undoBtn');
  const contextMenu = $('#contextMenu');

  function saveScheduleIndex() {
    localStorage.setItem(SCHEDULE_INDEX_KEY, JSON.stringify(scheduleIndex));
  }

  function activeScheduleMeta() {
    return scheduleIndex.find(item => item.id === activeScheduleId) || scheduleIndex[0];
  }

  function refreshScheduleSelector() {
    const select = $('#scheduleSelect');
    if (!select) return;

    select.innerHTML = scheduleIndex
      .map(item => `<option value="${item.id}">${item.name}</option>`)
      .join('');

    select.value = activeScheduleId;
    $('#deleteScheduleBtn')?.toggleAttribute('disabled', scheduleIndex.length <= 1);
  }

  function scheduleStorageKey(id) {
    return `weekly-planner-schedule:${id}`;
  }

  function safeScheduleName(name) {
    const cleaned = String(name || '').trim().replace(/\s+/g, ' ');
    return cleaned.slice(0, 48) || 'Horario';
  }

  function createSchedule(name, initialEvents = []) {
    const id = 'h_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,7);
    const meta = { id, name:safeScheduleName(name) };

    scheduleIndex.push(meta);
    saveScheduleIndex();
    localStorage.setItem(scheduleStorageKey(id), JSON.stringify(initialEvents));
    localStorage.setItem(ACTIVE_SCHEDULE_KEY, id);
    location.reload();
  }

  function switchSchedule(id) {
    if (!scheduleIndex.some(item => item.id === id)) return;
    persist();
    localStorage.setItem(ACTIVE_SCHEDULE_KEY, id);
    location.reload();
  }

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const subjectById = id => SUBJECTS.find(subject => subject.id === id);

  function uid() {
    return 'e_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function rowHeight() {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--row-h')) || 31;
  }

  function formatTime(totalMinutes) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }

  function formatDuration(slots) {
    const minutes = slots * STEP;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (!hours) return `${rest} min`;
    if (!rest) return `${hours} h`;
    return `${hours} h ${rest} min`;
  }

  function eventStart(event) {
    return START_MIN + event.startSlot * STEP;
  }

  function eventEnd(event) {
    return eventStart(event) + event.duration * STEP;
  }

  function announce(message) {
    if (!message) return;
    status.textContent = message;
    status.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => status.classList.add('hidden'), 2200);
  }

  function selectedEvents() {
    return events.filter(event => selectedIds.has(event.id));
  }

  function saveState() {
    history.push(JSON.stringify(events));
    if (history.length > 60) history.shift();
    undoBtn.disabled = history.length === 0;
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch {}
  }

  function loadEvents() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      // Si ya existe un horario guardado, se respeta tal cual, incluso si está vacío.
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : JSON.parse(JSON.stringify(DEFAULT_EVENTS));
      }

      // Primera apertura: cargar el horario predeterminado de la captura.
      return JSON.parse(JSON.stringify(DEFAULT_EVENTS));
    } catch {
      return JSON.parse(JSON.stringify(DEFAULT_EVENTS));
    }
  }

  function pulse(ids) {
    requestAnimationFrame(() => {
      ids.forEach(id => {
        const node = app.querySelector(`[data-event-id="${id}"]`);
        if (!node) return;
        node.classList.remove('pop');
        void node.offsetWidth;
        node.classList.add('pop');
        setTimeout(() => node.classList.remove('pop'), 260);
      });
    });
  }

  /* ==========================================================
     Solapamientos
  ========================================================== */

  function computeDayLayout(dayEvents) {
    const sorted = [...dayEvents].sort((a,b) =>
      a.startSlot - b.startSlot || b.duration - a.duration
    );

    const groups = [];
    let current = [];
    let groupEnd = -1;

    for (const event of sorted) {
      const end = event.startSlot + event.duration;

      if (!current.length || event.startSlot < groupEnd) {
        current.push(event);
        groupEnd = Math.max(groupEnd, end);
      } else {
        groups.push(current);
        current = [event];
        groupEnd = end;
      }
    }

    if (current.length) groups.push(current);

    const result = new Map();

    for (const group of groups) {
      const laneEnds = [];
      const assignments = new Map();

      for (const event of group) {
        let lane = laneEnds.findIndex(end => end <= event.startSlot);

        if (lane === -1) {
          lane = laneEnds.length;
          laneEnds.push(-1);
        }

        laneEnds[lane] = event.startSlot + event.duration;
        assignments.set(event.id, lane);
      }

      const laneCount = Math.max(1, laneEnds.length);

      for (const event of group) {
        result.set(event.id, {
          lane: assignments.get(event.id),
          laneCount
        });
      }
    }

    return result;
  }

  function currentLayouts(extraEvent = null) {
    const result = new Map();

    for (let day = 0; day < 5; day++) {
      const list = events
        .filter(event =>
          event.day === day &&
          event.id !== extraEvent?.sourceId &&
          passesFilter(event)
        )
        .map(event => ({...event}));

      if (extraEvent && extraEvent.day === day) {
        list.push({...extraEvent, id:'__preview__'});
      }

      const layout = computeDayLayout(list);
      for (const [id, value] of layout) result.set(id, value);
    }

    return result;
  }

  function applyGeometry(node, event, layout) {
    const gap = 4;
    const count = Math.max(1, layout.laneCount);
    const width = 100 / count;
    const left = layout.lane * width;

    node.style.top = `calc(var(--row-h) * ${event.startSlot} + 2px)`;
    node.style.height = `calc(var(--row-h) * ${event.duration} - 4px)`;
    node.style.left = `calc(${left}% + ${gap}px)`;
    node.style.width = `calc(${width}% - ${gap * 2}px)`;
  }

  /* ==========================================================
     Indicador del momento actual
  ========================================================== */

  function clearCurrentTimeIndicator() {
    $$('.now-line').forEach(node => node.remove());
    $$('.day-head').forEach(node => node.classList.remove('is-today'));
  }

  function updateCurrentTimeIndicator() {
    clearCurrentTimeIndicator();

    const toggle = $('#nowToggleBtn');
    toggle.classList.toggle('active', showCurrentTime);
    toggle.setAttribute('aria-pressed', String(showCurrentTime));

    if (!showCurrentTime) return;

    const now = new Date();
    const weekdayIndex = now.getDay() - 1; // lunes=0 ... viernes=4

    if (weekdayIndex < 0 || weekdayIndex > 4) return;

    $$('.day-head')[weekdayIndex].classList.add('is-today');

    const minutesNow =
      now.getHours() * 60 +
      now.getMinutes() +
      now.getSeconds() / 60;

    if (minutesNow < START_MIN || minutesNow > END_MIN) return;

    const line = document.createElement('div');
    line.className = 'now-line';

    const positionSlots = (minutesNow - START_MIN) / STEP;
    line.style.top = `calc(var(--row-h) * ${positionSlots})`;

    const label = document.createElement('span');
    label.className = 'now-label';
    label.textContent = `Ahora · ${formatTime(Math.floor(minutesNow))}`;

    line.appendChild(label);
    columns[weekdayIndex].appendChild(line);
  }

  function startNowClock() {
    if (nowTimer) clearInterval(nowTimer);
    updateCurrentTimeIndicator();
    nowTimer = setInterval(updateCurrentTimeIndicator, 30000);
  }

  /* ==========================================================
     Filtros
  ========================================================== */

  function passesFilter(event) {
    const labFilter = $('#labFilter').value;
    const courseFilter = $('#courseFilter').value;
    const subjectFilter = $('#subjectFilter').value;
    const frameFilter = $('#frameFilter').value;
    const subject = subjectById(event.subjectId);

    if (!subject) return false;
    if (labFilter === 'lab' && !event.lab) return false;
    if (labFilter === 'nonlab' && event.lab) return false;
    if (courseFilter !== 'all' && String(subject.course) !== courseFilter) return false;
    if (subjectFilter !== 'all' && event.subjectId !== subjectFilter) return false;
    if (frameFilter === 'framed' && !event.frame) return false;
    if (frameFilter === 'none' && event.frame) return false;

    if (frameColorFilterValue !== 'all') {
      if (!event.frame) return false;
      if ((event.frameColor || '').toLowerCase() !== frameColorFilterValue) return false;
    }

    return true;
  }

  function refreshFrameFilter() {
    const container = $('#frameColorFilter');
    const colors = [...new Set(
      events
        .filter(event => event.frame && event.frameColor)
        .map(event => event.frameColor.toLowerCase())
    )];

    if (frameColorFilterValue !== 'all' && !colors.includes(frameColorFilterValue)) {
      frameColorFilterValue = 'all';
    }

    container.innerHTML = '';

    const allButton = document.createElement('button');
    allButton.type = 'button';
    allButton.className = 'color-filter-all' + (frameColorFilterValue === 'all' ? ' active' : '');
    allButton.textContent = 'Todos';
    allButton.addEventListener('click', () => {
      frameColorFilterValue = 'all';
      render();
    });
    container.appendChild(allButton);

    for (const color of colors) {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'color-swatch' + (frameColorFilterValue === color ? ' active' : '');
      swatch.style.setProperty('--swatch-color', color);
      swatch.setAttribute('aria-label', 'Filtrar por este color de marco');
      swatch.title = 'Filtrar por este color';
      swatch.addEventListener('click', () => {
        frameColorFilterValue = frameColorFilterValue === color ? 'all' : color;
        render();
      });
      container.appendChild(swatch);
    }
  }

  /* ==========================================================
     Render
  ========================================================== */

  function render() {
    columns.forEach(column => {
      column.querySelectorAll('.event').forEach(node => node.remove());
    });

    const layouts = currentLayouts();
    let visibleCount = 0;

    for (const event of events) {
      const subject = subjectById(event.subjectId);
      if (!subject) continue;

      const visible = passesFilter(event);
      if (visible) visibleCount++;

      const node = document.createElement('div');
      const layout = layouts.get(event.id) || {lane:0, laneCount:1};

      node.className = [
        'event',
        selectedIds.has(event.id) ? 'is-selected' : '',
        event.frame ? 'has-frame' : '',
        event.lab ? 'lab' : '',
        visible ? '' : 'filtered-out'
      ].filter(Boolean).join(' ');

      node.dataset.eventId = event.id;
      node.tabIndex = 0;

      applyGeometry(node, event, layout);

      node.style.background = subject.bg;
      node.style.color = subject.fg;
      node.style.opacity = (event.opacity ?? 100) / 100;
      node.style.setProperty('--frame-color', event.frameColor || '#dc2626');

      node.innerHTML = `
        <div class="resize-handle top" data-edge="top"></div>
        <div class="event-title">${subject.name}</div>
        <div class="event-meta">
          ${formatTime(eventStart(event))}–${formatTime(eventEnd(event))}
          · ${formatDuration(event.duration)}
        </div>
        ${event.lab ? '<div class="lab-label">LAB</div>' : ''}
        <div class="resize-handle bottom" data-edge="bottom"></div>
      `;

      node.addEventListener('click', pointerEvent => {
        if (Date.now() < suppressClickUntil) return;
        pointerEvent.stopPropagation();
        handleSelectionClick(event.id, pointerEvent);
      });

      node.addEventListener('contextmenu', pointerEvent => {
        pointerEvent.preventDefault();
        pointerEvent.stopPropagation();

        if (!selectedIds.has(event.id)) {
          selectedIds = new Set([event.id]);
        }

        render();
        openContextMenu(pointerEvent, event);
      });

      node.addEventListener('pointerdown', pointerEvent => {
        if (pointerEvent.button === 2) return;
        if (pointerEvent.ctrlKey || pointerEvent.metaKey || pointerEvent.shiftKey) return;

        const handle = pointerEvent.target.closest('.resize-handle');

        if (handle) {
          beginResize(pointerEvent, event, handle.dataset.edge);
        } else {
          beginEventDrag(pointerEvent, event, node);
        }
      });

      columns[event.day].appendChild(node);
    }

    updateEditor();
    refreshFrameFilter();

    $('#filterSummary').textContent =
      visibleCount === events.length
        ? `Mostrando todos los bloques (${visibleCount}).`
        : `Mostrando ${visibleCount} de ${events.length} bloques.`;

    persist();
    updateCurrentTimeIndicator();
  }

  function handleSelectionClick(id, pointerEvent) {
    const additive = pointerEvent.ctrlKey || pointerEvent.metaKey || pointerEvent.shiftKey;

    if (additive) {
      if (selectedIds.has(id)) selectedIds.delete(id);
      else selectedIds.add(id);
    } else {
      selectedIds = new Set([id]);
    }

    selectedSubject = null;
    updateSubjectSelection();
    render();
    pulse([id]);
  }

  function updateSubjectSelection() {
    $$('.subject-chip').forEach(button => {
      button.classList.toggle('selected', button.dataset.subjectId === selectedSubject);
    });
  }

  function updateEditor() {
    const editor = $('#editor');
    const list = selectedEvents();

    if (!list.length) {
      editor.classList.add('hidden');
      return;
    }

    editor.classList.remove('hidden');

    $('#editorHeading').textContent =
      list.length === 1        ? 'Bloque seleccionado'
        : `${list.length} bloques seleccionados`;

    $('#editorTitle').textContent =
      list.length === 1
        ? `${subjectById(list[0].subjectId).name} · ${DAYS[list[0].day]} · ${formatTime(eventStart(list[0]))}–${formatTime(eventEnd(list[0]))} · ${formatDuration(list[0].duration)}`
        : 'Los ajustes se aplican al conjunto seleccionado.';
  }

  /* ==========================================================
     Inicialización del horario y asignaturas
  ========================================================== */

  for (let slot = 0; slot < SLOT_COUNT; slot++) {
    const node = document.createElement('div');
    node.className = 'time-label';
    node.style.top = `calc(var(--row-h) * ${slot})`;
    node.textContent = formatTime(START_MIN + slot * STEP);
    $('#timeColumn').appendChild(node);
  }

  let lastCourse = null;
  const subjectOptGroups = {
    3: document.createElement('optgroup'),
    4: document.createElement('optgroup')
  };
  subjectOptGroups[3].label = '3.º';
  subjectOptGroups[4].label = '4.º';

  for (const subject of SUBJECTS) {
    if (subject.course !== lastCourse) {
      const groupTitle = document.createElement('div');
      groupTitle.className = 'subject-group-title';
      groupTitle.textContent = `${subject.course}.º curso`;
      $('#subjectList').appendChild(groupTitle);
      lastCourse = subject.course;
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'subject-chip';
    button.dataset.subjectId = subject.id;

    button.innerHTML = `
      <span class="subject-dot" style="background:${subject.fg}"></span>
      <span>${subject.name}</span>
      <span class="course-badge">${subject.course}.º</span>
    `;

    button.addEventListener('click', () => {
      selectedSubject = selectedSubject === subject.id ? null : subject.id;
      selectedIds.clear();
      updateSubjectSelection();
      render();
    });

    button.addEventListener('pointerdown', event => beginSubjectDrag(event, subject));
    $('#subjectList').appendChild(button);

    const option = document.createElement('option');
    option.value = subject.id;
    option.textContent = subject.name;
    subjectOptGroups[subject.course].appendChild(option);
  }

  $('#subjectFilter').appendChild(subjectOptGroups[3]);
  $('#subjectFilter').appendChild(subjectOptGroups[4]);

  columns.forEach(column => {
    column.addEventListener('click', event => {
      if (duplicateMode) {
        const anchor = duplicateMode.anchor;
        placeDuplicate(
          Number(column.dataset.day),
          slotFromPointer(column, event.clientY, 0, anchor.duration)
        );
        return;
      }

      if (!selectedSubject) return;
      if (event.target.closest('.event')) return;

      addEvent(
        selectedSubject,
        Number(column.dataset.day),
        slotFromPointer(column, event.clientY, 0, DEFAULT_DURATION),
        DEFAULT_DURATION
      );

      selectedSubject = null;
      updateSubjectSelection();
    });
  });

  /* ==========================================================
     Crear / editar
  ========================================================== */

  function addEvent(subjectId, day, startSlot, durationSlots) {
    saveState();

    const event = {
      id:uid(),
      subjectId,
      day,
      startSlot,
      duration:clamp(durationSlots, 1, SLOT_COUNT - startSlot),
      lab:false,
      frame:false,
      frameColor:'#dc2626',
      opacity:100
    };

    events.push(event);
    selectedIds = new Set([event.id]);

    render();
    pulse([event.id]);

    announce(
      `${subjectById(subjectId).name} añadida el ${DAYS[day]} a las ${formatTime(eventStart(event))}.`
    );
  }

  function adjustSelected(startDelta, durationDelta) {
    const list = selectedEvents();
    if (!list.length) return;

    saveState();

    for (const event of list) {
      if (startDelta) {
        event.startSlot = clamp(
          event.startSlot + startDelta,
          0,
          SLOT_COUNT - event.duration
        );
      }

      if (durationDelta) {
        event.duration = clamp(
          event.duration + durationDelta,
          1,
          SLOT_COUNT - event.startSlot
        );
      }
    }

    render();
    pulse([...selectedIds]);
  }

  function deleteSelected() {
    if (!selectedIds.size) return;

    saveState();
    events = events.filter(event => !selectedIds.has(event.id));
    selectedIds.clear();

    closeContextMenu();
    render();
    announce('Selección eliminada.');
  }

  /* ==========================================================
     Drag & drop + preview
  ========================================================== */

  function columnAt(clientX, clientY) {
    return columns.find(column => {
      const rect = column.getBoundingClientRect();
      return (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      );
    }) || null;
  }

  function slotFromPointer(column, clientY, grabOffset = 0, durationSlots = 1) {
    const rect = column.getBoundingClientRect();
    const localY = clientY - rect.top - grabOffset;

    return clamp(
      Math.round(localY / rowHeight()),
      0,
      SLOT_COUNT - durationSlots
    );
  }

  function showPreview(event) {
    previewEvent = event;

    if (!previewNode) {
      previewNode = document.createElement('div');
      previewNode.className = 'drop-preview';
    }

    if (previewNode.parentElement !== columns[event.day]) {
      previewNode.remove();
      columns[event.day].appendChild(previewNode);
    }

    columns.forEach((column, index) => {
      column.classList.toggle('drop-active', index === event.day);
    });

    const subject = subjectById(event.subjectId);
    const layout = currentLayouts(event).get('__preview__') || {lane:0,laneCount:1};

    previewNode.style.background = subject.bg;
    previewNode.style.color = subject.fg;

    applyGeometry(previewNode, event, layout);

    previewNode.innerHTML = `
      <div class="event-title">${subject.name}</div>
      <div class="event-meta">
        ${formatTime(START_MIN + event.startSlot * STEP)}–
        ${formatTime(START_MIN + (event.startSlot + event.duration) * STEP)}
        · ${formatDuration(event.duration)}
      </div>
    `;
  }

  function hidePreview() {
    previewEvent = null;
    if (previewNode) previewNode.remove();
    columns.forEach(column => column.classList.remove('drop-active'));
  }

  function beginSubjectDrag(pointerEvent, subject) {
    if (pointerEvent.pointerType === 'mouse' && pointerEvent.button !== 0) return;

    const originX = pointerEvent.clientX;
    const originY = pointerEvent.clientY;
    let moved = false;

    const move = event => {
      if (!moved && Math.hypot(event.clientX-originX, event.clientY-originY) > 7) {
        moved = true;
      }

      if (!moved) return;

      const column = columnAt(event.clientX, event.clientY);

      if (!column) {
        hidePreview();
        return;
      }

      showPreview({
        id:'__preview__',
        subjectId:subject.id,
        day:Number(column.dataset.day),
        startSlot:slotFromPointer(column, event.clientY, 0, DEFAULT_DURATION),
        duration:DEFAULT_DURATION
      });
    };

    const up = () => {
      document.removeEventListener('pointermove', move);

      if (moved && previewEvent) {
        const drop = {...previewEvent};
        hidePreview();
        addEvent(drop.subjectId, drop.day, drop.startSlot, drop.duration);
      } else {
        hidePreview();
      }
    };

    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up, {once:true});
  }

  function beginEventDrag(pointerEvent, event, node) {
    pointerEvent.stopPropagation();
    closeContextMenu();

    if (!selectedIds.has(event.id)) {
      selectedIds = new Set([event.id]);
    }

    const rect = node.getBoundingClientRect();
    const grabOffset = clamp(pointerEvent.clientY - rect.top, 0, rect.height);

    const originX = pointerEvent.clientX;
    const originY = pointerEvent.clientY;
    let moved = false;

    const move = current => {
      if (!moved && Math.hypot(current.clientX-originX, current.clientY-originY) > 5) {
        moved = true;
      }

      if (!moved) return;

      const column = columnAt(current.clientX, current.clientY);

      if (!column) {
        hidePreview();
        return;
      }

      showPreview({
        id:'__preview__',
        sourceId:event.id,
        subjectId:event.subjectId,
        day:Number(column.dataset.day),
        startSlot:slotFromPointer(column, current.clientY, grabOffset, event.duration),
        duration:event.duration
      });
    };

    const up = () => {
      document.removeEventListener('pointermove', move);

      if (!moved || !previewEvent) {
        hidePreview();
        render();
        pulse([event.id]);
        return;
      }

      saveState();

      const dayDelta = previewEvent.day - event.day;
      const slotDelta = previewEvent.startSlot - event.startSlot;

      for (const item of selectedEvents()) {
        item.day = clamp(item.day + dayDelta, 0, 4);
        item.startSlot = clamp(
          item.startSlot + slotDelta,
          0,
          SLOT_COUNT - item.duration
        );
      }

      suppressClickUntil = Date.now() + 150;

      hidePreview();
      render();
      pulse([...selectedIds]);

      announce('Bloque(s) movido(s).');
    };

    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up, {once:true});
  }

  function beginResize(pointerEvent, event, edge) {
    pointerEvent.stopPropagation();

    if (!selectedIds.has(event.id)) {
      selectedIds = new Set([event.id]);
    }

    const original = selectedEvents().map(item => ({
      id:item.id,
      startSlot:item.startSlot,
      duration:item.duration
    }));

    const initialY = pointerEvent.clientY;

    const move = current => {
      const delta = Math.round((current.clientY - initialY) / rowHeight());

      for (const initial of original) {
        const item = events.find(event => event.id === initial.id);

        if (edge === 'bottom') {
          item.duration = clamp(
            initial.duration + delta,
            1,
            SLOT_COUNT - item.startSlot
          );
        } else {
          const initialEnd = initial.startSlot + initial.duration;
          item.startSlot = clamp(
            initial.startSlot + delta,
            0,
            initialEnd - 1
          );
          item.duration = initialEnd - item.startSlot;
        }
      }

      render();
    };

    const up = () => {
      document.removeEventListener('pointermove', move);

      const final = selectedEvents().map(item => ({
        id:item.id,
        startSlot:item.startSlot,
        duration:item.duration
      }));

      for (const initial of original) {
        const item = events.find(event => event.id === initial.id);
        item.startSlot = initial.startSlot;
        item.duration = initial.duration;
      }

      saveState();

      for (const value of final) {
        const item = events.find(event => event.id === value.id);
        item.startSlot = value.startSlot;
        item.duration = value.duration;
      }

      suppressClickUntil = Date.now() + 150;

      render();
      pulse([...selectedIds]);
    };

    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up, {once:true});
  }

  /* ==========================================================
     Menú contextual y edición por lote
  ========================================================== */

  function openContextMenu(pointerEvent, event) {
    const list = selectedEvents();

    $('#contextTitle').textContent =
      list.length > 1
        ? `${list.length} bloques seleccionados`
        : subjectById(event.subjectId).name;

    $('#toggleLabBtn').setAttribute(
      'aria-checked',
      String(list.length > 0 && list.every(item => item.lab))
    );

    $('#toggleFrameBtn').setAttribute(
      'aria-checked',
      String(list.length > 0 && list.every(item => item.frame))
    );

    $('#frameColorInput').value = list[0]?.frameColor || '#dc2626';
    $('#opacityInput').value = list[0]?.opacity ?? 100;
    $('#opacityValue').textContent = `${list[0]?.opacity ?? 100}%`;

    contextMenu.classList.remove('hidden');

    const appRect = app.getBoundingClientRect();
    const menuRect = contextMenu.getBoundingClientRect();

    const x = clamp(
      pointerEvent.clientX - appRect.left,
      6,
      Math.max(6, appRect.width - menuRect.width - 6)
    );

    const y = Math.max(6, pointerEvent.clientY - appRect.top);

    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
  }

  function closeContextMenu() {
    contextMenu.classList.add('hidden');
    opacitySnapshotTaken = false;
  }

  function applyToSelected(callback, message) {
    const list = selectedEvents();
    if (!list.length) return;

    saveState();
    list.forEach(callback);

    render();
    pulse(list.map(item => item.id));

    if (message) announce(message);
  }

  $('#toggleLabBtn').addEventListener('click', event => {
    event.stopPropagation();

    const list = selectedEvents();
    const nextValue = !list.every(item => item.lab);

    applyToSelected(
      item => item.lab = nextValue,
      nextValue ? 'LAB activado.' : 'LAB desactivado.'
    );

    closeContextMenu();
  });

  $('#toggleFrameBtn').addEventListener('click', event => {
    event.stopPropagation();

    const list = selectedEvents();
    const nextValue = !list.every(item => item.frame);

    applyToSelected(
      item => item.frame = nextValue,
      nextValue ? 'Marco activado.' : 'Marco desactivado.'
    );

    closeContextMenu();
  });

  $('#frameColorInput').addEventListener('change', event => {
    applyToSelected(item => {
      item.frame = true;
      item.frameColor = event.target.value;
    }, 'Color de marco actualizado.');

    closeContextMenu();
  });

  $('#opacityInput').addEventListener('pointerdown', () => {
    if (!opacitySnapshotTaken) {
      saveState();
      opacitySnapshotTaken = true;
    }
  });

  $('#opacityInput').addEventListener('input', event => {
    const value = Number(event.target.value);

    $('#opacityValue').textContent = `${value}%`;

    for (const item of selectedEvents()) {
      item.opacity = value;
    }

    render();
  });

  $('#opacityInput').addEventListener('change', () => {
    announce('Opacidad actualizada.');
    opacitySnapshotTaken = false;
  });

  $('#deleteBtn').addEventListener('click', deleteSelected);
  $('#deleteSelectedBtn').addEventListener('click', deleteSelected);

  /* ==========================================================
     Duplicar y colocar con un clic
  ========================================================== */

  $('#duplicateBtn').addEventListener('click', () => {
    const list = selectedEvents();
    if (!list.length) return;

    duplicateMode = {
      items:list.map(item => ({...item})),
      anchor:{...list[0]}
    };

    closeContextMenu();

    $('#duplicateCursor').classList.remove('hidden');

    announce(
      'Duplicado activo: mueve el ratón y haz clic en el horario para colocarlo. Esc cancela.'
    );
  });

  function placeDuplicate(day, startSlot) {
    if (!duplicateMode) return;

    saveState();

    const anchor = duplicateMode.anchor;
    const dayDelta = day - anchor.day;
    const slotDelta = startSlot - anchor.startSlot;

    const newIds = [];

    for (const item of duplicateMode.items) {
      const copy = {
        ...item,
        id:uid(),
        day:clamp(item.day + dayDelta, 0, 4),
        startSlot:clamp(
          item.startSlot + slotDelta,
          0,
          SLOT_COUNT - item.duration
        )
      };

      events.push(copy);
      newIds.push(copy.id);
    }

    selectedIds = new Set(newIds);
    duplicateMode = null;

    $('#duplicateCursor').classList.add('hidden');

    hidePreview();
    render();
    pulse(newIds);

    announce('Duplicado colocado.');
  }

  document.addEventListener('mousemove', event => {
    if (!duplicateMode) return;

    const cursor = $('#duplicateCursor');
    cursor.style.left = `${event.clientX + 14}px`;
    cursor.style.top = `${event.clientY + 14}px`;

    const column = columnAt(event.clientX, event.clientY);

    if (!column) {
      hidePreview();
      return;
    }

    const anchor = duplicateMode.anchor;

    showPreview({
      id:'__preview__',
      subjectId:anchor.subjectId,
      day:Number(column.dataset.day),
      startSlot:slotFromPointer(column, event.clientY, 0, anchor.duration),
      duration:anchor.duration
    });
  });

  /* ==========================================================
     Filtros, editor y atajos
  ========================================================== */

  $('#earlierBtn').addEventListener('click', () => adjustSelected(-1,0));
  $('#laterBtn').addEventListener('click', () => adjustSelected(1,0));
  $('#shorterBtn').addEventListener('click', () => adjustSelected(0,-1));
  $('#longerBtn').addEventListener('click', () => adjustSelected(0,1));

  $('#undoBtn').addEventListener('click', () => {
    if (!history.length) return;

    events = JSON.parse(history.pop());
    selectedIds.clear();

    undoBtn.disabled = history.length === 0;

    render();
    announce('Último cambio deshecho.');
  });

  $('#clearBtn').addEventListener('click', () => {
    if (!events.length) {
      announce('El horario ya está vacío.');
      return;
    }

    saveState();
    events = [];
    selectedIds.clear();

    render();
    announce('Horario vacío.');
  });

  ['labFilter','courseFilter','subjectFilter','frameFilter'].forEach(id => {
    $('#' + id).addEventListener('change', render);
  });

  $('#resetFiltersBtn').addEventListener('click', () => {
    $('#labFilter').value = 'all';
    $('#courseFilter').value = 'all';
    $('#subjectFilter').value = 'all';
    $('#frameFilter').value = 'all';
    frameColorFilterValue = 'all';
    render();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeContextMenu();
      closeSettings();

      if (duplicateMode) {
        duplicateMode = null;
        $('#duplicateCursor').classList.add('hidden');
        hidePreview();
        announce('Duplicado cancelado.');
      }
    }

    if ((event.key === 'Delete' || event.key === 'Backspace') &&
        !['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)) {
      if (selectedIds.size) {
        event.preventDefault();
        deleteSelected();
      }
    }
  });

  document.addEventListener('click', event => {
    if (!contextMenu.contains(event.target) && !event.target.closest('.event')) {
      closeContextMenu();
    }
  });


  /* ==========================================================
     Ajustes y tema
  ========================================================== */

  const THEME_KEY = 'weekly-planner-theme';
  const ROSITA_UNLOCK_KEY = 'weekly-planner-rosita-unlocked-v1';

  function rositaUnlocked() {
    return localStorage.getItem(ROSITA_UNLOCK_KEY) === '1';
  }

  function refreshSecretUnlocks() {
    const rositaButton = $('.rosita-theme-option');
    if (rositaButton) rositaButton.classList.toggle('hidden', !rositaUnlocked());
  }

  function resolveTheme(choice) {
    if (choice === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return choice;
  }

  function applyTheme(choice) {
    const allowed = ['light','dark','system'];
    if (rositaUnlocked()) allowed.push('rosita');
    const normalized = allowed.includes(choice) ? choice : 'system';
    document.body.dataset.theme = resolveTheme(normalized);
    localStorage.setItem(THEME_KEY, normalized);

    $$('.theme-option').forEach(button => {
      button.classList.toggle('active', button.dataset.themeChoice === normalized);
    });
  }

  function openSettings() {
    const panel = $('#settingsBackdrop');
    panel.classList.remove('hidden');
    panel.setAttribute('aria-hidden','false');
  }

  function closeSettings() {
    const panel = $('#settingsBackdrop');
    panel.classList.add('hidden');
    panel.setAttribute('aria-hidden','true');
  }

  $('#settingsBtn').addEventListener('click', openSettings);
  $('#closeSettingsBtn').addEventListener('click', closeSettings);

  refreshSecretUnlocks();

  $('#secretCodeForm')?.addEventListener('submit', event => {
    event.preventDefault();
    const input = $('#secretCodeInput');
    const code = String(input?.value || '').trim().toLowerCase();

    if (code === 'lmp') {
      const clonedDefault = DEFAULT_EVENTS.map(item => ({...item, id:uid()}));
      input.value = '';
      createSchedule('LMP', clonedDefault);
      return;
    }

    if (code === 'rosita') {
      localStorage.setItem(ROSITA_UNLOCK_KEY, '1');
      refreshSecretUnlocks();
      applyTheme('rosita');
      input.value = '';
      announce('Tema Rosita desbloqueado.');
      return;
    }

    if (input) input.value = '';
    announce('Código no reconocido.');
  });

  refreshScheduleSelector();

  $('#scheduleSelect').addEventListener('change', event => {
    switchSchedule(event.target.value);
  });

  $('#newScheduleBtn').addEventListener('click', () => {
    const name = prompt('Nombre del nuevo horario:', 'Nuevo horario');
    if (name === null) return;
    createSchedule(name, []);
  });

  $('#renameScheduleBtn').addEventListener('click', () => {
    const current = activeScheduleMeta();
    const name = prompt('Nuevo nombre:', current.name);
    if (name === null) return;

    current.name = safeScheduleName(name);
    saveScheduleIndex();
    refreshScheduleSelector();
    announce('Horario renombrado.');
  });

  $('#deleteScheduleBtn').addEventListener('click', () => {
    if (scheduleIndex.length <= 1) {
      announce('Debe existir al menos un horario.');
      return;
    }

    const current = activeScheduleMeta();
    if (!confirm(`¿Eliminar "${current.name}"? Esta acción no se puede deshacer.`)) return;

    localStorage.removeItem(scheduleStorageKey(current.id));
    scheduleIndex = scheduleIndex.filter(item => item.id !== current.id);
    saveScheduleIndex();

    const next = scheduleIndex[0];
    localStorage.setItem(ACTIVE_SCHEDULE_KEY, next.id);
    location.reload();
  });

  $('#backupScheduleBtn').addEventListener('click', () => {
    const current = activeScheduleMeta();
    const payload = {
      app:'planificador-semanal',
      version:1,
      name:current.name,
      exportedAt:new Date().toISOString(),
      events:events,
      settings:{
        theme:localStorage.getItem(THEME_KEY) || 'system',
        showCurrentTime
      }
    };

    const blob = new Blob(
      [JSON.stringify(payload, null, 2)],
      {type:'application/json;charset=utf-8'}
    );

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `${current.name.replace(/[^a-z0-9áéíóúüñ_-]+/gi,'-').replace(/^-+|-+$/g,'') || 'horario'}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    announce('Copia JSON exportada.');
  });

  $('#importScheduleBtn').addEventListener('click', () => {
    $('#importScheduleInput').click();
  });

  $('#importScheduleInput').addEventListener('change', async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const payload = JSON.parse(await file.text());
      const importedEvents = Array.isArray(payload) ? payload : payload.events;

      if (!Array.isArray(importedEvents)) {
        throw new Error('El JSON no contiene un horario válido.');
      }

      const importedName =
        !Array.isArray(payload) && payload.name
          ? payload.name
          : file.name.replace(/\.json$/i,'');

      createSchedule(importedName || 'Horario importado', importedEvents);
    } catch (error) {
      console.error(error);
      announce('No se pudo importar ese archivo JSON.');
    }
  });
  $('#settingsBackdrop').addEventListener('click', event => {
    if (event.target === $('#settingsBackdrop')) closeSettings();
  });

  $$('.theme-option').forEach(button => {
    button.addEventListener('click', () => applyTheme(button.dataset.themeChoice));
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
    if ((localStorage.getItem(THEME_KEY) || 'system') === 'system') applyTheme('system');
  });

  applyTheme(localStorage.getItem(THEME_KEY) || 'system');

  $('#nowToggleBtn').addEventListener('click', () => {
    showCurrentTime = !showCurrentTime;
    updateCurrentTimeIndicator();

    announce(
      showCurrentTime
        ? 'Indicador del momento actual activado.'
        : 'Indicador del momento actual desactivado.'
    );
  });

  /* ==========================================================
     Exportación 100% local: SVG / PNG / JPG / PDF / XLSX
  ========================================================== */

  function escapeXml(value) {
    return String(value).replace(/[<>&'\"]/g, char => ({
      '<':'&lt;',
      '>':'&gt;',
      '&':'&amp;',
      "'":'&apos;',
      '\"':'&quot;'
    })[char]);
  }

  function wrapTextApprox(text, maxCharsPerLine, maxLines) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let current = '';

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length <= maxCharsPerLine) {
        current = candidate;
      } else {        if (current) lines.push(current);
        current = word;
      }
    }

    if (current) lines.push(current);
    if (!lines.length) lines.push('');

    if (lines.length > maxLines) {
      const trimmed = lines.slice(0, maxLines);
      let last = trimmed[maxLines - 1];
      if (last.length > Math.max(1, maxCharsPerLine - 1)) {
        last = last.slice(0, Math.max(1, maxCharsPerLine - 1));
      }
      trimmed[maxLines - 1] = last.replace(/[ .,;:-]+$/,'') + '…';
      return trimmed;
    }

    return lines;
  }

  function svgMultiLineText(x, y, lines, className, lineHeight) {
    return `<text x="${x}" y="${y}" class="${className}">` +
      lines.map((line, index) =>
        `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
      ).join('') +
      `</text>`;
  }

  function buildSVG() {
    const W = 1500;
    const H = 1000;
    const margin = 65;
    const timeW = 100;
    const gridTop = 170;
    const gridH = 700;
    const headerH = 60;
    const dayW = (W - margin*2 - timeW) / 5;
    const layouts = currentLayouts();
    let clipCounter = 0;

    let svg = `
      <svg xmlns="http://www.w3.org/2000/svg"
           width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
        <rect width="100%" height="100%" fill="#ffffff"/>
        <style>
          text{font-family:Arial,sans-serif;fill:#111827}
          .title{font-size:34px;font-weight:700}
          .day{font-size:18px;font-weight:700}
          .time{font-size:12px;fill:#6b7280}
          .evt{font-size:12px;font-weight:700}
          .meta{font-size:10px;fill:#374151}
          .lab{font-size:9px;font-weight:800;letter-spacing:2px}
        </style>
        <text x="${margin}" y="65" class="title">Horario semanal</text>
    `;

    for (let day = 0; day < 5; day++) {
      const x = margin + timeW + day*dayW;
      svg += `
        <rect x="${x}" y="${gridTop-headerH}"
              width="${dayW}" height="${headerH}"
              fill="#f8fafc" stroke="#d1d5db"/>
        <text x="${x+dayW/2}" y="${gridTop-23}"
              text-anchor="middle" class="day">${DAYS[day]}</text>
      `;
    }

    for (let slot = 0; slot <= SLOT_COUNT; slot++) {
      const y = gridTop + slot*(gridH/SLOT_COUNT);
      svg += `<line x1="${margin+timeW}" y1="${y}" x2="${W-margin}" y2="${y}" stroke="#e5e7eb"/>`;
      if (slot < SLOT_COUNT && slot % 2 === 0) {
        svg += `<text x="${margin+timeW-12}" y="${y+4}" text-anchor="end" class="time">${formatTime(START_MIN + slot*STEP)}</text>`;
      }
    }

    for (let day = 0; day <= 5; day++) {
      const x = margin + timeW + day*dayW;
      svg += `<line x1="${x}" y1="${gridTop}" x2="${x}" y2="${gridTop+gridH}" stroke="#d1d5db"/>`;
    }

    for (const event of events.filter(passesFilter)) {
      const subject = subjectById(event.subjectId);
      const layout = layouts.get(event.id) || {lane:0,laneCount:1};
      const slotH = gridH / SLOT_COUNT;
      const laneW = dayW / layout.laneCount;
      const x = margin + timeW + event.day*dayW + layout.lane*laneW + 4;
      const y = gridTop + event.startSlot*slotH + 3;
      const w = laneW - 8;
      const h = event.duration*slotH - 6;
      const opacity = (event.opacity ?? 100) / 100;
      const clipId = `clip_evt_${clipCounter++}`;
      const padX = 8;
      const contentX = x + padX;
      const contentW = Math.max(28, w - padX * 2);
      const titleChars = Math.max(8, Math.floor(contentW / 6.6));
      const metaChars = Math.max(10, Math.floor(contentW / 6.2));
      const hasLab = !!event.lab;
      const availableTitleHeight = Math.max(14, h - (hasLab ? 28 : 18) - 16);
      const maxTitleLines = Math.max(1, Math.floor(availableTitleHeight / 14));
      const titleLines = wrapTextApprox(subject.name, titleChars, Math.min(4, maxTitleLines));
      const metaText = `${formatTime(eventStart(event))}–${formatTime(eventEnd(event))} · ${formatDuration(event.duration)}`;
      const metaLines = h >= 38 ? wrapTextApprox(metaText, metaChars, h >= 64 ? 2 : 1) : [];

      svg += `<defs><clipPath id="${clipId}"><rect x="${x+2}" y="${y+2}" width="${Math.max(1,w-4)}" height="${Math.max(1,h-4)}" rx="8"/></clipPath></defs>`;
      svg += `<g opacity="${opacity}">`;
      svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="${subject.bg}" stroke="${event.lab ? subject.fg : '#9ca3af'}" stroke-width="${event.lab ? 2 : 1}" ${event.lab ? 'stroke-dasharray="7 5"' : ''}/>`;

      if (event.frame) {
        svg += `<rect x="${x-2}" y="${y-2}" width="${w+4}" height="${h+4}" rx="11" fill="none" stroke="${event.frameColor}" stroke-width="3"/>`;
      }

      svg += `<g clip-path="url(#${clipId})">`;
      svg += svgMultiLineText(contentX, y + 18, titleLines, 'evt', 13);
      if (metaLines.length) {
        const metaY = y + 18 + (titleLines.length * 13) + 4;
        svg += svgMultiLineText(contentX, metaY, metaLines, 'meta', 11);
      }
      if (event.lab) {
        svg += `<text x="${x+w/2}" y="${y+h-7}" text-anchor="middle" class="lab">LAB</text>`;
      }
      svg += `</g>`;
      svg += `</g>`;
    }

    return svg + '</svg>';
  }

  function downloadBlob(blob, filename) {
    if (!blob) throw new Error('No se pudo generar el archivo.');
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      link.remove();
    }, 2500);
  }

  function svgToCanvas(svg) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const svgUrl = URL.createObjectURL(new Blob([svg], {type:'image/svg+xml;charset=utf-8'}));

      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 1500;
          canvas.height = 1000;
          const context = canvas.getContext('2d');
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(svgUrl);
          resolve(canvas);
        } catch (error) {
          URL.revokeObjectURL(svgUrl);
          reject(error);
        }
      };

      image.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        reject(new Error('El navegador no pudo rasterizar el horario.'));
      };

      image.src = svgUrl;
    });
  }

  function dataUrlToBytes(dataUrl) {
    const base64 = dataUrl.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function concatBytes(parts) {
    const total = parts.reduce((sum, part) => sum + part.length, 0);
    const output = new Uint8Array(total);
    let offset = 0;
    for (const part of parts) {
      output.set(part, offset);
      offset += part.length;
    }
    return output;
  }

  const enc = new TextEncoder();
  const ascii = value => enc.encode(value);

  function buildPdfFromJpeg(jpegBytes, imageWidth, imageHeight) {
    const pageW = 842;
    const pageH = 595;
    const scale = Math.min(pageW / imageWidth, pageH / imageHeight);
    const drawW = imageWidth * scale;
    const drawH = imageHeight * scale;
    const x = (pageW - drawW) / 2;
    const y = (pageH - drawH) / 2;
    const content = `q\n${drawW.toFixed(3)} 0 0 ${drawH.toFixed(3)} ${x.toFixed(3)} ${y.toFixed(3)} cm\n/Im0 Do\nQ\n`;
    const contentBytes = ascii(content);

    const objects = [
      ascii('<< /Type /Catalog /Pages 2 0 R >>'),
      ascii('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'),
      ascii(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`),
      concatBytes([
        ascii(`<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`),
        jpegBytes,
        ascii('\nendstream')
      ]),
      concatBytes([
        ascii(`<< /Length ${contentBytes.length} >>\nstream\n`),
        contentBytes,
        ascii('endstream')
      ])
    ];

    const parts = [ascii('%PDF-1.4\n')];
    const offsets = [0];
    let position = parts[0].length;

    objects.forEach((objectBytes, index) => {
      offsets.push(position);
      const prefix = ascii(`${index + 1} 0 obj\n`);
      const suffix = ascii('\nendobj\n');
      parts.push(prefix, objectBytes, suffix);
      position += prefix.length + objectBytes.length + suffix.length;
    });

    const xrefPosition = position;
    let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= objects.length; i++) {
      xref += `${String(offsets[i]).padStart(10,'0')} 00000 n \n`;
    }
    xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPosition}\n%%EOF`;
    parts.push(ascii(xref));

    return concatBytes(parts);
  }

  /* ZIP sin compresión para generar un XLSX válido sin librerías externas. */
  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    let crc = 0xFFFFFFFF;
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function le16(value) {
    return new Uint8Array([value & 255, (value >>> 8) & 255]);
  }

  function le32(value) {
    return new Uint8Array([
      value & 255,
      (value >>> 8) & 255,
      (value >>> 16) & 255,
      (value >>> 24) & 255
    ]);
  }

  function makeZip(fileMap) {
    const locals = [];
    const centrals = [];
    let localOffset = 0;

    for (const [name, value] of Object.entries(fileMap)) {
      const nameBytes = enc.encode(name);
      const data = value instanceof Uint8Array ? value : enc.encode(value);
      const crc = crc32(data);

      const localHeader = concatBytes([
        le32(0x04034b50), le16(20), le16(0), le16(0), le16(0), le16(0),
        le32(crc), le32(data.length), le32(data.length),
        le16(nameBytes.length), le16(0), nameBytes
      ]);

      locals.push(localHeader, data);

      const centralHeader = concatBytes([
        le32(0x02014b50), le16(20), le16(20), le16(0), le16(0), le16(0), le16(0),
        le32(crc), le32(data.length), le32(data.length),
        le16(nameBytes.length), le16(0), le16(0), le16(0), le16(0), le32(0),
        le32(localOffset), nameBytes
      ]);

      centrals.push(centralHeader);
      localOffset += localHeader.length + data.length;
    }

    const localData = concatBytes(locals);
    const centralData = concatBytes(centrals);
    const count = Object.keys(fileMap).length;

    const end = concatBytes([
      le32(0x06054b50), le16(0), le16(0), le16(count), le16(count),
      le32(centralData.length), le32(localData.length), le16(0)
    ]);

    return concatBytes([localData, centralData, end]);
  }

  function excelColumn(index) {
    let name = '';
    let n = index + 1;
    while (n > 0) {
      const remainder = (n - 1) % 26;
      name = String.fromCharCode(65 + remainder) + name;
      n = Math.floor((n - 1) / 26);
    }
    return name;
  }

  function buildXlsx() {
    const headers = ['Día','Asignatura','Inicio','Fin','Duración','LAB','Marco','Color marco','Opacidad'];
    const rows = events.filter(passesFilter).map(event => [
      DAYS[event.day],
      subjectById(event.subjectId).name,
      formatTime(eventStart(event)),
      formatTime(eventEnd(event)),
      formatDuration(event.duration),
      event.lab ? 'Sí' : 'No',
      event.frame ? 'Sí' : 'No',
      event.frame ? event.frameColor : '',
      `${event.opacity ?? 100}%`
    ]);

    const allRows = [headers, ...rows];
    const sheetRows = allRows.map((row, rowIndex) => {
      const cells = row.map((value, columnIndex) => {
        const ref = `${excelColumn(columnIndex)}${rowIndex + 1}`;
        return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
      }).join('');
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    }).join('');

    const files = {
      '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
      '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
      'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Horario" sheetId="1" r:id="rId1"/></sheets></workbook>`,
      'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
      'xl/worksheets/sheet1.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`
    };

    return makeZip(files);
  }


  function buildInteractiveExportHTML() {
    const exportedEvents = JSON.stringify(
      events.filter(passesFilter).map(event => ({
        id:event.id,
        subjectId:event.subjectId,
        day:event.day,
        startSlot:event.startSlot,
        duration:event.duration,
        lab:!!event.lab,
        frame:!!event.frame,
        frameColor:event.frameColor || '#dc2626',
        opacity:event.opacity ?? 100
      }))
    );

    const exportedSubjects = JSON.stringify(SUBJECTS);

    return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Horario semanal · en vivo</title>
<style>
:root{--row-h:30px;--time-w:72px;--day-min:150px;--border:#dbe1ea;--text:#172033;--muted:#6b7280}
*{box-sizing:border-box}
body{margin:0;background:#f6f7fb;color:var(--text);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.page{max-width:1500px;margin:auto;padding:24px}
.top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:18px}
h1{margin:0;font-size:28px}
.controls{display:flex;align-items:center;gap:9px}
button{min-height:40px;padding:8px 12px;border:1px solid var(--border);border-radius:11px;background:#fff;font:inherit;font-weight:700;cursor:pointer}
button.active{border-color:#ef4444;background:#fff1f2;color:#b91c1c}
.info{font-size:12px;color:var(--muted)}
.card{overflow:hidden;border:1px solid var(--border);border-radius:18px;background:#fff}
.scroll{overflow-x:auto}
.cal{min-width:830px;display:grid;grid-template-columns:var(--time-w) repeat(5,minmax(var(--day-min),1fr));grid-template-rows:48px auto;position:relative}
.corner,.head{height:48px;display:flex;align-items:center;justify-content:center;background:#f8fafc;border-right:1px solid var(--border);border-bottom:1px solid var(--border);font-size:13px;font-weight:800}
.head.today{background:#fff7f7;color:#b91c1c}
.timecol,.day{position:relative;height:calc(var(--row-h)*26)}
.timecol{background:#f8fafc;border-right:1px solid var(--border)}
.tlabel{position:absolute;left:0;right:0;height:var(--row-h);padding-top:4px;text-align:center;font-size:10px;color:var(--muted);border-top:1px solid var(--border)}
.day{border-right:1px solid var(--border);background-image:repeating-linear-gradient(to bottom,transparent 0,transparent calc(var(--row-h) - 1px),var(--border) calc(var(--row-h) - 1px),var(--border) var(--row-h))}
.event{position:absolute;box-sizing:border-box;border-radius:10px;padding:5px 6px 7px;border:1px solid rgba(0,0,0,.1);overflow:hidden;outline:3px solid transparent;outline-offset:1px}
.event.lab{border:2px dashed currentColor;padding:4px 5px 18px}
.event.frame{outline-color:var(--frame)}
.title{font-size:11px;font-weight:800;line-height:1.15}
.meta{font-size:9.5px;margin-top:3px;opacity:.84}
.lablabel{position:absolute;left:5px;right:5px;bottom:3px;text-align:center;font-size:8px;font-weight:900;letter-spacing:.12em}
.nowline{position:absolute;left:0;right:0;height:2px;background:#ef4444;z-index:20;pointer-events:none}
.nowline:before{content:"";position:absolute;left:-5px;top:50%;width:10px;height:10px;border-radius:50%;background:#ef4444;transform:translateY(-50%)}
.nowlabel{position:absolute;left:6px;top:-11px;padding:2px 5px;border-radius:6px;background:#ef4444;color:#fff;font-size:9px;font-weight:800;white-space:nowrap}
@media(max-width:650px){.page{padding:12px}:root{--row-h:29px;--time-w:62px;--day-min:126px}}
</style>
</head>
<body>
<div class="page">
  <div class="top">
    <div>
      <h1>Horario semanal</h1>
      <div class="info">La línea roja muestra el momento actual y se actualiza automáticamente.</div>
    </div>
    <div class="controls">
      <button id="toggleNow" class="active">Ahora</button>
      <span id="clock" class="info"></span>
    </div>
  </div>

  <div class="card">
    <div class="scroll">
      <div class="cal">
        <div class="corner">Hora</div>
        <div class="head">Lunes</div>
        <div class="head">Martes</div>
        <div class="head">Miércoles</div>
        <div class="head">Jueves</div>
        <div class="head">Viernes</div>
        <div id="timecol" class="timecol"></div>
        <div class="day" data-day="0"></div>
        <div class="day" data-day="1"></div>
        <div class="day" data-day="2"></div>
        <div class="day" data-day="3"></div>
        <div class="day" data-day="4"></div>
      </div>
    </div>
  </div>
</div>

<script>
const START=480,STEP=30,SLOTS=26,DAYS=['Lunes','Martes','Miércoles','Jueves','Viernes'];
const SUBJECTS=${exportedSubjects};
const EVENTS=${exportedEvents};
const sub=id=>SUBJECTS.find(s=>s.id===id);
const cols=[...document.querySelectorAll('.day')];
const fmt=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const dur=n=>{const m=n*30,h=Math.floor(m/60),r=m%60;return h?(r?h+' h '+r+' min':h+' h'):r+' min'};
let showNow=true;

for(let i=0;i<SLOTS;i++){
  const n=document.createElement('div');
  n.className='tlabel';
  n.style.top='calc(var(--row-h) * '+i+')';
  n.textContent=fmt(START+i*STEP);
  document.getElementById('timecol').appendChild(n);
}

function layoutDay(list){
  const sorted=[...list].sort((a,b)=>a.startSlot-b.startSlot||b.duration-a.duration);
  const groups=[];
  let group=[],groupEnd=-1;
  const result=new Map();

  for(const e of sorted){
    const eEnd=e.startSlot+e.duration;
    if(!group.length||e.startSlot<groupEnd){
      group.push(e);
      groupEnd=Math.max(groupEnd,eEnd);
    }else{
      groups.push(group);
      group=[e];
      groupEnd=eEnd;
    }
  }
  if(group.length)groups.push(group);

  for(const current of groups){
    const laneEnds=[];
    const assignment=new Map();

    for(const e of current){
      let lane=laneEnds.findIndex(end=>end<=e.startSlot);
      if(lane<0){
        lane=laneEnds.length;
        laneEnds.push(-1);
      }
      laneEnds[lane]=e.startSlot+e.duration;
      assignment.set(e.id,lane);
    }

    for(const e of current){
      result.set(e.id,{lane:assignment.get(e.id),count:Math.max(1,laneEnds.length)});
    }
  }

  return result;
}

const layouts=new Map();
for(let d=0;d<5;d++){
  for(const [id,value] of layoutDay(EVENTS.filter(e=>e.day===d))){
    layouts.set(id,value);
  }
}

for(const e of EVENTS){
  const s=sub(e.subjectId);
  const l=layouts.get(e.id)||{lane:0,count:1};
  const n=document.createElement('div');
  const width=100/l.count;
  const left=l.lane*width;

  n.className='event'+(e.lab?' lab':'')+(e.frame?' frame':'');
  n.style.setProperty('--frame',e.frameColor||'#dc2626');
  n.style.background=s.bg;
  n.style.color=s.fg;
  n.style.opacity=(e.opacity??100)/100;
  n.style.top='calc(var(--row-h) * '+e.startSlot+' + 2px)';
  n.style.height='calc(var(--row-h) * '+e.duration+' - 4px)';
  n.style.left='calc('+left+'% + 4px)';
  n.style.width='calc('+width+'% - 8px)';

  const start=START+e.startSlot*STEP;
  const finish=start+e.duration*STEP;

  n.innerHTML=
    '<div class="title">'+s.name+'</div>'+
    '<div class="meta">'+fmt(start)+'–'+fmt(finish)+' · '+dur(e.duration)+'</div>'+
    (e.lab?'<div class="lablabel">LAB</div>':'');

  cols[e.day].appendChild(n);
}

function updateNow(){
  document.querySelectorAll('.nowline').forEach(n=>n.remove());
  document.querySelectorAll('.head').forEach(n=>n.classList.remove('today'));

  const now=new Date();
  document.getElementById('clock').textContent=
    now.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});

  const weekday=now.getDay()-1;
  if(!showNow||weekday<0||weekday>4)return;

  document.querySelectorAll('.head')[weekday].classList.add('today');

  const minutes=
    now.getHours()*60+
    now.getMinutes()+
    now.getSeconds()/60;

  if(minutes<START||minutes>START+SLOTS*STEP)return;

  const line=document.createElement('div');
  line.className='nowline';
  line.style.top='calc(var(--row-h) * '+((minutes-START)/STEP)+')';
  line.innerHTML='<span class="nowlabel">Ahora · '+fmt(Math.floor(minutes))+'</span>';
  cols[weekday].appendChild(line);
}

document.getElementById('toggleNow').onclick=()=>{
  showNow=!showNow;
  document.getElementById('toggleNow').classList.toggle('active',showNow);
  updateNow();
};

updateNow();
setInterval(updateNow,30000);
<\/script>
</body>
</html>`;
  }

  async function exportSchedule() {
    const type = $('#exportType').value;

    if (type === 'html-live') {
      const html = buildInteractiveExportHTML();
      downloadBlob(
        new Blob([html], {type:'text/html;charset=utf-8'}),
        'horario-semanal-en-vivo.html'
      );
      announce('HTML interactivo exportado. La marca de tiempo seguirá funcionando al abrirlo.');
      return;
    }
    const svg = buildSVG();
    announce(`Generando ${type.toUpperCase()}…`);

    if (type === 'svg') {
      downloadBlob(new Blob([svg], {type:'image/svg+xml;charset=utf-8'}), 'horario-semanal.svg');
      announce('SVG exportado.');
      return;
    }

    if (type === 'xlsx') {
      const bytes = buildXlsx();
      downloadBlob(
        new Blob([bytes], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),
        'horario-semanal.xlsx'
      );
      announce('Excel exportado.');
      return;
    }

    const canvas = await svgToCanvas(svg);

    if (type === 'pdf') {
      const jpegBytes = dataUrlToBytes(canvas.toDataURL('image/jpeg', 0.96));
      const pdfBytes = buildPdfFromJpeg(jpegBytes, canvas.width, canvas.height);
      downloadBlob(new Blob([pdfBytes], {type:'application/pdf'}), 'horario-semanal.pdf');
      announce('PDF exportado.');
      return;
    }

    const mime = type === 'jpg' ? 'image/jpeg' : 'image/png';
    const extension = type === 'jpg' ? 'jpg' : 'png';
    const quality = type === 'jpg' ? 0.94 : 1;

    const blob = await new Promise(resolve => canvas.toBlob(resolve, mime, quality));
    downloadBlob(blob, `horario-semanal.${extension}`);
    announce(`${extension.toUpperCase()} exportado.`);
  }

  $('#exportBtn').addEventListener('click', async () => {
    const button = $('#exportBtn');
    if (button.disabled) return;
    button.disabled = true;
    const oldText = button.textContent;
    button.textContent = 'Generando…';

    try {
      await exportSchedule();
    } catch (error) {
      console.error(error);
      announce(`Error al exportar: ${error.message || 'error desconocido'}`);
    } finally {
      button.disabled = false;
      button.textContent = oldText;
    }
  });

  /* ==========================================================
     Eventos finales
  ========================================================== */

  $('#earlierBtn').addEventListener('click', () => adjustSelected(-1,0));
  $('#laterBtn').addEventListener('click', () => adjustSelected(1,0));
  $('#shorterBtn').addEventListener('click', () => adjustSelected(0,-1));
  $('#longerBtn').addEventListener('click', () => adjustSelected(0,1));

  $('#undoBtn').addEventListener('click', () => {
    if (!history.length) return;

    events = JSON.parse(history.pop());
    selectedIds.clear();

    undoBtn.disabled = history.length === 0;

    render();
    announce('Último cambio deshecho.');
  });

  $('#clearBtn').addEventListener('click', () => {
    if (!events.length) {
      announce('El horario ya está vacío.');
      return;
    }

    saveState();
    events = [];
    selectedIds.clear();

    render();
    announce('Horario vacío.');
  });

  ['labFilter','subjectFilter','frameFilter'].forEach(id => {
    $('#' + id).addEventListener('change', render);
  });

  $('#resetFiltersBtn').addEventListener('click', () => {
    $('#labFilter').value = 'all';
    $('#subjectFilter').value = 'all';
    $('#frameFilter').value = 'all';
    render();
  });

  /* ==========================================================
     PWA / instalación
  ========================================================== */

  let deferredInstallPrompt = null;

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch(error => {
        console.warn('Service Worker no disponible:', error);
      });
    });
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    $('#installAppBtn')?.classList.remove('hidden');
  });

  $('#installAppBtn')?.addEventListener('click', async () => {
    if (!deferredInstallPrompt) {
      announce('Usa el menú del navegador para instalar la aplicación.');
      return;
    }

    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    $('#installAppBtn')?.classList.add('hidden');
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    $('#installAppBtn')?.classList.add('hidden');
    announce('Aplicación instalada.');
  });

  render();
  refreshScheduleSelector();
  startNowClock();
})();