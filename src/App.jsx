import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import Logo from './components/Logo.jsx';
import DemoTour from './components/DemoTour.jsx';
import { CONTACT, goals, initialAppointments, initialAvailability, START_DATE, therapists } from './data.js';
import { buildCalendar, buildMonthBlocks, dateLabel, dayNumber, fromTime, serviceName, shortPrice, toTime } from './utils.js';
import { getAvailability, makeSlots } from './pricing.js';

const PROGRAMS = [
  { count: 1, title: 'Разовый сеанс', note: 'одна запись' },
  { count: 4, title: 'Комплекс 4 сеанса', note: 'мягкий курс' },
  { count: 6, title: 'Комплекс 6 сеансов', note: 'стабильная работа' },
  { count: 10, title: 'Комплекс 10 сеансов', note: 'полный курс' },
];

function normalizeInitialAppointments() {
  return initialAppointments.map((item) => ({
    ...item,
    therapistName: therapists.find((t) => t.id === item.therapistId)?.name || 'Мастер',
    serviceTitle: serviceName(item.serviceId),
    status: item.status || 'confirmed',
    price: item.price || 2000,
  }));
}

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function Home({ setView }) {
  return (
    <section className="grid min-h-[calc(100vh-8rem)] items-center gap-8 pb-16 pt-8 lg:grid-cols-[1.05fr_.95fr]">
      <div className="animate-fadeSlide">
        <div className="mb-5 inline-flex rounded-full border border-lime-200/20 bg-lime-200/10 px-4 py-2 text-sm font-bold text-lime-100">Умная запись на массаж</div>
        <h1 className="text-5xl font-black leading-[.92] tracking-[-.07em] text-lime-50 md:text-7xl">Лакиза<span className="block text-lime-200">курс сеансов в календаре</span></h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-emerald-50/70">Теперь запись строится не только на один визит. Клиент может собрать комплекс: каждый сеанс получает свою дату, время, цену и место в расписании.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button onClick={() => setView('schedule')} className="rounded-full bg-lime-200 px-6 py-4 font-black text-emerald-950 shadow-xl shadow-lime-500/20">Собрать запись</button>
          <button onClick={() => setView('therapist')} className="rounded-full border border-white/10 bg-white/10 px-6 py-4 font-black text-lime-50">Посмотреть расписание</button>
        </div>
      </div>
      <div className="rounded-[2.5rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
        <div className="rounded-[2rem] bg-[#0b2015] p-6">
          <div className="flex items-start justify-between gap-4"><Logo /><div className="rounded-3xl bg-lime-100 px-4 py-3 text-right text-emerald-950"><div className="text-xs font-black uppercase">курс</div><div className="text-2xl font-black">до 10 сеансов</div></div></div>
          <div className="mt-8 grid gap-3">{['комплекс или разовый сеанс','расписание каждого визита','шкала времени по цветам','запись видна мастеру и админу'].map((x) => <div key={x} className="rounded-2xl bg-white/5 p-4 text-emerald-50/75">✓ {x}</div>)}</div>
        </div>
      </div>
    </section>
  );
}

