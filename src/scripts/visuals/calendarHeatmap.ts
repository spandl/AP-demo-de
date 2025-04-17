import * as d3 from "d3";
import * as Plot from "@observablehq/plot";
import { groupData } from "../groupData.js";
import { theme } from "./theme.js";
import {
  formatWeekDay,
  getDateRangeFromWeek,
  formatDate,
  formatNumber,
} from "../format.js";

import type { IGenericVizStyles, IDataSet, IVizSize } from "./types.js";

interface IDataAccessors {
  date: string;
  metric: string;
}

export const calendarHeatmap = {
  create: (
    data: IDataSet[],
    accessors: IDataAccessors,
    config: IGenericVizStyles,
    size: IVizSize
  ) => {
    const { threshold } = config.targets as { threshold: number };
    const { width } = size;
    const marginLeft = width > 600 ? width * 0.333 : width * 0.2;

    const groupedData = groupData(
      data,
      {
        dimensionKeys: [accessors.date],
        metricKeys: [accessors.metric],
      },
      "sum"
    );

    const yCount = [
      ...new Set(
        groupedData.map(
          (d) =>
            `${d3.utcFormat("%Y")(d.event_date)} | ${d3.utcFormat("%W")(
              d.event_date
            )}`
        )
      ),
    ].length;

    const height = 75 * yCount;

    const xAccessor = (d: IDataSet) =>
      `${Number(d3.utcFormat("%u")(d.event_date)) - 1}`;

    const yAccessor = (d: IDataSet) =>
      `${d3.utcFormat("%Y")(d.event_date)} | ${d3.utcFormat("%W")(
        d.event_date
      )}`;

    const heatmap = Plot.plot({
      width: width - 4 * remInPixels,
      height,
      marginLeft,
      padding: 0.175,
      color: {
        domain: [0, d3.max(groupedData, d => d[accessors.metric])],
        range: [theme.schemes.divergent[1], theme.schemes.divergent[2]],
      },
      x: {
        type: "band",
      },
      y: {
        reverse: true,
      },
      marks: [
        Plot.axisY({
          fontSize: width > 800 ? 16 : 12,
          tickSize: 0,
          tickFormat: (d) =>
            getDateRangeFromWeek({
              weekIndex: Number(d.split(" | ")[1]),
              year: Number(d.split(" | ")[0]),
              options: {
                day: "numeric",
                month: "short",
              },
            }),
          label: null,
        }),
        Plot.axisX({
          fontSize: 12,
          label: null,
          tickSize: 0,
          tickFormat: (d) => formatWeekDay(Number(d), { style: "short" }),
        }),

        Plot.cell(groupedData, {
          x: xAccessor,
          y: yAccessor,
          fill: accessors.metric,
          r: 5,
          channels: {
            ["Date"]: (d) => {
              return formatDate(d[accessors.date], {
                options: {
                  dateStyle: "long",
                },
              });
            },
            ["Weekday"]: (d) => {
              return formatDate(d[accessors.date], {
                options: {
                  weekday: "long",
                },
              });
            },
            ["Total"]: (d) => formatNumber(d[accessors.metric]),
          },
          tip: {
            format: {
              x: false,
              y: false,
              fill: false
            },
            lineHeight: 1.4,
            fontSize: 12,
          },
        }),

        Plot.text(groupedData, {
          x: xAccessor,
          y: yAccessor,
          text: (d: IDataSet) => formatNumber(d[accessors.metric]),
          fill: (d: IDataSet) => {
            if (d[accessors.metric] >= threshold) return theme.ui.background;
            return theme.ui.textColor;
          },
          opacity: (d: IDataSet) => {
            if (d[accessors.metric] >= threshold) return 1;
            return 0.75;
          },
          fontSize: width > 800 ? 12 : 12 * 0.8,
          fontWeight: 700,
        }),
      ],
    });

    return heatmap;
  },
};

const remInPixels = parseFloat(
  getComputedStyle(document.documentElement).fontSize
);
