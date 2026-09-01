import { TestBed } from '@angular/core/testing';
import { MockDataService, formatByUnit } from './mock-data.service';

describe('MockDataService', () => {
  let service: MockDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MockDataService);
  });

  it('is created', () => {
    expect(service).toBeTruthy();
  });

  it('returns one series point per day in the requested range', (done) => {
    service.getSeries('sales', { start: '2026-08-01', end: '2026-08-10' }).subscribe((points) => {
      expect(points.length).toBe(10);
      expect(points[0].date).toBe('2026-08-01');
      expect(points[points.length - 1].date).toBe('2026-08-10');
      points.forEach((p) => expect(Number.isFinite(p.value)).toBeTrue());
      done();
    });
  });

  it('returns an empty series for a range outside the generated window', (done) => {
    service.getSeries('sales', { start: '1990-01-01', end: '1990-01-02' }).subscribe((points) => {
      expect(points).toEqual([]);
      done();
    });
  });

  it('breakdown slices sum to (approximately) the range total', (done) => {
    const range = { start: '2026-08-01', end: '2026-08-31' };
    service.getSeries('sales', range).subscribe((series) => {
      const total = series.reduce((s, p) => s + p.value, 0);
      service.getBreakdown('sales', range).subscribe((slices) => {
        const sliceTotal = slices.reduce((s, sl) => s + sl.value, 0);
        // Weights are normalized floats rounded per-slice, so allow a small
        // rounding tolerance rather than requiring an exact match.
        expect(Math.abs(sliceTotal - total)).toBeLessThan(slices.length + 1);
        done();
      });
    });
  });

  it('drilling into a category returns that category\'s sub-categories', (done) => {
    const range = { start: '2026-08-01', end: '2026-08-31' };
    service.getBreakdown('sales', range).subscribe((top) => {
      const drillable = top.find((s) => s.drillable);
      expect(drillable).toBeTruthy();
      service.getBreakdown('sales', range, drillable!.category).subscribe((sub) => {
        expect(sub.length).toBeGreaterThan(0);
        expect(sub.every((s) => !top.some((t) => t.category === s.category))).toBeTrue();
        done();
      });
    });
  });

  it('table rows are restricted to the requested date range', (done) => {
    const range = { start: '2026-08-01', end: '2026-08-07' };
    service.getTableRows('sales', range).subscribe((rows) => {
      expect(rows.every((r) => r.date >= range.start && r.date <= range.end)).toBeTrue();
      done();
    });
  });

  it('stat summary reports a percentage delta vs the prior equal-length period', (done) => {
    service.getStatSummary('engagement', { start: '2026-08-01', end: '2026-08-10' }).subscribe((summary) => {
      expect(typeof summary.deltaPct).toBe('number');
      expect(summary.formatted).toContain('%');
      done();
    });
  });
});

describe('formatByUnit', () => {
  it('formats currency without decimals', () => {
    expect(formatByUnit(1234, 'currency')).toBe('$1,234');
  });

  it('formats percent with one decimal', () => {
    expect(formatByUnit(3.456, 'percent')).toBe('3.5%');
  });

  it('formats counts with thousands separators', () => {
    expect(formatByUnit(108443, 'count')).toBe('108,443');
  });
});
