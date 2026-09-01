import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject, input, signal, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsCoreOption, ECElementEvent } from 'echarts/core';
import { WidgetFrameComponent } from '../../../../shared/components/widget-frame/widget-frame.component';
import {
  ChartType,
  DATASET_LABELS,
  DatasetKey,
  DateRange,
  WidgetConfig,
  WidgetSettings,
} from '../../../../core/models/widget.model';
import { DATASET_META } from '../../../../core/models/dataset.model';
import { MockDataService, formatByUnit } from '../../../../core/services/mock-data.service';
import { ExportService } from '../../../../core/services/export.service';

type ChartData =
  | { kind: 'series'; points: { date: string; value: number }[] }
  | { kind: 'breakdown'; slices: { category: string; value: number; drillable?: boolean }[] };

const PALETTE = ['#6c4ce0', '#9c8bf0', '#3fbf8f', '#f2a93c', '#ef6a6a', '#4fb2e0'];

/**
 * Chart widget backed by Apache ECharts (via ngx-echarts).
 *
 * Chart type is more than a re-skin: "line" queries the dataset's daily
 * time series (a trend), while "bar"/"pie" query a category breakdown of
 * the same dataset — which is what makes drill-down meaningful (click a
 * category to see its sub-categories). Zoom (dataZoom) is offered on the
 * trend view where "zooming into a date range" actually means something;
 * bar/pie lean on ECharts' native rich tooltips and click-to-drill instead.
 * All three bonus chart features end up covered, each where it naturally
 * fits, rather than bolted onto every chart type uniformly.
 */
