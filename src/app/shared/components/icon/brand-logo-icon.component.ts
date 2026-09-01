import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * AnchorzUp brand mark.
 *
 * One icon per file: to add an icon, drop a sibling `*-icon.component.ts`
 * next to this one and import it only where it's used — unused icons never
 * reach the bundle. Shared sizing lives in `./icon-base.scss`.
 *
 * Decorative here (always sits beside the "AnchorzUp" wordmark), so the host
 * is `aria-hidden`. An icon that carries meaning on its own should instead
 * expose `role="img"` + an `aria-label`.
 */
@Component({
  selector: 'app-brand-logo-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  styleUrl: './icon-base.scss',
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <title>AnchorzUp icon</title>
      <circle cx="100" cy="100" r="96" fill="#633C8D" />
      <g transform="translate(17.6,16.8) scale(0.80)">
        <g
          transform="translate(-105.405939,305.886660) scale(0.1,-0.1)"
          fill="#ffffff"
        >
          <path
            d="M1990 3053 c-14 -2 -35 -6 -48 -9 l-22 -4 2 -648 3 -647 140 -3 c77 -1 150 0 163 3 l22 5 0 470 c0 262 4 471 9 474 8 6 118 -37 171 -65 77 -42 159 -117 227 -206 l54 -73 175 0 c201 0 192 -6 142 98 -124 260 -345 461 -607 551 -141 48 -323 71 -431 54z"
          />
          <path
            d="M1057 1874 c-10 -10 4 -79 40 -194 78 -248 292 -488 543 -607 145 -69 268 -95 443 -95 296 1 527 97 737 303 139 137 260 369 285 547 l7 52 -169 -2 -168 -3 -11 -40 c-6 -22 -14 -49 -18 -60 -4 -11 -13 -33 -19 -49 -6 -16 -32 -61 -57 -100 -171 -259 -476 -370 -794 -288 -117 31 -270 138 -351 247 -62 83 -120 203 -127 265 l-3 25 -166 3 c-91 1 -168 0 -172 -4z"
          />
        </g>
      </g>
    </svg>
  `,
})
export class BrandLogoIconComponent {}
