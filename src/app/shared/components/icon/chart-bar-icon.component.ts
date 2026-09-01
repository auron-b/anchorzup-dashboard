import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Bar chart type. */
@Component({
  selector: 'app-chart-bar-icon',
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
      <path d="M8 17v-4M13 17V8M18 17v-7" />
    </svg>
  `,
})
export class ChartBarIconComponent {}
