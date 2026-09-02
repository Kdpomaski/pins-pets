import {
  addDays,
  addMonths,
  addWeeks,
  differenceInDays,
  endOfDay,
  format,
  setHours,
  setMinutes,
  startOfDay,
} from 'date-fns';
import { inventoryForPet, type InjectionLog, type InventoryItem, type PinsData } from '@/lib/store';

export type ExportFormat = 'calendar' | 'text';

export type ExportRange = {
  from: Date;
  to: Date;
};

export type ExportOptions = {
  range: ExportRange;
  petId?: string | null;
  petName?: string;
};

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function applyTime(date: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number);
  return setMinutes(setHours(startOfDay(date), h || 8), m || 0);
}

function doseInInventoryUnits(
  dose: number,
  doseUnit: InventoryItem['unit'],
  itemUnit: InventoryItem['unit'],
): number {
  if (itemUnit === doseUnit) return dose;
  if (itemUnit === 'mg' && doseUnit === 'mcg') return dose / 1000;
  if (itemUnit === 'mcg' && doseUnit === 'mg') return dose * 1000;
  return dose;
}

export function remainingDoses(
  item: InventoryItem,
  dose: number,
  unit: InventoryItem['unit'],
): number {
  if (!dose || dose <= 0) return 0;
  const perDose = doseInInventoryUnits(dose, unit, item.unit);
  if (item.form === 'vial' && item.concentration) {
    const total = item.remainingVolume * item.concentration;
    return Math.max(0, Math.floor(total / perDose));
  }
  return Math.max(0, Math.floor(item.remainingVolume / perDose));
}

function defaultWeekdays(frequency: string): number[] {
  const f = frequency.toLowerCase();
  if (f.includes('3x/week')) return [1, 3, 5];
  if (f.includes('2x/week')) return [1, 4];
  if (f === 'weekly' || f === 'bi-weekly' || f === 'monthly') return [1];
  return [0, 1, 2, 3, 4, 5, 6];
}

function generateDoseDates(
  count: number,
  frequency: string,
  start: Date,
  time: string,
  weekdays: number[],
): Date[] {
  const results: Date[] = [];
  const freq = frequency.toLowerCase();

  if (freq === 'daily') {
    for (let i = 0; i < count; i++) results.push(applyTime(addDays(start, i), time));
    return results;
  }

  if (freq === '2x/day') {
    for (let i = 0; results.length < count; i++) {
      const day = addDays(start, Math.floor(i / 2));
      results.push(applyTime(day, i % 2 === 0 ? '08:00' : '20:00'));
    }
    return results;
  }

  if (freq === 'every other day') {
    for (let i = 0; i < count; i++) results.push(applyTime(addDays(start, i * 2), time));
    return results;
  }

  if (freq === 'monthly') {
    for (let i = 0; i < count; i++) results.push(applyTime(addMonths(start, i), time));
    return results;
  }

  if (freq === 'bi-weekly') {
    for (let i = 0; i < count; i++) {
      const weekStart = addWeeks(start, i * 2);
      const targetDay = weekdays[0] ?? 1;
      const offset = (targetDay - weekStart.getDay() + 7) % 7;
      results.push(applyTime(addDays(weekStart, offset), time));
    }
    return results;
  }

  let cursor = start;
  const maxDays = count * 21;
  while (results.length < count && differenceInDays(cursor, start) <= maxDays) {
    if (weekdays.includes(cursor.getDay())) {
      results.push(applyTime(cursor, time));
    }
    cursor = addDays(cursor, 1);
  }

  return results;
}

type PlannedDose = { at: Date; compound: string; dose: number; unit: InventoryItem['unit'] };

function matchesPet<T extends { petId?: string | null }>(row: T, petId?: string | null): boolean {
  if (!petId) return true;
  if (!row.petId) return true;
  return row.petId === petId;
}

export function inExportRange(iso: string, range: ExportRange): boolean {
  const t = new Date(iso).getTime();
  return t >= startOfDay(range.from).getTime() && t <= endOfDay(range.to).getTime();
}

