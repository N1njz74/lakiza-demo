import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import Logo from './components/Logo.jsx';
import { CONTACT, goals, initialAppointments, initialAvailability, roles, services, START_DATE, therapists } from './data.js';
import { buildCalendar, buildMonthBlocks, dateLabel, dayNumber, fromTime, serviceName, shortPrice, toTime } from './utils.js';
import { getAvailability, makeSlots } from './pricing.js';

function Home({ setView }) {
  return (
    <section className="grid min-h-[calc(100vh-8rem)] items-center gap-8 pb-16 pt-8 lg:grid-cols-[1.05fr_.95fr]">
      <div className="animate-fadeSlide">
        <div className="mb-5 inline-flex rounded-full border border-lime-200/20 bg-lime-200/10 px-4 py-2 text-sm font-bold text-lime-100">Календарь цен для массажного кабинета</div>
        <h1 className="text-5xl font-black leading-[.92] tracking-[-.07em] text-lime-50 md:text-7xl">Лакиза<span className="block text-lime-200">массаж без суеты</span></h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-emerald-50/70">Клиент выбирает дату по минимальной цене, затем конкретное свободное время. Массажист управляет графиком, выходными и ручными записями.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button onClick={() => setView('schedule')} className="rounded-full bg-lime-200 px-6 py-4 font-black text-emerald-950 shadow-xl shadow-lime-500/20">Открыть запись</button>
          <button onClick={() => setView('therapist')} className="rounded-full border border-white/10 bg-white/10 px-6 py-4 font-black text-lime-50">Кабинет массажиста</button>
        </div>
      </div>
      <div className="rounded-[2.5rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
        <div className="rounded-[2rem] bg-[#0b2015] p-6">
          <div className="flex items-start justify-between gap-4"><Logo /><div className="rounded-3xl bg-lime-100 px-4 py-3 text-right text-emerald-950"><div className="text-xs font-black uppercase">лучшее окно</div><div className="text-2xl font-black">от 1300₽</div></div></div>
          <div className="mt-8 grid gap-3">{['цена на каждой дате','выбор времени внутри дня','ручная запись по телефону','выходные и рабочие часы'].map((x) => <div key={x} className="rounded-2xl bg-white/5 p-4 text-emerald-50/75">✓ {x}</div>)}</div>
        </div>
      </div>
    </section>
  );
}

