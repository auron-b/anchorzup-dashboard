import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  inject,
  input,
  signal,
  computed,
  effect,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { WidgetFrameComponent } from '../../../../shared/components/widget-frame/widget-frame.component';
import { ArrowUpIconComponent } from '../../../../shared/components/icon/arrow-up-icon.component';
import { ChevronLeftIconComponent } from '../../../../shared/components/icon/chevron-left-icon.component';
import { ChevronRightIconComponent } from '../../../../shared/components/icon/chevron-right-icon.component';
import {
  DATASET_LABELS,
  DatasetKey,
  DateRange,
  WidgetConfig,
  WidgetSettings,
} from '../../../../core/models/widget.model';
import { DATASET_META } from '../../../../core/models/dataset.model';
import {
  MockDataService,
  formatByUnit,
} from '../../../../core/services/mock-data.service';
import { ExportService } from '../../../../core/services/export.service';

type SortKey = 'name' | 'email' | 'country' | 'date' | 'metric';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 8;

/**
 * Table widget: sorting, filtering and pagination all run client-side over
 * the range-filtered rows the mock "API" returns — the acceptance criteria
 * only requires the three behaviours, not server-side paging, and doing it
 * in-memory keeps this widget dependency-free (no table library needed).
 */
@Component({
  selector: 'app-table-widget',
  standalone: true,
  imports: [
    WidgetFrameComponent,
    ArrowUpIconComponent,
    ChevronLeftIconComponent,
    ChevronRightIconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-widget-frame
      [title]="config().title"
      [loading]="resource.isLoading()"
      (remove)="remove.emit()"
    >
      <div frame-controls class="table-controls">
        <select
          class="table-controls__select"
          (change)="onDatasetChange($event)"
          title="Data source"
        >
          @for (key of datasetKeys; track key) {
            <option
              [value]="key"
              [selected]="key === config().settings.dataset"
            >
              {{ datasetLabels[key] }}
            </option>
          }
        </select>
        <button
          type="button"
          class="table-controls__export"
          title="Export CSV"
          (click)="exportCsv()"
        >
          CSV
        </button>
        <button
          type="button"
          class="table-controls__export"
          title="Export PDF"
          (click)="exportPdf()"
        >
          PDF
        </button>
      </div>

      <div class="table-widget__toolbar">
        <input
          type="search"
          class="table-widget__filter"
          placeholder="Filter…"
          [value]="filterText()"
          (input)="onFilterInput($event)"
        />
        <span class="table-widget__count"
          >{{ filteredRows().length }} results</span
        >
      </div>

      @if (resource.error()) {
        <p class="table-widget__error">Couldn't load this table.</p>
      } @else {
        <div class="table-widget__scroll">
          <table class="table-widget">
            <thead>
              <tr>
                @for (col of columns; track col.key) {
                  <th
                    [class.table-widget__num]="col.numeric"
                    (click)="sortBy(col.key)"
                  >
                    <span class="table-widget__th">
                      {{ col.key === 'metric' ? metricLabel() : col.label }}
                      @if (sortState(col.key); as dir) {
                        <app-arrow-up-icon
                          class="table-widget__sort"
                          [class.table-widget__sort--desc]="dir === 'desc'"
                        />
                      }
                    </span>
                  </th>
                }
              </tr>
            </thead>
            <tbody>
              @for (row of pagedRows(); track row.id) {
                <tr>
                  <td>{{ row.name }}</td>
                  <td class="table-widget__muted">{{ row.email }}</td>
                  <td>{{ row.country }}</td>
                  <td class="table-widget__muted">{{ row.date }}</td>
                  <td class="table-widget__num">
                    {{ formatMetric(row.metric) }}
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="table-widget__empty">
                    No rows match your filter.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="table-widget__pagination">
          <span>{{ pageRangeLabel() }}</span>
          <div class="table-widget__pager">
            <button
              type="button"
              aria-label="Previous page"
              [disabled]="page() === 0"
              (click)="page.set(page() - 1)"
            >
              <app-chevron-left-icon />
            </button>
            <button
              type="button"
              aria-label="Next page"
              [disabled]="page() >= totalPages() - 1"
              (click)="page.set(page() + 1)"
            >
              <app-chevron-right-icon />
            </button>
          </div>
        </div>
      }
    </app-widget-frame>
  `,
  styleUrl: './table-widget.component.scss',
})
export class TableWidgetComponent {
  readonly config = input.required<WidgetConfig>();
  readonly range = input.required<DateRange>();

  @Output() readonly settingsChange = new EventEmitter<
    Partial<WidgetSettings>
  >();
  @Output() readonly remove = new EventEmitter<void>();

  private readonly mockData = inject(MockDataService);
  private readonly exportSvc = inject(ExportService);

  readonly datasetLabels = DATASET_LABELS;
  readonly datasetKeys: DatasetKey[] = ['sales', 'userActivity', 'engagement'];

  /** Sortable columns, in display order. `metric` takes its label from the dataset. */
  readonly columns: ReadonlyArray<{
    key: SortKey;
    label: string;
    numeric?: boolean;
  }> = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'country', label: 'Country' },
    { key: 'date', label: 'Date' },
    { key: 'metric', label: '', numeric: true },
  ];

  readonly filterText = signal('');
  readonly sortKey = signal<SortKey>('date');
  readonly sortDir = signal<SortDir>('desc');
  readonly page = signal(0);

  readonly resource = rxResource({
    request: () => ({
      dataset: this.config().settings.dataset,
      range: this.range(),
    }),
    loader: ({ request }) =>
      this.mockData.getTableRows(request.dataset, request.range),
  });

  readonly filteredRows = computed(() => {
    const rows = this.resource.value() ?? [];
    const q = this.filterText().trim().toLowerCase();
    const filtered = q
      ? rows.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.email.toLowerCase().includes(q) ||
            r.country.toLowerCase().includes(q),
        )
      : rows;

    const key = this.sortKey();
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (typeof av === 'number' && typeof bv === 'number')
        return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredRows().length / PAGE_SIZE)),
  );

  readonly pagedRows = computed(() => {
    const start = this.page() * PAGE_SIZE;
    return this.filteredRows().slice(start, start + PAGE_SIZE);
  });

  constructor() {
    // Any change to the underlying rows or the filter text can strand the
    // current page past the end (or, when switching to a smaller dataset,
    // is a good time to reset to a familiar view) — snap back to page 0.
    effect(() => {
      this.filteredRows();
      this.page.set(0);
    });
  }

  metricLabel(): string {
    return DATASET_META[this.config().settings.dataset].metricLabel;
  }

  formatMetric(value: number): string {
    return formatByUnit(
      value,
      DATASET_META[this.config().settings.dataset].unit,
    );
  }

  pageRangeLabel(): string {
    const total = this.filteredRows().length;
    if (total === 0) return '0 of 0';
    const start = this.page() * PAGE_SIZE + 1;
    const end = Math.min(total, start + PAGE_SIZE - 1);
    return `${start}–${end} of ${total}`;
  }

  sortBy(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  /** Sort direction for `key`, or null when the table isn't sorted by it. */
  sortState(key: SortKey): SortDir | null {
    return this.sortKey() === key ? this.sortDir() : null;
  }

  onFilterInput(event: Event): void {
    this.filterText.set((event.target as HTMLInputElement).value);
  }

  onDatasetChange(event: Event): void {
    this.settingsChange.emit({
      dataset: (event.target as HTMLSelectElement).value as DatasetKey,
    });
  }

  exportCsv(): void {
    const meta = DATASET_META[this.config().settings.dataset];
    this.exportSvc.exportRowsToCsv(
      this.config().title,
      [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'country', label: 'Country' },
        { key: 'date', label: 'Date' },
        { key: 'metric', label: meta.metricLabel },
      ],
      this.filteredRows(),
    );
  }

  exportPdf(): void {
    const meta = DATASET_META[this.config().settings.dataset];
    this.exportSvc.exportRowsToPdf(
      this.config().title,
      [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'country', label: 'Country' },
        { key: 'date', label: 'Date' },
        { key: 'metric', label: meta.metricLabel },
      ],
      this.filteredRows().map((r) => ({
        ...r,
        metric: this.formatMetric(r.metric),
      })),
    );
  }
}
