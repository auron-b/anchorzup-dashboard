/**
 * Domain models for the dashboard.
 *
 * A single "widget" is the unit of customization the acceptance criteria
 * cares about: it has a position/size on the grid, a visibility flag, and a
 * small settings bag (dataset + chart type) that the widget itself reads to
 * decide what to render. Keeping layout (gridster) and settings (business)
 * concerns in the same flat record keeps persistence trivial — the whole
 * array is exactly what we save to localStorage and restore on reload.
 */

export type DatasetKey = 'sales' | 'userActivity' | 'engagement';

export type ChartType = 'line' | 'bar' | 'pie';

export type WidgetType = 'stat' | 'chart' | 'table';

export interface DateRange {
  /** ISO date string, inclusive */
  start: string;
  /** ISO date string, inclusive */
  end: string;
}

export type DateRangePreset = '7d' | '30d' | '90d' | 'ytd' | 'custom';

export interface GlobalFilters {
  preset: DateRangePreset;
  range: DateRange;
}

export interface WidgetSettings {
  dataset: DatasetKey;
  /** Only meaningful for 'chart' widgets */
  chartType?: ChartType;
  /** Only meaningful for 'stat' widgets */
  compareToPrevious?: boolean;
}

/**
 * Gridster reads/writes x, y, rows, cols (and a couple of internal fields)
 * directly on each item, so GridsterItem is intersected in rather than
 * nested — see dashboard.store.ts for how this is kept in sync.
 */
export interface WidgetLayout {
  x: number;
  y: number;
  rows: number;
  cols: number;
  minItemRows?: number;
  minItemCols?: number;
}

export interface WidgetConfig extends WidgetLayout {
  id: string;
  type: WidgetType;
  title: string;
  visible: boolean;
  settings: WidgetSettings;
}

export const DATASET_LABELS: Record<DatasetKey, string> = {
  sales: 'Sales',
  userActivity: 'User Activity',
  engagement: 'Engagement',
};

export const DATE_PRESET_LABELS: Record<DateRangePreset, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  ytd: 'Year to date',
  custom: 'Custom range',
};
