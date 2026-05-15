import { useEffect, useMemo, useState } from 'react';
import Logo from './components/Logo.jsx';
import DemoTour from './components/DemoTour.jsx';
import { CONTACT, goals, initialAppointments, initialAvailability, START_DATE, therapists } from './data.js';
import { buildCalendar, buildMonthBlocks, dateLabel, dayNumber, fromTime, serviceName, shortPrice, toTime } from './utils.js';
import { getAvailability, makeSlots } from './pricing.js';

const programs = [
  { count: 1, title: 'Разово', note: 'один визит' },
  { count: 4, title: '4 сеанса', note: 'мягкий курс' },
  { count: 6, title: '6 сеансов', note: 'стабильная работа' },
  { count: 10, title: '10 сеансов', note: 'полный курс' },
];

function readStore(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}
function normalizeInitial() {
  return initialAppointments.map((a) => ({
    ...a,
    therapistName: therapists.find((t) => t.id === a.therapistId)?.name || 'Мастер',
    serviceTitle: serviceName(a.serviceId),
    price: a.price || 2000,
    status: a.status || 'confirmed',
  }));
}
function planToBusy(item) {
  return { id: `draft-${item.sessionNo}-${item.date}-${item.start}`, date: item.date, therapistId: item.therapistId, start: item.start, duration: item.duration, status: 'confirmed' };
}
function slotToPlan(slot, index) {
  return {
    sessionNo: index + 1,
    date: slot.date,
    start: slot.start,
    end: slot.end,
    duration: slot.duration,
    price: slot.finalPrice,
    therapistId: slot.therapist.id,
    therapistName: slot.therapist.name,
    serviceId: slot.service.id,
    serviceTitle: slot.service.title,
    label: slot.reason.label,
    slotId: slot.id,
  };
}

export default function InteractiveApp() {
  const [view, setView] = useState('home');
  const [role, setRole] = useState('client');
  const [demo, setDemo] = useState(false);
  const [appointments, setAppointments] = useState(() => readStore('lakizaAppointmentsV2', normalizeInitial()));
  const [clientBookings, setClientBookings] = useState(() => readStore('lakizaClientBookingsV2', []));
  const [availability, setAvailability] = useState(initialAvailability);

  useEffect(() => { try { localStorage.setItem('lakizaAppointmentsV2', JSON.stringify(appointments)); } catch {} }, [appointments]);
  useEffect(() => { try { localStorage.setItem('lakizaClientBookingsV2', JSON.stringify(clientBookings)); } catch {} }, [clientBookings]);

  return (
    <main className="min-h-screen bg-[#06110b] text-white selection:bg-lime-200 selection:text-emerald-950">
      <TopBar view={view} setView={setView} role={role} setRole={setRole} setDemo={setDemo} />
      <section className="relative min-h-screen overflow-hidden px-4 pt-32 md:px-8 md:pt-36">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(163,230,53,.24),transparent_34%),linear-gradient(180deg,#06110b_0%,#0a1d13_52%,#06110b_100%)]" />
        <div className="relative mx-auto max-w-7xl animate-screenChange">
          {view === 'home' && <Home setView={setView} />}
          {view === 'book' && <BookingWorkspace appointments={appointments} availability={availability} setAppointments={setAppointments} clientBookings={clientBookings} setClientBookings={setClientBookings} />}
          {view === 'schedule' && (role === 'admin' ? <AdminDashboard appointments={appointments} /> : <TherapistWorkspace appointments={appointments} setAppointments={setAppointments} availability={availability} setAvailability={setAvailability} />)}
        </div>
      </section>
      <Footer />
      <DemoTour open={demo} onClose={() => setDemo(false)} />
    </main>
  );
}

