import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  CompactType,
  DisplayGrid,
  GridsterConfig,
  GridsterItem,
  GridsterModule,
  GridType,
} from 'angular-gridster2';
import { BrandLogoIconComponent } from '../../shared/components/icon/brand-logo-icon.component';
import { FilterBarComponent } from '../../shared/components/filter-bar/filter-bar.component';
import {
  AddWidgetRequest,
  WidgetPickerComponent,
} from '../../shared/components/widget-picker/widget-picker.component';
import { StatCardWidgetComponent } from './widgets/stat-card-widget/stat-card-widget.component';
import { ChartWidgetComponent } from './widgets/chart-widget/chart-widget.component';
import { TableWidgetComponent } from './widgets/table-widget/table-widget.component';
import { DashboardStore } from '../../core/state/dashboard.store';
import {
  DATASET_LABELS,
  DatasetKey,
  DateRangePreset,
  WidgetSettings,
} from '../../core/models/widget.model';

/**
 * The dashboard page. Owns the gridster configuration and wires the store's
 * widgets/filters down into the widget components; every widget-level
 * change (drag, resize, dataset switch, remove) flows back up into
 * `DashboardStore`, which is the only place layout is ever mutated.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    GridsterModule,
    BrandLogoIconComponent,
    FilterBarComponent,
    WidgetPickerComponent,
    StatCardWidgetComponent,
    ChartWidgetComponent,
    TableWidgetComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly store = inject(DashboardStore);

  readonly widgets = this.store.visibleWidgets;
  readonly hiddenWidgets = this.store.hiddenWidgets;
  readonly filters = this.store.filters;
  readonly ready = this.store.ready;

  readonly datasetLabels = DATASET_LABELS;

  readonly justSaved = signal(false);

  readonly gridOptions: GridsterConfig = {
    gridType: GridType.VerticalFixed,
    fixedRowHeight: 56,
    minCols: 12,
    maxCols: 12,
    minRows: 4,
    margin: 12,
    outerMargin: true,
    outerMarginTop: 4,
    mobileBreakpoint: 720,
    displayGrid: DisplayGrid.OnDragAndResize,
    pushItems: true,
    swap: true,
    // Float every tile up into any gap above it, during the drag and on drop,
    // so the grid never keeps an empty row between widgets. Trade-off: a tile
    // can't be parked in a lower row on purpose — there must be something
    // above it.
    compactType: CompactType.CompactUp,
    // `ignoreContent: true` is what actually confines dragging to the header.
    // Without it gridster starts a drag from *anywhere* in the tile and
    // preventDefault()s the mousedown, which stops inputs/selects/buttons
    // inside a widget from ever receiving focus or clicks. `widget-no-drag`
    // opts the interactive bits of the header back out of the drag handle.
    draggable: {
      enabled: true,
      ignoreContent: true,
      dragHandleClass: 'widget-drag-handle',
      ignoreContentClass: 'widget-no-drag',
    },
    resizable: { enabled: true },
    itemChangeCallback: (item) => this.onItemChange(item),
    itemResizeCallback: (item) => this.onItemChange(item),
  };

  onItemChange(item: GridsterItem): void {
    const id = (item as unknown as { id: string }).id;
    this.store.updateLayout([
      { id, x: item.x, y: item.y, rows: item.rows, cols: item.cols },
    ]);
  }

  onPresetChange(preset: DateRangePreset): void {
    this.store.setDateRangePreset(preset);
  }

  onCustomRange(range: { start: string; end: string }): void {
    this.store.setCustomRange(range.start, range.end);
  }

  onSettingsChange(id: string, patch: Partial<WidgetSettings>): void {
    this.store.updateWidgetSettings(id, patch);
  }

  onRemove(id: string): void {
    this.store.setVisibility(id, false);
  }

  onRestore(id: string): void {
    this.store.setVisibility(id, true);
  }

  onAddWidget(request: AddWidgetRequest): void {
    const label = DATASET_LABELS[request.dataset];
    const typeLabel =
      request.type === 'stat'
        ? 'Stat'
        : request.type === 'table'
          ? 'Table'
          : (request.chartType ?? 'Chart');
    this.store.addWidget(request.type, `${label} ${typeLabel}`, {
      dataset: request.dataset,
      chartType: request.chartType,
      compareToPrevious: request.type === 'stat',
    });
  }

  onSaveLayout(): void {
    // Persistence already happens automatically via the store's effect();
    // this button is the explicit, discoverable affordance the mock-up
    // calls for, plus a little confirmation so "Save" doesn't feel silent.
    this.justSaved.set(true);
    setTimeout(() => this.justSaved.set(false), 1600);
  }

  onReset(): void {
    if (
      confirm(
        'Reset the dashboard to its default layout? This clears your saved customizations.',
      )
    ) {
      this.store.resetToDefaults();
    }
  }

  datasetKeys(): DatasetKey[] {
    return ['sales', 'userActivity', 'engagement'];
  }
}
