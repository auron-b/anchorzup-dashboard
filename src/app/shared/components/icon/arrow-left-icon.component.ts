import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Leftward arrow — used for "back" out of a drill-down. */
@Component({
  selector: 'app-arrow-left-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  styleUrl: './icon-base.scss',
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      focusable="false"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  `,
})
export class ArrowLeftIconComponent {}
