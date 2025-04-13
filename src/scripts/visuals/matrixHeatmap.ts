import * as d3 from "d3";
import * as Plot from "@observablehq/plot";
import { formatNumber, formatWeekDay } from "../format.js";

interface IDataAccessors {
  metric: number;
  compareMetric: number;
  dateTime: string;
}

import type { IDataSet, IGenericVizStyles, IVizSize } from "./types.js";

/*
TODO >
 * Use color scheme from theme
 * Color 
 * Minimum range should be 10 pages (keep colors light below that)
 */

export const matrixHeatmap = {
  create: (
    data: IDataSet[],
    accessors: IDataAccessors,
    config: IGenericVizStyles,
    size: IVizSize
  ) => {
    const { dateTime, metric, compareMetric } = accessors;
    const cleanData = data.filter(
      (d): d is IDataAccessors =>
        d != null &&
        dateTime in d &&
        typeof d[dateTime] === "string" &&
        d[dateTime] != null
    );

    const heatmapData = processData(cleanData, accessors);
    const { width } = size;

    const maxMetric = d3.max(heatmapData, (d:any) => d[metric]);
        const minDistribution = 10;

    const growth = (d: IDataSet) => d.metric / d.compareMetric - 1;

    const plot = Plot.plot({
      // width: xCount * cellSize + 100,
      width: width - 2 * 20,
      height: 24 * 40,
      marginLeft: 75,
      padding: 0.175,
      x: {
        type: "band",
      },
      y: {
        reverse: true,
      },
      color: {
        domain: [0, maxMetric > minDistribution ? maxMetric : minDistribution],
        range: ["#deebf7", "#9ecae1", "#3182bd"], // sequential theme
      },
      // color: { type: "linear", scheme: "YlGnBu" },
      marks: [
        Plot.axisY({
          fontSize: width > 800 ? 14 : 11,
          tickSize: 0,
          tickFormat: (d) => {
            const hours = d.toString().padStart(2, "0");
            return `${hours}:00`;
          },
          label: null,
        }),

        Plot.axisX({
          fontSize: width > 800 ? 14 : 11,
          label: null,
          tickSize: 0,
          tickFormat: (d) => formatWeekDay(d, {}),
          anchor: "top",
        }),

        

        Plot.cell(heatmapData, {
          x: "weekday",
          y: "hour",
          fill: "metric",
          channels: {
            ["Sessions"]: "metric",
            ["Previous Sessions"]: "compareMetric",
            ["Weekday"]: (d) => {
              return formatWeekDay(d.weekday, {});
            },
            ["Hour"]: (d) => {
              const hours = d.hour.toString().padStart(2, "0");
              return `${hours}:00`;
            },
            ["Change"]: (d) =>
              formatNumber(growth(d), {
                options: {
                  style: "percent",
                },
              }),
          },
          r: 5,
          tip: {
            format: {
              x: false,
              y: false,
              fill: false,
            },
            lineHeight: 1.4,
                fontSize: 12,
          },
        }),

        Plot.text(heatmapData, {
            x: "weekday",
            y: "hour",
            text: "metric",
            fontSize: width > 800 ? 12 : 12 * 0.75,
              fontWeight: 700,
          }),
      ],
    });
    return plot;
  },
};

// Function to process the dataset
function processData(data: IDataSet[], accessors: IDataAccessors) {
  const { dateTime, metric, compareMetric } = accessors;

  // Group the data by date and hour
  const groupedData = d3.group(
    data,
    (d) => {
      const weekday = d3.isoParse(d[dateTime] as string);
      if (!weekday) {
        console.warn(`Failed to parse date: ${d[dateTime]}`);
        return 0;
      }
      return +d3.timeFormat("%u")(weekday) - 1; // Convert 1-7 to 0-6
    },
    (d) => {
      const weekday = d3.isoParse(d[dateTime] as string);
      if (!weekday) {
        console.warn(`Failed to parse date: ${d[dateTime]}`);
        return 0;
      }
      return weekday.getUTCHours();
    }
  );

  // Transform the grouped data into the desired format
  const result = Array.from(groupedData, ([weekday, hourMap]) => {
    const hourData = Array.from(hourMap, ([hour, entries]) => {
      return {
        weekday,
        hour: +hour,
        metric: d3.sum(entries, (d) => d[metric] as number),
        compareMetric: d3.sum(entries, (d) => d[compareMetric] as number),
      };
    });
    return hourData;
  }).flat();

  // Sort by date and hour
  result.sort((a, b) => {
    const dateCompare = a.weekday - b.weekday;
    if (dateCompare === 0) {
      return a.hour - b.hour;
    }
    return dateCompare;
  });

  return result;
}
