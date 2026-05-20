const EVENTS_KEY = 'lakizaAdminSchedulerEvents';
const CLIENTS_KEY = 'lakizaClientProfiles';

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}
function saveJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function today() { return new Date().toISOString().slice(0, 10); }
function addDays(date, shift) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + shift);
  return d.toISOString().slice(0, 10);
}
function digits(value) { return String(value || '').replace(/\D/g, ''); }
function clientId(phone) { return `client-${digits(phone)}`; }

const people = [
  { name: 'Ирина Климова', phone: '+7 900 111-22-33', staffId: 'kristina', service: 'Спина и шея', h: '168', w: [69.2, 68.6, 67.9, 67.4], note: 'просила мягко, шея справа' },
  { name: 'Олег Петров', phone: '+7 900 444-55-66', staffId: 'kristina', service: 'Классический массаж', h: '181', w: [88.0, 87.1, 86.4], note: 'курс на спину, перезвонить вечером' },
  { name: 'Мария Волкова', phone: '+7 900 222-33-44', staffId: 'vera', service: 'Антистресс', h: '165', w: [60.4, 59.9, 59.4, 59.1, 58.9], note: 'не любит сильное давление' },
  { name: 'Денис Серов', phone: '+7 900 555-44-33', staffId: 'alina', service: 'Лимфодренаж', h: '178', w: [82.8, 82.1, 81.7], note: 'после тренировок, следить за поясницей' },
  { name: 'Анна Белова', phone: '+7 900 888-77-66', staffId: 'natalia', service: 'Курс 4 сеанса', h: '170', w: [64.2, 63.8, 63.5, 63.3], note: 'подарочный сертификат' },
  { name: 'Светлана Морозова', phone: '+7 900 333-20-10', staffId: 'vera', service: 'Спина и шея', h: '162', w: [72.0, 71.5], note: 'частые головные боли' },
  { name: 'Алексей Романов', phone: '+7 900 777-12-34', staffId: 'alina', service: 'Спортивный массаж', h: '184', w: [91.0, 90.4, 90.0], note: 'спортзал, забитые ноги' },
  { name: 'Елена Смирнова', phone: '+7 900 666-45-67', staffId: 'natalia', service: 'Антистресс', h: '166', w: [57.8, 57.7], note: 'тихая музыка, без разговоров' },
  { name: 'Павел Андреев', phone: '+7 900 123-88-10', staffId: 'kristina', service: 'Поясница', h: '176', w: [79.5, 79.1, 78.9], note: 'сидячая работа, поясница' },
  { name: 'Наталья Громова', phone: '+7 900 321-10-98', staffId: 'vera', service: 'Расслабляющий массаж', h: '169', w: [66.1, 65.7], note: 'удобнее после 18:00' },
];

function makeRichEvents() {
  const d = today();
  const times = ['09:00', '10:00', '11:00', '14:00', '16:00', '18:00'];
  let n = 1;
  const result = [];
  people.forEach((p, pi) => {
    p.w.forEach((weight, wi) => {
      result.push({
        id: `rich-${n++}`,
        clientId: clientId(p.phone),
        date: addDays(d, -35 + wi * 7 + (pi % 3)),
        time: times[(pi + wi) % times.length],
        duration: wi % 2 ? 90 : 60,
        staffId: p.staffId,
        client: p.name,
        phone: p.phone,
        service: p.service,
        status: 'done',
        note: p.note,
        weight: String(weight),
        height: p.h,
      });
    });
    result.push({ id: `rich-${n++}`, clientId: clientId(p.phone), date: addDays(d, pi % 4), time: times[(pi + 2) % times.length], duration: pi % 2 ? 90 : 60, staffId: p.staffId, client: p.name, phone: p.phone, service: p.service, status: pi % 3 === 0 ? 'confirmed' : 'new', note: p.note });
    result.push({ id: `rich-${n++}`, clientId: clientId(p.phone), date: addDays(d, 7 + pi), time: times[(pi + 3) % times.length], duration: 60, staffId: p.staffId, client: p.name, phone: p.phone, service: p.service, status: 'confirmed', note: 'следующий сеанс курса' });
  });
  return result;
}

function ensureRichDemoData() {
  const events = readJson(EVENTS_KEY, []);
  if (events.length >= 25 && events.some((event) => String(event.id).startsWith('rich-'))) return;

  const rich = makeRichEvents();
  const existingManual = events.filter((event) => !String(event.id || '').startsWith('seed-') && !String(event.id || '').startsWith('rich-'));
  const nextEvents = [...existingManual, ...rich];
  saveJson(EVENTS_KEY, nextEvents);

  const existingClients = readJson(CLIENTS_KEY, []);
  const byId = new Map(existingClients.map((client) => [client.id, client]));
  people.forEach((p) => {
    const id = clientId(p.phone);
    byId.set(id, {
      id,
      name: p.name,
      phone: p.phone,
      email: byId.get(id)?.email || '',
      assignedStaffId: byId.get(id)?.assignedStaffId || p.staffId,
      privateNotes: byId.get(id)?.privateNotes || p.note,
      createdAt: byId.get(id)?.createdAt || new Date().toISOString(),
    });
  });
  saveJson(CLIENTS_KEY, Array.from(byId.values()));
}

ensureRichDemoData();