@Component({
  selector: 'app-chart-widget',
  standalone: true,
  imports: [WidgetFrameComponent, NgxEchartsDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-widget-frame [title]="config().title" [loading]="resource.isLoading()" (remove)="remove.emit()">
      <div frame-controls class="chart-controls">
        @if (drillPath().length) {
          <button type="button" class="chart-controls__back" (click)="drillPath.set([])">
            ← All {{ datasetLabels[config().settings.dataset] }}
          </button>
        }
        <select
          class="chart-controls__select"
          (change)="onDatasetChange($event)"
          title="Data source"
        >
          @for (key of datasetKeys; track key) {
            <option [value]="key" [selected]="key === config().settings.dataset">{{ datasetLabels[key] }}</option>
          }
        </select>
        <div class="chart-controls__types" role="group" aria-label="Chart type">
          @for (type of chartTypes; track type) {
            <button
              type="button"
              class="chart-controls__type"
              [class.chart-controls__type--active]="type === activeChartType()"
              (click)="onChartTypeChange(type)"
              [title]="type"
            >
              {{ typeIcon[type] }}
            </button>
          }
        </div>
        <button type="button" class="chart-controls__export" title="Export chart as PDF" (click)="exportPdf()">⇩</button>
      </div>

      @if (resource.error()) {
        <p class="chart-widget__error">Couldn't load this chart.</p>
      } @else {
        <div class="chart-widget__canvas">
          <div
            echarts
            #chartRef="echarts"
            class="chart-widget__echart"
            [options]="chartOption()"
            [autoResize]="true"
            (chartClick)="onChartClick($event)"
            (chartInit)="onChartInit($event)"
          ></div>
        </div>
      }
    </app-widget-frame>
  `,
  styleUrl: './chart-widget.component.scss',
})
export class ChartWidgetComponent {
  readonly config = input.required<WidgetConfig>();
  readonly range = input.required<DateRange>();

  @Output() readonly settingsChange = new EventEmitter<Partial<WidgetSettings>>();
  @Output() readonly remove = new EventEmitter<void>();

  private readonly mockData = inject(MockDataService);
  private readonly exportSvc = inject(ExportService);

  readonly datasetLabels = DATASET_LABELS;
  readonly datasetKeys: DatasetKey[] = ['sales', 'userActivity', 'engagement'];
  readonly chartTypes: ChartType[] = ['line', 'bar', 'pie'];
  readonly typeIcon: Record<ChartType, string> = { line: '📈', bar: '📊', pie: '🥧' };

  /** Which category we've drilled into, top-of-stack first (max depth 1 for this dataset shape). */
  readonly drillPath = signal<string[]>([]);

  readonly activeChartType = computed<ChartType>(() => this.config().settings.chartType ?? 'line');

  private echartsInstance: unknown;

  readonly resource = rxResource({
    request: () => ({
      dataset: this.config().settings.dataset,
      chartType: this.activeChartType(),
      range: this.range(),
      parent: this.drillPath()[0],
    }),
    loader: ({ request }): import('rxjs').Observable<ChartData> => {
      if (request.chartType === 'line') {
        return this.mockData
          .getSeries(request.dataset, request.range)
          .pipe(map((points) => ({ kind: 'series', points }) as const));
      }
      return this.mockData
        .getBreakdown(request.dataset, request.range, request.parent)
        .pipe(map((slices) => ({ kind: 'breakdown', slices }) as const));
    },
  });

  readonly chartOption = computed<EChartsCoreOption>(() => {
    const data = this.resource.value();
    const dataset = this.config().settings.dataset;
    const type = this.activeChartType();
    const unit = DATASET_META[dataset].unit;

    if (!data) return {};

    if (data.kind === 'series') {
      return buildTrendOption(data.points, unit);
    }
    return type === 'pie' ? buildPieOption(data.slices, unit) : buildBarOption(data.slices, unit);
  });

  onDatasetChange(event: Event): void {
    this.drillPath.set([]);
    this.settingsChange.emit({ dataset: (event.target as HTMLSelectElement).value as DatasetKey });
  }

  onChartTypeChange(type: ChartType): void {
    this.drillPath.set([]);
    this.settingsChange.emit({ chartType: type });
  }

  onChartClick(event: ECElementEvent): void {
    const data = this.resource.value();
    if (!data || data.kind !== 'breakdown' || this.drillPath().length) return;
    const name = event.name;
    const slice = data.slices.find((s) => s.category === name);
    if (slice?.drillable) {
      this.drillPath.set([name]);
    }
  }

  onChartInit(instance: unknown): void {
    this.echartsInstance = instance;
  }

  exportPdf(): void {
    const instance = this.echartsInstance as { getDataURL: (opts: object) => string; getWidth: () => number; getHeight: () => number } | undefined;
    if (!instance) return;
    const dataUrl = instance.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' });
    this.exportSvc.exportImageToPdf(this.config().title, dataUrl, instance.getWidth(), instance.getHeight());
  }
}

// ---- option builders ----------------------------------------------------

function buildTrendOption(points: { date: string; value: number }[], unit: 'currency' | 'count' | 'percent'): EChartsCoreOption {
  return {
    color: [PALETTE[0]],
    grid: { left: 8, right: 12, top: 16, bottom: 44, containLabel: true },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v: unknown) => formatByUnit(Number(v), unit),
    },
    xAxis: {
      type: 'category',
      data: points.map((p) => p.date),
      boundaryGap: false,
      axisLabel: { fontSize: 10, color: '#a5a2bd' },
      axisLine: { lineStyle: { color: '#e6e5f2' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 10, color: '#a5a2bd', formatter: (v: number) => compact(v, unit) },
      splitLine: { lineStyle: { color: '#f0eff8' } },
    },
    dataZoom: [
      { type: 'inside', throttle: 50 },
      { type: 'slider', height: 14, bottom: 6, borderColor: 'transparent', backgroundColor: '#fafaff', fillerColor: 'rgba(108,76,224,0.15)', handleSize: 14 },
    ],
    series: [
      {
        type: 'line',
        data: points.map((p) => p.value),
        smooth: true,
        symbol: 'none',
        areaStyle: { opacity: 0.08 },
        lineStyle: { width: 2.5 },
      },
    ],
  };
}

function buildBarOption(slices: { category: string; value: number; drillable?: boolean }[], unit: 'currency' | 'count' | 'percent'): EChartsCoreOption {
  return {
    color: [PALETTE[0]],
    grid: { left: 8, right: 12, top: 16, bottom: 32, containLabel: true },
    tooltip: {
      trigger: 'item',
      valueFormatter: (v: unknown) => formatByUnit(Number(v), unit),
    },
    xAxis: {
      type: 'category',
      data: slices.map((s) => s.category),
      axisLabel: { fontSize: 10, color: '#a5a2bd', interval: 0, rotate: slices.length > 4 ? 20 : 0 },
      axisLine: { lineStyle: { color: '#e6e5f2' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 10, color: '#a5a2bd', formatter: (v: number) => compact(v, unit) },
      splitLine: { lineStyle: { color: '#f0eff8' } },
    },
    series: [
      {
        type: 'bar',
        data: slices.map((s) => s.value),
        barMaxWidth: 42,
        itemStyle: { borderRadius: [6, 6, 0, 0], color: PALETTE[0] },
        cursor: slices.some((s) => s.drillable) ? 'pointer' : 'default',
      },
    ],
  };
}

function buildPieOption(slices: { category: string; value: number; drillable?: boolean }[], unit: 'currency' | 'count' | 'percent'): EChartsCoreOption {
  return {
    color: PALETTE,
    tooltip: {
      trigger: 'item',
      formatter: (p: unknown) => {
        const item = p as { name: string; value: number; percent: number };
        return `${item.name}<br/>${formatByUnit(item.value, unit)} (${item.percent}%)`;
      },
    },
    legend: { bottom: 0, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 10, color: '#6b6784' } },
    series: [
      {
        type: 'pie',
        radius: ['42%', '72%'],
        center: ['50%', '44%'],
        data: slices.map((s) => ({ name: s.category, value: s.value })),
        label: { fontSize: 10, color: '#6b6784' },
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        emphasis: { scale: true, scaleSize: 6 },
      },
    ],
  };
}

function compact(value: number, unit: 'currency' | 'count' | 'percent'): string {
  if (unit === 'percent') return `${value}%`;
  if (Math.abs(value) >= 1000) return `${unit === 'currency' ? '$' : ''}${(value / 1000).toFixed(1)}k`;
  return `${unit === 'currency' ? '$' : ''}${value}`;
}
