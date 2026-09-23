import {defaultWeeklyEvents} from './config.js';

const K={
 legacy:'weekly-planner-v10-subjects14',
 schedules:'weekly-planner-schedules-index-v1',
 activeSchedule:'weekly-planner-active-schedule-v1',
 view:'planner-active-view-v1',
 theme:'weekly-planner-theme',
 rosita:'weekly-planner-rosita-unlocked-v1',
 coins:'planner-coins-v1',
 ownedSkins:'planner-owned-skins-v1',
 activeSkin:'planner-active-skin-v1',
 extraOwned:'planner-extra-owned-skins-v1',
 extraActive:'planner-extra-active-skin-v1',
 infinite:'planner-infinite-coins-debug-v1'
};

const safeParse=(raw,fallback)=>{try{return JSON.parse(raw)}catch{return fallback}};
const uid=()=>crypto.randomUUID?.()||`id_${Date.now()}_${Math.random().toString(36).slice(2)}`;

export const storage={
 keys:K,
 get(key,fallback=null){const v=localStorage.getItem(key);return v===null?fallback:v},
 set(key,value){localStorage.setItem(key,String(value))},
 getJSON(key,fallback){const v=localStorage.getItem(key);return v===null?fallback:safeParse(v,fallback)},
 setJSON(key,value){localStorage.setItem(key,JSON.stringify(value))},
 remove(key){localStorage.removeItem(key)},
 scheduleKey(id){return `weekly-planner-schedule:${id}`},
 monthKey(id){return `monthly-planner-events:${id}`},
 cursorKey(id){return `monthly-planner-cursor:${id}`},
 quizKey(){const d=new Date(),p=n=>String(n).padStart(2,'0');return `planner-quiz-v2:${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`}
};

export function ensureData(){
 let index=storage.getJSON(K.schedules,null);
 if(!Array.isArray(index)||!index.length){
   index=[{id:'principal',name:'Mi horario'}];
   storage.setJSON(K.schedules,index);
 }
 let active=storage.get(K.activeSchedule,index[0].id);
 if(!index.some(x=>x.id===active)) active=index[0].id;
 storage.set(K.activeSchedule,active);

 const key=storage.scheduleKey(active);
 if(localStorage.getItem(key)===null){
   const legacy=storage.getJSON(K.legacy,null);
   const events=Array.isArray(legacy)?legacy:defaultWeeklyEvents();
   storage.setJSON(key,events);
 }
 if(localStorage.getItem(storage.monthKey(active))===null) storage.setJSON(storage.monthKey(active),[]);

 const owned=storage.getJSON(K.ownedSkins,['default']);
 if(!Array.isArray(owned)||!owned.includes('default')) storage.setJSON(K.ownedSkins,['default']);
 return {index,active};
}

export function schedules(){return storage.getJSON(K.schedules,[{id:'principal',name:'Mi horario'}]);}
export function activeScheduleId(){return storage.get(K.activeSchedule,'principal');}
export function setActiveSchedule(id){storage.set(K.activeSchedule,id);}
export function activeSchedule(){const id=activeScheduleId();return schedules().find(x=>x.id===id)||schedules()[0];}
export function createSchedule(name,events=defaultWeeklyEvents()){
 const id=`h_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
 const list=schedules();list.push({id,name:name||'Nuevo horario'});storage.setJSON(K.schedules,list);
 storage.setJSON(storage.scheduleKey(id),events.map(e=>({...e,id:uid()})));storage.setJSON(storage.monthKey(id),[]);setActiveSchedule(id);return id;
}
export function renameSchedule(id,name){const list=schedules().map(s=>s.id===id?{...s,name:name||s.name}:s);storage.setJSON(K.schedules,list);}
export function deleteSchedule(id){const list=schedules();if(list.length<=1) return false;const next=list.filter(s=>s.id!==id);storage.setJSON(K.schedules,next);storage.remove(storage.scheduleKey(id));storage.remove(storage.monthKey(id));storage.remove(storage.cursorKey(id));if(activeScheduleId()===id)setActiveSchedule(next[0].id);return true;}

export function loadWeekly(){return storage.getJSON(storage.scheduleKey(activeScheduleId()),[]);}
export function saveWeekly(events){storage.setJSON(storage.scheduleKey(activeScheduleId()),events);}
export function loadMonth(){return storage.getJSON(storage.monthKey(activeScheduleId()),[]);}
export function saveMonth(events){storage.setJSON(storage.monthKey(activeScheduleId()),events);}

export function exportPayload(){return {
 app:'planificador-universitario',version:3,name:activeSchedule()?.name||'Horario',exportedAt:new Date().toISOString(),
 events:loadWeekly(),monthlyEvents:loadMonth(),settings:{theme:storage.get(K.theme,'system'),view:storage.get(K.view,'week'),activeSkin:getActiveSkin(),showCurrentTime:storage.get('weekly-planner-show-current-time','1')!=='0'}
};}

export function importPayload(payload){
 let weekly=[],monthly=[];
 if(Array.isArray(payload)) weekly=payload;
 else if(payload&&Array.isArray(payload.events)){weekly=payload.events;monthly=Array.isArray(payload.monthlyEvents)?payload.monthlyEvents:[];}
 else throw new Error('Formato no válido');
 const id=createSchedule(payload?.name||'Importado',weekly);storage.setJSON(storage.monthKey(id),monthly);
 if(payload?.settings?.theme)storage.set(K.theme,payload.settings.theme);
 if(payload?.settings?.view)storage.set(K.view,payload.settings.view);
 if(payload?.settings?.showCurrentTime===false)storage.set('weekly-planner-show-current-time','0');
 return id;
}

export function coins(){return Math.max(0,parseInt(storage.get(K.coins,'0'),10)||0)}
export function setCoins(v){storage.set(K.coins,Math.max(0,Math.floor(v)))}
export function infiniteCoins(){return storage.get(K.infinite,'0')==='1'}
export function setInfiniteCoins(v){storage.set(K.infinite,v?'1':'0')}
export function ownedSkins(){const a=storage.getJSON(K.ownedSkins,['default']);const extra=storage.getJSON(K.extraOwned,[]);return [...new Set(['default',...(Array.isArray(a)?a:[]),...(Array.isArray(extra)?extra:[])])];}
export function ownSkin(id){const a=ownedSkins();if(!a.includes(id)){a.push(id);storage.setJSON(K.ownedSkins,a);}}
export function getActiveSkin(){return storage.get(K.extraActive,null)||storage.get(K.activeSkin,'default')||'default'}
export function setActiveSkin(id){storage.remove(K.extraActive);storage.set(K.activeSkin,id)}

export function quizState(){return storage.getJSON(storage.quizKey(),{done:[],wrong:{}})}
export function saveQuizState(state){storage.setJSON(storage.quizKey(),state)}
