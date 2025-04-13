import * as d3 from "d3";
import { formatNumber, formatDuration } from "../format.js";
import type { INumberFormatOptions } from "../format.js";
interface INumberOptions {
  title: string;
  value: number;
  compareValue: number;
  formatOptions?: INumberFormatOptions;
  durationUnit?: string;
}

interface IMarkupOptions {
  title: string;
  valueString: string;
  trendString: string | null;
  trendSymbol: string;
}

type TTrendSymbol = "up" | "down" | "flat" | "";

interface IScorecardValues {
  value: number;
  compareValue: number;
  diff: number;
  trend: number;
  trendSymbol: TTrendSymbol;
}

/* 
TODO > scorecards
* Include function for weighted median value
* Read colors from JSON, not UI theme.
*/

export const scoreCards = {
  number: ({
    title,
    value,
    compareValue,
    formatOptions,
    durationUnit,
  }: INumberOptions): HTMLElement => {
    const { locales, options } = formatOptions ?? {
      locales: null,
      options: null,
    };

    const valueSet = scoreCards.values(value, compareValue);

    // Duration has different format
    const valueString = !durationUnit
      ? formatNumber(valueSet.value, formatOptions)
      : formatDuration({ [durationUnit]: valueSet.value }, { style: "narrow", maxUnits: 3 });

    const trendString = compareValue ? formatNumber(valueSet.trend, {
      locales: locales ?? "en-US",
      options: {
        ...options,
        style: "percent",
      },
    }) : null;

    return scoreCards.markup({
      title,
      valueString,
      trendString,
      trendSymbol: valueSet.trendSymbol,
    });
  },

  markup: ({
    title,
    valueString,
    trendString,
    trendSymbol,
  }: IMarkupOptions): HTMLElement => {
    const card = d3.create("div").attr("class", "card scorecard");
    card.append("h2").text(title);
    
    card.append("div").attr("class", `metric ${trendSymbol}`).text(valueString);

    if (trendString)
    card.append("div").attr("class", "change").text(trendString);

    return card.node() as HTMLElement;
  },

  values: (value: number, compareValue: number): IScorecardValues => {
    const trend = value / compareValue - 1;
    const trendSymbol = compareValue ? trendSign(trend) : "";
    return {
      value,
      compareValue,
      diff: value - compareValue,
      trend,
      trendSymbol,
    };
  },
};

const trendSign = (trendNumber: number): TTrendSymbol => {
  if (trendNumber > 0) return "up";
  if (trendNumber === 0) return "flat";
  if (trendNumber < 0) return "down";
  return "";
};