function Calendar({ dayInfo, selectedDate, onPick }) {
  const months = buildMonthBlocks(dayInfo);
  return (
    <div className="rounded-[2rem] bg-[#f4f6f8] p-3 text-slate-950 md:p-5">
      {months.map((month) => (
        <div key={month.key} className="mb-4 rounded-[1.75rem] bg-white p-4 shadow-sm">
          <div className="mb-4 text-2xl font-black capitalize">{month.title}</div>
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-black text-slate-400">{['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'].map((w) => <div key={w}>{w}</div>)}</div>
          <div className="grid grid-cols-7 gap-1">
            {month.cells.map((cell, index) => {
              if (!cell) return <div key={index} className="h-16" />;
              const selected = selectedDate === cell.date;
              const disabled = !cell.slots;
              const low = cell.min && cell.min <= 1500;
              return (
                <button key={cell.date} disabled={disabled} onClick={() => onPick(cell.date)} className={`relative flex h-16 flex-col items-center justify-center rounded-2xl transition ${selected ? 'bg-blue-600 text-white shadow-lg' : disabled ? 'bg-slate-50 text-slate-300' : 'bg-white text-slate-950 hover:bg-slate-100'}`}>
                  <b className="text-xl">{dayNumber(cell.date)}</b>
                  <span className={`text-[11px] font-black ${selected ? 'text-blue-100' : low ? 'text-emerald-600' : 'text-slate-400'}`}>{cell.min ? shortPrice(cell.min) : ''}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function SlotCard({ slot, active, onPick }) {
  const best = slot.reason.tone === 'best';
  const cls = active ? 'border-blue-300 bg-blue-600 text-white ring-4 ring-blue-200/20' : best ? 'border-lime-200 bg-lime-200 text-emerald-950' : 'border-white/10 bg-white/5 text-lime-50';
  const sub = active ? 'text-white/80' : best ? 'text-emerald-950/75' : 'text-emerald-50/60';
  return (
    <button onClick={onPick} className={`rounded-[1.6rem] border p-4 text-left shadow-xl transition hover:-translate-y-1 ${cls}`}>
      <div className="flex justify-between gap-3">
        <div><div className="text-3xl font-black">{toTime(slot.start)}</div><div className={`mt-1 text-sm font-bold ${sub}`}>{toTime(slot.end)} · {slot.therapist.name}</div></div>
        <div className="text-right"><div className="text-3xl font-black">{slot.finalPrice}₽</div><div className={`mt-1 text-sm font-bold ${sub}`}>{slot.save ? `−${slot.save}₽` : slot.extra ? `+${slot.extra}₽` : 'база'}</div></div>
      </div>
      <div className="mt-4 flex gap-3"><span className={`rounded-full px-4 py-2 text-sm font-black ${active ? 'bg-white/15 text-white' : best ? 'bg-emerald-950/10 text-emerald-950' : 'bg-white/10 text-lime-50'}`}>{slot.reason.label}</span><span className={`pt-2 text-sm font-bold ${sub}`}>{slot.reason.note}</span></div>
    </button>
  );
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
  const save = () => {
    if (!selectedSlot) return;
    setAppointments((p) => [...p, { id: `site-${Date.now()}`, date: selectedSlot.date, therapistId: selectedSlot.therapist.id, clientName: client || 'Клиент с сайта', phone: phone || 'контакт не указан', serviceId: selectedSlot.service.id, start: selectedSlot.start, duration: selectedSlot.duration, source: 'site', inviteSent: true, price: selectedSlot.finalPrice }]);
    setClient('');
    setPhone('');
    alert('Запись сохранена в кабинете массажиста');
  };
  return (
    <section className="grid min-h-[calc(100vh-8rem)] gap-6 pb-20 pt-8 xl:grid-cols-[.82fr_1.18fr]">
      <div>
        <h1 className="text-4xl font-black tracking-[-.05em] text-lime-50 md:text-6xl">Календарь цен</h1>
        <p className="mt-4 leading-7 text-emerald-50/65">Выбери параметры, дату и конкретное время. Синяя карточка — выбранный слот.</p>
        <div className="mt-6 grid gap-4 rounded-[2rem] border border-lime-200/15 bg-lime-200/10 p-4">
          <Pick title="Цель" items={goals} value={goalId} onPick={(id) => { setGoalId(id); setSelectedDate(''); }} />
          <div><b className="text-lime-100">Длительность</b><div className="mt-2 grid grid-cols-3 gap-2">{[45,60,90].map((d) => <button key={d} onClick={() => setDuration(d)} className={`rounded-2xl p-3 font-black ${duration === d ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-white'}`}>{d} мин</button>)}</div></div>
          <div><b className="text-lime-100">Специалист</b><div className="mt-2 grid gap-2">{therapists.map((t) => <button key={t.id} onClick={() => setTherapistId(t.id)} className={`rounded-2xl p-3 text-left font-black ${therapistId === t.id ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-white'}`}>{t.name}<div className="text-xs opacity-60">{t.level}</div></button>)}</div></div>
        </div>
        {selectedSlot && <div className="mt-5 rounded-[2rem] border border-blue-300/30 bg-blue-600 p-5 text-white"><b className="text-2xl">Выбрано: {dateLabel(selectedSlot.date)}, {toTime(selectedSlot.start)}</b><div className="mt-2">{selectedSlot.therapist.name} · {selectedSlot.service.title} · {selectedSlot.finalPrice}₽</div><div className="mt-4 grid gap-2"><input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Имя клиента" className="rounded-2xl px-4 py-3 text-emerald-950" /><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон" className="rounded-2xl px-4 py-3 text-emerald-950" /><button onClick={save} className="rounded-full bg-lime-200 px-5 py-4 font-black text-emerald-950">Сохранить запись</button></div></div>}
      </div>
      <div><Calendar dayInfo={dayInfo} selectedDate={selectedDate} onPick={(date) => { setSelectedDate(date); setSlotId(''); }} />{selectedDate && <div className="mt-5 rounded-[2rem] border border-white/10 bg-[#07140e]/70 p-4"><div className="mb-4 text-2xl font-black text-lime-50">{dateLabel(selectedDate)} · свободные окна</div><div className="grid gap-3 md:grid-cols-2">{slots.map((slot) => <SlotCard key={slot.id} slot={slot} active={slot.id === slotId} onPick={() => setSlotId(slot.id)} />)}</div></div>}</div>
    </section>
  );
}

function Pick({ title, items, value, onPick }) {
  return <div><b className="text-lime-100">{title}</b><div className="mt-2 grid grid-cols-2 gap-2">{items.map((i) => <button key={i.id} onClick={() => onPick(i.id)} className={`rounded-2xl p-3 text-left text-sm font-black ${value === i.id ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-white'}`}>{i.label}</button>)}</div></div>;
}

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

const demoSteps = [
  { role: 'client', title: 'Клиент открывает сайт', click: 'Открыть запись', screen: 'home', cursor: [27, 71], target: [27, 71, 26, 10], subtitle: 'Сайт сразу ведёт клиента к записи: не длинный лендинг, а понятный путь к дате, времени и цене.' },
  { role: 'client', title: 'Выбор цели', click: 'Спина / шея', screen: 'setup', cursor: [24, 36], target: [24, 36, 34, 12], subtitle: 'Цель визита влияет на тип сеанса, длительность и будущую цену в календаре.' },
  { role: 'client', title: 'Выбор длительности', click: '60 минут', screen: 'setup', cursor: [43, 56], target: [43, 56, 20, 10], subtitle: 'После выбора длительности система пересчитывает свободные окна. Длинный сеанс занимает больше места в расписании.' },
  { role: 'client', title: 'Календарь цен', click: 'Дата с ценой 1.3к', screen: 'calendar', cursor: [44, 47], target: [44, 47, 11, 13], subtitle: 'На каждой дате клиент видит минимальную цену дня. Не нужно открывать каждую дату вручную.' },
  { role: 'client', title: 'Свободные окна дня', click: '15:00 · 1550₽', screen: 'slots', cursor: [50, 54], target: [50, 54, 60, 16], subtitle: 'Салатовые карточки показывают выгодные окна. Синий цвет фиксирует выбранное клиентом время.' },
  { role: 'client', title: 'Сохранение заявки', click: 'Сохранить запись', screen: 'booking', cursor: [56, 80], target: [56, 80, 46, 10], subtitle: 'Клиент вводит имя и телефон. Запись сразу попадает в расписание массажиста.' },
  { role: 'therapist', title: 'Кристина видит запись', click: 'Новая запись в расписании', screen: 'therapist', cursor: [48, 46], target: [48, 46, 64, 14], subtitle: 'Массажист видит время, имя клиента, телефон, услугу и источник записи.' },
  { role: 'therapist', title: 'Управление графиком', click: 'Переключатель выходного', screen: 'work', cursor: [34, 42], target: [34, 42, 42, 12], subtitle: 'Массажист может отметить выходной или изменить часы. Клиент уже не увидит закрытые окна.' },
  { role: 'therapist', title: 'Запись по телефону', click: 'Добавить клиента', screen: 'manual', cursor: [58, 76], target: [58, 76, 46, 10], subtitle: 'Если клиент написал или позвонил, массажист вручную добавляет его в расписание без личного кабинета.' },
  { role: 'admin', title: 'Контроль администратора', click: 'Сводка загрузки', screen: 'admin', cursor: [68, 39], target: [68, 39, 38, 15], subtitle: 'Администратор видит общую загрузку, источники записей, ручные добавления и свободные окна.' },
];

function DemoTour({ open, onClose }) {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [clicking, setClicking] = useState(false);
  const current = demoSteps[step] || demoSteps[0];

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setPaused(false);
    setClicking(false);
  }, [open]);

  useEffect(() => {
    if (!open || paused) return;
    setClicking(false);
    const clickTimer = setTimeout(() => setClicking(true), 1300);
    const nextTimer = setTimeout(() => {
      setClicking(false);
      setStep((value) => value >= demoSteps.length - 1 ? 0 : value + 1);
    }, 5200);
    return () => { clearTimeout(clickTimer); clearTimeout(nextTimer); };
  }, [open, paused, step]);

  if (!open) return null;
  const progress = ((step + 1) / demoSteps.length) * 100;
  const next = () => { setClicking(false); setStep((value) => value >= demoSteps.length - 1 ? 0 : value + 1); };
  const prev = () => { setClicking(false); setStep((value) => value <= 0 ? demoSteps.length - 1 : value - 1); };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[#041008] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(163,230,53,.22),transparent_34%),radial-gradient(circle_at_80%_70%,rgba(37,99,235,.18),transparent_32%),linear-gradient(135deg,#041008_0%,#0b2015_55%,#06110b_100%)]" />
      <div className="relative z-10 flex h-full flex-col p-4 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3"><Logo small /><div><div className="text-sm font-black uppercase tracking-[.25em] text-lime-100">Лакиза · демо</div><div className="text-xs text-emerald-50/50">автоматический сценарий интерфейса</div></div></div>
          <button onClick={onClose} className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20">Закрыть</button>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-lime-200 transition-all duration-500" style={{ width: `${progress}%` }} /></div>
        <div className="relative mt-4 grid flex-1 min-h-0 gap-4 lg:grid-cols-[1fr_330px]">
          <div className="relative min-h-0 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.06] shadow-2xl shadow-black/40 backdrop-blur-xl">
            <DemoScene screen={current.screen} target={current.target} clicking={clicking} />
            <div className="pointer-events-none absolute z-40 transition-all duration-[1200ms] ease-[cubic-bezier(.2,.9,.2,1)]" style={{ left: `${current.cursor[0]}%`, top: `${current.cursor[1]}%` }}>
              <div className="relative h-16 w-16 -translate-x-4 -translate-y-4">
                {clicking && <div className="absolute left-8 top-8 h-7 w-7 rounded-full border-4 border-blue-300" style={{ animation: 'demoClick .55s ease-out both' }} />}
                <div className="absolute left-1 top-1 rotate-[-18deg] text-6xl drop-shadow-2xl">➤</div>
                <div className={`absolute left-9 top-9 h-4 w-4 rounded-full bg-blue-500 ring-4 ring-white transition-transform ${clicking ? 'scale-75' : 'scale-100'}`} />
              </div>
            </div>
          </div>
          <aside className="flex min-h-0 flex-col rounded-[2rem] border border-white/10 bg-[#07140e]/88 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="flex items-center justify-between"><span className="rounded-full bg-lime-200 px-3 py-1 text-xs font-black uppercase tracking-[.18em] text-emerald-950">{roles[current.role].label}</span><span className="text-sm font-bold text-emerald-50/45">{step + 1} / {demoSteps.length}</span></div>
            <h2 className="mt-5 text-3xl font-black leading-none tracking-[-.05em] text-lime-50">{current.title}</h2>
            <div className="mt-5 rounded-[1.5rem] border border-blue-300/20 bg-blue-600/15 p-4"><div className="text-xs font-black uppercase tracking-[.2em] text-blue-100/60">куда кликаем</div><div className="mt-2 text-base font-bold leading-7 text-blue-50">{current.click}</div></div>
            <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm leading-6 text-emerald-50/65">Сценарий не просто показывает картинку: курсор въезжает на подсвеченный элемент, делает клик и только потом переходит дальше.</div>
            <div className="mt-auto grid grid-cols-3 gap-2 pt-5"><button onClick={prev} className="rounded-2xl bg-white/10 px-3 py-3 text-sm font-bold hover:bg-white/15">Назад</button><button onClick={() => setPaused(!paused)} className="rounded-2xl bg-white/10 px-3 py-3 text-sm font-bold hover:bg-white/15">{paused ? 'Пуск' : 'Пауза'}</button><button onClick={next} className="rounded-2xl bg-lime-200 px-3 py-3 text-sm font-black text-emerald-950">Дальше</button></div>
          </aside>
        </div>
        <div key={step} className="mx-auto mt-4 w-full max-w-5xl rounded-[1.5rem] border border-white/10 bg-black/60 px-5 py-4 text-center text-base font-bold leading-7 text-white shadow-2xl backdrop-blur md:text-lg" style={{ animation: 'demoSubtitle .45s ease-out both' }}>{current.subtitle}</div>
      </div>
    </div>
  );
}

function DemoScene({ screen, target, clicking }) {
  return (
    <div className="relative h-full overflow-auto p-5 md:p-8">
      <DemoTarget target={target} clicking={clicking} />
      {screen === 'home' && <SceneHome />}
      {screen === 'setup' && <SceneSetup />}
      {screen === 'calendar' && <SceneCalendar />}
      {screen === 'slots' && <SceneSlots />}
      {screen === 'booking' && <SceneBooking />}
      {screen === 'therapist' && <SceneTherapist />}
      {screen === 'work' && <SceneWork />}
      {screen === 'manual' && <SceneManual />}
      {screen === 'admin' && <SceneAdmin />}
    </div>
  );
}

function DemoTarget({ target, clicking }) {
  if (!target) return null;
  const [x, y, w, h] = target;
  return <div className={`pointer-events-none absolute z-30 rounded-[1.4rem] border-2 border-blue-300/90 bg-blue-400/10 transition-all duration-500 ${clicking ? 'scale-[.98] bg-blue-400/20' : ''}`} style={{ left: `${x - w / 2}%`, top: `${y - h / 2}%`, width: `${w}%`, height: `${h}%`, animation: 'demoTarget 1.8s ease-in-out infinite' }} />;
}

function SceneHome() { return <div className="grid min-h-full items-center gap-6 lg:grid-cols-[1fr_.8fr]"><div><div className="mb-5 inline-flex rounded-full bg-lime-200/10 px-4 py-2 text-sm font-bold text-lime-100">умная запись</div><h3 className="text-5xl font-black leading-[.9] tracking-[-.06em] text-lime-50 md:text-7xl">Лакиза<span className="block text-lime-200">календарь цен</span></h3><p className="mt-5 max-w-xl text-xl leading-8 text-emerald-50/70">Сначала дата, потом время. Цена считается по загрузке мастера.</p><button className="mt-8 rounded-full bg-lime-200 px-6 py-4 font-black text-emerald-950">Открыть запись</button></div><DemoPhone /></div>; }
function SceneSetup() { return <div><SceneTitle title="Параметры сеанса" /><div className="grid gap-4 md:grid-cols-2"><DemoPanel title="Цель визита" items={['Спина / шея', 'Стресс / сон', 'После нагрузки', 'Полное восстановление']} active={0} /><DemoPanel title="Длительность" items={['45 минут', '60 минут', '90 минут']} active={1} /><DemoPanel title="Специалист" items={['Любой специалист', 'Кристина', 'Алёна', 'Мария']} active={0} /></div></div>; }
function SceneCalendar() { const days = [[14,'1.9к'],[15,'1.7к'],[16,'1.3к'],[17,'2.1к'],[18,''],[19,'1.8к'],[20,'1.5к'],[21,'1.6к'],[22,''],[23,'1.9к'],[24,'1.4к'],[25,''],[26,'2.2к'],[27,'1.8к']]; return <div><SceneTitle title="Календарь цен" /><div className="rounded-[2rem] bg-white p-5 text-slate-950"><div className="mb-4 text-3xl font-black capitalize">май</div><div className="grid grid-cols-7 gap-2">{days.map(([d,p]) => <div key={d} className={`flex h-16 flex-col items-center justify-center rounded-2xl ${d === 16 ? 'bg-blue-600 text-white' : p ? 'bg-slate-50' : 'bg-slate-50 text-slate-300'}`}><b className="text-xl">{d}</b><span className={`text-xs font-black ${p === '1.3к' ? 'text-emerald-500' : d === 16 ? 'text-blue-100' : 'text-slate-400'}`}>{p}</span></div>)}</div></div></div>; }
function SceneSlots() { return <div><SceneTitle title="Окна выбранного дня" /><div className="grid gap-3 md:grid-cols-2">{[['14:30','1300₽','Желательное время','bg-lime-200 text-emerald-950'],['15:00','1550₽','Выбрано','bg-blue-600 text-white'],['16:00','1850₽','Мастер-профиль','bg-white/10 text-lime-50']].map(([t,p,l,c]) => <div key={t} className={`rounded-[1.7rem] p-5 ${c}`}><div className="flex justify-between"><b className="text-4xl">{t}</b><b className="text-4xl">{p}</b></div><div className="mt-4 inline-flex rounded-full bg-black/10 px-4 py-2 font-bold">{l}</div></div>)}</div></div>; }
function SceneBooking() { return <div><SceneTitle title="Финальная заявка" /><div className="max-w-xl rounded-[2rem] bg-lime-50 p-5 text-emerald-950"><div className="grid gap-3"><div className="rounded-2xl bg-white p-4 font-bold">Анна Петрова</div><div className="rounded-2xl bg-white p-4 font-bold">+7 900 000-00-00</div><div className="rounded-2xl bg-emerald-950/10 p-4"><b>16 мая, 15:00</b><br/>Кристина · 60 минут · 1550₽</div><button className="rounded-full bg-emerald-950 px-5 py-4 font-black text-lime-100">Сохранить запись</button></div></div></div>; }
function SceneTherapist() { return <div><SceneTitle title="Расписание Кристины" /><div className="grid gap-3">{[['10:00','Ольга','с сайта'],['15:00','Анна Петрова','новая запись'],['18:00','Ирина','по телефону']].map(([t,n,s]) => <div key={t} className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5"><div className="text-3xl font-black text-lime-50">{t}</div><div className="mt-1 text-lg font-bold">{n}</div><div className="text-emerald-50/55">{s}</div></div>)}</div></div>; }
function SceneWork() { return <div><SceneTitle title="График работы" /><div className="grid gap-3 md:grid-cols-2"><DemoPill label="Суббота" value="Выходной" active /><DemoPill label="Рабочее время" value="10:00–18:00" /><DemoPill label="Желательное" value="14:00–16:00" active /><DemoPill label="Нежелательное" value="18:00–20:00" /></div></div>; }
function SceneManual() { return <div><SceneTitle title="Запись по телефону" /><div className="max-w-xl rounded-[2rem] bg-lime-50 p-5 text-emerald-950"><div className="grid gap-3"><div className="rounded-2xl bg-white p-4 font-bold">Клиент по телефону</div><div className="rounded-2xl bg-white p-4 font-bold">Восстановительный массаж</div><div className="rounded-2xl bg-white p-4 font-bold">17:30 · 60 минут</div><button className="rounded-full bg-emerald-950 px-5 py-4 font-black text-lime-100">Добавить клиента</button></div></div></div>; }
function SceneAdmin() { return <div><SceneTitle title="Администратор" /><div className="grid gap-3 md:grid-cols-2"><DemoPill label="Записей сегодня" value="7" active /><DemoPill label="Ручные записи" value="2" /><DemoPill label="Свободные окна" value="11" /><DemoPill label="Выручка" value="12 850₽" active /></div></div>; }
function SceneTitle({ title }) { return <div><div className="mb-3 text-sm font-black uppercase tracking-[.25em] text-lime-300/70">демо-сцена</div><h3 className="mb-6 text-4xl font-black tracking-[-.05em] text-lime-50 md:text-5xl">{title}</h3></div>; }
function DemoPanel({ title, items, active }) { return <div className="rounded-[2rem] border border-lime-200/15 bg-lime-200/10 p-4"><div className="mb-3 font-black text-lime-100">{title}</div><div className="grid gap-2">{items.map((item, index) => <div key={item} className={`rounded-2xl p-3 font-black ${index === active ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-white'}`}>{item}</div>)}</div></div>; }
function DemoPill({ label, value, active }) { return <div className={`rounded-2xl p-5 ${active ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-white'}`}><div className="text-xs font-black uppercase opacity-60">{label}</div><div className="mt-1 text-2xl font-black">{value}</div></div>; }
function DemoPhone() { return <div className="mx-auto w-full max-w-[320px] rounded-[2.5rem] border border-white/10 bg-[#06110b] p-4 shadow-2xl"><div className="mb-4 h-6 rounded-full bg-white/10"/><div className="rounded-[2rem] bg-[#0b2015] p-4"><div className="mb-4 flex items-center justify-between"><b className="tracking-[.2em] text-lime-100">ЛАКИЗА</b><span className="rounded-full bg-lime-200 px-3 py-1 text-xs font-black text-emerald-950">демо</span></div><div className="grid gap-3"><div className="h-20 rounded-2xl bg-lime-200/90"/><div className="h-16 rounded-2xl bg-white/10"/><div className="h-24 rounded-2xl bg-blue-600/80"/><div className="h-14 rounded-full bg-lime-200"/></div></div></div>; }

function Sections() {
  return <><section className="bg-[#0a1d13] px-4 py-20 text-white md:px-8"><div className="mx-auto max-w-7xl"><h2 className="text-4xl font-black text-lime-50">Единая логика</h2><p className="mt-4 max-w-3xl leading-8 text-emerald-50/65">Календарь связывает клиента, массажиста и администратора. Все записи попадают в одно расписание.</p></div></section><footer className="bg-[#07140e] px-4 py-14 text-white md:px-8"><div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-8"><div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between"><div><b className="tracking-[.2em] text-lime-100">ЛАКИЗА</b><div className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/60 md:text-base">{CONTACT.address}</div><a href={`tel:${CONTACT.phoneLink}`} className="mt-1 inline-block whitespace-nowrap text-lg font-black tracking-[-.02em] text-lime-100 md:text-xl">{CONTACT.phoneDisplay}</a></div><a href={CONTACT.whatsapp} className="w-fit rounded-full bg-lime-200 px-5 py-3 font-black text-emerald-950">Написать в WhatsApp</a></div></div></footer></>;
}

export default function App() {
  const [view, setView] = useState('home');
  const [role, setRole] = useState('client');
  const [demoOpen, setDemoOpen] = useState(false);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [availability, setAvailability] = useState(initialAvailability);
  return <main className="min-h-screen bg-[#06110b] font-sans selection:bg-lime-200 selection:text-emerald-950"><Header view={view} setView={setView} role={role} setRole={setRole} onStartDemo={() => setDemoOpen(true)} /><section className="relative min-h-screen overflow-hidden px-4 pt-32 text-white md:px-8 md:pt-36"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(163,230,53,0.24),transparent_34%),linear-gradient(180deg,#06110b_0%,#0a1d13_52%,#06110b_100%)]" /><div className="relative mx-auto max-w-7xl animate-screenChange">{view === 'home' && <Home setView={setView} />}{view === 'services' && <Home setView={setView} />}{view === 'schedule' && <Schedule appointments={appointments} availability={availability} setAppointments={setAppointments} />}{view === 'therapist' && <TherapistCabinet appointments={appointments} setAppointments={setAppointments} availability={availability} setAvailability={setAvailability} />}</div></section><Sections /><DemoTour open={demoOpen} onClose={() => setDemoOpen(false)} /></main>;
}
