import { services, therapists, START_DATE } from './data.js';

export function pad(value) { return String(value).padStart(2, '0'); }
export function makeDate(iso) { const [y,m,d] = iso.split('-').map(Number); return new Date(y, m - 1, d); }
export function addDays(iso, amount) { const date = makeDate(iso); date.setDate(date.getDate() + amount); return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`; }
export function buildCalendar(count = 70) { return Array.from({ length: count }, (_, i) => addDays(START_DATE, i)); }
export function toTime(minutes) { return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`; }
export function fromTime(value) { const [h,m] = value.split(':').map(Number); return h * 60 + m; }
export function dateLabel(iso) { return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(makeDate(iso)).replace('.', ''); }
export function monthTitle(iso) { return new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(makeDate(iso)); }
export function weekdayMonFirst(iso) { const day = makeDate(iso).getDay(); return day === 0 ? 6 : day - 1; }
export function monthKey(iso) { return iso.slice(0, 7); }
export function dayNumber(iso) { return Number(iso.slice(8, 10)); }
export function shortPrice(value) { if (!value) return ''; const n = value / 1000; return `${n.toFixed(n % 1 === 0 ? 0 : 1)}к`; }
export function overlaps(aStart, aEnd, bStart, bEnd) { return aStart < bEnd && bStart < aEnd; }
export function serviceName(id) { return services.find((s) => s.id === id)?.title || 'Сеанс'; }
export function getTherapist(id) { return therapists.find((t) => t.id === id) || therapists[1]; }

export function buildMonthBlocks(dayInfo) {
  const groups = [];
  for (const day of dayInfo) {
    const key = monthKey(day.date);
    let group = groups.find((g) => g.key === key);
    if (!group) { group = { key, title: monthTitle(day.date), days: [] }; groups.push(group); }
    group.days.push(day);
  }
  return groups.map((group) => {
    const cells = [];
    for (let i = 0; i < weekdayMonFirst(group.days[0].date); i += 1) cells.push(null);
    group.days.forEach((day) => cells.push(day));
    while (cells.length % 7 !== 0) cells.push(null);
    return { ...group, cells };
  });
}