function TopBar({ view, setView, role, setRole, setDemo }) {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-4 md:px-8">
      <div className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-[#07140e]/85 px-4 py-3 shadow-2xl shadow-black/20 backdrop-blur-xl md:px-6">
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => setView('home')} className="flex items-center gap-3 text-left"><Logo small /><div><div className="text-sm font-semibold tracking-[.22em] text-lime-100">ЛАКИЗА</div><div className="text-xs text-emerald-100/60">массажный кабинет</div></div></button>
          <nav className="hidden gap-1 lg:flex">
            {[['home','Главная'],['book','Запись'],['schedule',role === 'admin' ? 'Админ' : 'Расписание']].map(([id,label]) => <button key={id} onClick={() => setView(id)} className={`rounded-full px-4 py-2 text-sm font-bold ${view === id ? 'bg-lime-200 text-emerald-950' : 'text-emerald-50/75 hover:bg-white/10'}`}>{label}</button>)}
          </nav>
          <div className="flex items-center gap-2"><select value={role} onChange={(e) => setRole(e.target.value)} className="max-w-[130px] rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-lime-50 outline-none md:max-w-none md:text-sm"><option className="bg-emerald-950" value="client">Клиент</option><option className="bg-emerald-950" value="therapist">Массажист</option><option className="bg-emerald-950" value="admin">Администратор</option></select><button onClick={() => setDemo(true)} className="rounded-full bg-blue-600 px-3 py-2 text-xs font-bold text-white md:px-4 md:text-sm">Демо</button></div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 lg:hidden">{[['home','Главная'],['book','Запись'],['schedule','Кабинет']].map(([id,label]) => <button key={id} onClick={() => setView(id)} className={`rounded-2xl py-2 text-xs font-black ${view === id ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-white'}`}>{label}</button>)}</div>
      </div>
    </header>
  );
}

function Home({ setView }) {
  return (
    <section className="grid min-h-[calc(100vh-8rem)] items-center gap-8 pb-16 pt-8 lg:grid-cols-[1.05fr_.95fr]">
      <div><div className="mb-5 inline-flex rounded-full border border-lime-200/20 bg-lime-200/10 px-4 py-2 text-sm font-black text-lime-100">новая интерактивная запись</div><h1 className="text-5xl font-black leading-[.92] tracking-[-.07em] text-lime-50 md:text-7xl">Лакиза<span className="block text-lime-200">курс без прыжков по странице</span></h1><p className="mt-6 max-w-2xl text-lg leading-8 text-emerald-50/70">Запись сделана как рабочий пульт: параметры, календарь, окна, план курса и финальное сохранение находятся в одном интерфейсе.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><button onClick={() => setView('book')} className="rounded-full bg-lime-200 px-6 py-4 font-black text-emerald-950 shadow-xl">Открыть запись</button><button onClick={() => setView('schedule')} className="rounded-full border border-white/10 bg-white/10 px-6 py-4 font-black text-lime-50">Посмотреть расписание</button></div></div>
      <div className="rounded-[2.5rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl"><div className="rounded-[2rem] bg-[#0b2015] p-6"><div className="flex items-start justify-between gap-4"><Logo /><div className="rounded-3xl bg-lime-100 px-4 py-3 text-right text-emerald-950"><div className="text-xs font-black uppercase">курс</div><div className="text-2xl font-black">1–10 сеансов</div></div></div><div className="mt-8 grid gap-3">{['без автопрокрутки', 'календарь и время рядом', 'комплекс по сеансам', 'видно у мастера и админа'].map((x) => <div key={x} className="rounded-2xl bg-white/5 p-4 text-emerald-50/75">✓ {x}</div>)}</div></div></div>
    </section>
  );
}

