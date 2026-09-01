import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Pie / breakdown chart type. */
@Component({
  selector: 'app-chart-pie-icon',
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
      <path d="M21.2 15.9A10 10 0 1 1 8.1 2.8" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  `,
})
export class ChartPieIconComponent {}
