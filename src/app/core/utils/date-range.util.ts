import { DateRange, DateRangePreset } from '../models/widget.model';

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, delta: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + delta);
  return copy;
}

/** Resolves a named preset into a concrete { start, end } pair, anchored on "today". */
export function presetToRange(preset: DateRangePreset, today: Date = new Date()): DateRange {
  const end = new Date(today);
  end.setHours(0, 0, 0, 0);

  switch (preset) {
    case '7d':
      return { start: toIso(addDays(end, -6)), end: toIso(end) };
    case '30d':
      return { start: toIso(addDays(end, -29)), end: toIso(end) };
    case '90d':
      return { start: toIso(addDays(end, -89)), end: toIso(end) };
    case 'ytd': {
      const jan1 = new Date(end.getFullYear(), 0, 1);
      return { start: toIso(jan1), end: toIso(end) };
    }
    case 'custom':
    default:
      return { start: toIso(addDays(end, -29)), end: toIso(end) };
  }
}

export function formatRangeLabel(range: DateRange): string {
  const fmt = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(range.start)} – ${fmt(range.end)}`;
}
