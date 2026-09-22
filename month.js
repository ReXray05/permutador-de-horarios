(() => {
  'use strict';

  const ACTIVE_SCHEDULE_KEY = 'weekly-planner-active-schedule-v1';
  const SCHEDULE_INDEX_KEY = 'weekly-planner-schedules-index-v1';
  const THEME_KEY = 'weekly-planner-theme';
  const VIEW_KEY = 'planner-active-view-v1';

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

  const TYPES = [
    { id:'exam', label:'Examen', short:'EXAMEN' },
    { id:'delivery', label:'Entrega', short:'ENTREGA' },
    { id:'work', label:'Trabajo', short:'TRABAJO' },
    { id:'presentation', label:'Presentación', short:'PRESENT.' },
    { id:'lab', label:'Práctica / LAB', short:'PRÁCTICA' },
    { id:'other', label:'Otro', short:'OTRO' }
  ];

  const MONTHS = [
    'enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre'
  ];

  const WEEKDAYS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

  const $ = sel => document.querySelector(sel);
  const $$ = sel => [...document.querySelectorAll(sel)];

  const activeScheduleId = localStorage.getItem(ACTIVE_SCHEDULE_KEY) || 'principal';
  const MONTH_KEY = 'monthly-planner-events:' + activeScheduleId;
  const MONTH_CURSOR_KEY = 'monthly-planner-cursor:' + activeScheduleId;

  let events = loadEvents();
  let editingId = null;
  let dragId = null;

  let cursor = loadCursor();
  let filters = {
    course:'all',
    subject:'all',
    type:'all',
    status:'all'
  };

  function uid() {
    return 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,8);
  }

  function esc(value) {
    return String(value ?? '')
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  function pad(n) {
    return String(n).padStart(2,'0');
  }

  function toISO(date) {
    return date.getFullYear() + '-' + pad(date.getMonth()+1) + '-' + pad(date.getDate());
  }

  function parseISO(value) {
    const [y,m,d] = String(value).split('-').map(Number);
    return new Date(y, (m || 1)-1, d || 1);
  }

  function todayISO() {
    return toISO(new Date());
  }

  function subject(id) {
    return SUBJECTS.find(item => item.id === id) || SUBJECTS[0];
  }

  function typeInfo(id) {
    return TYPES.find(item => item.id === id) || TYPES[TYPES.length - 1];
  }

  function loadEvents() {
    try {
      const parsed = JSON.parse(localStorage.getItem(MONTH_KEY) || '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(item => item && typeof item === 'object' && /^\d{4}-\d{2}-\d{2}$/.test(item.date || ''))
        .map(item => ({
          id:item.id || uid(),
          subjectId:SUBJECTS.some(s => s.id === item.subjectId) ? item.subjectId : SUBJECTS[0].id,
          type:TYPES.some(t => t.id === item.type) ? item.type : 'other',
          title:String(item.title || '').slice(0,120),
          date:item.date,
          start:String(item.start || '').slice(0,5),
          end:String(item.end || '').slice(0,5),
          location:String(item.location || '').slice(0,120),
          notes:String(item.notes || '').slice(0,1200),
          completed:Boolean(item.completed)
        }));
    } catch {
      return [];
    }
  }

  function saveEvents() {
    localStorage.setItem(MONTH_KEY, JSON.stringify(events));
  }

  function loadCursor() {
    try {
      const raw = localStorage.getItem(MONTH_CURSOR_KEY);
      if (raw && /^\d{4}-\d{2}$/.test(raw)) {
        const [y,m] = raw.split('-').map(Number);
        return new Date(y,m-1,1);
      }
    } catch {}
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  function saveCursor() {
    localStorage.setItem(MONTH_CURSOR_KEY, cursor.getFullYear() + '-' + pad(cursor.getMonth()+1));
  }

  function announce(message) {
    const node = $('#status');
    if (!node) return;
    node.textContent = message;
    node.classList.remove('hidden');
    clearTimeout(announce.timer);
    announce.timer = setTimeout(() => node.classList.add('hidden'), 2200);
  }

  function visibleEvents() {
    return events.filter(item => {
      const s = subject(item.subjectId);
      if (filters.course !== 'all' && String(s.course) !== filters.course) return false;
      if (filters.subject !== 'all' && item.subjectId !== filters.subject) return false;
      if (filters.type !== 'all' && item.type !== filters.type) return false;
      if (filters.status === 'pending' && item.completed) return false;
      if (filters.status === 'done' && !item.completed) return false;
      return true;
    });
  }

  function sortEvents(list) {
    return [...list].sort((a,b) => {
      const ad = a.date + 'T' + (a.start || '23:59');
      const bd = b.date + 'T' + (b.start || '23:59');
      return ad.localeCompare(bd) || typeInfo(a.type).label.localeCompare(typeInfo(b.type).label);
    });
  }

  function setView(view) {
    const normalized = view === 'month' ? 'month' : 'week';
    localStorage.setItem(VIEW_KEY, normalized);

    $('#weekView')?.classList.toggle('hidden', normalized !== 'week');
    $('#monthView')?.classList.toggle('hidden', normalized !== 'month');

    $$('.view-tab').forEach(btn => {
      const active = btn.dataset.view === normalized;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    });

    $$('.week-only-action').forEach(node => node.classList.toggle('hidden', normalized !== 'week'));

    if (normalized === 'month') render();
  }

  function populateControls() {
    const subjectOptions = SUBJECTS
      .map(s => '<option value="' + s.id + '">' + esc(s.name) + ' · ' + s.course + '.º</option>')
      .join('');

    $('#monthSubjectFilter').innerHTML = '<option value="all">Todas</option>' + subjectOptions;
    $('#eventSubject').innerHTML = subjectOptions;

    $('#monthTypeFilter').innerHTML =
      '<option value="all">Todos</option>' +
      TYPES.map(t => '<option value="' + t.id + '">' + esc(t.label) + '</option>').join('');

    $('#eventType').innerHTML =
      TYPES.map(t => '<option value="' + t.id + '">' + esc(t.label) + '</option>').join('');

    $('#monthWeekdayHead').innerHTML = WEEKDAYS
      .map(day => '<div class="month-weekday">' + day + '</div>')
      .join('');
  }

  function eventChip(item) {
    const s = subject(item.subjectId);
    const t = typeInfo(item.type);
    const time = item.start ? item.start : '';
    const main = item.title.trim() || t.label;

    return '<article class="month-event-chip type-' + esc(item.type) + (item.completed ? ' is-completed' : '') + '" ' +
      'draggable="true" data-month-event-id="' + esc(item.id) + '" ' +
      'style="--event-bg:' + s.bg + ';--event-fg:' + s.fg + '">' +
      '<div class="month-event-topline"><span class="month-type-label">' + esc(t.short) + '</span>' +
      (time ? '<span class="month-event-time">' + esc(time) + '</span>' : '') + '</div>' +
      '<div class="month-event-name">' + esc(main) + '</div>' +
      '<div class="month-event-subject">' + esc(s.name) + '</div>' +
      '</article>';
  }

  function renderCalendar() {
    const grid = $('#monthGrid');
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year,month,1);
    const firstOffset = (first.getDay() + 6) % 7;
    const start = new Date(year,month,1-firstOffset);
    const visible = visibleEvents();
    const today = todayISO();

    $('#monthTitle').textContent =
      MONTHS[month].charAt(0).toUpperCase() + MONTHS[month].slice(1) + ' ' + year;

    let html = '';

    for (let i=0; i<42; i++) {
      const date = new Date(start);
      date.setDate(start.getDate()+i);
      const iso = toISO(date);
      const inMonth = date.getMonth() === month;
      const dayEvents = sortEvents(visible.filter(item => item.date === iso));

      html += '<div class="month-day' +
        (inMonth ? '' : ' outside-month') +
        (iso === today ? ' is-today' : '') +
        '" data-date="' + iso + '">' +
        '<div class="month-day-head">' +
          '<button class="month-day-number" type="button" data-add-date="' + iso + '">' + date.getDate() + '</button>' +
          '<button class="month-day-add" type="button" data-add-date="' + iso + '" aria-label="Añadir evento">+</button>' +
        '</div>' +
        '<div class="month-day-events">' +
          dayEvents.map(eventChip).join('') +
        '</div>' +
      '</div>';
    }

    grid.innerHTML = html;
  }

  function renderUpcoming() {
    const list = $('#upcomingList');
    const today = todayISO();
    const future = sortEvents(
      visibleEvents().filter(item => item.date >= today && !item.completed)
    ).slice(0,8);

    if (!future.length) {
      list.innerHTML = '<div class="upcoming-empty">No hay nada pendiente próximamente.</div>';
      return;
    }

    list.innerHTML = future.map(item => {
      const s = subject(item.subjectId);
      const t = typeInfo(item.type);
      const d = parseISO(item.date);
      const label = d.toLocaleDateString('es-ES',{day:'numeric',month:'short'});
      return '<button class="upcoming-item" type="button" data-month-event-id="' + esc(item.id) + '" ' +
        'style="--event-bg:' + s.bg + ';--event-fg:' + s.fg + '">' +
        '<span class="upcoming-date">' + esc(label) + '</span>' +
        '<span class="upcoming-main"><strong>' + esc(item.title || t.label) + '</strong>' +
        '<small>' + esc(s.name) + ' · ' + esc(t.label) + (item.start ? ' · ' + esc(item.start) : '') + '</small></span>' +
        '</button>';
    }).join('');
  }

  function renderSummary() {
    const shown = visibleEvents().length;
    const total = events.length;
    $('#monthFilterSummary').textContent =
      shown === total
        ? total + (total === 1 ? ' evento' : ' eventos')
        : 'Mostrando ' + shown + ' de ' + total + ' eventos';
  }

  function render() {
    renderCalendar();
    renderUpcoming();
    renderSummary();
  }

  function resetForm() {
    editingId = null;
    $('#eventModalTitle').textContent = 'Nuevo evento';
    $('#eventId').value = '';
    $('#eventSubject').value = SUBJECTS[0].id;
    $('#eventType').value = 'exam';
    $('#eventTitle').value = '';
    $('#eventDate').value = todayISO();
    $('#eventStart').value = '';
    $('#eventEnd').value = '';
    $('#eventLocation').value = '';
    $('#eventNotes').value = '';
    $('#eventCompleted').checked = false;
    $('#deleteMonthEventBtn').classList.add('hidden');
  }

  function openModal(date = todayISO(), id = null) {
    resetForm();

    if (id) {
      const item = events.find(e => e.id === id);
      if (!item) return;
      editingId = id;
      $('#eventModalTitle').textContent = 'Editar evento';
      $('#eventId').value = item.id;
      $('#eventSubject').value = item.subjectId;
      $('#eventType').value = item.type;
      $('#eventTitle').value = item.title;
      $('#eventDate').value = item.date;
      $('#eventStart').value = item.start;
      $('#eventEnd').value = item.end;
      $('#eventLocation').value = item.location;
      $('#eventNotes').value = item.notes;
      $('#eventCompleted').checked = item.completed;
      $('#deleteMonthEventBtn').classList.remove('hidden');
    } else {
      $('#eventDate').value = date;
    }

    const backdrop = $('#eventModalBackdrop');
    backdrop.classList.remove('hidden');
    backdrop.setAttribute('aria-hidden','false');
    setTimeout(() => $('#eventTitle').focus(), 0);
  }

  function closeModal() {
    const backdrop = $('#eventModalBackdrop');
    backdrop.classList.add('hidden');
    backdrop.setAttribute('aria-hidden','true');
    editingId = null;
  }

  function saveFromForm(event) {
    event.preventDefault();

    const date = $('#eventDate').value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      announce('Elige una fecha válida.');
      return;
    }

    const start = $('#eventStart').value;
    const end = $('#eventEnd').value;

    if (start && end && end <= start) {
      announce('La hora de fin debe ser posterior a la de inicio.');
      return;
    }

    const data = {
      id:editingId || uid(),
      subjectId:$('#eventSubject').value,
      type:$('#eventType').value,
      title:$('#eventTitle').value.trim().slice(0,120),
      date,
      start,
      end,
      location:$('#eventLocation').value.trim().slice(0,120),
      notes:$('#eventNotes').value.trim().slice(0,1200),
      completed:$('#eventCompleted').checked
    };

    if (editingId) {
      const index = events.findIndex(item => item.id === editingId);
      if (index >= 0) events[index] = data;
      announce('Evento actualizado.');
    } else {
      events.push(data);
      announce('Evento añadido.');
    }

    saveEvents();
    cursor = new Date(parseISO(date).getFullYear(),parseISO(date).getMonth(),1);
    saveCursor();
    closeModal();
    render();
  }

  function deleteEditing() {
    if (!editingId) return;
    const item = events.find(e => e.id === editingId);
    if (!item) return;
    if (!confirm('¿Eliminar "' + (item.title || typeInfo(item.type).label) + '"?')) return;

    events = events.filter(e => e.id !== editingId);
    saveEvents();
    closeModal();
    render();
    announce('Evento eliminado.');
  }

  function moveEvent(id, date) {
    const item = events.find(e => e.id === id);
    if (!item || item.date === date) return;
    item.date = date;
    saveEvents();
    render();
    announce('Evento movido al ' + parseISO(date).toLocaleDateString('es-ES',{day:'numeric',month:'long'}) + '.');
  }

  function exportICS() {
    const list = sortEvents(events);
    if (!list.length) {
      announce('No hay eventos que exportar.');
      return;
    }

    const escICS = value => String(value || '')
      .replaceAll('\\','\\\\')
      .replaceAll('\n','\\n')
      .replaceAll(',','\\,')
      .replaceAll(';','\\;');

    const stamp = new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//LMP//Permutador de horarios//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    for (const item of list) {
      const s = subject(item.subjectId);
      const t = typeInfo(item.type);
      const ymd = item.date.replaceAll('-','');
      const summary = (item.title ? item.title + ' · ' : '') + t.label + ' · ' + s.name;

      lines.push('BEGIN:VEVENT');
      lines.push('UID:' + escICS(item.id + '@permutador-lmp'));
      lines.push('DTSTAMP:' + stamp);

      if (item.start) {
        lines.push('DTSTART:' + ymd + 'T' + item.start.replace(':','') + '00');
        if (item.end) lines.push('DTEND:' + ymd + 'T' + item.end.replace(':','') + '00');
      } else {
        const next = new Date(parseISO(item.date));
        next.setDate(next.getDate()+1);
        lines.push('DTSTART;VALUE=DATE:' + ymd);
        lines.push('DTEND;VALUE=DATE:' + toISO(next).replaceAll('-',''));
      }

      lines.push('SUMMARY:' + escICS(summary));
      if (item.location) lines.push('LOCATION:' + escICS(item.location));
      if (item.notes) lines.push('DESCRIPTION:' + escICS(item.notes));
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');

    const blob = new Blob([lines.join('\r\n')],{type:'text/calendar;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'calendario-universidad.ics';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url),1000);
    announce('Calendario .ics exportado.');
  }

  function backupPayload() {
    let weeklyEvents = [];
    try {
      weeklyEvents = JSON.parse(localStorage.getItem('weekly-planner-schedule:' + activeScheduleId) || '[]');
      if (!Array.isArray(weeklyEvents)) weeklyEvents = [];
    } catch {}

    let scheduleName = 'Mi horario';
    try {
      const index = JSON.parse(localStorage.getItem(SCHEDULE_INDEX_KEY) || '[]');
      scheduleName = index.find(x => x.id === activeScheduleId)?.name || scheduleName;
    } catch {}

    return {
      app:'planificador-universitario',
      version:2,
      name:scheduleName,
      exportedAt:new Date().toISOString(),
      events:weeklyEvents,
      monthlyEvents:events,
      settings:{
        theme:localStorage.getItem(THEME_KEY) || 'system',
        view:localStorage.getItem(VIEW_KEY) || 'week'
      }
    };
  }

  function exportBackup() {
    const payload = backupPayload();
    const blob = new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = (payload.name || 'horario')
      .replace(/[^a-z0-9áéíóúüñ_-]+/gi,'-')
      .replace(/^-+|-+$/g,'') + '.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url),1000);
    announce('Copia completa exportada.');
  }

  async function importBackup(file) {
    const payload = JSON.parse(await file.text());
    const weeklyEvents = Array.isArray(payload) ? payload : payload.events;
    const monthlyEvents = Array.isArray(payload?.monthlyEvents) ? payload.monthlyEvents : [];

    if (!Array.isArray(weeklyEvents)) throw new Error('Formato no válido');

    let index = [];
    try {
      index = JSON.parse(localStorage.getItem(SCHEDULE_INDEX_KEY) || '[]');
      if (!Array.isArray(index)) index = [];
    } catch {}

    const id = 'h_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,7);
    const name = String(
      (!Array.isArray(payload) && payload.name) ||
      file.name.replace(/\.json$/i,'') ||
      'Horario importado'
    ).trim().replace(/\s+/g,' ').slice(0,48) || 'Horario importado';

    index.push({id,name});
    localStorage.setItem(SCHEDULE_INDEX_KEY,JSON.stringify(index));
    localStorage.setItem('weekly-planner-schedule:' + id,JSON.stringify(weeklyEvents));
    localStorage.setItem('monthly-planner-events:' + id,JSON.stringify(monthlyEvents));
    localStorage.setItem(ACTIVE_SCHEDULE_KEY,id);

    if (!Array.isArray(payload) && payload.settings?.theme) {
      localStorage.setItem(THEME_KEY,payload.settings.theme);
    }
    if (!Array.isArray(payload) && payload.settings?.view) {
      localStorage.setItem(VIEW_KEY,payload.settings.view);
    }

    location.reload();
  }

  populateControls();

  $$('.view-tab').forEach(btn => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  });

  $('#prevMonthBtn').addEventListener('click', () => {
    cursor = new Date(cursor.getFullYear(),cursor.getMonth()-1,1);
    saveCursor();
    render();
  });

  $('#nextMonthBtn').addEventListener('click', () => {
    cursor = new Date(cursor.getFullYear(),cursor.getMonth()+1,1);
    saveCursor();
    render();
  });

  $('#todayMonthBtn').addEventListener('click', () => {
    const now = new Date();
    cursor = new Date(now.getFullYear(),now.getMonth(),1);
    saveCursor();
    render();
  });

  $('#addMonthEventBtn').addEventListener('click', () => openModal(todayISO()));
  $('#monthIcsBtn').addEventListener('click', exportICS);

  $('#monthGrid').addEventListener('click', event => {
    const chip = event.target.closest('[data-month-event-id]');
    if (chip) {
      openModal(null,chip.dataset.monthEventId);
      return;
    }

    const add = event.target.closest('[data-add-date]');
    if (add) {
      openModal(add.dataset.addDate);
      return;
    }

    const cell = event.target.closest('.month-day[data-date]');
    if (cell) openModal(cell.dataset.date);
  });

  $('#monthGrid').addEventListener('dragstart', event => {
    const chip = event.target.closest('[data-month-event-id]');
    if (!chip) return;
    dragId = chip.dataset.monthEventId;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain',dragId);
    chip.classList.add('is-dragging');
  });

  $('#monthGrid').addEventListener('dragend', event => {
    event.target.closest('[data-month-event-id]')?.classList.remove('is-dragging');
    $$('.month-day.drop-target').forEach(cell => cell.classList.remove('drop-target'));
    dragId = null;
  });

  $('#monthGrid').addEventListener('dragover', event => {
    const cell = event.target.closest('.month-day[data-date]');
    if (!cell || !dragId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    $$('.month-day.drop-target').forEach(node => node !== cell && node.classList.remove('drop-target'));
    cell.classList.add('drop-target');
  });

  $('#monthGrid').addEventListener('drop', event => {
    const cell = event.target.closest('.month-day[data-date]');
    if (!cell) return;
    event.preventDefault();
    const id = dragId || event.dataTransfer.getData('text/plain');
    if (id) moveEvent(id,cell.dataset.date);
    cell.classList.remove('drop-target');
    dragId = null;
  });

  $('#upcomingList').addEventListener('click', event => {
    const item = event.target.closest('[data-month-event-id]');
    if (item) openModal(null,item.dataset.monthEventId);
  });

  ['monthCourseFilter','monthSubjectFilter','monthTypeFilter','monthStatusFilter'].forEach(id => {
    $('#' + id).addEventListener('change', () => {
      filters.course = $('#monthCourseFilter').value;
      filters.subject = $('#monthSubjectFilter').value;
      filters.type = $('#monthTypeFilter').value;
      filters.status = $('#monthStatusFilter').value;
      render();
    });
  });

  $('#resetMonthFiltersBtn').addEventListener('click', () => {
    filters = {course:'all',subject:'all',type:'all',status:'all'};
    $('#monthCourseFilter').value = 'all';
    $('#monthSubjectFilter').value = 'all';
    $('#monthTypeFilter').value = 'all';
    $('#monthStatusFilter').value = 'all';
    render();
  });

  $('#eventForm').addEventListener('submit',saveFromForm);
  $('#closeEventModalBtn').addEventListener('click',closeModal);
  $('#cancelEventBtn').addEventListener('click',closeModal);
  $('#deleteMonthEventBtn').addEventListener('click',deleteEditing);
  $('#eventModalBackdrop').addEventListener('click',event => {
    if (event.target === $('#eventModalBackdrop')) closeModal();
  });

  document.addEventListener('keydown',event => {
    if (event.key === 'Escape' && !$('#eventModalBackdrop').classList.contains('hidden')) {
      closeModal();
    }
  });

  // Sustituye la copia JSON de la vista semanal por una copia completa
  // (semana + calendario mensual) sin tocar el código original.
  document.addEventListener('click',event => {
    if (!event.target.closest('#backupScheduleBtn')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    exportBackup();
  },true);

  document.addEventListener('change',async event => {
    if (event.target?.id !== 'importScheduleInput') return;
    event.stopImmediatePropagation();
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      await importBackup(file);
    } catch (error) {
      console.error(error);
      announce('No se pudo importar ese archivo JSON.');
    }
  },true);

  setView(localStorage.getItem(VIEW_KEY) || 'week');
  render();
})();