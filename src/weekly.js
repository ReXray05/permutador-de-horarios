import {DAYS,SUBJECTS,SUBJECT_BY_ID,START_HOUR,SLOT_MIN,SLOTS} from './config.js';
import {loadWeekly,saveWeekly,storage} from './storage.js';
import {uid,clamp,toast,download,esc} from './ui.js';

const MOBILE_QUERY='(max-width:700px)';
const DEFAULT_DURATION=2;
const LONG_PRESS_MS=520;

const slotToTime=slot=>{
  const minutes=START_HOUR*60+slot*SLOT_MIN;
  return `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
};

const durationLabel=slots=>{
  const minutes=slots*SLOT_MIN;
  const h=Math.floor(minutes/60),m=minutes%60;
  return h&&m?`${h} h ${m} min`:h?`${h} h`:`${m} min`;
};

const overlaps=(a,b)=>a.startSlot<b.startSlot+b.duration&&b.startSlot<a.startSlot+a.duration;
const isMobile=()=>matchMedia(MOBILE_QUERY).matches;

export class WeeklyPlanner{
  constructor(){
    this.events=loadWeekly();
    this.selected=new Set();
    this.primarySelected=null;
    this.undoStack=[];
    this.locked=isMobile();
    this.filters={lab:'all',course:'all',subject:'all',frame:'all',frameColor:'all'};
    this.showNow=storage.get('weekly-planner-show-current-time','1')!=='0';
    this.selectedSubject=null;
    this.dropPreview=null;
    this.duplicatePlacement=null;
    this.popIds=new Set();
    this.suppressClickUntil=0;
    this.longPressTimer=null;
  }

  init(){
    this.renderTimes();
    this.renderSubjects();
    this.renderFrameFilter();
    this.bind();
    this.render();
    this.updateNow();
    this.nowTimer=setInterval(()=>this.updateNow(),30000);
  }

  destroy(){
    clearInterval(this.nowTimer);
    clearTimeout(this.longPressTimer);
  }

  snapshot(){
    this.undoStack.push(JSON.stringify(this.events));
    if(this.undoStack.length>60)this.undoStack.shift();
    this.syncUndoButton();
  }

  syncUndoButton(){
    const button=document.querySelector('#undoBtn');
    if(button)button.disabled=!this.undoStack.length;
  }

  persist(){saveWeekly(this.events)}

  mutate(fn,{pop=[]}={}){
    if(this.locked&&isMobile()){
      toast('Activa la edición para modificar el horario.');
      return false;
    }
    this.snapshot();
    fn();
    pop.forEach(id=>this.popIds.add(id));
    this.persist();
    this.render();
    return true;
  }

  setLocked(value){
    this.locked=!!value;
    const editor=document.querySelector('#editor');
    editor?.classList.toggle('locked',this.locked);
    ['earlierBtn','laterBtn','shorterBtn','longerBtn','deleteSelectedBtn'].forEach(id=>{
      const control=document.getElementById(id);
      if(control)control.disabled=this.locked;
    });
    if(this.locked){
      this.cancelDuplicatePlacement();
      this.clearDropPreview();
    }
  }

  setEvents(events){
    this.events=Array.isArray(events)?events:[];
    this.selected.clear();
    this.primarySelected=null;
    this.persist();
    this.render();
  }

  renderTimes(){
    const column=document.querySelector('#timeColumn');
    if(!column)return;
    column.innerHTML='';
    for(let slot=0;slot<SLOTS;slot++){
      const node=document.createElement('div');
      node.className='time-label';
      node.textContent=slot%2===0?slotToTime(slot):'';
      column.appendChild(node);
    }
  }

  renderSubjects(){
    const list=document.querySelector('#subjectList');
    if(!list)return;
    list.innerHTML=SUBJECTS.map(subject=>`
      <button class="subject-chip" draggable="true" data-subject="${subject.id}" style="--subject:${subject.color}">
        <span></span><b>${esc(subject.name)}</b><small>${subject.course}.º</small>
      </button>`).join('');

    const select=document.querySelector('#subjectFilter');
    if(select){
      select.innerHTML='<option value="all">Todas</option>'+SUBJECTS.map(subject=>`<option value="${subject.id}">${esc(subject.name)}</option>`).join('');
    }
  }

  renderFrameFilter(){
    let host=document.querySelector('#frameColorFilter');
    if(!host){
      const frameSelect=document.querySelector('#frameFilter');
      const field=frameSelect?.closest('.field');
      if(field){
        host=document.createElement('div');
        host.id='frameColorFilter';
        host.className='frame-color-filter';
        host.setAttribute('aria-label','Color del marco');
        field.insertAdjacentElement('afterend',host);
      }
    }
    if(!host)return;
    host.innerHTML=[['all','Todos'],['red','Rojo'],['yellow','Amarillo'],['blue','Azul']].map(([value,label])=>`<button type="button" class="frame-swatch${value==='all'?' active':''}" data-frame-filter="${value}" title="${label}" aria-label="${label}"><i class="${value}"></i></button>`).join('');
  }

  lanes(dayEvents){
    const items=[...dayEvents].sort((a,b)=>a.startSlot-b.startSlot||b.duration-a.duration);
    const components=[];
    for(const event of items){
      const touching=components.filter(group=>group.some(other=>overlaps(other,event)));
      if(!touching.length){components.push([event]);continue}
      const merged=[event,...touching.flat()];
      touching.forEach(group=>components.splice(components.indexOf(group),1));
      components.push(merged);
    }
    const result=new Map();
    for(const group of components){
      const laneEnds=[];
      const assignments=[];
      for(const event of group.sort((a,b)=>a.startSlot-b.startSlot||b.duration-a.duration)){
        let lane=laneEnds.findIndex(end=>end<=event.startSlot);
        if(lane<0){lane=laneEnds.length;laneEnds.push(0)}
        laneEnds[lane]=event.startSlot+event.duration;
        assignments.push([event,lane]);
      }
      const count=Math.max(1,laneEnds.length);
      assignments.forEach(([event,lane])=>result.set(event.id,{lane,count}));
    }
    return result;
  }

  visible(event){
    const subject=SUBJECT_BY_ID[event.subjectId];
    if(!subject)return false;
    if(this.filters.lab==='lab'&&!event.lab)return false;
    if(this.filters.lab==='nonlab'&&event.lab)return false;
    if(this.filters.course!=='all'&&String(subject.course)!==this.filters.course)return false;
    if(this.filters.subject!=='all'&&event.subjectId!==this.filters.subject)return false;
    if(this.filters.frame==='framed'&&!event.frame)return false;
    if(this.filters.frame==='none'&&event.frame)return false;
    if(this.filters.frameColor!=='all'&&event.frame!==this.filters.frameColor)return false;
    return true;
  }

  render(){
    for(let day=0;day<5;day++){
      const column=document.querySelector(`.day-column[data-day="${day}"]`);
      if(!column)continue;
      const events=this.events.filter(event=>event.day===day&&this.visible(event));
      const layout=this.lanes(events);
      column.querySelectorAll('.week-event').forEach(node=>node.remove());
      for(const event of events){
        const subject=SUBJECT_BY_ID[event.subjectId];
        if(!subject)continue;
        const {lane,count}=layout.get(event.id)||{lane:0,count:1};
        const node=document.createElement('article');
        node.className=`week-event${event.lab?' lab':''}${this.selected.has(event.id)?' selected':''}${this.popIds.has(event.id)?' pop':''}`;
        node.dataset.id=event.id;
        node.style.setProperty('--subject',subject.color);
        node.style.top=`calc(var(--slot-h) * ${event.startSlot})`;
        node.style.height=`calc(var(--slot-h) * ${event.duration} - 2px)`;
        node.style.left=`calc(${lane} * (100% / ${count}) + 1px)`;
        node.style.width=`calc(100% / ${count} - 2px)`;
        node.style.opacity=event.opacity??1;
        if(event.frame)node.dataset.frame=event.frame;
        node.innerHTML=`<strong>${esc(subject.name)}</strong>${event.lab?'<em>LAB</em>':''}<small>${slotToTime(event.startSlot)}–${slotToTime(event.startSlot+event.duration)} · ${durationLabel(event.duration)}</small><i class="resize-handle" aria-hidden="true"></i>`;
        column.appendChild(node);
      }
    }
    if(this.popIds.size){
      const ids=[...this.popIds];
      setTimeout(()=>{
        ids.forEach(id=>this.popIds.delete(id));
        ids.forEach(id=>document.querySelector(`.week-event[data-id="${CSS.escape(id)}"]`)?.classList.remove('pop'));
      },260);
    }
    this.renderEditor();
    this.updateFilterSummary();
    this.syncUndoButton();
  }

  renderEditor(){
    const editor=document.querySelector('#editor');
    const title=document.querySelector('#editorTitle');
    if(!editor||!title)return;
    const ids=[...this.selected];
    if(!ids.length){editor.classList.add('hidden');return}
    editor.classList.remove('hidden');
    const first=this.events.find(event=>event.id===ids[0]);
    title.textContent=ids.length>1?`${ids.length} bloques seleccionados`:SUBJECT_BY_ID[first?.subjectId]?.name||'';
    editor.classList.toggle('locked',this.locked);
  }

  updateFilterSummary(){
    const node=document.querySelector('#filterSummary');
    if(node)node.textContent=`Mostrando ${this.events.filter(event=>this.visible(event)).length} de ${this.events.length} bloques.`;
  }

  bind(){this.bindSubjects();this.bindColumns();this.bindCalendar();this.bindEditor();this.bindFilters();this.bindToolbar();this.bindKeyboard()}

  bindSubjects(){
    const list=document.querySelector('#subjectList');
    if(!list)return;
    list.addEventListener('click',event=>{
      const chip=event.target.closest('[data-subject]');if(!chip)return;
      this.selectedSubject=chip.dataset.subject;
      list.querySelectorAll('.subject-chip').forEach(node=>node.classList.toggle('selected',node===chip));
    });
    list.addEventListener('dragstart',event=>{
      const chip=event.target.closest('[data-subject]');if(!chip)return;
      this.selectedSubject=chip.dataset.subject;
      event.dataTransfer.effectAllowed='copy';
      event.dataTransfer.setData('text/plain',chip.dataset.subject);
      list.querySelectorAll('.subject-chip').forEach(node=>node.classList.toggle('selected',node===chip));
    });
  }

  bindColumns(){
    document.querySelectorAll('.day-column').forEach(column=>{
      column.addEventListener('dragover',event=>{
        event.preventDefault();
        if(this.locked&&isMobile())return;
        const subjectId=event.dataTransfer?.getData('text/plain')||this.selectedSubject;
        if(!SUBJECT_BY_ID[subjectId])return;
        const slot=this.slotFromClientY(column,event.clientY,DEFAULT_DURATION);
        this.showDropPreview(column,slot,DEFAULT_DURATION,SUBJECT_BY_ID[subjectId].color,false);
      });
      column.addEventListener('dragleave',event=>{if(!column.contains(event.relatedTarget))this.clearDropPreview()});
      column.addEventListener('drop',event=>{
        event.preventDefault();this.clearDropPreview();
        if(this.locked&&isMobile())return;
        const subjectId=event.dataTransfer.getData('text/plain')||this.selectedSubject;
        if(!SUBJECT_BY_ID[subjectId])return;
        const slot=this.slotFromClientY(column,event.clientY,DEFAULT_DURATION);
        const created={id:uid(),day:Number(column.dataset.day),subjectId,startSlot:slot,duration:DEFAULT_DURATION,lab:false,frame:null,opacity:1};
        this.mutate(()=>{this.events.push(created);this.selected=new Set([created.id]);this.primarySelected=created.id},{pop:[created.id]});
      });
      column.addEventListener('pointermove',event=>{
        if(!this.duplicatePlacement)return;
        const slot=this.slotFromClientY(column,event.clientY,this.duplicatePlacement.anchor.duration);
        this.showDropPreview(column,slot,this.duplicatePlacement.anchor.duration,SUBJECT_BY_ID[this.duplicatePlacement.anchor.subjectId]?.color||'var(--accent)',true);
      });
      column.addEventListener('click',event=>{
        if(Date.now()<this.suppressClickUntil||event.target.closest('.week-event'))return;
        if(this.locked&&isMobile())return;
        if(this.duplicatePlacement){
          const slot=this.slotFromClientY(column,event.clientY,this.duplicatePlacement.anchor.duration);
          this.placeDuplicate(Number(column.dataset.day),slot);return;
        }
        if(!this.selectedSubject)return;
        const slot=this.slotFromClientY(column,event.clientY,DEFAULT_DURATION);
        const created={id:uid(),day:Number(column.dataset.day),subjectId:this.selectedSubject,startSlot:slot,duration:DEFAULT_DURATION,lab:false,frame:null,opacity:1};
        this.mutate(()=>{this.events.push(created);this.selected=new Set([created.id]);this.primarySelected=created.id},{pop:[created.id]});
      });
    });
  }

  bindCalendar(){
    const calendar=document.querySelector('#calendar');if(!calendar)return;
    calendar.addEventListener('click',event=>{
      if(Date.now()<this.suppressClickUntil)return;
      const node=event.target.closest('.week-event');if(!node)return;
      const id=node.dataset.id;
      if(event.ctrlKey||event.metaKey||event.shiftKey){if(this.selected.has(id))this.selected.delete(id);else this.selected.add(id)}
      else{this.selected.clear();this.selected.add(id)}
      this.primarySelected=id;this.render();
    });
    calendar.addEventListener('contextmenu',event=>{
      const node=event.target.closest('.week-event');if(!node)return;
      event.preventDefault();
      if(!this.selected.has(node.dataset.id)){this.selected.clear();this.selected.add(node.dataset.id);this.primarySelected=node.dataset.id;this.render()}
      this.openContext(event.clientX,event.clientY);
    });
    calendar.addEventListener('pointerdown',event=>this.pointerDown(event));
  }

  bindEditor(){
    const apply=(selector,fn)=>document.querySelector(selector)?.addEventListener('click',()=>this.mutate(()=>{
      for(const id of this.selected){const event=this.events.find(item=>item.id===id);if(event)fn(event)}
    }));
    apply('#earlierBtn',event=>event.startSlot=clamp(event.startSlot-1,0,SLOTS-event.duration));
    apply('#laterBtn',event=>event.startSlot=clamp(event.startSlot+1,0,SLOTS-event.duration));
    apply('#shorterBtn',event=>event.duration=Math.max(1,event.duration-1));
    apply('#longerBtn',event=>event.duration=Math.min(SLOTS-event.startSlot,event.duration+1));
    document.querySelector('#deleteSelectedBtn')?.addEventListener('click',()=>this.deleteSelected());
  }

  bindFilters(){
    const map={labFilter:'lab',courseFilter:'course',subjectFilter:'subject',frameFilter:'frame'};
    Object.entries(map).forEach(([id,key])=>document.getElementById(id)?.addEventListener('change',event=>{this.filters[key]=event.target.value;this.render()}));
    document.querySelector('#frameColorFilter')?.addEventListener('click',event=>{
      const button=event.target.closest('[data-frame-filter]');if(!button)return;
      this.filters.frameColor=button.dataset.frameFilter;
      document.querySelectorAll('[data-frame-filter]').forEach(node=>node.classList.toggle('active',node===button));this.render();
    });
    document.querySelector('#resetFiltersBtn')?.addEventListener('click',()=>{
      this.filters={lab:'all',course:'all',subject:'all',frame:'all',frameColor:'all'};
      ['labFilter','courseFilter','subjectFilter','frameFilter'].forEach(id=>{const node=document.getElementById(id);if(node)node.value='all'});
      document.querySelectorAll('[data-frame-filter]').forEach(node=>node.classList.toggle('active',node.dataset.frameFilter==='all'));this.render();
    });
  }

  bindToolbar(){
    document.querySelector('#undoBtn')?.addEventListener('click',()=>{
      const previous=this.undoStack.pop();if(!previous)return;
      this.events=JSON.parse(previous);this.persist();this.selected.clear();this.primarySelected=null;this.cancelDuplicatePlacement();this.render();
    });
    document.querySelector('#clearBtn')?.addEventListener('click',()=>{if(confirm('¿Vaciar el horario semanal?'))this.mutate(()=>{this.events=[];this.selected.clear();this.primarySelected=null})});
    document.querySelector('#nowToggleBtn')?.addEventListener('click',()=>{this.showNow=!this.showNow;storage.set('weekly-planner-show-current-time',this.showNow?'1':'0');document.querySelector('#nowToggleBtn')?.classList.toggle('active',this.showNow);this.updateNow()});
    document.querySelector('#exportBtn')?.addEventListener('click',()=>this.export(document.querySelector('#exportType')?.value||'png'));
    document.addEventListener('click',event=>{if(!event.target.closest('#contextMenu'))document.querySelector('#contextMenu')?.classList.add('hidden')});
  }

  bindKeyboard(){
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'){this.cancelDuplicatePlacement();document.querySelector('#contextMenu')?.classList.add('hidden')}
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();document.querySelector('#undoBtn')?.click()}
      if((event.key==='Delete'||event.key==='Backspace')&&this.selected.size&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){event.preventDefault();this.deleteSelected()}
    });
  }

  slotFromClientY(column,clientY,duration=1){
    const rect=column.getBoundingClientRect();
    return clamp(Math.floor((clientY-rect.top)/(rect.height/SLOTS)),0,Math.max(0,SLOTS-duration));
  }

  showDropPreview(column,slot,duration,color,duplicate=false){
    if(!this.dropPreview){this.dropPreview=document.createElement('div');this.dropPreview.className='week-drop-preview'}
    if(this.dropPreview.parentElement!==column)column.appendChild(this.dropPreview);
    this.dropPreview.style.setProperty('--preview-subject',color);
    this.dropPreview.style.top=`calc(var(--slot-h) * ${slot})`;
    this.dropPreview.style.height=`calc(var(--slot-h) * ${duration} - 2px)`;
    this.dropPreview.classList.toggle('duplicate',duplicate);
  }

  clearDropPreview(){this.dropPreview?.remove();this.dropPreview=null}

  pointerDown(event){
    const node=event.target.closest('.week-event');if(!node)return;
    if(this.locked&&isMobile())return;
    if(event.button!==0&&event.pointerType==='mouse')return;
    const id=node.dataset.id,resizing=!!event.target.closest('.resize-handle');
    if(!this.selected.has(id)){this.selected.clear();this.selected.add(id);this.primarySelected=id;this.render()}
    if(isMobile()&&event.pointerType!=='mouse'&&!resizing){clearTimeout(this.longPressTimer);this.longPressTimer=setTimeout(()=>this.openContext(event.clientX,event.clientY),LONG_PRESS_MS)}
    const selectedEvents=[...this.selected].map(selectedId=>this.events.find(item=>item.id===selectedId)).filter(Boolean);
    const origin=new Map(selectedEvents.map(item=>[item.id,{day:item.day,startSlot:item.startSlot,duration:item.duration}]));
    const anchorOrigin=origin.get(id),column=node.closest('.day-column'),rect=column.getBoundingClientRect(),slotHeight=rect.height/SLOTS;
    const startX=event.clientX,startY=event.clientY;let started=false;
    const startMutation=()=>{if(started)return;started=true;clearTimeout(this.longPressTimer);this.snapshot();document.body.classList.add('weekly-dragging')};
    const move=moveEvent=>{
      if(Math.abs(moveEvent.clientX-startX)+Math.abs(moveEvent.clientY-startY)<6)return;
      startMutation();
      if(resizing){
        const delta=Math.round((moveEvent.clientY-startY)/slotHeight);
        for(const item of selectedEvents){const base=origin.get(item.id);item.duration=clamp(base.duration+delta,1,SLOTS-item.startSlot)}
      }else{
        let deltaSlot=Math.round((moveEvent.clientY-startY)/slotHeight);
        const targetColumn=document.elementFromPoint(moveEvent.clientX,moveEvent.clientY)?.closest('.day-column');
        let deltaDay=targetColumn?Number(targetColumn.dataset.day)-anchorOrigin.day:0;
        const minDay=Math.min(...selectedEvents.map(item=>origin.get(item.id).day)),maxDay=Math.max(...selectedEvents.map(item=>origin.get(item.id).day));
        deltaDay=clamp(deltaDay,-minDay,4-maxDay);
        const minStart=Math.min(...selectedEvents.map(item=>origin.get(item.id).startSlot)),maxEnd=Math.max(...selectedEvents.map(item=>origin.get(item.id).startSlot+origin.get(item.id).duration));
        deltaSlot=clamp(deltaSlot,-minStart,SLOTS-maxEnd);
        for(const item of selectedEvents){const base=origin.get(item.id);item.day=base.day+deltaDay;item.startSlot=base.startSlot+deltaSlot}
      }
      this.render();
    };
    const up=()=>{clearTimeout(this.longPressTimer);removeEventListener('pointermove',move);removeEventListener('pointerup',up);removeEventListener('pointercancel',up);document.body.classList.remove('weekly-dragging');if(started){this.persist();this.suppressClickUntil=Date.now()+220;this.render()}};
    addEventListener('pointermove',move);addEventListener('pointerup',up,{once:true});addEventListener('pointercancel',up,{once:true});
  }

  openContext(x,y){
    const menu=document.querySelector('#contextMenu');if(!menu)return;
    menu.style.left=`${clamp(x,8,innerWidth-198)}px`;menu.style.top=`${clamp(y,8,innerHeight-318)}px`;menu.classList.remove('hidden');
    menu.onclick=event=>{const action=event.target.closest('[data-action]')?.dataset.action;if(!action)return;menu.classList.add('hidden');this.handleContextAction(action)};
  }

  handleContextAction(action){
    if(action==='lab'){this.mutate(()=>this.selected.forEach(id=>{const event=this.events.find(item=>item.id===id);if(event)event.lab=!event.lab}));return}
    if(action.startsWith('frame-')){const frame=action==='frame-none'?null:action.slice(6);this.mutate(()=>this.selected.forEach(id=>{const event=this.events.find(item=>item.id===id);if(event)event.frame=frame}));return}
    if(action==='opacity'){this.mutate(()=>this.selected.forEach(id=>{const event=this.events.find(item=>item.id===id);if(event)event.opacity=(event.opacity??1)>.7?.52:1}));return}
    if(action==='duplicate'){this.beginDuplicatePlacement();return}
    if(action==='delete')this.deleteSelected();
  }

  beginDuplicatePlacement(){
    if(!this.selected.size||this.locked&&isMobile())return;
    const chosen=[...this.selected].map(id=>this.events.find(event=>event.id===id)).filter(Boolean);
    const anchor=this.events.find(event=>event.id===(this.primarySelected||chosen[0]?.id))||chosen[0];if(!anchor)return;
    this.duplicatePlacement={source:chosen.map(event=>({...event})),anchor:{...anchor}};
    document.querySelector('#calendar')?.classList.add('duplicate-mode');toast('Duplicado listo: haz clic donde quieras colocar la copia.',2600);
  }

  cancelDuplicatePlacement(){this.duplicatePlacement=null;document.querySelector('#calendar')?.classList.remove('duplicate-mode');this.clearDropPreview()}

  placeDuplicate(day,startSlot){
    const placement=this.duplicatePlacement;if(!placement)return;
    const deltaDay=day-placement.anchor.day,deltaSlot=startSlot-placement.anchor.startSlot,ids=[];
    this.mutate(()=>{
      const clones=placement.source.map(source=>{const clone={...source,id:uid(),day:clamp(source.day+deltaDay,0,4),startSlot:clamp(source.startSlot+deltaSlot,0,SLOTS-source.duration)};ids.push(clone.id);return clone});
      this.events.push(...clones);this.selected=new Set(ids);this.primarySelected=ids[0]||null;
    });
    ids.forEach(id=>this.popIds.add(id));this.cancelDuplicatePlacement();this.render();
  }

  deleteSelected(){if(!this.selected.size)return;this.mutate(()=>{this.events=this.events.filter(event=>!this.selected.has(event.id));this.selected.clear();this.primarySelected=null})}

  updateNow(){
    const line=document.querySelector('#currentTimeLine');if(!line)return;
    document.querySelector('#nowToggleBtn')?.classList.toggle('active',this.showNow);
    if(!this.showNow){line.classList.add('hidden');return}
    const now=new Date(),weekday=now.getDay()-1,minutes=now.getHours()*60+now.getMinutes(),start=START_HOUR*60,end=start+SLOTS*SLOT_MIN;
    if(weekday<0||weekday>4||minutes<start||minutes>end){line.classList.add('hidden');return}
    line.classList.remove('hidden');line.style.setProperty('--now-day',weekday);line.style.setProperty('--now-y',`${((minutes-start)/(end-start))*100}%`);
    const label=line.querySelector('span');if(label)label.textContent=`Ahora · ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  }

  svg(){
    const W=1400,H=900,left=92,top=58,bottom=22,row=(H-top-bottom)/SLOTS,col=(W-left-20)/5;
    const visibleEvents=this.events.filter(event=>this.visible(event)),layouts=new Map();
    for(let day=0;day<5;day++)for(const [id,value] of this.lanes(visibleEvents.filter(event=>event.day===day)))layouts.set(id,value);
    const xml=[`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,'<rect width="100%" height="100%" fill="#fff"/>','<style>text{font-family:Arial,sans-serif;fill:#111}.sm{font-size:11px}.xs{font-size:9px}.hd{font-size:14px;font-weight:700}</style>'];
    DAYS.forEach((day,index)=>xml.push(`<text class="hd" x="${left+index*col+8}" y="34">${esc(day)}</text>`));
    for(let slot=0;slot<=SLOTS;slot++){const y=top+slot*row;xml.push(`<line x1="${left}" x2="${W-20}" y1="${y}" y2="${y}" stroke="#dfe3eb"/>`);if(slot<SLOTS&&slot%2===0)xml.push(`<text class="sm" x="8" y="${y+12}">${slotToTime(slot)}</text>`)}
    for(let day=0;day<=5;day++){const x=left+day*col;xml.push(`<line y1="${top}" y2="${H-bottom}" x1="${x}" x2="${x}" stroke="#dfe3eb"/>`)}
    for(const event of visibleEvents){
      const subject=SUBJECT_BY_ID[event.subjectId];if(!subject)continue;
      const {lane,count}=layouts.get(event.id)||{lane:0,count:1},laneW=col/count,x=left+event.day*col+lane*laneW+2,y=top+event.startSlot*row+1,w=laneW-4,h=event.duration*row-2;
      const frame=event.frame==='red'?'#ef4444':event.frame==='yellow'?'#facc15':event.frame==='blue'?'#3b82f6':'none';
      xml.push(`<g opacity="${event.opacity??1}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${subject.color}" stroke="${frame}" stroke-width="${frame==='none'?0:3}"/>`);
      const words=subject.name.split(' ');let line1='',line2='';for(const word of words){if((line1+' '+word).trim().length<=22)line1=(line1+' '+word).trim();else line2=(line2+' '+word).trim()}
      xml.push(`<text class="sm" x="${x+6}" y="${y+15}" fill="#fff">${esc(line1)}</text>`);if(line2&&h>34)xml.push(`<text class="sm" x="${x+6}" y="${y+29}" fill="#fff">${esc(line2.slice(0,26))}</text>`);if(event.lab&&h>47)xml.push(`<text class="xs" x="${x+6}" y="${y+43}" fill="#fff">LAB · ${slotToTime(event.startSlot)}–${slotToTime(event.startSlot+event.duration)}</text>`);xml.push('</g>');
    }
    xml.push('</svg>');return xml.join('');
  }

  async svgToCanvas(svg){
    const blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob);
    try{const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url});const canvas=document.createElement('canvas');canvas.width=1400;canvas.height=900;const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);return canvas}finally{URL.revokeObjectURL(url)}
  }

  makePdf(jpegDataUrl,width,height){
    const raw=atob(jpegDataUrl.split(',')[1]),pageW=842,pageH=595,margin=24,scale=Math.min((pageW-margin*2)/width,(pageH-margin*2)/height),drawW=width*scale,drawH=height*scale,x=(pageW-drawW)/2,y=(pageH-drawH)/2;
    const parts=[],offsets=[0];let length=0;const push=text=>{parts.push(text);length+=text.length};push('%PDF-1.4\n');const obj=(n,body)=>{offsets[n]=length;push(`${n} 0 obj\n${body}\nendobj\n`)};
    obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');obj(3,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
    offsets[4]=length;push(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${raw.length} >>\nstream\n`);push(raw);push('\nendstream\nendobj\n');
    const stream=`q\n${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im0 Do\nQ`;obj(5,`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    const xref=length;push('xref\n0 6\n0000000000 65535 f \n');for(let i=1;i<=5;i++)push(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
    const binary=parts.join(''),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i)&255;return new Blob([bytes],{type:'application/pdf'});
  }

  interactiveHtml(){
    const data=this.events.map(event=>({...event,subject:SUBJECT_BY_ID[event.subjectId]}));
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Horario</title><style>body{font-family:Arial,sans-serif;margin:20px;background:#f6f7fb}.cal{position:relative;display:grid;grid-template-columns:70px repeat(5,1fr);grid-template-rows:42px 780px;background:white;border:1px solid #ddd;min-width:900px}.head{display:grid;place-items:center;font-weight:bold;background:#f4f4f4}.times{position:relative;border-right:1px solid #ddd}.time{position:absolute;left:5px;font-size:10px;color:#666}.day{position:relative;border-right:1px solid #ddd;background:repeating-linear-gradient(to bottom,transparent 0,transparent 29px,#eee 29px,#eee 30px)}.ev{position:absolute;left:3px;right:3px;border-radius:6px;padding:5px;color:white;overflow:hidden;font-size:11px}.now{position:absolute;height:2px;background:#e33;z-index:10;pointer-events:none}.now:before{content:'';position:absolute;width:8px;height:8px;border-radius:50%;background:#e33;left:-4px;top:-3px}</style></head><body><div class="cal" id="cal"><div class="head">Hora</div>${DAYS.map(d=>`<div class="head">${esc(d)}</div>`).join('')}<div class="times" id="times"></div>${DAYS.map((_,i)=>`<div class="day" data-day="${i}"></div>`).join('')}<div id="now" class="now" hidden></div></div><script>const START=${START_HOUR},SLOTS=${SLOTS},MIN=${SLOT_MIN},events=${JSON.stringify(data)};const times=document.getElementById('times');for(let s=0;s<SLOTS;s+=2){const n=document.createElement('div');n.className='time';n.style.top=(s/SLOTS*100)+'%';const m=START*60+s*MIN;n.textContent=String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');times.appendChild(n)}for(const e of events){const d=document.querySelector('.day[data-day="'+e.day+'"]');const n=document.createElement('div');n.className='ev';n.style.top=(e.startSlot/SLOTS*100)+'%';n.style.height=(e.duration/SLOTS*100)+'%';n.style.background=e.subject.color;n.innerHTML='<b>'+e.subject.name+'</b>';d.appendChild(n)}function now(){const line=document.getElementById('now'),d=new Date(),day=d.getDay()-1,min=d.getHours()*60+d.getMinutes(),start=START*60,end=start+SLOTS*MIN;if(day<0||day>4||min<start||min>end){line.hidden=true;return}line.hidden=false;line.style.left='calc(70px + '+day+' * ((100% - 70px) / 5))';line.style.width='calc((100% - 70px) / 5)';line.style.top='calc(42px + '+((min-start)/(end-start)*780)+'px)'}now();setInterval(now,30000)<\/script></body></html>`;
  }

  xlsxXml(){
    const rows=[['Día','Asignatura','Inicio','Fin','Duración','LAB','Marco'],...this.events.map(event=>[DAYS[event.day]||'',SUBJECT_BY_ID[event.subjectId]?.name||'',slotToTime(event.startSlot),slotToTime(event.startSlot+event.duration),durationLabel(event.duration),event.lab?'Sí':'No',event.frame||''])];
    return `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Horario"><Table>${rows.map(row=>`<Row>${row.map(cell=>`<Cell><Data ss:Type="String">${esc(cell)}</Data></Cell>`).join('')}</Row>`).join('')}</Table></Worksheet></Workbook>`;
  }

  async export(type){
    try{
      const svg=this.svg();
      if(type==='svg'){download('horario.svg',new Blob([svg],{type:'image/svg+xml'}));return}
      if(type==='html-live'){download('horario-interactivo.html',new Blob([this.interactiveHtml()],{type:'text/html'}));return}
      if(type==='xlsx'){download('horario.xls',new Blob([this.xlsxXml()],{type:'application/vnd.ms-excel'}));return}
      const canvas=await this.svgToCanvas(svg);
      if(type==='png'||type==='jpg'){const mime=type==='png'?'image/png':'image/jpeg',ext=type==='png'?'png':'jpg';canvas.toBlob(blob=>blob&&download(`horario.${ext}`,blob),mime,.94);return}
      if(type==='pdf'){download('horario.pdf',this.makePdf(canvas.toDataURL('image/jpeg',.92),canvas.width,canvas.height))}
    }catch(error){console.error(error);toast('No se pudo exportar el horario.')}
  }
}
