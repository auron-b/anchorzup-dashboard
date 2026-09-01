import { Injectable, computed, effect, signal } from '@angular/core';
import { GlobalFilters, DateRangePreset, WidgetConfig, WidgetLayout, WidgetSettings, WidgetType } from '../models/widget.model';
import { PersistenceService } from '../services/persistence.service';
import { presetToRange } from '../utils/date-range.util';

interface DashboardState {
  widgets: WidgetConfig[];
  filters: GlobalFilters;
}

/**
 * The dashboard's single source of truth.
 *
 * ## Why a hand-rolled signal store instead of NgRx (Signal Store or classic)
 *
 * This app has exactly one meaningful piece of shared state — the widget
 * list and the active filters — read by a handful of sibling components.
 * NgRx earns its ceremony (actions, reducers, effects, selectors) on apps
 * with many independent feature slices, undo/redo, or a team that needs a
 * strict, enforced data-flow convention. Here it would only add
 * indirection: every "rename this widget" would round-trip through an
 * action creator and a reducer to update the same array this store updates
 * directly.
 *
 * Angular's own signals primitives (signal / computed / effect) give the
 * same guarantees that matter for a dashboard like this — a single mutable
 * source of truth, derived state that recomputes only when its inputs
 * change, and fine-grained change detection with OnPush everywhere — with
 * none of the boilerplate. `effect()` is what makes persistence a one-line
 * concern: it re-runs whenever `widgets` or `filters` change and writes the
 * new snapshot to localStorage, so no component has to remember to call
 * "save" after every edit.
 *
 * If this dashboard grew into a multi-page app with independent domains
 * (auth, billing, dashboard, admin...), promoting this to an NgRx
 * SignalStore per feature would be the natural next step — it's built on
 * the exact same primitives, so the migration is additive, not a rewrite.
 */
@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private readonly widgetsSignal = signal<WidgetConfig[]>([]);
  private readonly filtersSignal = signal<GlobalFilters>({
    preset: '90d',
    range: presetToRange('90d'),
  });

  /** True once the initial load (persisted or default) has happened, so the UI can skip a layout flash. */
  readonly ready = signal(false);

  readonly widgets = this.widgetsSignal.asReadonly();
  readonly filters = this.filtersSignal.asReadonly();

  readonly visibleWidgets = computed(() => this.widgetsSignal().filter((w) => w.visible));
  readonly hiddenWidgets = computed(() => this.widgetsSignal().filter((w) => !w.visible));

  private persistTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly persistence: PersistenceService) {
    this.loadInitialState();

    // Any change to widgets or filters is exactly what a reload should
    // restore — so persist on every change, debounced so a drag or resize
    // gesture (which fires many intermediate updates) doesn't hammer
    // localStorage on every frame.
    effect(() => {
      const state: DashboardState = {
        widgets: this.widgetsSignal(),
        filters: this.filtersSignal(),
      };
      if (!this.ready()) return;
      clearTimeout(this.persistTimer);
      this.persistTimer = setTimeout(() => this.persistence.save(state), 250);
    });
  }

  // ---- filters -----------------------------------------------------

  setDateRangePreset(preset: DateRangePreset): void {
    this.filtersSignal.set({ preset, range: presetToRange(preset) });
  }

  setCustomRange(start: string, end: string): void {
    this.filtersSignal.set({ preset: 'custom', range: { start, end } });
  }

  // ---- widget layout (driven by gridster's itemChange/itemResize) ---

  updateLayout(updates: (WidgetLayout & { id: string })[]): void {
    const byId = new Map(updates.map((u) => [u.id, u]));
    this.widgetsSignal.update((widgets) =>
      widgets.map((w) => {
        const u = byId.get(w.id);
        if (!u) return w;
        return { ...w, x: u.x, y: u.y, rows: u.rows, cols: u.cols };
      }),
    );
  }

  // ---- widget settings / visibility ---------------------------------

  updateWidgetSettings(id: string, patch: Partial<WidgetSettings>): void {
    this.widgetsSignal.update((widgets) =>
      widgets.map((w) => (w.id === id ? { ...w, settings: { ...w.settings, ...patch } } : w)),
    );
  }

  renameWidget(id: string, title: string): void {
    this.widgetsSignal.update((widgets) => widgets.map((w) => (w.id === id ? { ...w, title } : w)));
  }

  setVisibility(id: string, visible: boolean): void {
    this.widgetsSignal.update((widgets) => widgets.map((w) => (w.id === id ? { ...w, visible } : w)));
  }

  removeWidget(id: string): void {
    this.widgetsSignal.update((widgets) => widgets.filter((w) => w.id !== id));
  }

  addWidget(type: WidgetType, title: string, settings: WidgetSettings): WidgetConfig {
    const widget: WidgetConfig = {
      id: crypto.randomUUID(),
      type,
      title,
      visible: true,
      settings,
      ...this.findFreeSlot(type),
    };
    this.widgetsSignal.update((widgets) => [...widgets, widget]);
    return widget;
  }

  resetToDefaults(): void {
    this.persistence.clear();
    this.widgetsSignal.set(defaultWidgets());
    this.filtersSignal.set({ preset: '90d', range: presetToRange('90d') });
  }

  // ---- internals ------------------------------------------------------

  private loadInitialState(): void {
    const persisted = this.persistence.load<DashboardState>();
    if (persisted?.widgets?.length) {
      this.widgetsSignal.set(persisted.widgets);
      this.filtersSignal.set(persisted.filters ?? { preset: '90d', range: presetToRange('90d') });
    } else {
      this.widgetsSignal.set(defaultWidgets());
    }
    this.ready.set(true);
  }

  /** Places a new widget below the current lowest-occupied row, full width. */
  private findFreeSlot(type: WidgetType): WidgetLayout {
    const widgets = this.widgetsSignal();
    const maxY = widgets.reduce((m, w) => Math.max(m, w.y + w.rows), 0);
    const size = type === 'stat' ? { rows: 2, cols: 4 } : type === 'table' ? { rows: 5, cols: 8 } : { rows: 4, cols: 6 };
    return { x: 0, y: maxY, ...size, minItemCols: 2, minItemRows: 2 };
  }
}

