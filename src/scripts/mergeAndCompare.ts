import * as d3 from "d3";
import _ from "lodash";

import { groupData } from "./groupData.js";

/* 
TODO >
* Allow for aggregation per metric
*/

interface AddComparisonMetricsOptions {
  currentData: DataPoint[];
  previousData: DataPoint[];
  dateKey: string;
  dimensionKeys: string[];
  metricKeys: string[];
  currentDateRange: [Date, Date];
  previousDateRange: [Date, Date];
  aggregation: TAggregation;
}

type TAggregation = "sum" | "mean" | "median" | "min" | "max";

interface DataPoint {
  [key: string]: unknown;
}

export interface ComparisonDateRangeOptions {
  data: DataPoint[];
  dimensionKeys: string[];
  metricKeys: string[];
  dateKey: string;
  currentDateRange: [Date, Date];
  previousDateRange: [Date, Date];
  aggregation: TAggregation;
}

interface PairedDataset {
  [key: `${string}`]: Date | DataPoint[] | unknown;
  comparisonDate: Date;
  data: DataPoint[];
  comparisonData: DataPoint[];
}

/**
 * Filters data by date range and calls `mergeAndCompare`
 */
export function processComparisonData({
  data,
  dateKey,
  dimensionKeys,
  metricKeys,
  currentDateRange,
  previousDateRange,
  aggregation,
}: ComparisonDateRangeOptions) {
 debugger
  const currentData = filterDataByDateRange(data, currentDateRange, dateKey);
  const previousData = filterDataByDateRange(data, previousDateRange, dateKey);

  const dataset = mergeByDateAndCompare({
    currentData,
    previousData,
    dateKey,
    metricKeys,
    dimensionKeys,
    currentDateRange,
    previousDateRange,
    aggregation,
  });

  return dataset;
}

/**
 * Filters data within specified date range (inclusive)
 */
export function filterDataByDateRange(
  data: DataPoint[],
  dateRange: [Date, Date],
  dateKey: string
): DataPoint[] {
 
  const [startDate, endDate] = dateRange;
  // Use d3.utcDay to consistently handle dates
  return data.filter((row) => {
    const rowDate = d3.utcDay.floor(row[dateKey] as Date);
    const start = d3.utcDay.floor(startDate);
    const end = d3.utcDay.floor(endDate);
    return rowDate >= start && rowDate <= end;
  });
};

function mergeByDateAndCompare(
  options: AddComparisonMetricsOptions
): DataPoint[] {
  const {
    currentData,
    previousData,
    dateKey,
    dimensionKeys,
    metricKeys,
    currentDateRange,
    previousDateRange,
    aggregation,
  } = options;

  const currentDataMerge = groupData(
    currentData,
    {
      dimensionKeys: [dateKey, ...dimensionKeys],
      metricKeys: metricKeys,
    },
    aggregation
  );

  const previousDataMerge = groupData(
    previousData,
    {
      dimensionKeys: [dateKey, ...dimensionKeys],
      metricKeys,
    },
    aggregation
  );

  const currentDataGroup = d3.group(currentDataMerge, (d) => d[dateKey]);
  const previousDataGroup = d3.group(previousDataMerge, (d) => d[dateKey]);

  // Add missing dates to base period
  addMissingDates(currentDataGroup, currentDateRange);
  addMissingDates(previousDataGroup, previousDateRange);

  // combine date ranges for easier merging
  const dataset = pairDatasets(currentDataGroup, previousDataGroup, dateKey);
  // Merge data and return
  const mergedData = mergeAndCompareMetrics(dataset, metricKeys, dimensionKeys, dateKey);

  return mergedData;
}

