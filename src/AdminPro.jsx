import { useState } from 'react';

const STAFF = ['Кристина Лакиза', 'Вера Соколова', 'Алина Миронова', 'Наталья Орлова'];
const HOURS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'];
const EVENTS = [
  ['Кристина Лакиза','09:00','Ирина · Спина'],
  ['Кристина Лакиза','14:00','Олег · Классика'],
  ['Вера Соколова','11:00','Мария · Антистресс'],
  ['Алина Миронова','16:00','Денис · Лимфодренаж'],
  ['Наталья Орлова','18:00','Анна · Курс'],
];

function today(){return new Date().toISOString().slice(0,10)}
function shift(name){return STAFF.indexOf(name)}
function works(name){return ((Math.floor(Date.now()/86400000)+shift(name))%4)<2}

export default function AdminPro(){
  const [tab,setTab]=useState('calendar');
  const [staff,setStaff]=useState('Все');
  const [people,setPeople]=useState(STAFF);
  const shown=staff==='Все'?people:people.filter(x=>x===staff);
  const del=(name)=>{ if(confirm('Удалить '+name+'?')) setPeople(people.filter(x=>x!==name)); };
  const edit=(name)=>{ const v=prompt('Новое имя',name); if(v&&confirm('Сохранить '+v+'?')) setPeople(people.map(x=>x===name?v:x)); };
  return <div className="grid gap-4">
    <div className="grid grid-cols-4 gap-2 rounded-[1.7rem] bg-white/10 p-2">{['calendar','load','users','list'].map(x=><button key={x} onClick={()=>setTab(x)} className={(tab===x?'bg-lime-200 text-emerald-950':'bg-white/10 text-white')+' rounded-2xl px-2 py-3 text-xs font-black'}>{x==='calendar'?'Календарь':x==='load'?'Загрузка':x==='users'?'Пользователи':'Записи'}</button>)}</div>
    {tab==='calendar'&&<Panel title="Календарь администратора" note="08:00–20:00, смены 2 через 2"><Filter value={staff} set={setStaff} people={people}/>{shown.map(n=><Day key={n} name={n}/>)}</Panel>}
    {tab==='load'&&<Panel title="Загрузка" note="визуально по мастерам">{people.map(n=><Load key={n} name={n}/>)}</Panel>}
    {tab==='users'&&<Panel title="Пользователи" note="редактирование с подтверждением">{people.map(n=><div key={n} className="mb-3 rounded-3xl bg-white/10 p-4"><b className="text-lime-100">{n}</b><div className="text-sm text-emerald-50/60">массажист</div><div className="mt-3 flex gap-2"><button onClick={()=>edit(n)} className="rounded-full bg-lime-200 px-4 py-2 text-xs font-black text-emerald-950">Редактировать</button><button onClick={()=>del(n)} className="rounded-full bg-red-500/20 px-4 py-2 text-xs font-black text-red-100">Удалить</button></div></div>)}</Panel>}
    {tab==='list'&&<Panel title="Записи" note="фильтр по массажисту"><Filter value={staff} set={setStaff} people={people}/>{EVENTS.filter(e=>staff==='Все'||e[0]===staff).map((e,i)=><div key={i} className="mb-3 rounded-3xl bg-white/10 p-4"><b className="text-lime-100">{today()} · {e[1]}</b><div>{e[0]} · {e[2]}</div></div>)}</Panel>}
  </div>
}
function Filter({value,set,people}){return <select value={value} onChange={e=>set(e.target.value)} className="mb-4 w-full rounded-2xl bg-white px-4 py-4 font-bold text-emerald-950"><option>Все</option>{people.map(p=><option key={p}>{p}</option>)}</select>}
function Day({name}){const ok=works(name);return <div className="mb-4 rounded-3xl bg-white/10 p-4"><div className="mb-2 flex justify-between"><b className="text-lime-100">{name}</b><span className={(ok?'bg-lime-200 text-emerald-950':'bg-red-500/20 text-red-100')+' rounded-full px-3 py-1 text-xs font-black'}>{ok?'Работает':'Выходной'}</span></div>{HOURS.map(h=>{const ev=EVENTS.find(e=>e[0]===name&&e[1]===h);return <div key={h} className="grid grid-cols-[58px_1fr] gap-2 py-1"><span className="pt-2 text-xs text-emerald-50/50">{h}</span><div className={(ev?'bg-lime-200 text-emerald-950':ok?'bg-white/5 text-emerald-50/40':'bg-red-500/10 text-red-100/60')+' rounded-2xl px-3 py-2 text-sm'}>{ev?ev[2]:ok?'свободно':'выходной'}</div></div>})}</div>}
function Load({name}){const busy=EVENTS.filter(e=>e[0]===name).length;const pct=Math.min(100,busy*18);return <div className="mb-4 rounded-3xl bg-white/10 p-4"><div className="mb-2 flex justify-between"><b>{name}</b><b className="text-lime-200">{pct}%</b></div><div className="h-4 rounded-full bg-white/10"><div className="h-4 rounded-full bg-lime-200" style={{width:pct+'%'}}/></div></div>}
function Panel({title,note,children}){return <div className="rounded-[2rem] border border-white/10 bg-[#07140e]/80 p-5 shadow-2xl shadow-black/30"><div className="mb-5"><div className="text-xs font-black uppercase tracking-[.18em] text-lime-300/70">{note}</div><h1 className="mt-1 text-4xl font-black tracking-[-.06em] text-lime-50">{title}</h1></div>{children}</div>}
