import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Next — pagination and forward affordances. */
@Component({
  selector: 'app-chevron-right-icon',
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
      <path d="m9 5 7 7-7 7" />
    </svg>
  `,
})
export class ChevronRightIconComponent {}
