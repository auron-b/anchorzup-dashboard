import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideEchartsCore } from 'ngx-echarts';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // Lazy-loads the echarts core + only the chart/component types the
    // dashboard actually registers (see chart-widget.component.ts), instead
    // of pulling the full echarts bundle into the main chunk.
    provideEchartsCore({ echarts: () => import('echarts') }),
  ],
};
