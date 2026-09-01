import { TestBed } from '@angular/core/testing';
import { TableWidgetComponent } from './table-widget.component';
import { WidgetConfig } from '../../../../core/models/widget.model';

const CONFIG: WidgetConfig = {
  id: 'table-test',
  type: 'table',
  title: 'Customer Sales',
  visible: true,
  x: 0,
  y: 0,
  rows: 5,
  cols: 12,
  settings: { dataset: 'sales' },
};

const RANGE = { start: '2026-08-01', end: '2026-08-31' };

describe('TableWidgetComponent', () => {
  function createComponent() {
    const fixture = TestBed.createComponent(TableWidgetComponent);
    fixture.componentRef.setInput('config', CONFIG);
    fixture.componentRef.setInput('range', RANGE);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TableWidgetComponent] });
  });

  it('defaults to sorting by date, descending (most recent first)', () => {
    const { componentInstance } = createComponent();
    expect(componentInstance.sortKey()).toBe('date');
    expect(componentInstance.sortDir()).toBe('desc');
  });

  it('sortBy on a new column switches to it ascending; clicking the same column again flips direction', () => {
    const { componentInstance } = createComponent();

    componentInstance.sortBy('name');
    expect(componentInstance.sortKey()).toBe('name');
    expect(componentInstance.sortDir()).toBe('asc');

    componentInstance.sortBy('name');
    expect(componentInstance.sortDir()).toBe('desc');

    componentInstance.sortBy('email');
    expect(componentInstance.sortKey()).toBe('email');
    expect(componentInstance.sortDir()).toBe('asc');
  });

  it('updates the filter signal from the search input', () => {
    const { componentInstance } = createComponent();
    const input = document.createElement('input');
    input.value = 'acme';
    componentInstance.onFilterInput({ target: input } as unknown as Event);
    expect(componentInstance.filterText()).toBe('acme');
  });

  it('resolves the metric label and currency formatting from the sales dataset', () => {
    const { componentInstance } = createComponent();
    expect(componentInstance.metricLabel()).toBe('Sales');
    expect(componentInstance.formatMetric(1234)).toBe('$1,234');
  });
});
