import { useMemo, useState } from 'react';
import AdminPro from './AdminPro.jsx';

const K='lakizaDemoRoleAppointments';
const U='lakizaDemoClients';
const R={client:'Клиент',therapist:'Массажист',admin:'Администратор'};
const STAFF=[
 {login:'kristina',role:'admin',name:'Кристина',surname:'Лакиза'},
 {login:'vera',role:'therapist',name:'Вера',surname:'Соколова'},
 {login:'alina',role:'therapist',name:'Алина',surname:'Миронова'},
 {login:'natalia',role:'therapist',name:'Наталья',surname:'Орлова'},
 {login:'master',role:'therapist',name:'Мастер',surname:'Демо'}
];
const SERVICES=['Классический массаж','Спина и шея','Антистресс','Лимфодренаж'];
const TIMES=['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'];
function read(k,f){try{return JSON.parse(localStorage.getItem(k))||f}catch{return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
function name(u){return [u?.name,u?.surname].filter(Boolean).join(' ')||u?.login||'Пользователь'}
function today(){return new Date().toISOString().slice(0,10)}

export default function RoleApp2({user,logout,build}){
 const [view,setView]=useState('main');
 const users=useMemo(()=>{const saved=read(U,[]);const m=new Map([...STAFF,...saved].map(x=>[x.login,x]));const arr=[...m.values()];save(U,arr);return arr},[]);
 const [appts,setAppts]=useState(()=>read(K,[]));
 const therapists=users.filter(x=>x.role==='therapist'||x.login==='kristina');
 const setA=v=>{setAppts(v);save(K,v)};
 if(user.role==='admin')return <Shell user={user} logout={logout} build={build}><AdminPro users={users} appointments={appts}/></Shell>;
 if(user.role==='therapist')return <Shell user={user} logout={logout} build={build}><Panel title="Кабинет массажиста" note="мои записи">{appts.filter(a=>a.therapistLogin===user.login).map(a=><Card key={a.id} a={a}/>)}</Panel></Shell>;
 return <Shell user={user} logout={logout} build={build}>{view==='book'?<Book user={user} therapists={therapists} appts={appts} setA={setA} back={()=>setView('main')}/>:<Client user={user} setView={setView} appts={appts}/>}</Shell>;
}
function Shell({user,logout,build,children}){return <main className="min-h-screen bg-[#06110b] text-white"><div className="fixed inset-0 bg-[linear-gradient(180deg,#06110b,#0b2114,#06110b)]"/><header className="fixed left-0 right-0 top-0 z-50 px-3 pt-3"><div className="mx-auto max-w-7xl rounded-[1.7rem] border border-white/10 bg-[#07140e]/90 p-3 shadow-2xl"><div className="flex items-center justify-between"><div><div className="text-sm font-black tracking-[.22em] text-lime-100">ЛАКИЗА</div><div className="text-xs font-bold text-emerald-100/55">{R[user.role]} · {name(user)}</div></div><button onClick={logout} className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-lime-50">Выйти</button></div></div></header><section className="relative mx-auto max-w-7xl px-4 pb-24 pt-32"><div className="mb-5 inline-flex rounded-full bg-lime-300 px-4 py-2 text-xs font-black text-emerald-950">{build}</div>{children}</section></main>}
function Client({user,setView,appts}){const mine=appts.filter(a=>a.clientLogin===user.login);return <Panel title="Кабинет клиента" note="только свои записи"><button onClick={()=>setView('book')} className="mb-5 rounded-full bg-lime-200 px-6 py-4 font-black text-emerald-950">Записаться</button>{mine.map(a=><Card key={a.id} a={a}/>)}</Panel>}
function Book({user,therapists,appts,setA,back}){const [f,setF]=useState({therapistLogin:therapists[0]?.login||'kristina',service:SERVICES[0],date:today(),time:'10:00'});const submit=()=>{const t=therapists.find(x=>x.login===f.therapistLogin);setA([{id:'a'+Date.now(),...f,clientLogin:user.login,clientName:name(user),therapistName:name(t),status:'new'},...appts]);back()};return <Panel title="Новая запись" note="форма клиента"><Sel label="Массажист" value={f.therapistLogin} set={v=>setF({...f,therapistLogin:v})} options={therapists.map(t=>[t.login,name(t)])}/><Sel label="Услуга" value={f.service} set={v=>setF({...f,service:v})} options={SERVICES.map(x=>[x,x])}/><Inp label="Дата" type="date" value={f.date} set={v=>setF({...f,date:v})}/><Sel label="Время" value={f.time} set={v=>setF({...f,time:v})} options={TIMES.map(x=>[x,x])}/><button onClick={submit} className="mt-5 w-full rounded-full bg-lime-200 px-6 py-4 font-black text-emerald-950">Создать запись</button></Panel>}
function Card({a}){return <div className="mb-3 rounded-3xl bg-white/10 p-4"><b className="text-lime-100">{a.date} · {a.time}</b><div>{a.clientName} · {a.service}</div><div className="text-sm text-emerald-50/60">{a.therapistName} · {a.status}</div></div>}
function Panel({title,note,children}){return <div className="rounded-[2rem] border border-white/10 bg-[#07140e]/80 p-5 shadow-2xl"><div className="mb-5"><div className="text-xs font-black uppercase tracking-[.18em] text-lime-300/70">{note}</div><h1 className="text-4xl font-black tracking-[-.06em] text-lime-50">{title}</h1></div>{children}</div>}
function Sel({label,value,set,options}){return <label className="mb-3 block"><span className="mb-1 block text-xs font-black uppercase tracking-[.14em] text-lime-200/60">{label}</span><select value={value} onChange={e=>set(e.target.value)} className="w-full rounded-2xl bg-white px-4 py-4 font-bold text-emerald-950">{options.map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label>}
function Inp({label,value,set,type='text'}){return <label className="mb-3 block"><span className="mb-1 block text-xs font-black uppercase tracking-[.14em] text-lime-200/60">{label}</span><input type={type} value={value} onChange={e=>set(e.target.value)} className="w-full rounded-2xl bg-white px-4 py-4 font-bold text-emerald-950"/></label>}
