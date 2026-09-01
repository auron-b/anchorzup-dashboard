import { ChangeDetectionStrategy, Component, EventEmitter, Output, input } from '@angular/core';

/**
 * Chrome shared by every widget type: drag handle, title, an optional
 * per-widget controls slot (dataset/chart-type pickers), a remove button,
 * and a loading overlay while the "API" call for that widget is in flight.
 *
 * Only the header carries gridster's drag-handle class, so dragging never
 * fights with scrolling a table or hovering a chart tooltip.
 */
@Component({
  selector: 'app-widget-frame',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="widget-frame">
      <header class="widget-frame__header widget-drag-handle">
        <span class="widget-frame__title">{{ title() }}</span>
        <div class="widget-frame__controls">
          <ng-content select="[frame-controls]" />
        </div>
        <button
          type="button"
          class="widget-frame__icon-btn"
          title="Remove widget"
          aria-label="Remove widget"
          (click)="remove.emit()"
        >
          ✕
        </button>
      </header>

      <div class="widget-frame__body">
        @if (loading()) {
          <div class="widget-frame__loading" aria-live="polite">
            <span class="widget-frame__spinner"></span>
          </div>
        }
        <ng-content />
      </div>
    </div>
  `,
  styleUrl: './widget-frame.component.scss',
})
export class WidgetFrameComponent {
  readonly title = input.required<string>();
  readonly loading = input(false);

  @Output() readonly remove = new EventEmitter<void>();
}