function BookingWorkspace({ appointments, availability, setAppointments, clientBookings, setClientBookings }) {
  const [programCount, setProgramCount] = useState(4);
  const [goalId, setGoalId] = useState('back');
  const [duration, setDuration] = useState(60);
  const [therapistId, setTherapistId] = useState('any');
  const [stage, setStage] = useState('plan');
  const [plan, setPlan] = useState(() => Array.from({ length: 4 }, () => null));
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [slotId, setSlotId] = useState('');
  const [client, setClient] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const calendar = useMemo(() => buildCalendar(70), []);
  const goal = goals.find((g) => g.id === goalId) || goals[0];
  const planBusy = useMemo(() => plan.filter(Boolean).map(planToBusy), [plan]);
  const busy = useMemo(() => [...appointments, ...planBusy], [appointments, planBusy]);
  const dayInfo = useMemo(() => calendar.map((date) => { const list = makeSlots({ date, serviceId: goal.serviceId, duration, therapistId, appointments: busy, availability }); return { date, slots: list.length, min: list.length ? Math.min(...list.map((s) => s.finalPrice)) : null }; }), [calendar, goal.serviceId, duration, therapistId, busy, availability]);
  const slots = selectedDate ? makeSlots({ date: selectedDate, serviceId: goal.serviceId, duration, therapistId, appointments: busy, availability }) : [];
  const selectedSlot = slots.find((s) => s.id === slotId);
  const completed = plan.filter(Boolean).length;
  const total = plan.reduce((sum, item) => sum + (item?.price || 0), 0);
  const ready = completed === programCount;

  const reset = (count = programCount) => { setPlan(Array.from({ length: count }, () => null)); setActiveIndex(0); setSelectedDate(''); setSlotId(''); setStage('plan'); };
  const setCount = (count) => { setProgramCount(count); reset(count); };
  const param = (fn) => { fn(); reset(programCount); };
  const fix = () => {
    if (!selectedSlot) return;
    const next = [...plan]; next[activeIndex] = slotToPlan(selectedSlot, activeIndex); setPlan(next); setSelectedDate(''); setSlotId('');
    const empty = next.findIndex((x) => !x); if (empty === -1) setStage('details'); else setActiveIndex(empty);
  };
  const edit = (i) => { const next = [...plan]; next[i] = null; setPlan(next); setActiveIndex(i); setSelectedDate(''); setSlotId(''); setStage('plan'); };
  const auto = () => {
    const result = Array.from({ length: programCount }, () => null); let temp = [...appointments];
    for (let i = 0; i < programCount; i += 1) {
      let best = null; for (const date of calendar.slice(i * 5, i * 5 + 12)) { for (const slot of makeSlots({ date, serviceId: goal.serviceId, duration, therapistId, appointments: temp, availability })) if (!best || slot.finalPrice < best.finalPrice) best = slot; }
      if (best) { const item = slotToPlan(best, i); result[i] = item; temp.push(planToBusy(item)); }
    }
    setPlan(result); setSelectedDate(''); setSlotId(''); const empty = result.findIndex((x) => !x); setActiveIndex(empty === -1 ? 0 : empty); setStage(empty === -1 ? 'details' : 'plan');
  };
  const save = () => {
    if (!ready) return;
    const groupId = `course-${Date.now()}`;
    const created = plan.filter(Boolean).map((item) => ({ ...item, id: `${groupId}-${item.sessionNo}`, groupId, sessionTotal: programCount, clientName: client.trim() || 'Клиент с сайта', phone: phone.trim() || 'контакт не указан', source: 'site', status: 'confirmed', inviteSent: true, comment: comment.trim(), createdAt: new Date().toISOString() }));
    setAppointments((p) => [...p, ...created]); setClientBookings((p) => [...created, ...p]); setStage('done');
  };

  return (
    <section className="min-h-[calc(100vh-8rem)] pb-12 pt-8">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><div className="mb-3 inline-flex rounded-full border border-lime-200/20 bg-lime-200/10 px-4 py-2 text-sm font-black text-lime-100">рабочий пульт</div><h1 className="text-4xl font-black tracking-[-.06em] text-lime-50 md:text-6xl">Запись без прыжков</h1><p className="mt-3 max-w-3xl leading-7 text-emerald-50/65">Выбираешь дату — окна появляются рядом. Выбираешь время — закрепляешь сеанс. Следующий сеанс открывается автоматически.</p></div><button onClick={auto} className="rounded-full bg-blue-600 px-5 py-4 font-black text-white shadow-xl">Автособрать курс</button></div>
      <div className="grid gap-4 xl:grid-cols-[340px_1fr_340px]">
        <aside className="rounded-[2rem] border border-lime-200/15 bg-lime-200/10 p-4"><PanelTitle title="Параметры" note="курс пересчитается" /><ProgramPicker value={programCount} onPick={setCount} /><GoalPick value={goalId} onPick={(id) => param(() => setGoalId(id))} /><Duration value={duration} onPick={(v) => param(() => setDuration(v))} /><MasterPick value={therapistId} onPick={(id) => param(() => setTherapistId(id))} /></aside>
        <main className="min-h-[620px] rounded-[2rem] border border-white/10 bg-[#07140e]/75 p-4 shadow-2xl shadow-black/25 backdrop-blur-xl">{stage === 'plan' && <PlanStage dayInfo={dayInfo} plan={plan} activeIndex={activeIndex} selectedDate={selectedDate} setSelectedDate={(d) => { setSelectedDate(d); setSlotId(''); }} slots={slots} selectedSlot={selectedSlot} setSlotId={setSlotId} fix={fix} />}{stage === 'details' && <DetailsStage plan={plan.filter(Boolean)} total={total} client={client} setClient={setClient} phone={phone} setPhone={setPhone} comment={comment} setComment={setComment} save={save} back={() => setStage('plan')} />}{stage === 'done' && <Done total={total} count={programCount} onNew={() => reset(programCount)} />}</main>
        <aside className="rounded-[2rem] border border-white/10 bg-white/10 p-4"><PlanPanel plan={plan} activeIndex={activeIndex} completed={completed} total={total} edit={edit} stage={stage} ready={ready} details={() => setStage('details')} /><ClientMini bookings={clientBookings} /></aside>
      </div>
    </section>
  );
}

