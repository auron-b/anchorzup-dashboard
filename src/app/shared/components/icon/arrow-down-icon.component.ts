import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Downward arrow — used for descending sort and negative deltas. */
@Component({
  selector: 'app-arrow-down-icon',
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
      <path d="M12 5v13M6 12l6 6 6-6" />
    </svg>
  `,
})
export class ArrowDownIconComponent {}
