import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Output, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ChartType,
  DATASET_LABELS,
  DatasetKey,
  WidgetConfig,
  WidgetType,
} from '../../../core/models/widget.model';

export interface AddWidgetRequest {
  type: WidgetType;
  dataset: DatasetKey;
  chartType?: ChartType;
}

/**
 * Covers "choose which widgets or data sources to display": a popover that
 * lets the user bring back a hidden widget, or create a brand-new one by
 * picking its type + dataset (+ chart type).
 */
@Component({
  selector: 'app-widget-picker',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="widget-picker">
      <button type="button" class="widget-picker__trigger" (click)="open.set(!open())">
        + Add widget
      </button>

      @if (open()) {
        <div class="widget-picker__panel">
          @if (hiddenWidgets().length) {
            <div class="widget-picker__section">
              <h4>Hidden widgets</h4>
              @for (w of hiddenWidgets(); track w.id) {
                <button type="button" class="widget-picker__row" (click)="restore.emit(w.id)">
                  <span>{{ w.title }}</span>
                  <span class="widget-picker__pill">show</span>
                </button>
              }
            </div>
            <hr />
          }

          <div class="widget-picker__section">
            <h4>New widget</h4>

            <label>
              Type
              <select [ngModel]="newType()" (ngModelChange)="newType.set($event)">
                <option value="stat">Stat card</option>
                <option value="chart">Chart</option>
                <option value="table">Table</option>
              </select>
            </label>

            <label>
              Data source
              <select [ngModel]="newDataset()" (ngModelChange)="newDataset.set($event)">
                <option value="sales">Sales</option>
                <option value="userActivity">User Activity</option>
                <option value="engagement">Engagement</option>
              </select>
            </label>

            @if (newType() === 'chart') {
              <label>
                Chart type
                <select [ngModel]="newChartType()" (ngModelChange)="newChartType.set($event)">
                  <option value="line">Line</option>
                  <option value="bar">Bar</option>
                  <option value="pie">Pie</option>
                </select>
              </label>
            }

            <button type="button" class="widget-picker__add" (click)="onAdd()">Add to dashboard</button>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './widget-picker.component.scss',
  // ngModel used deliberately for this tiny local form — see FormsModule import below.
})
export class WidgetPickerComponent {
  readonly hiddenWidgets = input.required<WidgetConfig[]>();

  @Output() readonly restore = new EventEmitter<string>();
  @Output() readonly addWidget = new EventEmitter<AddWidgetRequest>();

  readonly open = signal(false);
  readonly datasetLabels = DATASET_LABELS;

  newType = signal<WidgetType>('chart');
  newDataset = signal<DatasetKey>('sales');
  newChartType = signal<ChartType>('line');

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  onAdd(): void {
    this.addWidget.emit({
      type: this.newType(),
      dataset: this.newDataset(),
      chartType: this.newType() === 'chart' ? this.newChartType() : undefined,
    });
    this.open.set(false);
  }
}
