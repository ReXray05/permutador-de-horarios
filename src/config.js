export const DAYS=['Lunes','Martes','Miércoles','Jueves','Viernes'];
export const START_HOUR=8, END_HOUR=21, SLOT_MIN=30, SLOTS=(END_HOUR-START_HOUR)*2;

export const SUBJECTS=[
 {id:'materiales',name:'Ingeniería de Materiales',course:3,color:'#8b5cf6'},
 {id:'maquinas-electricas',name:'Máquinas Eléctricas',course:3,color:'#2563eb'},
 {id:'diseno-maquinas-1',name:'Diseño de Máquinas I',course:3,color:'#0ea5e9'},
 {id:'teoria-maquinas',name:'Teoría de Máquinas y Mecanismos',course:3,color:'#14b8a6'},
 {id:'teoria-estructuras',name:'Teoría de Estructuras',course:3,color:'#22c55e'},
 {id:'termica',name:'Ingeniería Térmica',course:3,color:'#84cc16'},
 {id:'electronica',name:'Electrónica',course:3,color:'#eab308'},
 {id:'diseno-mecanico',name:'Diseño Mecánico',course:4,color:'#f59e0b'},
 {id:'metrologia',name:'Metrología y Calidad',course:4,color:'#f97316'},
 {id:'fabricacion',name:'Ingeniería de Fabricación',course:4,color:'#ef4444'},
 {id:'oficina',name:'Oficina Técnica',course:4,color:'#ec4899'},
 {id:'sff',name:'Sistemas de Fabricación Flexible',course:4,color:'#d946ef'},
 {id:'motores',name:'Motores Alternativos',course:4,color:'#6366f1'},
 {id:'fem-vib',name:'Elementos Finitos y Vibraciones Mecánicas',course:4,color:'#64748b'}
];
export const SUBJECT_BY_ID=Object.fromEntries(SUBJECTS.map(s=>[s.id,s]));

const E=(day,subjectId,startSlot,duration,{lab=false,frame=null}={})=>({id:crypto.randomUUID?.()||Math.random().toString(36).slice(2),day,subjectId,startSlot,duration,lab,frame,opacity:1});
export function defaultWeeklyEvents(){return [
 E(0,'maquinas-electricas',3,7,{lab:true,frame:'red'}),E(0,'sff',8,4),E(0,'motores',8,4),E(0,'sff',15,4,{lab:true}),E(0,'motores',15,4,{lab:true}),E(0,'motores',19,4,{lab:true}),
 E(1,'metrologia',3,4),E(1,'termica',7,4,{lab:true,frame:'red'}),E(1,'oficina',8,4),E(1,'fem-vib',15,4),E(1,'oficina',19,4,{lab:true}),
 E(2,'fabricacion',1,2),E(2,'oficina',3,4,{lab:true}),E(2,'teoria-maquinas',7,4,{lab:true,frame:'red'}),E(2,'termica',7,4,{lab:true,frame:'red'}),E(2,'sff',8,4),E(2,'metrologia',15,8,{lab:true}),E(2,'motores',15,8,{lab:true}),
 E(3,'maquinas-electricas',2,4,{lab:true,frame:'red'}),E(3,'fabricacion',3,4,{lab:true}),E(3,'materiales',6,5,{lab:true,frame:'red'}),E(3,'motores',8,4),E(3,'fabricacion',15,8,{lab:true}),
 E(4,'electronica',3,8,{lab:true,frame:'red'}),E(4,'maquinas-electricas',3,8,{lab:true,frame:'red'}),E(4,'motores',3,2),E(4,'fem-vib',15,4),E(4,'fem-vib',19,4,{lab:true}),E(4,'sff',19,4,{lab:true})
];}

export const MONTH_TYPES=[['exam','Examen'],['delivery','Entrega'],['work','Trabajo'],['presentation','Presentación'],['lab','Práctica/LAB'],['other','Otro']];

export const SKINS={
 default:{name:'Clásica',price:0,pattern:''},
 canarias:{name:'Canarias',price:90,pattern:'🍌'},
 lgbt:{name:'LGTB+',price:100,pattern:'🌈'},
 tuna:{name:'Tuna',price:110,pattern:'🎸 ♫ 🪕 ♪ 🥁'},
 aston:{name:'Aston Martin',price:120,pattern:'🏁'},
 mort:{name:'Mort',price:130,pattern:'👀 💖 🐾'}
};

export const QUIZ=[
 ['q01','¿Cuál es la capital de Australia?',['Sídney','Melbourne','Canberra','Perth'],2],
 ['q02','¿Qué planeta está más cerca del Sol?',['Venus','Mercurio','Marte','Tierra'],1],
 ['q03','¿Cuántos lados tiene un dodecágono?',['10','12','14','20'],1],
 ['q04','¿Quién pintó La noche estrellada?',['Picasso','Van Gogh','Monet','Goya'],1],
 ['q05','¿Cuál es el océano más grande?',['Atlántico','Índico','Pacífico','Ártico'],2],
 ['q06','¿Qué elemento tiene símbolo Fe?',['Flúor','Hierro','Francio','Fermio'],1],
 ['q07','¿Qué país tiene forma aproximada de bota?',['Portugal','Italia','Croacia','Grecia'],1],
 ['q08','¿Cuál es el símbolo químico del oro?',['Ag','Au','O','Or'],1],
 ['q09','¿Cuántos grados tiene un ángulo llano?',['90°','120°','180°','360°'],2],
 ['q10','¿Quién compuso Las cuatro estaciones?',['Mozart','Vivaldi','Bach','Beethoven'],1],
 ['q11','¿Cuál es la capital de Nueva Zelanda?',['Auckland','Wellington','Christchurch','Hamilton'],1],
 ['q12','¿Qué planeta es el más grande del sistema solar?',['Saturno','Júpiter','Neptuno','Tierra'],1],
 ['q13','¿Cuántos huesos tiene normalmente un adulto?',['186','206','226','246'],1],
 ['q14','¿Qué río atraviesa París?',['Támesis','Danubio','Sena','Rin'],2],
 ['q15','¿En qué unidad se mide la frecuencia?',['Pascal','Hercio','Julio','Newton'],1],
 ['q16','¿Quién escribió La metamorfosis?',['Kafka','Camus','Borges','Dante'],0],
 ['q17','¿Qué órgano produce insulina?',['Hígado','Páncreas','Riñón','Bazo'],1],
 ['q18','¿Cuál es la capital de Marruecos?',['Casablanca','Marrakech','Rabat','Fez'],2]
].map(([id,q,o,a])=>({id,q,o,a}));
