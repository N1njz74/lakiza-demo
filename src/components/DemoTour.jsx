import { useEffect, useMemo, useState } from 'react';
import Logo from './Logo.jsx';

const steps = [
  ['клиент','Старт записи','Клиент видит один понятный вход: выбрать дату и время, а не читать длинный лендинг.','hero','Открыть запись',{x:50,y:75,w:70,h:9}],
  ['клиент','Параметры сеанса','Сначала выбираются цель, длительность и специалист. Всё помещается в один чистый экран телефона.','service','Спина / шея',{x:31,y:34,w:42,h:10}],
  ['клиент','Календарь цен','На каждой дате видна минимальная цена дня. Это похоже на выбор билета, но для массажа.','calendar','16 мая · 1.3к',{x:50,y:53,w:13,h:11}],
  ['клиент','Подтверждение даты','После выбора даты появляется закреплённая кнопка. Только потом открывается выбор времени.','confirm','Подтвердить дату',{x:50,y:88,w:84,h:9}],
  ['клиент','Шкала времени','Время показано как карта дня: занято, дешевле, нормально, дороже. Сегмент нажимается напрямую.','timeline','15:00 · 1550₽',{x:39,y:48,w:22,h:9}],
  ['клиент','Финальная запись','Клиент видит итог: дата, время, мастер и цена. Запись сохраняется в расписание.','booking','Сохранить запись',{x:50,y:82,w:82,h:9}],
  ['массажист','Кристина видит заявку','Новая заявка появляется в кабинете массажиста: время, имя, телефон и услуга.','therapist','Новая запись',{x:50,y:43,w:82,h:12}],
  ['массажист','График работы','Массажист закрывает дни, меняет часы и отмечает желательные окна.','work','Суббота — выходной',{x:50,y:35,w:82,h:10}],
  ['массажист','Запись по телефону','Клиента можно добавить вручную и отправить ему инвайт в личный кабинет.','manual','Создать инвайт',{x:50,y:82,w:82,h:9}],
  ['админ','Контроль системы','Администратор видит загрузку, выручку, ручные записи и свободные окна.','admin','Сводка',{x:70,y:31,w:35,h:13}],
];

export default function DemoTour({ open, onClose }) {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tap, setTap] = useState(false);
  const s = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  useEffect(() => { if (open) { setStep(0); setPaused(false); setTap(false); } }, [open]);
  useEffect(() => {
    if (!open || paused) return;
    setTap(false);
    const a = setTimeout(() => setTap(true), 1150);
    const b = setTimeout(() => { setTap(false); setStep(v => v >= steps.length - 1 ? 0 : v + 1); }, 4400);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [open, paused, step]);

  const screen = useMemo(() => <DemoScreen type={s[3]} />, [s]);
  if (!open) return null;
  const next = () => { setTap(false); setStep(v => v >= steps.length - 1 ? 0 : v + 1); };
  const prev = () => { setTap(false); setStep(v => v <= 0 ? steps.length - 1 : v - 1); };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[#030a06] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(190,242,100,.2),transparent_30%),radial-gradient(circle_at_78%_70%,rgba(37,99,235,.22),transparent_34%),linear-gradient(135deg,#030a06_0%,#07140e_48%,#020503_100%)]" />
      <div className="relative z-10 flex h-full flex-col px-3 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3"><Logo small /><div className="min-w-0"><div className="truncate text-xs font-black uppercase tracking-[.24em] text-lime-100">Лакиза · демо</div><div className="truncate text-[11px] font-bold text-emerald-50/45">мобильный сценарий записи</div></div></div>
          <button type="button" onClick={onClose} className="rounded-full bg-white/10 px-4 py-2 text-sm font-black hover:bg-white/15">Закрыть</button>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-lime-200 transition-all duration-500" style={{width:`${progress}%`}} /></div>
        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3 lg:grid lg:grid-cols-[1fr_340px]">
          <div className="flex min-h-0 items-center justify-center"><PhoneFrame target={s[6]} tap={tap}>{screen}</PhoneFrame></div>
          <aside className="hidden rounded-[2rem] border border-white/10 bg-white/[.06] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl lg:flex lg:flex-col">
            <div className="flex items-center justify-between"><span className="rounded-full bg-lime-200 px-3 py-1 text-xs font-black uppercase tracking-[.18em] text-emerald-950">{s[0]}</span><span className="text-sm font-bold text-emerald-50/40">{step+1}/{steps.length}</span></div>
            <h2 className="mt-5 text-4xl font-black leading-none tracking-[-.06em] text-lime-50">{s[1]}</h2>
            <p className="mt-5 text-base leading-7 text-emerald-50/70">{s[2]}</p>
            <div className="mt-5 rounded-[1.4rem] border border-blue-300/20 bg-blue-600/15 p-4"><div className="text-xs font-black uppercase tracking-[.18em] text-blue-100/55">тап</div><div className="mt-2 font-black text-blue-50">{s[4]}</div></div>
            <Controls paused={paused} setPaused={setPaused} next={next} prev={prev} />
          </aside>
        </div>
        <div key={step} className="mt-3 rounded-[1.4rem] border border-white/10 bg-black/55 p-3 text-center shadow-2xl backdrop-blur lg:hidden" style={{animation:'demoSubtitle .35s ease-out both'}}>
          <div className="text-[11px] font-black uppercase tracking-[.18em] text-lime-200/80">{s[0]} · {step+1}/{steps.length}</div>
          <div className="mt-1 text-lg font-black leading-5 tracking-[-.04em]">{s[1]}</div>
          <p className="mt-2 text-sm font-semibold leading-5 text-emerald-50/70">{s[2]}</p>
          <div className="mt-3 grid grid-cols-3 gap-2"><button onClick={prev} className="rounded-2xl bg-white/10 py-2 text-sm font-black">Назад</button><button onClick={() => setPaused(!paused)} className="rounded-2xl bg-white/10 py-2 text-sm font-black">{paused?'Пуск':'Пауза'}</button><button onClick={next} className="rounded-2xl bg-lime-200 py-2 text-sm font-black text-emerald-950">Дальше</button></div>
        </div>
      </div>
    </div>
  );
}

