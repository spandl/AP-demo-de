import * as d3 from "d3";
import * as Plot from "@observablehq/plot";
import {
  formatWeekDay,
  getDateRangeFromWeek,
  formatDate,
  formatNumber,
} from "../format.js";

import type {
  IGenericVizStyles,
  IDataSet,
  IDataAccessors,
  IVizSize,
} from "./types.js";

const remInPixels = parseFloat(
  getComputedStyle(document.documentElement).fontSize
);

export const calendarHeatmap = {
  create: (
    data: IDataSet[],
    accessors: IDataAccessors | undefined,
    config: IGenericVizStyles,
    size: IVizSize
  ) => {
    const { threshold } = config.targets as { threshold: number };
    const { width } = size;
    const marginLeft = width > 600 ? width * 0.333 : width * 0.2;

    const yCount = [
      ...new Set(
        data.map(
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

    const growth = (d: IDataSet[]) =>
      d3.sum(d, (i: IDataSet) => i.record_count);

    const heatmap = Plot.plot({
      width: width - 4 * remInPixels,
      height, //yCount * cellSize,
      marginLeft,
      padding: 0.175,
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
          tickFormat: (d) =>
            formatWeekDay(Number(d), {style: "short" }),
        }),

        Plot.cell(
          data,
          Plot.group(
            {
              fill: (d: number[]) => {
                const total = d3.sum(d);
                if (total >= threshold) return "#3FA0B1";
                if (total < threshold) return "#F17F15";
                return "#D9D9D9";
              },
            },
            {
              x: xAccessor,
              y: yAccessor,
              fill: "record_count",

              channels: {
                ["Date"]: (d) => {
                  return formatDate(d[0].event_date);
                },
                ["Weekday"]: (d) => {
                  return formatDate(d[0].event_date, {
                    options: {
                      weekday: "long",
                    },
                  });
                },
                ["Total"]: (d) => d3.sum(d, (i: IDataSet) => i.record_count),
              },
              r: 5,

              tip: {
                format: {
                  x: false,
                  y: false,
                },
                lineHeight: 1.4,
                fontSize: 12,
              },
            }
          )
        ),

        Plot.text(
          data,
          Plot.group(
            {
              fill: (d: IDataSet[]) => {
                const total = growth(d);
// debugger
                if (total >= threshold) return "white";
                if (total < threshold) return "darkslategrey";
                return "white";
              },
              text: (d: IDataSet[]) =>
                formatNumber(growth(d)),
              // filter: (d: IDataSet[]) => {
              //   const total = growth(d);
              //   if (total === 0) return false;
              //   return (
              //     (total >= threshold || total <= -threshold) &&
              //     Number.isFinite(total)
              //   );
              // },
            },
            {
              x: xAccessor,
              y: yAccessor,
              fontSize: width > 800 ? 12 : 12 * 0.8,
              fontWeight: 700,
            }
          )
        ),
      ],
    });

    return heatmap;
  },
};