function PanelTitle({ title, note }) { return <div className="mb-4"><div className="text-xs font-black uppercase tracking-[.2em] text-lime-300/70">{note}</div><h2 className="mt-1 text-2xl font-black text-lime-50">{title}</h2></div>; }
function ProgramPicker({ value, onPick }) { return <Block title="Формат">{programs.map((p) => <button key={p.count} onClick={() => onPick(p.count)} className={`rounded-2xl p-3 text-left font-black ${value === p.count ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-white'}`}><div>{p.title}</div><div className="text-xs opacity-60">{p.note}</div></button>)}</Block>; }
function GoalPick({ value, onPick }) { return <Block title="Цель">{goals.map((g) => <button key={g.id} onClick={() => onPick(g.id)} className={`rounded-2xl p-3 text-left text-sm font-black ${value === g.id ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-white'}`}>{g.label}</button>)}</Block>; }
function Duration({ value, onPick }) { return <div className="mb-4"><b className="text-sm text-lime-100">Длительность</b><div className="mt-2 grid grid-cols-3 gap-2">{[45,60,90].map((d) => <button key={d} onClick={() => onPick(d)} className={`rounded-2xl p-3 font-black ${value === d ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-white'}`}>{d}</button>)}</div></div>; }
function MasterPick({ value, onPick }) { return <div><b className="text-sm text-lime-100">Специалист</b><div className="mt-2 grid gap-2">{therapists.map((t) => <button key={t.id} onClick={() => onPick(t.id)} className={`rounded-2xl p-3 text-left font-black ${value === t.id ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-white'}`}>{t.name}<div className="text-xs opacity-60">{t.level}</div></button>)}</div></div>; }
function Block({ title, children }) { return <div className="mb-4"><b className="text-sm text-lime-100">{title}</b><div className="mt-2 grid grid-cols-2 gap-2">{children}</div></div>; }

