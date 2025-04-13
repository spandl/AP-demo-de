import * as Plot from "@observablehq/plot";
import _ from "lodash";
import { groupData } from "../groupData.js";
import { aggregateTopX } from "../aggregateTopX.js";
import { otherLightPatternDef } from "../otherPatternDef.js";
import { presetTools } from "../preset.js";
// import {
//   formatWeekDay,
//   getDateRangeFromWeek,
//   formatDate,
//   formatNumber,
// } from "../format.js";

import type {
  IDataSet,
  IGenericVizStyles,
  IDataAccessors,
  IVizSize,
} from "./types.js";

interface IBarChartOptions {
  accessors?: IDataAccessors;
  config?: IGenericVizStyles;
  size: IVizSize;
}
/* 
TODO > barchart
* Use Themes for chart styling
*/

const remInPixels = parseFloat(
  getComputedStyle(document.documentElement).fontSize
);

const barPreset = {
  set config(customStyles) {
    const preset = _.cloneDeep(this.defaultConfig);
    this.mergedConfig = presetTools.deepMergeWithPreset(preset, customStyles);
  },

  get config() {
    return _.isEmpty(this.mergedConfig) ? this.defaultConfig : this.mergedConfig;
  },

  mergedConfig: {},

  defaultConfig: {
    seriesConfiguration: {
      aggregateOther: true,
      maxSeries: 4,
      aggregateOtherLabel: "Other pages",
      otherStyle: "striped",
      otherColor: null,
    },
  },
};

/* 
Group and Top x based on settings
*/
const processData = (
  data: IDataSet[],
  accessors: IDataAccessors,
  config: IGenericVizStyles
): IDataSet[] => {
  if (!accessors?.dimension || !accessors?.metric) return data;
  const dim = accessors.dimension as string;
  // group Data
  const groupedData = groupData(
    data,
    {
      dimensionKeys: [accessors.dimension as string],
      metricKeys: [accessors.metric as string],
    },
    "sum"
  );

const {seriesConfiguration} = <any>config;

  if (!seriesConfiguration?.aggregateOther as boolean)
    return groupedData;

  // top X
  const topData = aggregateTopX(groupedData, {
    topX: seriesConfiguration.maxSeries,
    topBy: [accessors.metric as string],
    metricKeys: [accessors.metric as string],
    splitBy: [],
    aggregation: "sum",
  });

  topData[topData.length - 1][dim] =
    seriesConfiguration.aggregateOtherLabel;
  return topData;
};

export const horizontalBarChart = {
  create: (data: IDataSet[], options: IBarChartOptions) => {
    const { accessors, size, config } = options; // config
    
    const mergedStyles = presetTools.deepMergeWithPreset(barPreset.defaultConfig, config as IGenericVizStyles);
    const barChartData = processData(data, accessors as IDataAccessors, mergedStyles);

    if (!accessors?.dimension || !accessors?.metric) return data;
    const dimension = accessors.dimension as string;
    const metric = accessors.metric as string;

    const { width } = size;
    const marginLeft = width > 600 ? width * 0.333 : width * 0.45;
    const categoricalFontSize = width > 800 ? 16 : 12;
    const barChart = Plot.plot({
      marginLeft,
      width: width - 4 * remInPixels,
      height: barChartData.length * 50,
      x: {
        axis: null,
      },
      y: {
        padding: 0.2,
        label: null,
        domain: barChartData.map((d) => d[dimension]), // default order
      },
      marks: [
        Plot.barX(barChartData, {
          x: metric,
          y: dimension,
          fill: "#3FA0B1",
        }),
        Plot.barX(barChartData, {
          filter: (_, i) => i === barChartData.length - 1,
          x: metric,
          y: dimension,
          fill: "url(#hachures)",
        }),
        Plot.text(barChartData, {
          x: metric,
          text: metric,
          filter: (d) => d[metric] > 10,
          y: "page_title",
          sort: { y: "-x" },
          fill: "white",
          textAnchor: "end",
          dx: -5,
          lineAnchor: "middle",
          fontSize: 15,
          fontWeight: 600,
        }),
        Plot.ruleX([0]),
        Plot.axisY({
          fontSize: categoricalFontSize,
          tickSize: 0,
          fontWeight: 500,
          textOverflow: "ellipsis-end",
          lineWidth: (marginLeft / categoricalFontSize) * 0.9, // 0.9 > for bold
        }),
        otherLightPatternDef,
      ],
    });

    return barChart;
  },
};