function Controls({ paused, setPaused, next, prev }) {
  return <div className="mt-auto grid grid-cols-3 gap-2 pt-5"><button onClick={prev} className="rounded-2xl bg-white/10 px-3 py-3 text-sm font-black">Назад</button><button onClick={() => setPaused(!paused)} className="rounded-2xl bg-white/10 px-3 py-3 text-sm font-black">{paused?'Пуск':'Пауза'}</button><button onClick={next} className="rounded-2xl bg-lime-200 px-3 py-3 text-sm font-black text-emerald-950">Дальше</button></div>;
}

function PhoneFrame({ children, target, tap }) {
  return <div className="relative w-[min(390px,92vw)] max-w-[390px]"><div className="relative aspect-[9/17] overflow-hidden rounded-[2.45rem] border border-white/15 bg-[#050b08] p-2 shadow-2xl shadow-black/60"><div className="absolute left-1/2 top-2 z-30 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-[#050b08]" /><div className="relative h-full overflow-hidden rounded-[2rem] bg-[#f3f7ef] text-emerald-950">{children}<div className="pointer-events-none absolute rounded-[1.15rem] border-2 border-blue-500/90 bg-blue-500/10 transition-all duration-500" style={{left:`${target.x-target.w/2}%`,top:`${target.y-target.h/2}%`,width:`${target.w}%`,height:`${target.h}%`,boxShadow:'0 0 0 8px rgba(37,99,235,.08)'}} /><div className="pointer-events-none absolute z-40 transition-all duration-[1100ms] ease-[cubic-bezier(.2,.9,.2,1)]" style={{left:`${target.x}%`,top:`${target.y}%`}}><div className="relative h-16 w-16 -translate-x-4 -translate-y-4">{tap && <span className="absolute left-6 top-6 h-8 w-8 rounded-full border-4 border-blue-500" style={{animation:'demoClick .55s ease-out both'}} />}<span className={`absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl ring-4 ring-white transition-transform ${tap?'scale-90':'scale-100'}`}>●</span></div></div></div></div></div>;
}

function DemoScreen({ type }) {
  if (type === 'hero') return <Hero />;
  if (type === 'service') return <Service />;
  if (type === 'calendar') return <CalendarDemo />;
  if (type === 'confirm') return <Confirm />;
  if (type === 'timeline') return <Timeline />;
  if (type === 'booking') return <Booking />;
  if (type === 'therapist') return <Therapist />;
  if (type === 'work') return <Work />;
  if (type === 'manual') return <Manual />;
  return <Admin />;
}

