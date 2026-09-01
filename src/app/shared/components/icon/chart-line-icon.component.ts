import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Line / trend chart type. */
@Component({
  selector: 'app-chart-line-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  styleUrl: './icon-base.scss',
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      focusable="false"
    >
      <path d="M4 4v16h16" />
      <path d="m7 14 3.5-4 3 2.5L20 7" />
    </svg>
  `,
})
export class ChartLineIconComponent {}
