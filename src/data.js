export const CONTACT = {
  phoneDisplay: '8 900 096-20-71',
  phoneLink: '+79000962071',
  whatsapp: 'https://wa.me/79000962071',
  address: 'Челябинск, ул. 50-летия ВЛКСМ',
};

export const roles = {
  client: { label: 'Клиент', hint: 'запись на сеанс' },
  therapist: { label: 'Массажист', hint: 'своё расписание' },
  admin: { label: 'Администратор', hint: 'контроль записей' },
};

export const services = [
  { id: 'restore', title: 'Восстановительный массаж', prices: { 45: 1500, 60: 2000, 90: 2900 }, tags: ['спина', 'шея', 'напряжение'] },
  { id: 'relax', title: 'Антистресс и релакс', prices: { 45: 1300, 60: 1800, 90: 2600 }, tags: ['сон', 'стресс', 'расслабление'] },
  { id: 'sport', title: 'Спортивная проработка', prices: { 45: 1600, 60: 2200, 90: 3200 }, tags: ['мышцы', 'нагрузка', 'тонус'] },
];

export const goals = [
  { id: 'back', label: 'Спина / шея', serviceId: 'restore' },
  { id: 'stress', label: 'Стресс / сон', serviceId: 'relax' },
  { id: 'sport', label: 'После нагрузки', serviceId: 'sport' },
  { id: 'full', label: 'Полное восстановление', serviceId: 'restore' },
];

export const therapists = [
  { id: 'any', name: 'Любой специалист', level: 'система подберёт лучшее окно', multiplier: 1, work: [600, 1260] },
  { id: 'kristina', name: 'Кристина', level: 'старший массажист', multiplier: 1.12, work: [600, 1260] },
  { id: 'alena', name: 'Алёна', level: 'релакс и антистресс', multiplier: 1, work: [570, 1170] },
  { id: 'maria', name: 'Мария', level: 'спорт и восстановление', multiplier: 1.08, work: [660, 1320] },
];

export const initialAppointments = [
  { id: 'a1', date: '2026-05-14', therapistId: 'kristina', clientName: 'Ольга', phone: '+7 900 111-22-33', serviceId: 'restore', start: 600, duration: 60, source: 'site', inviteSent: true },
  { id: 'a2', date: '2026-05-14', therapistId: 'kristina', clientName: 'Наталья', phone: '+7 900 222-33-44', serviceId: 'relax', start: 780, duration: 60, source: 'phone', inviteSent: false },
  { id: 'a3', date: '2026-05-15', therapistId: 'kristina', clientName: 'Светлана', phone: '+7 900 444-55-66', serviceId: 'sport', start: 690, duration: 90, source: 'site', inviteSent: true },
];

export const initialAvailability = {
  kristina: {
    '2026-05-14': { preferred: [[840, 960]], unwanted: [[1080, 1200]] },
    '2026-05-16': { preferred: [[720, 900]], unwanted: [[1140, 1260]] },
  },
};

export const START_DATE = '2026-05-14';
