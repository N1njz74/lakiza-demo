import { START_DATE, services, therapists } from './data.js';
import { buildCalendar, getTherapist, overlaps } from './utils.js';

function intervalHit(start, end, intervals = []) {
  return intervals.some(([from, to]) => overlaps(start, end, from, to));
}

export function getAvailability(therapistId, date, availability) {
  const therapist = getTherapist(therapistId);
  const saved = availability[therapistId]?.[date] || {};
  return {
    off: Boolean(saved.off),
    work: saved.work || therapist.work,
    preferred: saved.preferred || [],
    unwanted: saved.unwanted || [],
  };
}

function gapAdjustment(gap) {
  if (gap === 0) return -250;
  if (gap >= 60 && gap <= 120) return -200;
  if (gap > 0 && gap < 45) return 450;
  if (gap >= 45 && gap < 60) return 300;
  if (gap > 150) return 150;
  return 0;
}

function getReason(totalAdj, preferenceAdj, demandAdj, masterAdj) {
  if (preferenceAdj < 0) return { label: 'Желательное время', tone: 'best', note: 'мастеру удобно это окно' };
  if (totalAdj <= -300) return { label: 'Оптимальное окно', tone: 'best', note: 'скидка за плотное расписание' };
  if (preferenceAdj > 0) return { label: 'Нежелательное время', tone: 'flex', note: 'повышающий коэффициент' };
  if (demandAdj > 0) return { label: 'Популярное время', tone: 'premium', note: 'пиковый спрос' };
  if (masterAdj > 0) return { label: 'Мастер-профиль', tone: 'premium', note: 'надбавка специалиста' };
  return { label: 'Стандарт', tone: 'standard', note: 'обычная цена' };
}

export function calculatePrice({ service, duration, therapist, date, start, appointments, availability }) {
  const base = service.prices[duration] || service.prices[60];
  const end = start + duration;
  const currentAvailability = getAvailability(therapist.id, date, availability);
  const booked = appointments
    .filter((a) => a.date === date && a.therapistId === therapist.id && a.status !== 'cancelled')
    .map((a) => [a.start, a.start + a.duration])
    .sort((a, b) => a[0] - b[0]);

  const previous = [...booked].reverse().find(([, bookedEnd]) => bookedEnd <= start);
  const next = booked.find(([bookedStart]) => bookedStart >= end);
  const beforeGap = start - (previous ? previous[1] : currentAvailability.work[0]);
  const afterGap = (next ? next[0] : currentAvailability.work[1]) - end;
  const beforeAdj = gapAdjustment(beforeGap);
  const afterAdj = gapAdjustment(afterGap);

  const hour = start / 60;
  const dayIndex = buildCalendar().indexOf(date);
  let demandAdj = 0;
  if (dayIndex >= 5 && dayIndex <= 6) demandAdj += 250;
  if (hour >= 17 && hour < 20) demandAdj += 350;
  if (hour >= 10 && hour < 13) demandAdj -= 150;
  if (date === START_DATE && hour < 15) demandAdj -= 250;

  const masterAdj = Math.round((base * (therapist.multiplier - 1)) / 50) * 50;
  let preferenceAdj = 0;
  if (intervalHit(start, end, currentAvailability.preferred)) preferenceAdj -= 300;
  if (intervalHit(start, end, currentAvailability.unwanted)) preferenceAdj += 350;

  const totalAdj = beforeAdj + afterAdj + demandAdj + masterAdj + preferenceAdj;
  const finalPrice = Math.max(900, Math.round((base + totalAdj) / 50) * 50);

  return {
    base,
    finalPrice,
    save: Math.max(0, base - finalPrice),
    extra: Math.max(0, finalPrice - base),
    beforeGap,
    afterGap,
    beforeAdj,
    afterAdj,
    demandAdj,
    masterAdj,
    preferenceAdj,
    reason: getReason(totalAdj, preferenceAdj, demandAdj, masterAdj),
  };
}

export function makeSlots({ date, serviceId, duration, therapistId, appointments, availability }) {
  const service = services.find((s) => s.id === serviceId) || services[0];
  const list = therapistId === 'any' ? therapists.filter((t) => t.id !== 'any') : therapists.filter((t) => t.id === therapistId);
  const slots = [];

  for (const therapist of list) {
    const currentAvailability = getAvailability(therapist.id, date, availability);
    if (currentAvailability.off) continue;

    for (let start = currentAvailability.work[0]; start + duration <= currentAvailability.work[1]; start += 30) {
      const end = start + duration;
      const busy = appointments.some((a) => a.date === date && a.therapistId === therapist.id && a.status !== 'cancelled' && overlaps(start, end, a.start, a.start + a.duration));
      if (busy) continue;
      const price = calculatePrice({ service, duration, therapist, date, start, appointments, availability });
      slots.push({
        id: `${date}-${therapist.id}-${start}-${duration}`,
        date,
        therapist,
        service,
        duration,
        start,
        end,
        ...price,
      });
    }
  }

  if (therapistId === 'any') {
    const best = new Map();
    for (const slot of slots) {
      const key = `${slot.date}-${slot.start}`;
      const old = best.get(key);
      if (!old || slot.finalPrice < old.finalPrice) best.set(key, slot);
    }
    return [...best.values()].sort((a, b) => a.start - b.start);
  }

  return slots.sort((a, b) => a.start - b.start);
}
