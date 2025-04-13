import * as d3 from 'd3';

interface AggregationFunctions {
  [key: string]: (values: number[]) => number;
}

interface TransformOptions<T> {
  topX: number;
  splitBy: (keyof T)[];
  topBy: (keyof T)[];
  metricKeys: (keyof T)[];
  aggregation: string;
  sortOrder?: ('asc' | 'desc')[];
}

const aggregationFunctions: AggregationFunctions = {
    sum: (values) => d3.sum(values),
    mean: (values) => d3.mean(values) ?? 0,
    median: (values) => d3.median(values) ?? 0,
    min: (values) => d3.min(values) ?? 0,
    max: (values) => d3.max(values) ?? 0,
  };

export function aggregateTopX<T extends Record<string, any>>(data: T[], options: TransformOptions<T>): Array<T | { isOther: boolean; data: T[] }> {
  const { topX, splitBy, topBy, metricKeys, aggregation, sortOrder = [] } = options;
  const aggregateFunc = aggregationFunctions[aggregation];

  if (!aggregateFunc) {
    throw new Error(`Unsupported aggregation type: ${aggregation}`);
  }

  // Sorting function based on topBy
  const sortedData = [...data].sort((a, b) => {
    for (let i = 0; i < topBy.length; i++) {
      const key = topBy[i];
      const order = sortOrder[i] || 'desc';
      const aValue = a[key];
      const bValue = b[key];
      
      if (aValue !== bValue) {
        return order === 'asc' ? d3.ascending(aValue, bValue) : d3.descending(aValue, bValue);
      }
    }
    return 0;
  });

  // Top X items
  const topItems = sortedData.slice(0, topX);
  const remainingItems = sortedData.slice(topX);

  // Group remaining items by splitBy keys
  const groupedOthers = d3.group(remainingItems, (d) => splitBy.map((key) => d[key]).join('|'));

  // Aggregate remaining items
  const otherItems = Array.from(groupedOthers, ([groupKey, values]) => {
    const aggregatedMetrics = Object.fromEntries(
      metricKeys.map((key) => [key, aggregateFunc(values.map((d) => d[key]))])
    );

    const groupValues = groupKey.split('|');
    return {
      ...Object.fromEntries(splitBy.map((key, i) => [key, groupValues[i]])),
      isOther: true,
      ...aggregatedMetrics,
      data: values,
    };
  });

  return [...topItems, ...otherItems];
}
