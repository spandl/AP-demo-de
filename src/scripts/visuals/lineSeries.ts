import * as Plot from "@observablehq/plot";
import { groupData } from "../groupData.js";
import { formatDate } from "../format.js";
import type { IDataSet, IGenericVizStyles, IVizSize } from "./types.js";
import { theme } from "./theme.js";

interface ILinesSeriesAccessors {
  date: string;
  compareDate: string;
  metric: string;
  compareMetric: string;
}

export const lineSeriesCompare = {
  create: (
    data: IDataSet[],
    accessors: ILinesSeriesAccessors,
    config: IGenericVizStyles,
    size: IVizSize
  ) => {
    const { date, compareDate, metric, compareMetric } = accessors;
    const { width } = size;
    const margin = { left: 20, right: 20 };

    const groupedData = groupData(
      data,
      {
        dimensionKeys: [accessors.date],
        metricKeys: [accessors.metric],
      },
      "sum"
    )
    .sort((a, b) => b[accessors.date] - a[accessors.date]);

    const lineChart = Plot.plot({
      width: width - margin.left - margin.right,
      style: "overflow: visible;",
      marginLeft: margin.left,
      x: { label: null, insetLeft: 25 },
      y: {
        grid: true,
        label: null,
      },
      marks: [
        // Date range
        Plot.lineY(groupedData, {
          x: date,
          y: metric,
          stroke: theme.schemes.categorical[0],
          strokeWidth: baseConfig.elements[1].defaultValue,
          curve: baseConfig.elements[0].defaultValue as Plot.Curve,
          marker: "circle-stroke",
          channels: {
            ["Date"]: (d) =>
              formatDate(d[date], {
                options: {
                  dateStyle: "medium",
                },
              }),
            ["Previous Date"]: (d) =>
              formatDate(d[compareDate], {
                options: {
                  dateStyle: "medium",
                },
              }),
            ["Count"]: (d) => d[metric],
            ["Previous Count"]: (d) => d[compareMetric],
          },
          tip: {
            format: {
              x: false,
              y: false,
            },
            lineHeight: 1.4,
            fontSize: 12,
          },
        }),
        // Compare date range
        Plot.lineY(groupedData, {
          x: date,
          y: compareMetric,
          stroke: theme.schemes.categorical[0],
          opacity: 0.5,
          strokeDasharray: "5 5",
          strokeWidth: 2,
          curve: baseConfig.elements[0].defaultValue as Plot.Curve,
        }),
        Plot.ruleY([0]),
        Plot.gridY({
          stroke: "#d1d1d1",
        }),
        Plot.axisY({
          tickSize: 0,
          dx: 25,
          dy: -6,
          lineAnchor: "bottom",
        }),
      ],
    });

    return lineChart;
  },
};

const baseConfig = {
  sectionName: "Line settings",
  sectionId: "line",
  elements: [
    {
      id: "interpolation",
      label: "Line interpolation",
      inputType: "selector",
      list: ["monotone-x"],
      defaultValue: "monotone-x",
    },
    {
      id: "strokeWidth",
      label: "Stroke width",
      inputType: "range",
      range: [0, 20],
      rangeStep: 1,
      defaultValue: 3,
    },
  ],
};
