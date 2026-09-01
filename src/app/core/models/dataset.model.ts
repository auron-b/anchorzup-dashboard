import { DatasetKey } from './widget.model';

export interface SeriesPoint {
  date: string; // ISO date (yyyy-MM-dd)
  value: number;
}

export interface BreakdownSlice {
  category: string;
  value: number;
  /** present only on top-level slices that can be drilled into */
  drillable?: boolean;
}

export interface TableRow {
  id: string;
  name: string;
  email: string;
  country: string;
  date: string; // ISO date
  metric: number;
  /** Index signature so rows can be handed straight to the generic CSV/PDF exporter. */
  [key: string]: string | number;
}

export interface StatSummary {
  label: string;
  value: number;
  /** already formatted for display, e.g. "$56,780" or "3.4%" */
  formatted: string;
  deltaPct: number;
}

export interface DatasetMeta {
  key: DatasetKey;
  label: string;
  /** unit used to format sums/points, e.g. currency vs plain count vs percent */
  unit: 'currency' | 'count' | 'percent';
  statLabel: string;
  metricLabel: string;
  categories: string[];
  subCategories: Record<string, string[]>;
}

export const DATASET_META: Record<DatasetKey, DatasetMeta> = {
  sales: {
    key: 'sales',
    label: 'Sales',
    unit: 'currency',
    statLabel: 'Total Sales',
    metricLabel: 'Sales',
    categories: ['Electronics', 'Apparel', 'Home & Garden', 'Sports', 'Beauty'],
    subCategories: {
      Electronics: ['Phones', 'Laptops', 'Audio', 'Accessories'],
      Apparel: ['Menswear', 'Womenswear', 'Kids', 'Footwear'],
      'Home & Garden': ['Furniture', 'Decor', 'Kitchen', 'Outdoor'],
      Sports: ['Fitness', 'Outdoor Gear', 'Team Sports', 'Footwear'],
      Beauty: ['Skincare', 'Makeup', 'Haircare', 'Fragrance'],
    },
  },
  userActivity: {
    key: 'userActivity',
    label: 'User Activity',
    unit: 'count',
    statLabel: 'Active Users',
    metricLabel: 'Sessions',
    categories: ['Web', 'Mobile App', 'Desktop App', 'API'],
    subCategories: {
      Web: ['Chrome', 'Safari', 'Firefox', 'Edge'],
      'Mobile App': ['iOS', 'Android', 'Tablet'],
      'Desktop App': ['Windows', 'macOS', 'Linux'],
      API: ['Public API', 'Partner Integrations', 'Internal Tools'],
    },
  },
  engagement: {
    key: 'engagement',
    label: 'Engagement',
    unit: 'percent',
    statLabel: 'Engagement Rate',
    metricLabel: 'Engagement',
    categories: ['Likes', 'Comments', 'Shares', 'Saves', 'Clicks'],
    subCategories: {
      Likes: ['Post', 'Story', 'Reel', 'Live'],
      Comments: ['Post', 'Story', 'Reel'],
      Shares: ['Post', 'Story', 'Reel', 'Live'],
      Saves: ['Post', 'Reel'],
      Clicks: ['Link in Bio', 'Ad', 'Product Tag'],
    },
  },
};