export function logsInRange(
  data: PinsData,
  compounds: string[],
  range: ExportRange,
  petId?: string | null,
): InjectionLog[] {
  return data.logs
    .filter((log) => {
      if (petId && log.petId !== petId) return false;
      if (!compounds.includes(log.compound)) return false;
      return inExportRange(log.timestamp, range);
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function buildFutureDoses(
  compounds: string[],
  data: PinsData,
  options?: { start?: Date; end?: Date; petId?: string | null },
): PlannedDose[] {
  const planned: PlannedDose[] = [];
  const start = startOfDay(options?.start ?? new Date());
  const end = options?.end ? endOfDay(options.end) : null;
  const inventory = inventoryForPet(data.inventory, options?.petId ?? null);

  for (const compound of compounds) {
    const item = inventory.find((i) => i.name === compound) ?? data.inventory.find((i) => i.name === compound);
    if (!item) continue;

    const schedule = data.schedule.find(
      (s) => s.compound === compound && s.active && matchesPet(s, options?.petId),
    );
    const dose = schedule?.dose ?? item.defaultDose ?? 0;
    const unit = schedule?.unit ?? item.unit;
    const time = schedule?.time ?? '08:00';
    const frequency = item.frequency ?? 'Weekly';
    const weekdays = schedule?.days?.length ? schedule.days : defaultWeekdays(frequency);

    const total = remainingDoses(item, dose, unit);
    if (!total || !dose) continue;

    const spanDays = end ? Math.max(1, differenceInDays(end, start) + 1) : total;
    const estimate = Math.min(total, end ? spanDays * 3 : total);
    const dates = generateDoseDates(estimate, frequency, start, time, weekdays).filter((at) =>
      end ? at.getTime() <= end.getTime() : true,
    );
    dates.forEach((at) => planned.push({ at, compound, dose, unit }));
  }

  return planned.sort((a, b) => a.at.getTime() - b.at.getTime());
}

function icsDate(date: Date): string {
  return format(date, "yyyyMMdd'T'HHmmss");
}

export function buildIcsCalendar(compounds: string[], data: PinsData, options: ExportOptions): string {
  const doses = buildFutureDoses(compounds, data, {
    start: options.range.from,
    end: options.range.to,
    petId: options.petId,
  });
  const who = options.petName ? `${options.petName} · ` : '';
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pins Pets//Schedule Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  doses.forEach((dose, index) => {
    const end = new Date(dose.at.getTime() + 15 * 60 * 1000);
    lines.push(
      'BEGIN:VEVENT',
      `UID:pins-pets-${dose.compound.replace(/\s/g, '')}-${index}-${dose.at.getTime()}@pins.app`,
      `DTSTAMP:${icsDate(new Date())}`,
      `DTSTART:${icsDate(dose.at)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${who}${dose.compound} - ${dose.dose} ${dose.unit}`,
      `DESCRIPTION:Scheduled dose of ${dose.compound} (${dose.dose} ${dose.unit})${options.petName ? ` for ${options.petName}` : ''}. Import into Google or Apple Calendar.`,
      'END:VEVENT',
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function buildAdministrationText(compounds: string[], data: PinsData, options: ExportOptions): string {
  const logs = logsInRange(data, compounds, options.range, options.petId);
  const rangeLabel = `${format(options.range.from, 'yyyy-MM-dd')} to ${format(options.range.to, 'yyyy-MM-dd')}`;

  const header = [
    'PINS PETS — Administration Log',
    `Exported: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
    options.petName ? `Pet: ${options.petName}` : '',
    `Range: ${rangeLabel}`,
    `Medications: ${compounds.join(', ')}`,
    '',
  ].filter((line) => line !== '');

  if (logs.length === 0) {
    return [...header, 'No administrations in this date range for the selected medications.'].join('\n');
  }

  const body = logs.map((log: InjectionLog) => {
    const when = format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm');
    const site = log.siteId ? log.siteId.replace(/-/g, ' ') : log.medType;
    return `${when} | ${log.compound} | ${log.dose} ${log.unit} | Site: ${site}${log.notes ? ` | Notes: ${log.notes}` : ''}`;
  });

  return [...header, ...body].join('\n');
}

export function exportSchedule(
  formatType: ExportFormat,
  compounds: string[],
  data: PinsData,
  options: ExportOptions,
) {
  if (compounds.length === 0) return;

  const fromStamp = format(options.range.from, 'yyyy-MM-dd');
  const toStamp = format(options.range.to, 'yyyy-MM-dd');
  const petStamp = options.petName ? `-${options.petName.toLowerCase().replace(/\s+/g, '-')}` : '';

  if (formatType === 'calendar') {
    downloadBlob(
      buildIcsCalendar(compounds, data, options),
      `pins-pets-schedule${petStamp}-${fromStamp}-to-${toStamp}.ics`,
      'text/calendar;charset=utf-8',
    );
    return;
  }

  downloadBlob(
    buildAdministrationText(compounds, data, options),
    `pins-pets-admin-log${petStamp}-${fromStamp}-to-${toStamp}.txt`,
    'text/plain;charset=utf-8',
  );
}

export function allCompoundNames(data: PinsData, petId?: string | null): string[] {
  const names = new Set<string>();
  const inventory = inventoryForPet(data.inventory, petId ?? null);
  inventory.forEach((i) => names.add(i.name));
  data.schedule.filter((s) => matchesPet(s, petId)).forEach((s) => names.add(s.compound));
  data.logs.filter((l) => !petId || l.petId === petId).forEach((l) => names.add(l.compound));
  return Array.from(names).sort();
}