function Calendar({ dayInfo, selectedDate, onPick, plan = [], activeIndex = 0 }) {
  const months = buildMonthBlocks(dayInfo);
  return (
    <div className="rounded-[2rem] bg-[#f4f6f8] p-3 text-slate-950 md:p-5">
      <div className="mb-4 rounded-[1.5rem] bg-white p-4 shadow-sm">
        <div className="text-xs font-black uppercase tracking-[.18em] text-slate-400">календарь курса</div>
        <div className="mt-1 text-2xl font-black tracking-[-.04em]">Сеанс {activeIndex + 1}: выбери дату</div>
        <p className="mt-2 text-sm leading-6 text-slate-500">На дате — минимальная цена дня. После выбора снизу появится кнопка «Продолжить».</p>
      </div>
      {months.map((month) => (
        <div key={month.key} className="mb-4 rounded-[1.75rem] bg-white p-4 shadow-sm">
          <div className="mb-4 text-2xl font-black capitalize">{month.title}</div>
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-black text-slate-400">{['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'].map((w) => <div key={w}>{w}</div>)}</div>
          <div className="grid grid-cols-7 gap-1">
            {month.cells.map((cell, index) => {
              if (!cell) return <div key={index} className="h-16" />;
              const selected = selectedDate === cell.date;
              const disabled = !cell.slots;
              const planned = plan.map((p, i) => p?.date === cell.date ? i + 1 : null).filter(Boolean);
              const low = cell.min && cell.min <= 1500;
              return (
                <button key={cell.date} disabled={disabled} onClick={() => onPick(cell.date)} className={`relative flex h-16 flex-col items-center justify-center rounded-2xl transition ${selected ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 ring-4 ring-blue-200/30' : disabled ? 'bg-slate-50 text-slate-300' : 'bg-white text-slate-950 hover:bg-slate-100 active:scale-[.98]'}`}>
                  <b className="text-xl">{dayNumber(cell.date)}</b>
                  <span className={`text-[11px] font-black ${selected ? 'text-blue-100' : low ? 'text-emerald-600' : 'text-slate-400'}`}>{cell.min ? shortPrice(cell.min) : ''}</span>
                  {planned.length > 0 && <span className="absolute right-1 top-1 rounded-full bg-emerald-950 px-1.5 py-0.5 text-[9px] font-black text-lime-100">{planned.join(',')}</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function FloatingAction({ visible, title, subtitle, onClick }) {
  if (!visible) return null;
  return (
    <div className="fixed bottom-4 left-3 right-3 z-[90] mx-auto max-w-xl md:bottom-6">
      <button onClick={onClick} className="w-full rounded-[1.7rem] border border-blue-300/30 bg-blue-600 px-5 py-4 text-left text-white shadow-2xl shadow-blue-950/50 backdrop-blur transition active:scale-[.99] md:rounded-full">
        <div className="text-base font-black md:text-lg">{title}</div>
        {subtitle && <div className="mt-1 text-xs font-bold text-blue-100/80 md:text-sm">{subtitle}</div>}
      </button>
    </div>
  );
}

function ProgramPicker({ packageCount, onPick }) {
  return <div><b className="text-lime-100">Формат записи</b><div className="mt-2 grid grid-cols-2 gap-2">{PROGRAMS.map((p) => <button key={p.count} onClick={() => onPick(p.count)} className={`rounded-2xl p-3 text-left font-black ${packageCount === p.count ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-white'}`}><div>{p.title}</div><div className="mt-1 text-xs opacity-60">{p.note}</div></button>)}</div></div>;
}

function Pick({ title, items, value, onPick }) {
  return <div><b className="text-lime-100">{title}</b><div className="mt-2 grid grid-cols-2 gap-2">{items.map((i) => <button key={i.id} onClick={() => onPick(i.id)} className={`rounded-2xl p-3 text-left text-sm font-black ${value === i.id ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-white'}`}>{i.label}</button>)}</div></div>;
}

function SlotCard({ slot, active, onPick }) {
  const best = slot.reason.tone === 'best';
  const premium = slot.reason.tone === 'premium';
  const cls = active ? 'border-blue-300 bg-blue-600 text-white ring-4 ring-blue-200/20' : best ? 'border-lime-200 bg-lime-200 text-emerald-950' : premium ? 'border-amber-200/30 bg-amber-200/10 text-amber-50' : 'border-white/10 bg-white/5 text-lime-50';
  const sub = active ? 'text-white/80' : best ? 'text-emerald-950/75' : 'text-emerald-50/60';
  return (
    <button onClick={onPick} className={`rounded-[1.6rem] border p-4 text-left shadow-xl transition hover:-translate-y-1 ${cls}`}>
      <div className="flex justify-between gap-3">
        <div><div className="text-3xl font-black">{toTime(slot.start)}</div><div className={`mt-1 text-sm font-bold ${sub}`}>{toTime(slot.end)} · {slot.therapist.name}</div></div>
        <div className="text-right"><div className="text-3xl font-black">{slot.finalPrice}₽</div><div className={`mt-1 text-sm font-bold ${sub}`}>{slot.save ? `−${slot.save}₽` : slot.extra ? `+${slot.extra}₽` : 'база'}</div></div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2"><span className={`rounded-full px-4 py-2 text-sm font-black ${active ? 'bg-white/15 text-white' : best ? 'bg-emerald-950/10 text-emerald-950' : 'bg-white/10 text-lime-50'}`}>{slot.reason.label}</span><span className={`pt-2 text-sm font-bold ${sub}`}>{slot.reason.note}</span></div>
    </button>
  );
}

function TimeScale({ slots, selectedSlot, onPick }) {
  if (!slots.length) return null;
  const start = Math.min(...slots.map((slot) => slot.start));
  const end = Math.max(...slots.map((slot) => slot.end));
  const minPrice = Math.min(...slots.map((slot) => slot.finalPrice));
  const maxPrice = Math.max(...slots.map((slot) => slot.finalPrice));
  const marks = [];
  for (let time = start; time <= end - 30; time += 30) {
    const slot = slots.find((item) => item.start === time);
    let type = 'busy';
    if (slot) {
      if (slot.finalPrice <= minPrice + 50 || slot.reason.tone === 'best') type = 'cheap';
      else if (slot.finalPrice >= maxPrice - 50 || slot.reason.tone === 'premium') type = 'expensive';
      else type = 'normal';
    }
    marks.push({ time, slot, type });
  }
  const style = { busy: 'bg-slate-700/60 text-slate-400 cursor-not-allowed', cheap: 'bg-lime-200 text-emerald-950', normal: 'bg-white/10 text-lime-50 hover:bg-white/15', expensive: 'bg-amber-300/20 text-amber-50 hover:bg-amber-300/25' };
  return (
    <div className="mb-5 rounded-[2rem] border border-white/10 bg-white/[.06] p-4 shadow-xl">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between"><div><div className="text-xs font-black uppercase tracking-[.2em] text-lime-300/70">шаг 2</div><h3 className="mt-1 text-2xl font-black tracking-[-.04em] text-lime-50">Шкала времени</h3></div><div className="text-sm font-bold text-emerald-50/55">Нажми сегмент, затем закрепи сеанс</div></div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 xl:grid-cols-10">{marks.map((mark) => { const active = selectedSlot?.start === mark.time; return <button key={mark.time} disabled={!mark.slot} onClick={() => mark.slot && onPick(mark.slot.id)} className={`min-h-[58px] rounded-2xl px-2 py-2 text-left text-xs font-black transition ${active ? 'bg-blue-600 text-white ring-4 ring-blue-200/20' : style[mark.type]}`}><div className="text-sm">{toTime(mark.time)}</div><div className="mt-1 text-[10px] opacity-75">{mark.slot ? `${mark.slot.finalPrice}₽` : 'занято'}</div></button>; })}</div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-emerald-50/65 sm:grid-cols-4"><Legend color="bg-slate-600" label="занято" /><Legend color="bg-lime-200" label="дешевле" /><Legend color="bg-white/30" label="нормально" /><Legend color="bg-amber-300/50" label="дороже" /></div>
    </div>
  );
}
function Legend({ color, label }) { return <div className="flex items-center gap-2"><span className={`h-3 w-3 rounded-full ${color}`} />{label}</div>; }

function makePlanItem(slot, index) {
  return { sessionNo: index + 1, date: slot.date, slotId: slot.id, therapistId: slot.therapist.id, therapistName: slot.therapist.name, serviceId: slot.service.id, serviceTitle: slot.service.title, start: slot.start, end: slot.end, duration: slot.duration, price: slot.finalPrice, label: slot.reason.label };
}
function planItemToAppointment(item) { return { id: `temp-${item.sessionNo}-${item.date}-${item.start}`, date: item.date, therapistId: item.therapistId, start: item.start, duration: item.duration, status: 'confirmed' }; }

function CoursePlan({ plan, activeIndex, onEdit, packageCount }) {
  const total = plan.reduce((sum, item) => sum + (item?.price || 0), 0);
  return (
    <div className="mt-5 rounded-[2rem] border border-white/10 bg-white/10 p-5 text-lime-50">
      <div className="flex items-start justify-between gap-3"><div><div className="text-xs font-black uppercase tracking-[.2em] text-lime-300/70">план курса</div><h3 className="mt-2 text-2xl font-black">{plan.filter(Boolean).length} / {packageCount} сеансов</h3></div><div className="text-right"><div className="text-xs text-emerald-50/45">итого</div><div className="text-2xl font-black text-lime-200">{total}₽</div></div></div>
      <div className="mt-4 grid gap-2">{plan.map((item, index) => <button key={index} onClick={() => onEdit(index)} className={`rounded-2xl p-4 text-left ${activeIndex === index && !item ? 'bg-blue-600 text-white' : item ? 'bg-lime-200 text-emerald-950' : 'bg-white/5 text-emerald-50/50'}`}><div className="text-xs font-black uppercase opacity-60">сеанс {index + 1}</div>{item ? <div className="mt-1 font-black">{dateLabel(item.date)} · {toTime(item.start)} · {item.price}₽<div className="text-xs opacity-70">{item.therapistName}</div></div> : <div className="mt-1 font-bold">ожидает выбора</div>}</button>)}</div>
    </div>
  );
}

function ClientDetails({ plan, client, setClient, phone, setPhone, comment, setComment, onSave, saved }) {
  const total = plan.reduce((sum, item) => sum + (item?.price || 0), 0);
  return (
    <div id="booking-details" className="mt-5 rounded-[2rem] border border-blue-300/30 bg-blue-600 p-5 text-white shadow-2xl shadow-blue-950/30">
      <div className="text-xs font-black uppercase tracking-[.2em] text-blue-100/70">финальный шаг</div>
      <h3 className="mt-2 text-3xl font-black tracking-[-.05em]">Данные клиента</h3>
      <div className="mt-4 rounded-[1.5rem] bg-white/10 p-4"><b>{plan.length} сеанс(ов) · {total}₽</b><div className="mt-2 grid gap-1 text-sm text-blue-50/80">{plan.map((item) => <div key={item.sessionNo}>{item.sessionNo}. {dateLabel(item.date)} · {toTime(item.start)} · {item.therapistName}</div>)}</div></div>
      <div className="mt-4 grid gap-2"><input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Имя клиента" className="rounded-2xl px-4 py-3 text-emerald-950 outline-none" /><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон" className="rounded-2xl px-4 py-3 text-emerald-950 outline-none" /><textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Комментарий" className="min-h-24 rounded-2xl px-4 py-3 text-emerald-950 outline-none" /><button onClick={onSave} className="rounded-full bg-lime-200 px-5 py-4 font-black text-emerald-950">Сохранить весь комплекс</button></div>
      {saved && <div className="mt-4 rounded-2xl bg-lime-200 p-4 font-black text-emerald-950">Комплекс создан. Все сеансы уже видны массажисту и администратору.</div>}
    </div>
  );
}

function ClientBookings({ bookings }) {
  if (!bookings.length) return null;
  return <div className="mt-5 rounded-[2rem] border border-white/10 bg-white/10 p-5 text-lime-50"><div className="text-xs font-black uppercase tracking-[.2em] text-lime-300/70">личный кабинет клиента</div><h3 className="mt-2 text-2xl font-black">Мои записи</h3><div className="mt-4 grid gap-3">{bookings.map((a) => <AppointmentRow key={a.id} appointment={a} />)}</div></div>;
}

function BookingPage({ appointments, availability, setAppointments, clientBookings, setClientBookings }) {
  const [packageCount, setPackageCount] = useState(4);
  const [goalId, setGoalId] = useState('back');
  const [duration, setDuration] = useState(60);
  const [therapistId, setTherapistId] = useState('any');
  const [plan, setPlan] = useState(Array.from({ length: 4 }, () => null));
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeDate, setActiveDate] = useState('');
  const [dateConfirmed, setDateConfirmed] = useState(false);
  const [slotId, setSlotId] = useState('');
  const [client, setClient] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [saved, setSaved] = useState(false);

  const goal = goals.find((g) => g.id === goalId) || goals[0];
  const calendar = useMemo(() => buildCalendar(70), []);
  const planBusy = useMemo(() => plan.filter(Boolean).map(planItemToAppointment), [plan]);
  const busyAppointments = useMemo(() => [...appointments, ...planBusy], [appointments, planBusy]);
  const dayInfo = useMemo(() => calendar.map((date) => { const list = makeSlots({ date, serviceId: goal.serviceId, duration, therapistId, appointments: busyAppointments, availability }); return { date, slots: list.length, min: list.length ? Math.min(...list.map((s) => s.finalPrice)) : null }; }), [calendar, goal.serviceId, duration, therapistId, busyAppointments, availability]);
  const selectedDay = dayInfo.find((item) => item.date === activeDate);
  const slots = activeDate && dateConfirmed ? makeSlots({ date: activeDate, serviceId: goal.serviceId, duration, therapistId, appointments: busyAppointments, availability }) : [];
  const selectedSlot = slots.find((s) => s.id === slotId);
  const allComplete = plan.every(Boolean);
  const completedPlan = plan.filter(Boolean);

  const resetCourse = (count = packageCount) => { setPlan(Array.from({ length: count }, () => null)); setActiveIndex(0); setActiveDate(''); setDateConfirmed(false); setSlotId(''); setSaved(false); };
  const chooseProgram = (count) => { setPackageCount(count); resetCourse(count); };
  const chooseDate = (date) => { setActiveDate(date); setDateConfirmed(false); setSlotId(''); };
  const confirmDate = () => { setDateConfirmed(true); setTimeout(() => document.getElementById('time-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80); };
  const editSession = (index) => { const next = [...plan]; next[index] = null; setPlan(next); setActiveIndex(index); setActiveDate(''); setDateConfirmed(false); setSlotId(''); setSaved(false); setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 60); };
  const confirmSession = () => {
    if (!selectedSlot) return;
    const next = [...plan]; next[activeIndex] = makePlanItem(selectedSlot, activeIndex); setPlan(next); setActiveDate(''); setDateConfirmed(false); setSlotId(''); setSaved(false);
    const firstEmpty = next.findIndex((x) => !x); setActiveIndex(firstEmpty === -1 ? activeIndex : firstEmpty);
    setTimeout(() => document.getElementById(firstEmpty === -1 ? 'booking-details-anchor' : 'course-calendar')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };
  const autoPlan = () => {
    const result = Array.from({ length: packageCount }, () => null); let temp = [...appointments];
    for (let i = 0; i < packageCount; i += 1) {
      let best = null; const startOffset = i * 6;
      for (const date of calendar.slice(startOffset, startOffset + 14)) {
        const list = makeSlots({ date, serviceId: goal.serviceId, duration, therapistId, appointments: temp, availability });
        for (const slot of list) if (!best || slot.finalPrice < best.finalPrice) best = slot;
      }
      if (best) { const item = makePlanItem(best, i); result[i] = item; temp.push(planItemToAppointment(item)); }
    }
    setPlan(result); setActiveIndex(result.findIndex((x) => !x) === -1 ? 0 : result.findIndex((x) => !x)); setActiveDate(''); setDateConfirmed(false); setSlotId(''); setSaved(false); setTimeout(() => document.getElementById('booking-details-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };
  const saveCourse = () => {
    if (!allComplete) return;
    const groupId = `course-${Date.now()}`;
    const created = completedPlan.map((item) => ({ id: `${groupId}-${item.sessionNo}`, groupId, sessionNo: item.sessionNo, sessionTotal: packageCount, date: item.date, therapistId: item.therapistId, therapistName: item.therapistName, clientName: client.trim() || 'Клиент с сайта', phone: phone.trim() || 'контакт не указан', serviceId: item.serviceId, serviceTitle: item.serviceTitle, start: item.start, duration: item.duration, source: 'site', inviteSent: true, status: 'confirmed', price: item.price, comment: comment.trim(), createdAt: new Date().toISOString() }));
    setAppointments((prev) => [...prev, ...created]); setClientBookings((prev) => [...created, ...prev]); setSaved(true);
  };

  return (
    <section className="grid min-h-[calc(100vh-8rem)] gap-6 pb-36 pt-8 xl:grid-cols-[.82fr_1.18fr]">
      <div>
        <h1 className="text-4xl font-black tracking-[-.05em] text-lime-50 md:text-6xl">Запись на курс</h1>
        <p className="mt-4 leading-7 text-emerald-50/65">Каждый сеанс комплекса ставится в календарь отдельно. После сохранения все визиты появляются в расписании мастера и администратора.</p>
        <div className="mt-6 grid gap-4 rounded-[2rem] border border-lime-200/15 bg-lime-200/10 p-4"><ProgramPicker packageCount={packageCount} onPick={chooseProgram} /><Pick title="Цель" items={goals} value={goalId} onPick={(id) => { setGoalId(id); resetCourse(); }} /><div><b className="text-lime-100">Длительность</b><div className="mt-2 grid grid-cols-3 gap-2">{[45,60,90].map((d) => <button key={d} onClick={() => { setDuration(d); resetCourse(); }} className={`rounded-2xl p-3 font-black ${duration === d ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-white'}`}>{d} мин</button>)}</div></div><div><b className="text-lime-100">Специалист</b><div className="mt-2 grid gap-2">{therapists.map((t) => <button key={t.id} onClick={() => { setTherapistId(t.id); resetCourse(); }} className={`rounded-2xl p-3 text-left font-black ${therapistId === t.id ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-white'}`}>{t.name}<div className="text-xs opacity-60">{t.level}</div></button>)}</div></div><button onClick={autoPlan} className="rounded-full bg-blue-600 px-5 py-4 font-black text-white shadow-xl shadow-blue-900/20">Автоматически собрать курс</button></div>
        <CoursePlan plan={plan} activeIndex={activeIndex} onEdit={editSession} packageCount={packageCount} />
        <div id="booking-details-anchor" />
        {allComplete && <ClientDetails plan={completedPlan} client={client} setClient={setClient} phone={phone} setPhone={setPhone} comment={comment} setComment={setComment} onSave={saveCourse} saved={saved} />}
        <ClientBookings bookings={clientBookings} />
      </div>
      <div id="course-calendar">
        {!allComplete && <Calendar dayInfo={dayInfo} selectedDate={activeDate} onPick={chooseDate} plan={plan} activeIndex={activeIndex} />}
        {activeDate && !dateConfirmed && <div className="mt-5 rounded-[2rem] border border-white/10 bg-[#07140e]/70 p-5 text-center text-emerald-50/65">Дата для сеанса {activeIndex + 1} выбрана. Кнопка «Продолжить» закреплена снизу экрана.</div>}
        {activeDate && dateConfirmed && <div id="time-section" className="mt-5 rounded-[2rem] border border-white/10 bg-[#07140e]/70 p-4"><div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between"><div><div className="text-xs font-black uppercase tracking-[.2em] text-lime-300/70">сеанс {activeIndex + 1}</div><div className="text-2xl font-black text-lime-50">{dateLabel(activeDate)} · свободные окна</div></div><button onClick={() => { setDateConfirmed(false); setSlotId(''); }} className="w-fit rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-lime-50">изменить дату</button></div><TimeScale slots={slots} selectedSlot={selectedSlot} onPick={setSlotId} /><div className="grid gap-3 md:grid-cols-2">{slots.map((slot) => <SlotCard key={slot.id} slot={slot} active={slot.id === slotId} onPick={() => setSlotId(slot.id)} />)}</div></div>}
        {allComplete && <div className="rounded-[2rem] border border-lime-200/20 bg-lime-200/10 p-6 text-lime-50"><div className="text-xs font-black uppercase tracking-[.2em] text-lime-300/70">курс собран</div><h2 className="mt-2 text-3xl font-black tracking-[-.05em]">Все сеансы стоят в плане</h2><p className="mt-3 text-emerald-50/65">Проверь данные клиента слева и сохрани комплекс.</p></div>}
      </div>
      <FloatingAction visible={Boolean(activeDate && !dateConfirmed && !allComplete)} title={`Продолжить · сеанс ${activeIndex + 1}`} subtitle={`${dateLabel(activeDate)} · минимальная цена ${selectedDay?.min || '—'}₽`} onClick={confirmDate} />
      <FloatingAction visible={Boolean(selectedSlot && dateConfirmed && !allComplete)} title={packageCount === 1 ? 'Продолжить к данным клиента' : `Закрепить сеанс ${activeIndex + 1}`} subtitle={`${toTime(selectedSlot?.start || 0)} · ${selectedSlot?.therapist.name || ''} · ${selectedSlot?.finalPrice || ''}₽`} onClick={confirmSession} />
    </section>
  );
}

function AppointmentRow({ appointment, admin = false }) {
  const therapist = appointment.therapistName || therapists.find((t) => t.id === appointment.therapistId)?.name || 'Мастер';
  return <div className="rounded-2xl bg-white/10 p-4 text-lime-50"><div className="flex items-start justify-between gap-3"><div><b className="text-2xl">{dateLabel(appointment.date)} · {toTime(appointment.start)}</b><div className="mt-1 text-emerald-50/75">{appointment.clientName} · {appointment.serviceTitle || serviceName(appointment.serviceId)}</div><div className="text-sm text-emerald-50/45">{therapist} · {appointment.phone}</div>{appointment.groupId && <div className="mt-2 rounded-full bg-lime-200 px-3 py-1 text-xs font-black text-emerald-950 w-fit">курс {appointment.sessionNo}/{appointment.sessionTotal}</div>}</div><div className="text-right"><div className="font-black text-lime-200">{appointment.price ? `${appointment.price}₽` : ''}</div>{admin && <div className="mt-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white">{appointment.source === 'phone' ? 'телефон' : 'сайт'}</div>}</div></div>{appointment.comment && <div className="mt-3 rounded-xl bg-white/5 p-3 text-sm text-emerald-50/60">{appointment.comment}</div>}</div>;
}

function TherapistCabinet({ appointments, setAppointments, availability, setAvailability }) {
  const [therapistId, setTherapistId] = useState('kristina');
  const [date, setDate] = useState(START_DATE);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [start, setStart] = useState('14:00');
  const current = getAvailability(therapistId, date, availability);
  const day = appointments.filter((a) => a.date === date && a.therapistId === therapistId).sort((a,b) => a.start - b.start);
  const future = appointments.filter((a) => a.therapistId === therapistId).sort((a,b) => `${a.date}-${a.start}`.localeCompare(`${b.date}-${b.start}`));
  const patch = (data) => setAvailability((p) => ({ ...p, [therapistId]: { ...(p[therapistId] || {}), [date]: { ...(p[therapistId]?.[date] || {}), ...data } } }));
  const manual = () => { setAppointments((p) => [...p, { id: `manual-${Date.now()}`, date, therapistId, therapistName: therapists.find((t) => t.id === therapistId)?.name, clientName: name || 'Клиент по телефону', phone: phone || 'контакт не указан', serviceId: 'restore', serviceTitle: 'Восстановительный массаж', start: fromTime(start), duration: 60, source: 'phone', inviteSent: false, status: 'confirmed', price: 2000 }]); setName(''); setPhone(''); };
  return <section className="grid min-h-[calc(100vh-8rem)] gap-6 pb-20 pt-8 xl:grid-cols-[.82fr_1.18fr]"><div className="rounded-[2rem] border border-white/10 bg-white/10 p-5"><h1 className="text-4xl font-black text-lime-50">Кабинет массажиста</h1><div className="mt-5 grid gap-3"><select value={therapistId} onChange={(e) => setTherapistId(e.target.value)} className="rounded-2xl bg-lime-50 p-3 text-emerald-950">{therapists.filter((t) => t.id !== 'any').map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-2xl bg-lime-50 p-3 text-emerald-950" /><button onClick={() => patch({ off: !current.off })} className={`rounded-full p-3 font-black ${current.off ? 'bg-red-200 text-red-950' : 'bg-lime-200 text-emerald-950'}`}>{current.off ? 'Выходной' : 'Работает'}</button><div className="grid grid-cols-2 gap-2"><input type="time" value={toTime(current.work[0])} onChange={(e) => patch({ work: [fromTime(e.target.value), current.work[1]] })} className="rounded-2xl bg-lime-50 p-3 text-emerald-950" /><input type="time" value={toTime(current.work[1])} onChange={(e) => patch({ work: [current.work[0], fromTime(e.target.value)] })} className="rounded-2xl bg-lime-50 p-3 text-emerald-950" /></div></div><div className="mt-5 rounded-[2rem] bg-lime-50 p-5 text-emerald-950"><h2 className="text-2xl font-black">Добавить по телефону</h2><div className="mt-4 grid gap-3"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя" className="rounded-2xl bg-white p-3" /><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон" className="rounded-2xl bg-white p-3" /><input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-2xl bg-white p-3" /><button onClick={manual} className="rounded-full bg-emerald-950 p-4 font-black text-lime-100">Добавить клиента</button></div></div></div><div className="grid gap-5"><div className="rounded-[2rem] border border-white/10 bg-white/10 p-5"><h2 className="text-2xl font-black text-lime-50">{dateLabel(date)} · записи</h2><div className="mt-4 grid gap-3">{day.length ? day.map((a) => <AppointmentRow key={a.id} appointment={a} />) : <div className="rounded-2xl bg-white/5 p-5 text-emerald-50/60">Записей на выбранный день нет</div>}</div></div><div className="rounded-[2rem] border border-white/10 bg-white/10 p-5"><h2 className="text-2xl font-black text-lime-50">Все ближайшие записи мастера</h2><div className="mt-4 grid gap-3">{future.map((a) => <AppointmentRow key={a.id} appointment={a} />)}</div></div></div></section>;
}

function AdminDashboard({ appointments }) {
  const sorted = [...appointments].sort((a,b) => `${a.date}-${a.start}`.localeCompare(`${b.date}-${b.start}`));
  const total = appointments.reduce((sum, a) => sum + (a.price || 0), 0);
  const courses = new Set(appointments.filter((a) => a.groupId).map((a) => a.groupId)).size;
  const site = appointments.filter((a) => a.source === 'site').length;
  return <section className="min-h-[calc(100vh-8rem)] pb-20 pt-8"><h1 className="text-4xl font-black tracking-[-.05em] text-lime-50 md:text-6xl">Кабинет администратора</h1><p className="mt-4 max-w-3xl leading-7 text-emerald-50/65">Общее расписание салона. Здесь видны одиночные записи, комплексы сеансов и ручные записи массажиста.</p><div className="mt-6 grid gap-3 md:grid-cols-4"><AdminStat label="всего визитов" value={appointments.length} /><AdminStat label="комплексов" value={courses} /><AdminStat label="с сайта" value={site} /><AdminStat label="выручка" value={`${total}₽`} /></div><div className="mt-6 rounded-[2rem] border border-white/10 bg-white/10 p-5"><h2 className="text-2xl font-black text-lime-50">Общее расписание</h2><div className="mt-4 grid gap-3">{sorted.map((a) => <AppointmentRow key={a.id} appointment={a} admin />)}</div></div></section>;
}
function AdminStat({ label, value }) { return <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5"><div className="text-xs font-black uppercase tracking-[.18em] text-emerald-50/40">{label}</div><div className="mt-2 text-3xl font-black text-lime-100">{value}</div></div>; }

function Sections() { return <><section className="bg-[#0a1d13] px-4 py-20 text-white md:px-8"><div className="mx-auto max-w-7xl"><h2 className="text-4xl font-black text-lime-50">Единая логика</h2><p className="mt-4 max-w-3xl leading-8 text-emerald-50/65">Клиентская запись, комплекс сеансов, расписание массажиста и админ-панель используют одно хранилище демо-сессии.</p></div></section><footer className="bg-[#07140e] px-4 py-14 text-white md:px-8"><div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-8"><div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between"><div><b className="tracking-[.2em] text-lime-100">ЛАКИЗА</b><div className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/60 md:text-base">{CONTACT.address}</div><a href={`tel:${CONTACT.phoneLink}`} className="mt-1 inline-block whitespace-nowrap text-lg font-black tracking-[-.02em] text-lime-100 md:text-xl">{CONTACT.phoneDisplay}</a></div><a href={CONTACT.whatsapp} className="w-fit rounded-full bg-lime-200 px-5 py-3 font-black text-emerald-950">Написать в WhatsApp</a></div></div></footer></>;
}

export default function App() {
  const [view, setView] = useState('home');
  const [role, setRole] = useState('client');
  const [demoOpen, setDemoOpen] = useState(false);
  const [appointments, setAppointments] = useState(() => readStorage('lakizaAppointments', normalizeInitialAppointments()));
  const [availability, setAvailability] = useState(initialAvailability);
  const [clientBookings, setClientBookings] = useState(() => readStorage('lakizaClientBookings', []));
  useEffect(() => { try { localStorage.setItem('lakizaAppointments', JSON.stringify(appointments)); } catch {} }, [appointments]);
  useEffect(() => { try { localStorage.setItem('lakizaClientBookings', JSON.stringify(clientBookings)); } catch {} }, [clientBookings]);
  return <main className="min-h-screen bg-[#06110b] font-sans selection:bg-lime-200 selection:text-emerald-950"><Header view={view} setView={setView} role={role} setRole={setRole} onStartDemo={() => setDemoOpen(true)} /><section className="relative min-h-screen overflow-hidden px-4 pt-32 text-white md:px-8 md:pt-36"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(163,230,53,0.24),transparent_34%),linear-gradient(180deg,#06110b_0%,#0a1d13_52%,#06110b_100%)]" /><div className="relative mx-auto max-w-7xl animate-screenChange">{view === 'home' && <Home setView={setView} />}{view === 'services' && <Home setView={setView} />}{view === 'schedule' && <BookingPage appointments={appointments} availability={availability} setAppointments={setAppointments} clientBookings={clientBookings} setClientBookings={setClientBookings} />}{view === 'therapist' && (role === 'admin' ? <AdminDashboard appointments={appointments} /> : <TherapistCabinet appointments={appointments} setAppointments={setAppointments} availability={availability} setAvailability={setAvailability} />)}</div></section><Sections /><DemoTour open={demoOpen} onClose={() => setDemoOpen(false)} /></main>;
}