function pairDatasets(
  currentPeriodData: d3.InternMap<Date, DataPoint[]>,
  previousPeriodData: d3.InternMap<Date, DataPoint[]>,
  dateKey: string
): PairedDataset[] {
  const sortedCurrentDates = Array.from(currentPeriodData.keys()).sort(
    (a, b) => a.getTime() - b.getTime()
  );
  const sortedPreviousDates = Array.from(previousPeriodData.keys()).sort(
    (a, b) => a.getTime() - b.getTime()
  );
 
  return sortedCurrentDates.map((date, index) => ({
    [dateKey]: date,
    comparisonDate: sortedPreviousDates[index] ?? null,
    data: currentPeriodData.get(date) || [],
    comparisonData: previousPeriodData.get(sortedPreviousDates[index]) || [],
  })) as PairedDataset[];
}

// Function to merge and compare metrics while keeping dates as Date objects
function mergeAndCompareMetrics(
  dataset: PairedDataset[],
  metricKeys: string[],
  dimensionKeys: string[],
  dateKey: string
): DataPoint[] {
  const mergedData: DataPoint[] = [];

  dataset.forEach((pairedData) => {
    const currentDate = pairedData[dateKey] as Date;
    const { comparisonDate, data, comparisonData } = pairedData;

    // If no data for this date at all, still create an entry
    if (data.length === 0 && comparisonData.length === 0) {
      mergedData.push({
        [dateKey]: currentDate,
        comparisonDate,
        ...mergeRows(null, null, metricKeys)
      });
      return;
    }
    
    const dataMap = _.keyBy(data, (row) => generateKey(row, dimensionKeys));
    
    const comparisonMap = _.keyBy(comparisonData, (row) =>
      generateKey(row, dimensionKeys)
    );

    _.forEach(dataMap, (row, key) => {
      const compareRow = comparisonMap[key] || null;
      // Remove the matched comparison row so we don't process it again
      if (compareRow) {
        delete comparisonMap[key];
      }

      mergedData.push({
        [dateKey]: currentDate,
        comparisonDate,
        ...mergeRows(row, compareRow, metricKeys),
      });
    });
    
    _.forEach(comparisonMap, (compareRow, key) => {
      if (!dataMap[key]) {
        mergedData.push({
          [dateKey]: currentDate,
          comparisonDate,
          ...mergeRows(null, compareRow, metricKeys),
        });
      }
    });
  });
  
  return mergedData;
}

function generateKey(row: DataPoint, dimensions: string[]): string {
  // If no dimensions, use a special identifier
  if (dimensions.length === 0) {
    return '__NO_DIMENSIONS__';
  }
  return dimensions.map((key) => String(row[key] ?? "")).join("|");
}

function mergeRows(
  row: DataPoint | null,
  compareRow: DataPoint | null,
  metrics: string[]
): Omit<DataPoint, "date"> {
  const merged: Record<string, unknown> = row ? _.cloneDeep(row) : {};
  delete merged.date;

  metrics.forEach((key) => {
    const currentValue = (row?.[key] as number | null) ?? null;
    const compareValue = (compareRow?.[key] as number | null) ?? null;

    merged[`${key}_compare`] = compareValue;
    merged[`${key}_change`] =
      currentValue !== null && compareValue !== null && compareValue !== 0
        ? (currentValue - compareValue) / compareValue
        : null;
  });

  return merged as Omit<DataPoint, "date">;
}

const addMissingDates = (
  data: d3.InternMap<any, DataPoint[]>,
  dateRange: [Date, Date]
): void => {
  const interval = d3.utcDay.every(1);
  if (!interval) {
    throw new Error("Failed to create time interval");
  }

  // Create the range of all required dates
  const startDate = d3.utcDay.floor(dateRange[0]);
  const endDate = d3.utcDay.floor(dateRange[1]);
  const allDates = interval.range(startDate, d3.utcDay.offset(endDate, 1));

  allDates.forEach((date) => {
    const formattedDate = d3.utcDay.floor(date); // Normalize to UTC day
    const existingGroup = data.get(formattedDate);

    if (!existingGroup) {
      // If this date is missing, add an empty array as placeholder
      data.set(formattedDate, []);
    }
  });
};