function Top({label='Лакиза'}){return <div className="sticky top-0 z-10 flex items-center justify-between bg-[#07140e] px-4 pb-3 pt-7 text-lime-50 shadow-lg"><div><div className="text-[11px] font-black uppercase tracking-[.22em] text-lime-200">{label}</div><div className="text-[11px] font-bold text-emerald-50/50">массажный кабинет</div></div><div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-200 text-xl font-black text-emerald-950">☯</div></div>}
function Label({n,t,dark=false}){return <div className={`mb-2 text-[10px] font-black uppercase tracking-[.18em] ${dark?'text-lime-200/70':'text-slate-400'}`}>шаг {n} · {t}</div>}
function Hero(){return <div className="h-full bg-[#0b2015] text-white"><Top/><div className="px-5 py-6"><div className="rounded-[2rem] bg-lime-200 p-5 text-emerald-950"><div className="text-xs font-black uppercase opacity-60">сегодня</div><div className="mt-2 text-4xl font-black leading-none tracking-[-.06em]">массаж от 1300₽</div><p className="mt-3 text-sm font-bold leading-5 opacity-70">Выбери дату по минимальной цене и подходящее окно.</p></div><div className="mt-4 grid grid-cols-2 gap-3"><Stat l="свободно" v="11 окон"/><Stat l="мастер" v="Кристина"/></div><button className="mt-6 w-full rounded-full bg-blue-600 py-4 text-base font-black text-white shadow-xl">Открыть запись</button></div></div>}
function Service(){return <div className="h-full bg-[#eef5e9]"><Top/><div className="px-4 py-5"><Label n="1" t="параметры"/><h3 className="text-2xl font-black tracking-[-.05em]">Что проработать?</h3><div className="mt-4 grid grid-cols-2 gap-3"><Choice a t="Спина / шея" s="60 мин"/><Choice t="Стресс / сон" s="релакс"/><Choice t="После нагрузки" s="спорт"/><Choice t="Всё тело" s="90 мин"/></div><div className="mt-5 rounded-[1.5rem] bg-white p-4 shadow-sm"><div className="text-xs font-black uppercase text-slate-400">специалист</div><div className="mt-2 flex items-center justify-between"><b>Любой</b><span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-black">лучшее окно</span></div></div></div></div>}
function CalendarDemo(){const days=[[14,'1.9к'],[15,'1.7к'],[16,'1.3к'],[17,'2.1к'],[18,''],[19,'1.8к'],[20,'1.5к'],[21,'1.6к'],[22,''],[23,'1.9к'],[24,'1.4к'],[25,''],[26,'2.2к'],[27,'1.8к']];return <div className="h-full bg-[#f3f7ef]"><Top/><div className="px-4 py-5"><Label n="2" t="дата"/><h3 className="text-2xl font-black tracking-[-.05em]">Май</h3><div className="mt-4 rounded-[1.7rem] bg-white p-3 shadow-sm"><div className="mb-2 grid grid-cols-7 text-center text-[10px] font-black text-slate-400">{['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'].map(x=><span key={x}>{x}</span>)}</div><div className="grid grid-cols-7 gap-1">{days.map(([d,p])=><div key={d} className={`flex h-14 flex-col items-center justify-center rounded-2xl ${d===16?'bg-blue-600 text-white':p?'bg-slate-50':'bg-slate-50 text-slate-300'}`}><b>{d}</b><span className={`text-[10px] font-black ${p==='1.3к'?'text-emerald-500':d===16?'text-blue-100':'text-slate-400'}`}>{p}</span></div>)}</div></div><div className="mt-4 rounded-[1.4rem] bg-emerald-950/5 p-4 text-sm font-bold text-emerald-950/70">Под датой — минимальная цена дня.</div></div></div>}
function Confirm(){return <div className="relative h-full bg-[#f3f7ef]"><CalendarDemo/><div className="absolute bottom-4 left-4 right-4 rounded-full bg-blue-600 px-5 py-4 text-center text-sm font-black text-white shadow-2xl">Подтвердить дату · 16 мая · от 1300₽</div></div>}
function Timeline(){const items=[['10:00','занято','bg-slate-300 text-slate-500'],['13:30','1300₽','bg-lime-200 text-emerald-950'],['15:00','1550₽','bg-blue-600 text-white'],['16:00','1850₽','bg-white text-emerald-950'],['18:30','2200₽','bg-amber-200 text-amber-950']];return <div className="h-full bg-[#0b2015] text-white"><Top/><div className="px-4 py-5"><Label n="3" t="время" dark/><h3 className="text-2xl font-black text-lime-50">16 мая · окна</h3><div className="mt-4 rounded-[1.7rem] border border-white/10 bg-white/5 p-3"><div className="grid grid-cols-2 gap-2">{items.map(([t,p,c])=><div key={t} className={`rounded-2xl p-3 ${c}`}><b>{t}</b><div className="mt-1 text-xs font-black opacity-70">{p}</div></div>)}</div><div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-bold text-emerald-50/60"><Dot c="bg-slate-400" t="занято"/><Dot c="bg-lime-200" t="дешевле"/><Dot c="bg-white" t="нормально"/><Dot c="bg-amber-200" t="дороже"/></div></div><div className="mt-4 rounded-[1.5rem] bg-blue-600 p-4 text-white"><div className="flex justify-between"><b className="text-3xl">15:00</b><b className="text-3xl">1550₽</b></div><div className="mt-2 text-sm font-bold opacity-70">выбранное время</div></div></div></div>}
function Booking(){return <div className="h-full bg-[#f3f7ef]"><Top/><div className="px-4 py-5"><Label n="4" t="запись"/><h3 className="text-2xl font-black">Проверь запись</h3><Card><b>16 мая · 15:00</b><div className="mt-1 text-sm font-bold text-slate-500">Кристина · 60 минут</div><div className="mt-3 rounded-2xl bg-blue-50 p-3 text-2xl font-black text-blue-700">1550₽</div></Card><Field t="Анна"/><Field t="8 900 000-00-00"/><button className="mt-4 w-full rounded-full bg-blue-600 py-4 font-black text-white">Сохранить запись</button></div></div>}
function Therapist(){return <div className="h-full bg-[#0b2015] text-white"><Top label="Кристина"/><div className="px-4 py-5"><Label n="5" t="расписание" dark/><h3 className="text-2xl font-black text-lime-50">Сегодня</h3><Ap t="10:00" n="Ольга"/><Ap t="15:00" n="Анна · новая" a/><Ap t="18:00" n="Ирина"/></div></div>}
function Work(){return <div className="h-full bg-[#f3f7ef]"><Top label="Кристина"/><div className="px-4 py-5"><Label n="6" t="график"/><h3 className="text-2xl font-black">Настройка недели</h3><Row t="Суббота" v="Выходной" a/><Row t="Рабочее время" v="10:00–18:00"/><Row t="Желательное" v="14:00–16:00" a/></div></div>}
function Manual(){return <div className="h-full bg-[#f3f7ef]"><Top label="Кристина"/><div className="px-4 py-5"><Label n="7" t="телефон"/><h3 className="text-2xl font-black">Ручная запись</h3><Field t="Клиент по телефону"/><Field t="17:30 · 60 минут"/><Field t="Восстановительный массаж"/><button className="mt-4 w-full rounded-full bg-emerald-950 py-4 font-black text-lime-100">Создать инвайт</button></div></div>}
function Admin(){return <div className="h-full bg-[#0b2015] text-white"><Top label="Админ"/><div className="px-4 py-5"><Label n="8" t="контроль" dark/><h3 className="text-2xl font-black text-lime-50">Сводка</h3><div className="mt-4 grid grid-cols-2 gap-3"><AdminCard l="записи" v="7"/><AdminCard l="выручка" v="12 850₽" a/><AdminCard l="ручные" v="2"/><AdminCard l="окна" v="11"/></div></div></div>}
function Stat({l,v}){return <div className="rounded-2xl bg-white/10 p-3"><div className="text-[10px] font-black uppercase text-emerald-50/40">{l}</div><div className="mt-1 font-black text-lime-100">{v}</div></div>}
function Choice({t,s,a=false}){return <div className={`rounded-[1.35rem] p-3 ${a?'bg-blue-600 text-white shadow-lg':'bg-white text-emerald-950 shadow-sm'}`}><b className="text-sm">{t}</b><div className="mt-1 text-xs font-bold opacity-60">{s}</div></div>}
function Card({children}){return <div className="mt-4 rounded-[1.7rem] bg-white p-4 shadow-sm">{children}</div>}
function Field({t}){return <div className="mt-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-emerald-950 shadow-sm">{t}</div>}
function Dot({c,t}){return <div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${c}`}/>{t}</div>}
function Ap({t,n,a=false}){return <div className={`mt-3 rounded-[1.5rem] p-4 ${a?'bg-blue-600 text-white':'bg-white/10 text-lime-50'}`}><div className="text-2xl font-black">{t}</div><div className="mt-1 text-sm font-bold opacity-70">{n}</div></div>}
function Row({t,v,a=false}){return <div className={`mt-3 rounded-[1.5rem] p-4 ${a?'bg-lime-200 text-emerald-950':'bg-white text-emerald-950 shadow-sm'}`}><div className="text-xs font-black uppercase opacity-50">{t}</div><div className="mt-1 text-xl font-black">{v}</div></div>}
function AdminCard({l,v,a=false}){return <div className={`rounded-[1.5rem] p-4 ${a?'bg-lime-200 text-emerald-950':'bg-white/10 text-lime-50'}`}><div className="text-xs font-black uppercase opacity-50">{l}</div><div className="mt-1 text-2xl font-black">{v}</div></div>}