function PlanStage({ dayInfo, plan, activeIndex, selectedDate, setSelectedDate, slots, selectedSlot, setSlotId, fix }) {
  return <div className="grid h-full gap-4 lg:grid-cols-[1fr_1fr]"><div className="overflow-hidden rounded-[1.7rem] bg-white p-3 text-slate-950"><CalendarCompact dayInfo={dayInfo} selectedDate={selectedDate} onPick={setSelectedDate} plan={plan} /></div><div className="flex min-h-0 flex-col"><div className="rounded-[1.7rem] border border-white/10 bg-white/5 p-4"><div className="text-xs font-black uppercase tracking-[.2em] text-lime-300/70">сеанс {activeIndex + 1}</div><h2 className="mt-1 text-3xl font-black tracking-[-.05em] text-lime-50">{selectedDate ? dateLabel(selectedDate) : 'Выбери дату'}</h2><p className="mt-2 text-sm leading-6 text-emerald-50/55">{selectedDate ? 'Окна уже здесь. Выбери время и закрепи сеанс.' : 'Без прокрутки: календарь слева, окна справа.'}</p></div><div className="mt-4 min-h-0 flex-1 overflow-auto rounded-[1.7rem] border border-white/10 bg-white/[.04] p-3">{selectedDate ? <SlotBoard slots={slots} selectedSlot={selectedSlot} onPick={setSlotId} /> : <EmptyHint />}</div><div className="mt-4 rounded-[1.7rem] border border-white/10 bg-white/5 p-3"><button disabled={!selectedSlot} onClick={fix} className={`w-full rounded-full px-5 py-4 font-black ${selectedSlot ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-emerald-50/35'}`}>{selectedSlot ? `Закрепить · ${toTime(selectedSlot.start)} · ${selectedSlot.finalPrice}₽` : 'Выбери время'}</button></div></div></div>;
}
function CalendarCompact({ dayInfo, selectedDate, onPick, plan }) { const month = buildMonthBlocks(dayInfo)[0]; return <div className="h-full overflow-auto"><div className="sticky top-0 z-10 bg-white pb-3"><div className="text-xs font-black uppercase tracking-[.18em] text-slate-400">календарь</div><h3 className="mt-1 text-3xl font-black capitalize tracking-[-.05em]">{month.title}</h3></div><div className="mb-2 grid grid-cols-7 text-center text-[11px] font-black text-slate-400">{['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'].map((w) => <div key={w}>{w}</div>)}</div><div className="grid grid-cols-7 gap-1">{month.cells.map((cell, i) => { if (!cell) return <div key={i} className="h-[70px]" />; const selected = selectedDate === cell.date; const planned = plan.map((p, idx) => p?.date === cell.date ? idx + 1 : null).filter(Boolean); return <button key={cell.date} disabled={!cell.slots} onClick={() => onPick(cell.date)} className={`relative flex h-[70px] flex-col items-center justify-center rounded-2xl ${selected ? 'bg-blue-600 text-white ring-4 ring-blue-200/30' : !cell.slots ? 'bg-slate-50 text-slate-300' : 'bg-slate-50 text-slate-950'}`}><b className="text-xl">{dayNumber(cell.date)}</b><span className={`text-[11px] font-black ${selected ? 'text-blue-100' : cell.min && cell.min <= 1500 ? 'text-emerald-600' : 'text-slate-400'}`}>{cell.min ? shortPrice(cell.min) : ''}</span>{planned.length > 0 && <span className="absolute right-1 top-1 rounded-full bg-emerald-950 px-1.5 py-0.5 text-[9px] font-black text-lime-100">{planned.join(',')}</span>}</button>; })}</div></div>; }
function SlotBoard({ slots, selectedSlot, onPick }) { if (!slots.length) return <div className="rounded-2xl bg-white/5 p-5 text-emerald-50/55">Нет свободных окон.</div>; const min = Math.min(...slots.map((s)=>s.finalPrice)); const max = Math.max(...slots.map((s)=>s.finalPrice)); return <div><div className="mb-3 grid grid-cols-2 gap-2 text-[11px] font-bold text-emerald-50/65 sm:grid-cols-4"><Legend c="bg-slate-600" t="занято"/><Legend c="bg-lime-200" t="дешевле"/><Legend c="bg-white/30" t="нормально"/><Legend c="bg-amber-300/50" t="дороже"/></div><div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-2">{slots.map((slot) => <SlotChip key={slot.id} slot={slot} selected={selectedSlot?.id === slot.id} min={min} max={max} onPick={() => onPick(slot.id)} />)}</div></div>; }
function SlotChip({ slot, selected, min, max, onPick }) { const cheap = slot.finalPrice <= min + 50 || slot.reason.tone === 'best'; const expensive = slot.finalPrice >= max - 50 || slot.reason.tone === 'premium'; const cls = selected ? 'bg-blue-600 text-white ring-4 ring-blue-200/20' : cheap ? 'bg-lime-200 text-emerald-950' : expensive ? 'bg-amber-300/20 text-amber-50' : 'bg-white/10 text-lime-50'; return <button onClick={onPick} className={`rounded-2xl p-3 text-left ${cls}`}><div className="flex justify-between gap-2"><b className="text-xl">{toTime(slot.start)}</b><b>{slot.finalPrice}₽</b></div><div className="mt-1 text-xs font-bold opacity-70">{slot.therapist.name}</div><div className="mt-2 text-[11px] font-black uppercase opacity-65">{slot.reason.label}</div></button>; }
function Legend({ c, t }) { return <div className="flex items-center gap-2"><span className={`h-3 w-3 rounded-full ${c}`} />{t}</div>; }
function EmptyHint(){ return <div className="flex h-full min-h-72 items-center justify-center rounded-[1.5rem] border border-dashed border-white/15 p-6 text-center text-emerald-50/45"><div><div className="text-4xl">↙</div><div className="mt-3 font-bold">Выбери дату. Окна появятся здесь.</div></div></div>; }

function PlanPanel({ plan, activeIndex, completed, total, edit, stage, ready, details }) { return <div><PanelTitle title="План курса" note={`${completed}/${plan.length} готово`} /><div className="rounded-[1.5rem] bg-white/5 p-3"><div className="mb-3 flex items-center justify-between"><span className="text-sm font-bold text-emerald-50/55">Итого</span><b className="text-2xl text-lime-200">{total}₽</b></div><div className="grid gap-2">{plan.map((item, i) => <button key={i} onClick={() => edit(i)} className={`rounded-2xl p-3 text-left ${activeIndex === i && !item && stage === 'plan' ? 'bg-blue-600 text-white' : item ? 'bg-lime-200 text-emerald-950' : 'bg-white/5 text-emerald-50/45'}`}><div className="text-xs font-black uppercase opacity-60">сеанс {i + 1}</div>{item ? <div className="mt-1 font-black">{dateLabel(item.date)} · {toTime(item.start)}<div className="text-xs opacity-70">{item.therapistName} · {item.price}₽</div></div> : <div className="mt-1 font-bold">не выбран</div>}</button>)}</div></div>{ready && stage === 'plan' && <button onClick={details} className="mt-3 w-full rounded-full bg-lime-200 px-5 py-4 font-black text-emerald-950">Перейти к данным клиента</button>}</div>; }
function DetailsStage({ plan, total, client, setClient, phone, setPhone, comment, setComment, save, back }) { return <div className="grid h-full gap-4 lg:grid-cols-[1fr_1fr]"><div className="rounded-[1.7rem] border border-white/10 bg-white/5 p-5"><div className="text-xs font-black uppercase tracking-[.2em] text-lime-300/70">финал</div><h2 className="mt-2 text-4xl font-black tracking-[-.06em] text-lime-50">Данные клиента</h2><div className="mt-5 grid gap-3"><input value={client} onChange={(e)=>setClient(e.target.value)} placeholder="Имя" className="rounded-2xl bg-white px-4 py-4 text-emerald-950 outline-none"/><input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="Телефон" className="rounded-2xl bg-white px-4 py-4 text-emerald-950 outline-none"/><textarea value={comment} onChange={(e)=>setComment(e.target.value)} placeholder="Комментарий" className="min-h-28 rounded-2xl bg-white px-4 py-4 text-emerald-950 outline-none"/></div><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={back} className="rounded-full bg-white/10 px-4 py-4 font-black text-white">Назад</button><button onClick={save} className="rounded-full bg-lime-200 px-4 py-4 font-black text-emerald-950">Сохранить</button></div></div><div className="rounded-[1.7rem] bg-white p-5 text-emerald-950"><div className="text-sm font-black uppercase tracking-[.2em] text-slate-400">итог</div><div className="mt-2 text-4xl font-black tracking-[-.06em]">{total}₽</div><div className="mt-5 grid gap-2">{plan.map((item)=><div key={item.sessionNo} className="rounded-2xl bg-slate-50 p-3"><b>{item.sessionNo}. {dateLabel(item.date)} · {toTime(item.start)}</b><div className="text-sm font-bold text-slate-500">{item.therapistName} · {item.price}₽</div></div>)}</div></div></div>; }
function Done({ total, count, onNew }) { return <div className="flex h-full items-center justify-center"><div className="max-w-2xl rounded-[2rem] bg-lime-200 p-8 text-center text-emerald-950 shadow-2xl"><div className="text-5xl">✓</div><h2 className="mt-3 text-4xl font-black tracking-[-.06em]">Запись создана</h2><p className="mt-3 font-bold opacity-70">Сохранено {count} сеанс(ов) на сумму {total}₽. Они уже видны в расписании.</p><button onClick={onNew} className="mt-6 rounded-full bg-emerald-950 px-6 py-4 font-black text-lime-100">Новая запись</button></div></div>; }
function ClientMini({ bookings }) { if (!bookings.length) return null; return <div className="mt-4 border-t border-white/10 pt-4"><div className="text-xs font-black uppercase tracking-[.2em] text-lime-300/70">личный кабинет</div><h3 className="mt-1 text-xl font-black text-lime-50">Мои записи</h3><div className="mt-3 grid max-h-56 gap-2 overflow-auto pr-1">{bookings.map((b) => <div key={b.id} className="rounded-2xl bg-white/5 p-3 text-sm text-emerald-50/70"><b className="text-lime-100">{dateLabel(b.date)} · {toTime(b.start)}</b><div>{b.serviceTitle || serviceName(b.serviceId)}</div></div>)}</div></div>; }

function AppointmentRow({ a, admin=false }) { return <div className="rounded-2xl bg-white/10 p-4 text-lime-50"><div className="flex items-start justify-between gap-3"><div><b className="text-2xl">{dateLabel(a.date)} · {toTime(a.start)}</b><div className="mt-1 text-emerald-50/75">{a.clientName} · {a.serviceTitle || serviceName(a.serviceId)}</div><div className="text-sm text-emerald-50/45">{a.therapistName || therapists.find((t)=>t.id===a.therapistId)?.name} · {a.phone}</div>{a.groupId && <div className="mt-2 w-fit rounded-full bg-lime-200 px-3 py-1 text-xs font-black text-emerald-950">курс {a.sessionNo}/{a.sessionTotal}</div>}</div><div className="text-right"><div className="font-black text-lime-200">{a.price ? `${a.price}₽` : ''}</div>{admin && <div className="mt-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white">{a.source === 'phone' ? 'телефон' : 'сайт'}</div>}</div></div></div>; }
function TherapistWorkspace({ appointments, setAppointments, availability, setAvailability }) { const [therapistId,setTherapistId]=useState('kristina'); const [date,setDate]=useState(START_DATE); const [name,setName]=useState(''); const [phone,setPhone]=useState(''); const [start,setStart]=useState('14:00'); const current=getAvailability(therapistId,date,availability); const day=appointments.filter((a)=>a.date===date&&a.therapistId===therapistId).sort((a,b)=>a.start-b.start); const all=appointments.filter((a)=>a.therapistId===therapistId).sort((a,b)=>`${a.date}-${a.start}`.localeCompare(`${b.date}-${b.start}`)); const patch=(data)=>setAvailability((p)=>({...p,[therapistId]:{...(p[therapistId]||{}),[date]:{...(p[therapistId]?.[date]||{}),...data}}})); const manual=()=>{setAppointments((p)=>[...p,{id:`manual-${Date.now()}`,date,therapistId,therapistName:therapists.find((t)=>t.id===therapistId)?.name,clientName:name||'Клиент по телефону',phone:phone||'контакт не указан',serviceId:'restore',serviceTitle:'Восстановительный массаж',start:fromTime(start),duration:60,source:'phone',status:'confirmed',price:2000}]); setName(''); setPhone('');}; return <section className="grid min-h-[calc(100vh-8rem)] gap-6 pb-20 pt-8 xl:grid-cols-[.82fr_1.18fr]"><div className="rounded-[2rem] border border-white/10 bg-white/10 p-5"><h1 className="text-4xl font-black text-lime-50">Кабинет массажиста</h1><div className="mt-5 grid gap-3"><select value={therapistId} onChange={(e)=>setTherapistId(e.target.value)} className="rounded-2xl bg-lime-50 p-3 text-emerald-950">{therapists.filter((t)=>t.id!=='any').map((t)=><option key={t.id} value={t.id}>{t.name}</option>)}</select><input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="rounded-2xl bg-lime-50 p-3 text-emerald-950"/><button onClick={()=>patch({off:!current.off})} className={`rounded-full p-3 font-black ${current.off?'bg-red-200 text-red-950':'bg-lime-200 text-emerald-950'}`}>{current.off?'Выходной':'Работает'}</button></div><div className="mt-5 rounded-[2rem] bg-lime-50 p-5 text-emerald-950"><h2 className="text-2xl font-black">Добавить по телефону</h2><div className="mt-4 grid gap-3"><input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Имя" className="rounded-2xl bg-white p-3"/><input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="Телефон" className="rounded-2xl bg-white p-3"/><input type="time" value={start} onChange={(e)=>setStart(e.target.value)} className="rounded-2xl bg-white p-3"/><button onClick={manual} className="rounded-full bg-emerald-950 p-4 font-black text-lime-100">Добавить клиента</button></div></div></div><div className="grid gap-5"><div className="rounded-[2rem] border border-white/10 bg-white/10 p-5"><h2 className="text-2xl font-black text-lime-50">{dateLabel(date)} · записи</h2><div className="mt-4 grid gap-3">{day.length?day.map((a)=><AppointmentRow key={a.id} a={a}/>):<div className="rounded-2xl bg-white/5 p-5 text-emerald-50/60">Записей нет</div>}</div></div><div className="rounded-[2rem] border border-white/10 bg-white/10 p-5"><h2 className="text-2xl font-black text-lime-50">Все записи мастера</h2><div className="mt-4 grid gap-3">{all.map((a)=><AppointmentRow key={a.id} a={a}/>)}</div></div></div></section>; }
function AdminDashboard({ appointments }) { const sorted=[...appointments].sort((a,b)=>`${a.date}-${a.start}`.localeCompare(`${b.date}-${b.start}`)); const total=appointments.reduce((s,a)=>s+(a.price||0),0); const courses=new Set(appointments.filter((a)=>a.groupId).map((a)=>a.groupId)).size; return <section className="min-h-[calc(100vh-8rem)] pb-20 pt-8"><h1 className="text-4xl font-black tracking-[-.05em] text-lime-50 md:text-6xl">Кабинет администратора</h1><p className="mt-4 max-w-3xl leading-7 text-emerald-50/65">Общее расписание салона: одиночные записи, комплексы и ручные записи.</p><div className="mt-6 grid gap-3 md:grid-cols-4"><Stat label="визитов" value={appointments.length}/><Stat label="комплексов" value={courses}/><Stat label="с сайта" value={appointments.filter((a)=>a.source==='site').length}/><Stat label="выручка" value={`${total}₽`}/></div><div className="mt-6 rounded-[2rem] border border-white/10 bg-white/10 p-5"><h2 className="text-2xl font-black text-lime-50">Общее расписание</h2><div className="mt-4 grid gap-3">{sorted.map((a)=><AppointmentRow key={a.id} a={a} admin />)}</div></div></section>; }
function Stat({label,value}){return <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5"><div className="text-xs font-black uppercase tracking-[.18em] text-emerald-50/40">{label}</div><div className="mt-2 text-3xl font-black text-lime-100">{value}</div></div>}
function Footer(){return <footer className="bg-[#07140e] px-4 py-14 text-white md:px-8"><div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-8"><b className="tracking-[.2em] text-lime-100">ЛАКИЗА</b><div className="mt-3 text-emerald-50/60">{CONTACT.address}</div><a href={`tel:${CONTACT.phoneLink}`} className="mt-1 inline-block whitespace-nowrap text-xl font-black text-lime-100">{CONTACT.phoneDisplay}</a></div></footer>}
