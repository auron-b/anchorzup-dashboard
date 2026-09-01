import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Upward arrow — used for ascending sort and positive deltas. */
@Component({
  selector: 'app-arrow-up-icon',
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
      <path d="M12 19V6M6 12l6-6 6 6" />
    </svg>
  `,
})
export class ArrowUpIconComponent {}
