import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DashboardStore } from './dashboard.store';
import { PersistenceService } from '../services/persistence.service';

describe('DashboardStore', () => {
  let store: DashboardStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(DashboardStore);
  });

  afterEach(() => localStorage.clear());

  it('boots with the default widget set when nothing is persisted', () => {
    expect(store.ready()).toBeTrue();
    expect(store.widgets().length).toBeGreaterThan(0);
    expect(store.visibleWidgets().length).toBe(store.widgets().length);
  });

  it('hides a widget without deleting it, and can restore it', () => {
    const id = store.widgets()[0].id;
    store.setVisibility(id, false);
    expect(store.visibleWidgets().some((w) => w.id === id)).toBeFalse();
    expect(store.hiddenWidgets().some((w) => w.id === id)).toBeTrue();

    store.setVisibility(id, true);
    expect(store.visibleWidgets().some((w) => w.id === id)).toBeTrue();
  });

  it('removeWidget deletes it outright', () => {
    const id = store.widgets()[0].id;
    const before = store.widgets().length;
    store.removeWidget(id);
    expect(store.widgets().length).toBe(before - 1);
    expect(store.widgets().some((w) => w.id === id)).toBeFalse();
  });

  it('addWidget appends a new widget with the requested settings', () => {
    const before = store.widgets().length;
    const widget = store.addWidget('chart', 'My New Chart', { dataset: 'engagement', chartType: 'bar' });
    expect(store.widgets().length).toBe(before + 1);
    expect(store.widgets().find((w) => w.id === widget.id)?.settings.dataset).toBe('engagement');
  });

  it('updateWidgetSettings patches only the given keys', () => {
    const id = store.widgets().find((w) => w.type === 'chart')!.id;
    store.updateWidgetSettings(id, { chartType: 'pie' });
    const widget = store.widgets().find((w) => w.id === id)!;
    expect(widget.settings.chartType).toBe('pie');
    expect(widget.settings.dataset).toBeTruthy(); // untouched key survives the patch
  });

  it('setDateRangePreset resolves a concrete range for the preset', () => {
    store.setDateRangePreset('7d');
    expect(store.filters().preset).toBe('7d');
    const { start, end } = store.filters().range;
    const days = (new Date(end).getTime() - new Date(start).getTime()) / 86400000;
    expect(days).toBe(6); // inclusive 7-day span
  });

  it('persists widget and filter changes to localStorage (debounced)', fakeAsync(() => {
    store.setDateRangePreset('30d');
    store.setVisibility(store.widgets()[0].id, false);
    TestBed.flushEffects(); // run the store's effect() synchronously
    tick(300); // flush the setTimeout debounce inside it

    const persisted = TestBed.inject(PersistenceService).load<{ widgets: unknown[]; filters: { preset: string } }>();
    expect(persisted).toBeTruthy();
    expect(persisted!.filters.preset).toBe('30d');
  }));

  it('resetToDefaults restores the default widget count and clears any prior save', fakeAsync(() => {
    const defaultCount = store.widgets().length;
    store.removeWidget(store.widgets()[0].id);
    TestBed.flushEffects();
    tick(300);
    expect(store.widgets().length).toBe(defaultCount - 1);

    store.resetToDefaults();
    // resetToDefaults clears storage synchronously, before the store's own
    // effect() has a chance to re-persist the restored default state.
    expect(TestBed.inject(PersistenceService).load()).toBeNull();
    expect(store.widgets().length).toBe(defaultCount);

    TestBed.flushEffects();
    tick(300); // let the debounced persist for the restored state settle
  }));
});
