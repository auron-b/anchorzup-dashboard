import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { WidgetFrameComponent } from '../../../../shared/components/widget-frame/widget-frame.component';
import { DATASET_LABELS, DatasetKey, DateRange, WidgetConfig, WidgetSettings } from '../../../../core/models/widget.model';
import { MockDataService } from '../../../../core/services/mock-data.service';

/**
 * KPI stat card. Data fetching uses Angular's `rxResource()` — the request
 * object is a small computed tuple of (dataset, range); whenever either
 * changes, the resource automatically cancels the in-flight load and
 * re-fetches, exposing `.value()`, `.isLoading()` and `.error()` as plain
 * signals. This replaces what would otherwise be a manual
 * `combineLatest` + `subscribe` + `signal.set()` dance in every widget.
 */
@Component({
  selector: 'app-stat-card-widget',
  standalone: true,
  imports: [WidgetFrameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-widget-frame [title]="config().title" [loading]="resource.isLoading()" (remove)="remove.emit()">
      <select
        frame-controls
        class="stat-card__dataset"
        (change)="onDatasetChange($event)"
        title="Data source"
      >
        @for (key of datasetKeys; track key) {
          <option [value]="key" [selected]="key === config().settings.dataset">{{ datasetLabels[key] }}</option>
        }
      </select>

      @if (resource.error()) {
        <p class="stat-card__error">Couldn't load this metric.</p>
      } @else {
        <div class="stat-card">
          <p class="stat-card__value">{{ resource.value()?.formatted ?? '—' }}</p>
          @if (config().settings.compareToPrevious && resource.value()) {
            <p
              class="stat-card__delta"
              [class.stat-card__delta--up]="(resource.value()?.deltaPct ?? 0) >= 0"
              [class.stat-card__delta--down]="(resource.value()?.deltaPct ?? 0) < 0"
            >
              <span>{{ (resource.value()?.deltaPct ?? 0) >= 0 ? '▲' : '▼' }}</span>
              {{ absPct(resource.value()?.deltaPct) }}% vs previous period
            </p>
          }
        </div>
      }
    </app-widget-frame>
  `,
  styleUrl: './stat-card-widget.component.scss',
})
export class StatCardWidgetComponent {
  readonly config = input.required<WidgetConfig>();
  readonly range = input.required<DateRange>();

  @Output() readonly settingsChange = new EventEmitter<Partial<WidgetSettings>>();
  @Output() readonly remove = new EventEmitter<void>();

  private readonly mockData = inject(MockDataService);
  readonly datasetLabels = DATASET_LABELS;
  readonly datasetKeys: DatasetKey[] = ['sales', 'userActivity', 'engagement'];

  readonly resource = rxResource({
    request: () => ({ dataset: this.config().settings.dataset, range: this.range() }),
    loader: ({ request }) => this.mockData.getStatSummary(request.dataset, request.range),
  });

  onDatasetChange(event: Event): void {
    const dataset = (event.target as HTMLSelectElement).value as DatasetKey;
    this.settingsChange.emit({ dataset });
  }

  absPct(value: number | undefined): string {
    return Math.abs(value ?? 0).toFixed(1);
  }
}
