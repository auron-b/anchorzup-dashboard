import { Injectable } from '@angular/core';
import { faker } from '@faker-js/faker';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { DatasetKey, DateRange } from '../models/widget.model';
import { BreakdownSlice, DATASET_META, SeriesPoint, StatSummary, TableRow } from '../models/dataset.model';

/**
 * Stands in for a real backend.
 *
 * The brief allows "JSON objects or mock API endpoints" — this does both:
 * realistic-looking records are generated once with Faker.js (seeded, so the
 * dashboard looks the same on every reload instead of jittering on every
 * refresh), then every read goes through an Observable with a small
 * artificial network delay, exactly like an HTTP call would. That's what
 * lets the widgets show a real loading state instead of just "loading" in
 * theory.
 *
 * Data is generated once per dataset for a full trailing year and cached in
 * memory; date-range "queries" filter that cache, the same way a real API
 * would filter rows server-side.
 */
@Injectable({ providedIn: 'root' })
export class MockDataService {
  private readonly days = 365;
  private readonly today = startOfDay(new Date());

  private readonly seriesCache = new Map<DatasetKey, SeriesPoint[]>();
  private readonly rowsCache = new Map<DatasetKey, TableRow[]>();
  private readonly categoryWeightsCache = new Map<DatasetKey, Map<string, number[]>>();

  constructor() {
    faker.seed(20260901);
    for (const key of Object.keys(DATASET_META) as DatasetKey[]) {
      this.seriesCache.set(key, this.buildSeries(key));
      this.rowsCache.set(key, this.buildRows(key));
    }
  }

  /** Daily time series for the requested range — powers line/bar charts. */
  getSeries(dataset: DatasetKey, range: DateRange): Observable<SeriesPoint[]> {
    const all = this.seriesCache.get(dataset)!;
    const points = all.filter((p) => p.date >= range.start && p.date <= range.end);
    return this.simulateNetwork(points);
  }

  /** Category totals for the range. Pass `parent` to drill into its sub-categories. */
  getBreakdown(dataset: DatasetKey, range: DateRange, parent?: string): Observable<BreakdownSlice[]> {
    const meta = DATASET_META[dataset];
    const labels = parent ? meta.subCategories[parent] ?? [] : meta.categories;
    const weights = this.categoryWeights(dataset, labels);
    const total = this.rangeTotal(dataset, range);

    const slices: BreakdownSlice[] = labels.map((category, i) => ({
      category,
      value: Math.round(total * weights[i]),
      drillable: !parent && !!meta.subCategories[category]?.length,
    }));
    return this.simulateNetwork(slices);
  }

  /** Headline KPI for a stat card: current-range total/avg plus % change vs the prior period of equal length. */
  getStatSummary(dataset: DatasetKey, range: DateRange): Observable<StatSummary> {
    const meta = DATASET_META[dataset];
    const current = this.aggregate(dataset, range);

    const spanDays = daysBetween(range.start, range.end) + 1;
    const prevEnd = addDays(range.start, -1);
    const prevStart = addDays(prevEnd, -(spanDays - 1));
    const previous = this.aggregate(dataset, { start: prevStart, end: prevEnd });

    const deltaPct = previous === 0 ? 0 : ((current - previous) / previous) * 100;

    return this.simulateNetwork({
      label: meta.statLabel,
      value: current,
      formatted: formatByUnit(current, meta.unit),
      deltaPct: Math.round(deltaPct * 10) / 10,
    });
  }

  /** Row-level records for the table widget, filtered to the active range. */
  getTableRows(dataset: DatasetKey, range: DateRange): Observable<TableRow[]> {
    const all = this.rowsCache.get(dataset)!;
    const rows = all.filter((r) => r.date >= range.start && r.date <= range.end);
    return this.simulateNetwork(rows);
  }

  // ---- internals -----------------------------------------------------

  private simulateNetwork<T>(value: T): Observable<T> {
    return of(value).pipe(delay(150 + Math.round(faker.number.float({ min: 0, max: 1 }) * 350)));
  }

