import { useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import Logo from './components/Logo.jsx';
import { CONTACT, goals, initialAppointments, initialAvailability, roles, services, START_DATE, therapists } from './data.js';
import { buildCalendar, buildMonthBlocks, dateLabel, dayNumber, fromTime, serviceName, shortPrice, toTime, weekdayMonFirst } from './utils.js';
import { getAvailability, makeSlots } from './pricing.js';

function Home({ setView }) {
  return (
    <section className="grid min-h-[calc(100vh-8rem)] items-center gap-8 pb-16 pt-8 lg:grid-cols-[1.05fr_.95fr]">
      <div className="animate-fadeSlide">
        <div className="mb-5 inline-flex rounded-full border border-lime-200/20 bg-lime-200/10 px-4 py-2 text-sm font-bold text-lime-100">Календарь цен для массажного кабинета</div>
        <h1 className="text-5xl font-black leading-[.92] tracking-[-.07em] text-lime-50 md:text-7xl">Лакиза<span className="block text-lime-200">массаж без суеты</span></h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-emerald-50/70">Клиент выбирает дату по минимальной цене, затем конкретное свободное время. Массажист управляет графиком, выходными и ручными записями.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button onClick={() => setView('schedule')} className="rounded-full bg-lime-200 px-6 py-4 font-black text-emerald-950">Открыть запись</button>
          <button onClick={() => setView('therapist')} className="rounded-full border border-white/10 bg-white/10 px-6 py-4 font-black text-lime-50">Кабинет массажиста</button>
        </div>
      </div>
      <div className="rounded-[2.5rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
        <div className="rounded-[2rem] bg-[#0b2015] p-6">
          <div className="flex items-start justify-between"><Logo /><div className="rounded-3xl bg-lime-100 px-4 py-3 text-right text-emerald-950"><div className="text-xs font-black uppercase">лучшее окно</div><div className="text-2xl font-black">от 1300₽</div></div></div>
          <div className="mt-8 grid gap-3">{['цена на каждой дате','выбор времени внутри дня','ручная запись по телефону','выходные и рабочие часы'].map((x) => <div key={x} className="rounded-2xl bg-white/5 p-4 text-emerald-50/75">✓ {x}</div>)}</div>
        </div>
      </div>
    </section>
  );
}

function Calendar({ dayInfo, selectedDate, onPick }) {
  const months = buildMonthBlocks(dayInfo);
  return <div className="rounded-[2rem] bg-[#f4f6f8] p-3 text-slate-950 md:p-5">{months.map((month) => <div key={month.key} className="mb-4 rounded-[1.75rem] bg-white p-4 shadow-sm"><div className="mb-4 text-2xl font-black capitalize">{month.title}</div><div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-black text-slate-400">{['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'].map((w) => <div key={w}>{w}</div>)}</div><div className="grid grid-cols-7 gap-1">{month.cells.map((cell, index) => { if (!cell) return <div key={index} className="h-16" />; const selected = selectedDate === cell.date; const disabled = !cell.slots; const low = cell.min && cell.min <= 1500; return <button key={cell.date} disabled={disabled} onClick={() => onPick(cell.date)} className={`relative flex h-16 flex-col items-center justify-center rounded-2xl ${selected ? 'bg-blue-600 text-white shadow-lg' : disabled ? 'bg-slate-50 text-slate-300' : 'bg-white text-slate-950 hover:bg-slate-100'}`}><b className="text-xl">{dayNumber(cell.date)}</b><span className={`text-[11px] font-black ${selected ? 'text-blue-100' : low ? 'text-emerald-600' : 'text-slate-400'}`}>{cell.min ? shortPrice(cell.min) : ''}</span></button>; })}</div></div>)}</div>;
}

function SlotCard({ slot, active, onPick }) {
  const selected = active;
  const best = slot.reason.tone === 'best';
  const cls = selected ? 'border-blue-300 bg-blue-600 text-white ring-4 ring-blue-200/20' : best ? 'border-lime-200 bg-lime-200 text-emerald-950' : 'border-white/10 bg-white/5 text-lime-50';
  const sub = selected ? 'text-white/80' : best ? 'text-emerald-950/75' : 'text-emerald-50/60';
  return <button onClick={onPick} className={`rounded-[1.6rem] border p-4 text-left shadow-xl transition hover:-translate-y-1 ${cls}`}><div className="flex justify-between gap-3"><div><div className="text-3xl font-black">{toTime(slot.start)}</div><div className={`mt-1 text-sm font-bold ${sub}`}>{toTime(slot.end)} · {slot.therapist.name}</div></div><div className="text-right"><div className="text-3xl font-black">{slot.finalPrice}₽</div><div className={`mt-1 text-sm font-bold ${sub}`}>{slot.save ? `−${slot.save}₽` : slot.extra ? `+${slot.extra}₽` : 'база'}</div></div></div><div className="mt-4 flex gap-3"><span className={`rounded-full px-4 py-2 text-sm font-black ${selected ? 'bg-white/15 text-white' : best ? 'bg-emerald-950/10 text-emerald-950' : 'bg-white/10 text-lime-50'}`}>{slot.reason.label}</span><span className={`pt-2 text-sm font-bold ${sub}`}>{slot.reason.note}</span></div></button>;
}

function Schedule({ appointments, availability, setAppointments }) {
  const [goalId, setGoalId] = useState('back');
  const [duration, setDuration] = useState(60);
  const [therapistId, setTherapistId] = useState('any');
  const [selectedDate, setSelectedDate] = useState('');
  const [slotId, setSlotId] = useState('');
  const [client, setClient] = useState('');
  const [phone, setPhone] = useState('');
  const goal = goals.find((g) => g.id === goalId) || goals[0];
  const calendar = useMemo(() => buildCalendar(70), []);
  const dayInfo = useMemo(() => calendar.map((date) => { const list = makeSlots({ date, serviceId: goal.serviceId, duration, therapistId, appointments, availability }); return { date, slots: list.length, min: list.length ? Math.min(...list.map((s) => s.finalPrice)) : null }; }), [calendar, goal.serviceId, duration, therapistId, appointments, availability]);
  const slots = selectedDate ? makeSlots({ date: selectedDate, serviceId: goal.serviceId, duration, therapistId, appointments, availability }) : [];
  const selectedSlot = slots.find((s) => s.id === slotId);
  const save = () => { if (!selectedSlot) return; setAppointments((p) => [...p, { id: `site-${Date.now()}`, date: selectedSlot.date, therapistId: selectedSlot.therapist.id, clientName: client || 'Клиент с сайта', phone: phone || 'контакт не указан', serviceId: selectedSlot.service.id, start: selectedSlot.start, duration: selectedSlot.duration, source: 'site', inviteSent: true, price: selectedSlot.finalPrice }]); setClient(''); setPhone(''); alert('Запись сохранена в кабинете массажиста'); };
  return <section className="grid min-h-[calc(100vh-8rem)] gap-6 pb-20 pt-8 xl:grid-cols-[.82fr_1.18fr]"><div><h1 className="text-4xl font-black tracking-[-.05em] text-lime-50 md:text-6xl">Календарь цен</h1><p className="mt-4 leading-7 text-emerald-50/65">Выбери параметры, дату и конкретное время. Синяя карточка — выбранный слот.</p><div className="mt-6 grid gap-4 rounded-[2rem] border border-lime-200/15 bg-lime-200/10 p-4"><Pick title="Цель" items={goals} value={goalId} onPick={(id) => { setGoalId(id); setSelectedDate(''); }} /><div><b className="text-lime-100">Длительность</b><div className="mt-2 grid grid-cols-3 gap-2">{[45,60,90].map((d) => <button key={d} onClick={() => setDuration(d)} className={`rounded-2xl p-3 font-black ${duration === d ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-white'}`}>{d} мин</button>)}</div></div><div><b className="text-lime-100">Специалист</b><div className="mt-2 grid gap-2">{therapists.map((t) => <button key={t.id} onClick={() => setTherapistId(t.id)} className={`rounded-2xl p-3 text-left font-black ${therapistId === t.id ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-white'}`}>{t.name}<div className="text-xs opacity-60">{t.level}</div></button>)}</div></div></div>{selectedSlot && <div className="mt-5 rounded-[2rem] border border-blue-300/30 bg-blue-600 p-5 text-white"><b className="text-2xl">Выбрано: {dateLabel(selectedSlot.date)}, {toTime(selectedSlot.start)}</b><div className="mt-2">{selectedSlot.therapist.name} · {selectedSlot.service.title} · {selectedSlot.finalPrice}₽</div><div className="mt-4 grid gap-2"><input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Имя клиента" className="rounded-2xl px-4 py-3 text-emerald-950" /><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон" className="rounded-2xl px-4 py-3 text-emerald-950" /><button onClick={save} className="rounded-full bg-lime-200 px-5 py-4 font-black text-emerald-950">Сохранить запись</button></div></div>}</div><div><Calendar dayInfo={dayInfo} selectedDate={selectedDate} onPick={(date) => { setSelectedDate(date); setSlotId(''); }} />{selectedDate && <div className="mt-5 rounded-[2rem] border border-white/10 bg-[#07140e]/70 p-4"><div className="mb-4 text-2xl font-black text-lime-50">{dateLabel(selectedDate)} · свободные окна</div><div className="grid gap-3 md:grid-cols-2">{slots.map((slot) => <SlotCard key={slot.id} slot={slot} active={slot.id === slotId} onPick={() => setSlotId(slot.id)} />)}</div></div>}</div></section>;
}

function Pick({ title, items, value, onPick }) { return <div><b className="text-lime-100">{title}</b><div className="mt-2 grid grid-cols-2 gap-2">{items.map((i) => <button key={i.id} onClick={() => onPick(i.id)} className={`rounded-2xl p-3 text-left text-sm font-black ${value === i.id ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-white'}`}>{i.label}</button>)}</div></div>; }

function TherapistCabinet({ appointments, setAppointments, availability, setAvailability }) {
  const [therapistId, setTherapistId] = useState('kristina');
  const [date, setDate] = useState(START_DATE);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [start, setStart] = useState('14:00');
  const current = getAvailability(therapistId, date, availability);
  const day = appointments.filter((a) => a.date === date && a.therapistId === therapistId).sort((a,b) => a.start - b.start);
  const patch = (data) => setAvailability((p) => ({ ...p, [therapistId]: { ...(p[therapistId] || {}), [date]: { ...(p[therapistId]?.[date] || {}), ...data } } }));
  const manual = () => { setAppointments((p) => [...p, { id: `manual-${Date.now()}`, date, therapistId, clientName: name || 'Клиент по телефону', phone: phone || 'контакт не указан', serviceId: 'restore', start: fromTime(start), duration: 60, source: 'phone', inviteSent: false }]); setName(''); setPhone(''); };
  return <section className="grid min-h-[calc(100vh-8rem)] gap-6 pb-20 pt-8 xl:grid-cols-[.82fr_1.18fr]"><div className="rounded-[2rem] border border-white/10 bg-white/10 p-5"><h1 className="text-4xl font-black text-lime-50">Кабинет массажиста</h1><div className="mt-5 grid gap-3"><select value={therapistId} onChange={(e) => setTherapistId(e.target.value)} className="rounded-2xl bg-lime-50 p-3 text-emerald-950">{therapists.filter((t) => t.id !== 'any').map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-2xl bg-lime-50 p-3 text-emerald-950" /><button onClick={() => patch({ off: !current.off })} className={`rounded-full p-3 font-black ${current.off ? 'bg-red-200 text-red-950' : 'bg-lime-200 text-emerald-950'}`}>{current.off ? 'Выходной' : 'Работает'}</button><div className="grid grid-cols-2 gap-2"><input type="time" value={toTime(current.work[0])} onChange={(e) => patch({ work: [fromTime(e.target.value), current.work[1]] })} className="rounded-2xl bg-lime-50 p-3 text-emerald-950" /><input type="time" value={toTime(current.work[1])} onChange={(e) => patch({ work: [current.work[0], fromTime(e.target.value)] })} className="rounded-2xl bg-lime-50 p-3 text-emerald-950" /></div></div></div><div className="grid gap-5"><div className="rounded-[2rem] border border-white/10 bg-white/10 p-5"><h2 className="text-2xl font-black text-lime-50">{dateLabel(date)} · записи</h2><div className="mt-4 grid gap-3">{day.length ? day.map((a) => <div key={a.id} className="rounded-2xl bg-white/10 p-4"><b className="text-2xl text-lime-50">{toTime(a.start)}</b><div className="text-emerald-50/75">{a.clientName} · {serviceName(a.serviceId)}</div><div className="text-sm text-emerald-50/45">{a.phone} · {a.source === 'phone' ? 'по телефону' : 'с сайта'}</div></div>) : <div className="rounded-2xl bg-white/5 p-5 text-emerald-50/60">Записей нет</div>}</div></div><div className="rounded-[2rem] bg-lime-50 p-5 text-emerald-950"><h2 className="text-2xl font-black">Добавить по телефону</h2><div className="mt-4 grid gap-3"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя" className="rounded-2xl bg-white p-3" /><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон" className="rounded-2xl bg-white p-3" /><input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-2xl bg-white p-3" /><button onClick={manual} className="rounded-full bg-emerald-950 p-4 font-black text-lime-100">Добавить клиента</button></div></div></div></section>;
}

function DemoTour({ open, onClose }) { if (!open) return null; return <div className="fixed inset-0 z-[100] bg-[#041008] p-5 text-white"><div className="mx-auto flex h-full max-w-6xl flex-col"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><Logo small /><b className="tracking-[.25em] text-lime-100">ЛАКИЗА · ДЕМО</b></div><button onClick={onClose} className="rounded-full bg-white/10 px-4 py-2 font-bold">Закрыть</button></div><div className="mt-5 grid flex-1 gap-5 lg:grid-cols-[1fr_330px]"><div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 p-8"><div className="absolute left-[45%] top-[42%] h-24 w-44 rounded-3xl border-4 border-blue-300 bg-blue-400/10" /><div className="absolute left-[48%] top-[43%] text-6xl">➤</div><h1 className="text-5xl font-black text-lime-50">Автодемонстрация</h1><p className="mt-5 max-w-2xl text-xl leading-9 text-emerald-50/75">Курсор показывает, куда нажимает клиент или массажист. Сценарий объясняет запись, календарь цен, кабинет массажиста и ручные записи.</p><div className="mt-8 grid gap-3 md:grid-cols-2"><div className="rounded-3xl bg-lime-200 p-6 text-emerald-950"><b>Клиент выбирает дату</b><br/>по минимальной цене</div><div className="rounded-3xl bg-blue-600 p-6 text-white"><b>Синий слот</b><br/>выбранное время</div></div></div><aside className="rounded-[2rem] border border-white/10 bg-[#07140e]/90 p-5"><div className="rounded-full bg-lime-200 px-4 py-2 text-center font-black text-emerald-950">Демо-режим</div><p className="mt-5 leading-7 text-emerald-50/70">Это стартовый полноэкранный режим. Следующим шагом расширим его до полного сценария с 14 шагами и субтитрами.</p></aside></div></div></div>; }

function Sections() { return <><section className="bg-[#0a1d13] px-4 py-20 text-white md:px-8"><div className="mx-auto max-w-7xl"><h2 className="text-4xl font-black text-lime-50">Единая логика</h2><p className="mt-4 max-w-3xl leading-8 text-emerald-50/65">Календарь связывает клиента, массажиста и администратора. Все записи попадают в одно расписание.</p></div></section><footer className="bg-[#07140e] px-4 py-14 text-white md:px-8"><div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/5 p-6"><b className="tracking-[.2em] text-lime-100">ЛАКИЗА</b><div className="mt-3 text-emerald-50/60">{CONTACT.address} · {CONTACT.phoneDisplay}</div></div></footer></>; }

export default function App() {
  const [view, setView] = useState('home');
  const [role, setRole] = useState('client');
  const [demoOpen, setDemoOpen] = useState(false);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [availability, setAvailability] = useState(initialAvailability);
  return <main className="min-h-screen bg-[#06110b] font-sans selection:bg-lime-200 selection:text-emerald-950"><Header view={view} setView={setView} role={role} setRole={setRole} onStartDemo={() => setDemoOpen(true)} /><section className="relative min-h-screen overflow-hidden px-4 pt-32 text-white md:px-8 md:pt-36"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(163,230,53,0.24),transparent_34%),linear-gradient(180deg,#06110b_0%,#0a1d13_52%,#06110b_100%)]" /><div className="relative mx-auto max-w-7xl animate-screenChange">{view === 'home' && <Home setView={setView} />}{view === 'services' && <Home setView={setView} />}{view === 'schedule' && <Schedule appointments={appointments} availability={availability} setAppointments={setAppointments} />}{view === 'therapist' && <TherapistCabinet appointments={appointments} setAppointments={setAppointments} availability={availability} setAvailability={setAvailability} />}</div></section><Sections /><DemoTour open={demoOpen} onClose={() => setDemoOpen(false)} /></main>;
}
