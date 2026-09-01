import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  input,
} from '@angular/core';
import { XIconComponent } from '../icon/x-icon.component';

/**
 * Chrome shared by every widget type: drag handle, title, an optional
 * per-widget controls slot (dataset/chart-type pickers), a remove button,
 * and a loading overlay while the "API" call for that widget is in flight.
 *
 * The header carries gridster's `widget-drag-handle` class so a drag can
 * only start there — never from the body (tables, filters, pagination) or
 * from the header's own controls/remove button, which opt out via
 * `widget-no-drag`. This pairs with `draggable.ignoreContent: true` in the
 * dashboard's gridster config.
 */
@Component({
  selector: 'app-widget-frame',
  standalone: true,
  imports: [XIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="widget-frame">
      <header class="widget-frame__header widget-drag-handle">
        <span class="widget-frame__title">{{ title() }}</span>
        <div class="widget-frame__controls widget-no-drag">
          <ng-content select="[frame-controls]" />
        </div>
        <button
          type="button"
          class="widget-frame__icon-btn widget-no-drag"
          title="Remove widget"
          aria-label="Remove widget"
          (click)="remove.emit()"
        >
          <app-x-icon />
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