/** Ships with a layout that mirrors (and cleans up) the reference mock-up. */
function defaultWidgets(): WidgetConfig[] {
  return [
    {
      id: 'stat-total-sales',
      type: 'stat',
      title: 'Total Sales',
      visible: true,
      x: 0,
      y: 0,
      rows: 2,
      cols: 4,
      minItemCols: 2,
      minItemRows: 2,
      settings: { dataset: 'sales', compareToPrevious: true },
    },
    {
      id: 'stat-active-users',
      type: 'stat',
      title: 'Active Users',
      visible: true,
      x: 4,
      y: 0,
      rows: 2,
      cols: 4,
      minItemCols: 2,
      minItemRows: 2,
      settings: { dataset: 'userActivity', compareToPrevious: true },
    },
    {
      id: 'stat-engagement',
      type: 'stat',
      title: 'Engagement Rate',
      visible: true,
      x: 8,
      y: 0,
      rows: 2,
      cols: 4,
      minItemCols: 2,
      minItemRows: 2,
      settings: { dataset: 'engagement', compareToPrevious: true },
    },
    {
      id: 'chart-sales-trend',
      type: 'chart',
      title: 'Sales Trend',
      visible: true,
      x: 0,
      y: 2,
      rows: 4,
      cols: 8,
      minItemCols: 3,
      minItemRows: 3,
      settings: { dataset: 'sales', chartType: 'line' },
    },
    {
      id: 'chart-category-breakdown',
      type: 'chart',
      title: 'Sales by Category',
      visible: true,
      x: 8,
      y: 2,
      rows: 4,
      cols: 4,
      minItemCols: 3,
      minItemRows: 3,
      settings: { dataset: 'sales', chartType: 'pie' },
    },
    {
      id: 'table-customers',
      type: 'table',
      title: 'Customer Sales',
      visible: true,
      x: 0,
      y: 6,
      rows: 5,
      cols: 12,
      minItemCols: 4,
      minItemRows: 3,
      settings: { dataset: 'sales' },
    },
  ];
}
