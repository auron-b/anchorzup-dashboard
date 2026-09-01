import { ChangeDetectionStrategy, Component, EventEmitter, Output, input } from '@angular/core';
import { DATE_PRESET_LABELS, DateRange, DateRangePreset } from '../../../core/models/widget.model';
import { formatRangeLabel } from '../../../core/utils/date-range.util';

const PRESETS: DateRangePreset[] = ['7d', '30d', '90d', 'ytd'];

/**
 * The global filter required by the brief: one control that updates every
 * visible widget simultaneously. Presentational only — the dashboard page
 * owns the actual filter state and passes it down as inputs.
 */
@Component({
  selector: 'app-filter-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filter-bar">
      <span class="filter-bar__label">Date range</span>
      <div class="filter-bar__presets" role="group" aria-label="Date range presets">
        @for (preset of presets; track preset) {
          <button
            type="button"
            class="filter-bar__chip"
            [class.filter-bar__chip--active]="preset === activePreset()"
            (click)="presetChange.emit(preset)"
          >
            {{ presetLabels[preset] }}
          </button>
        }
      </div>

      <span class="filter-bar__divider" aria-hidden="true"></span>

      <label class="filter-bar__custom">
        <input
          type="date"
          [value]="range().start"
          [max]="range().end"
          (change)="onStart($event)"
        />
        <span>–</span>
        <input
          type="date"
          [value]="range().end"
          [min]="range().start"
          (change)="onEnd($event)"
        />
      </label>

      <span class="filter-bar__resolved">{{ resolvedLabel() }}</span>
    </div>
  `,
  styleUrl: './filter-bar.component.scss',
})
export class FilterBarComponent {
  readonly activePreset = input.required<DateRangePreset>();
  readonly range = input.required<DateRange>();

  @Output() readonly presetChange = new EventEmitter<DateRangePreset>();
  @Output() readonly customRangeChange = new EventEmitter<DateRange>();

  readonly presets = PRESETS;
  readonly presetLabels = DATE_PRESET_LABELS;

  resolvedLabel(): string {
    return formatRangeLabel(this.range());
  }

  onStart(event: Event): void {
    const start = (event.target as HTMLInputElement).value;
    if (!start) return;
    this.customRangeChange.emit({ start, end: this.range().end });
  }

  onEnd(event: Event): void {
    const end = (event.target as HTMLInputElement).value;
    if (!end) return;
    this.customRangeChange.emit({ start: this.range().start, end });
  }
}
