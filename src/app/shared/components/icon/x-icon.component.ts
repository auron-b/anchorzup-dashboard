import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Close / dismiss. Inherits color + size from the button it sits in. */
@Component({
  selector: 'app-x-icon',
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
      focusable="false"
    >
      <path d="M6 6 18 18M18 6 6 18" />
    </svg>
  `,
})
export class XIconComponent {}
