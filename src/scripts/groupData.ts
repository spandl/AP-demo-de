import * as d3 from "d3";
import type { IDataSet } from "./visuals/types.js";

interface IGroupAccessors {
  dimensionKeys: string[];
  metricKeys: string[];
}

type TAggregation = "sum" | "mean" | "median" | "min" | "max";

type D3AggregationFunction = <T>(
  array: Iterable<T>,
  accessor: (d: T, i: number) => number | null | undefined
) => number | undefined;

const d3AggregationMethods: Record<TAggregation, D3AggregationFunction> = {
  sum: d3.sum,
  mean: d3.mean,
  median: d3.median,
  min: d3.min,
  max: d3.max,
};

type NestedMap = Map<any, NestedMap | IDataSet[]>;

const calculateValue = (
  values: IDataSet[],
  metricKey: string | null,
  aggregation: TAggregation
) => {
  if (!metricKey) return values.length;
  const useAggregation: TAggregation = aggregation || "sum";
  return d3AggregationMethods[useAggregation](values, (d: any) => d[metricKey]);
};

export const groupData = (
  data: IDataSet[],
  accessors: IGroupAccessors,
  aggregation: TAggregation
) => {
  const { dimensionKeys, metricKeys } = accessors;

  // If we have no dimension keys, treat the entire dataset as one group
  if (dimensionKeys.length === 0) {
    const result = {
      ...metricKeys.reduce((acc, metricKey) => {
        acc[metricKey] = calculateValue(data, metricKey, aggregation);
        return acc;
      }, {} as any),
    };
    return [result];
  }

  // Group by multiple dimensions
  const grouped =
    dimensionKeys.length === 1
      ? d3.group(data, (d: any) => d[dimensionKeys[0]])
      : d3.group(data, ...dimensionKeys.map((dim) => (d: any) => d[dim]));

  // Type guard function to check if we have a Map
  function isNestedMap(value: any): value is NestedMap {
    return value instanceof Map;
  }

  const flattenGroups = (
    mapOrData: NestedMap | IDataSet[],
    dims: string[] = [],
    result: any[] = []
  ): any[] => {
    if (isNestedMap(mapOrData)) {
      // Handle nested map case
      for (const [key, value] of mapOrData) {
        flattenGroups(value, [...dims, key], result);
      }
    } else {
      // Handle leaf case (array of IDataSet)
      const groupValues: IDataSet[] = mapOrData;
      const dimensionObject = dimensionKeys.reduce((acc, dim, index) => {
        acc[dim] = dims[index];
        return acc;
      }, {} as any);

      const metricValues =
        metricKeys.length > 0
          ? metricKeys.reduce((acc, metricKey) => {
              acc[metricKey] = calculateValue(
                groupValues,
                metricKey,
                aggregation
              );
              return acc;
            }, {} as any)
          : { value: groupValues.length };

      result.push({
        ...dimensionObject,
        ...metricValues,
      });
    }
    return result;
  };

  // Now we can safely process the grouped data
  const groupedData = flattenGroups(grouped).sort((a, b) => {
    const sortKey = metricKeys[0] || "value";
    return b[sortKey] - a[sortKey];
  });

  return groupedData;
};