  private aggregate(dataset: DatasetKey, range: DateRange): number {
    const all = this.seriesCache.get(dataset)!;
    const points = all.filter((p) => p.date >= range.start && p.date <= range.end);
    if (points.length === 0) return 0;
    const sum = points.reduce((s, p) => s + p.value, 0);
    return DATASET_META[dataset].unit === 'percent' ? sum / points.length : sum;
  }

  private rangeTotal(dataset: DatasetKey, range: DateRange): number {
    const all = this.seriesCache.get(dataset)!;
    const points = all.filter((p) => p.date >= range.start && p.date <= range.end);
    return points.reduce((s, p) => s + p.value, 0);
  }

  private categoryWeights(dataset: DatasetKey, labels: string[]): number[] {
    let byParent = this.categoryWeightsCache.get(dataset);
    if (!byParent) {
      byParent = new Map();
      this.categoryWeightsCache.set(dataset, byParent);
    }
    const cacheKey = labels.join('|');
    let weights = byParent.get(cacheKey);
    if (!weights) {
      const raw = labels.map(() => faker.number.float({ min: 0.4, max: 1 }));
      const sum = raw.reduce((s, v) => s + v, 0);
      weights = raw.map((v) => v / sum);
      byParent.set(cacheKey, weights);
    }
    return weights;
  }

  /** Base + weekly seasonality + slow trend + noise, tuned per dataset unit. */
  private buildSeries(dataset: DatasetKey): SeriesPoint[] {
    const meta = DATASET_META[dataset];
    const base = meta.unit === 'currency' ? 1400 : meta.unit === 'count' ? 900 : 3.2;
    const noiseScale = meta.unit === 'percent' ? 0.4 : base * 0.18;
    const trendPerDay = (meta.unit === 'percent' ? 0.002 : base * 0.0015);

    const points: SeriesPoint[] = [];
    for (let i = this.days - 1; i >= 0; i--) {
      const date = addDays(toIso(this.today), -i);
      const dow = new Date(date + 'T00:00:00').getDay();
      const weekendFactor = meta.key === 'sales' ? (dow === 0 || dow === 6 ? 1.25 : 1) : dow === 0 || dow === 6 ? 0.7 : 1;
      const seasonality = 1 + 0.15 * Math.sin((i / 7) * Math.PI * 2);
      const trend = trendPerDay * (this.days - i);
      const noise = faker.number.float({ min: -1, max: 1 }) * noiseScale;

      let value = (base + trend) * weekendFactor * seasonality + noise;
      if (meta.unit === 'percent') value = clamp(value, 0.2, 12);
      else value = Math.max(0, Math.round(value));

      points.push({ date, value: meta.unit === 'percent' ? Math.round(value * 100) / 100 : value });
    }
    return points;
  }

  private buildRows(dataset: DatasetKey): TableRow[] {
    const meta = DATASET_META[dataset];
    const count = 48;
    const rows: TableRow[] = [];
    for (let i = 0; i < count; i++) {
      const daysAgo = faker.number.int({ min: 0, max: this.days - 1 });
      const metric =
        meta.unit === 'currency'
          ? faker.number.int({ min: 40, max: 2200 })
          : meta.unit === 'count'
            ? faker.number.int({ min: 1, max: 480 })
            : faker.number.float({ min: 0.3, max: 11.5, fractionDigits: 2 });

      rows.push({
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        country: faker.location.country(),
        date: addDays(toIso(this.today), -daysAgo),
        metric,
      });
    }
    return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
  }
}

// ---- date/format helpers ---------------------------------------------

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(iso: string, delta: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return toIso(d);
}

function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso + 'T00:00:00').getTime();
  const end = new Date(endIso + 'T00:00:00').getTime();
  return Math.round((end - start) / 86400000);
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function formatByUnit(value: number, unit: 'currency' | 'count' | 'percent'): string {
  if (unit === 'currency') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  }
  if (unit === 'percent') {
    return `${value.toFixed(1)}%`;
  }
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

export { toIso as isoToday, addDays as addDaysIso };
