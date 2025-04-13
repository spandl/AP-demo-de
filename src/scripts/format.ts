import "@formatjs/intl-durationformat/polyfill"; // Load polyfill
import * as d3 from "d3";

interface IDateFormatOptions {
  locales?: Intl.LocalesArgument;
  options?: Intl.DateTimeFormatOptions;
}

interface IDateRangeFormatOptions {
  dates: [Date, Date];
  locales?: Intl.LocalesArgument;
  options?: Intl.DateTimeFormatOptions;
  separator?: string;
}

interface IWeekDayFormatOptions {
  locales?: Intl.LocalesArgument;
  style?: TWeekDayStyle;
}

interface IWeekRangeFormatOptions {
  weekIndex: number;
  year: number;
  locales?: Intl.LocalesArgument;
  options?: Intl.DateTimeFormatOptions;
  separator?: string;
}

type TWeekDayStyle = Intl.DateTimeFormatOptions["weekday"];

export const getDateRangeFromWeek = ({
  weekIndex,
  year,
  locales,
  options,
  separator,
}: IWeekRangeFormatOptions): string => {
  // Calculate the start and end dates for the given week index
  const startDate = d3.timeMonday(
    d3.timeWeek.offset(new Date(year, 0, 1), weekIndex)
  );
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6); // Sunday of the same week

  // Format the dates
  const formattedStartDate = formatDate(startDate, { locales, options });
  const formattedEndDate = formatDate(endDate, { locales, options });

  const separatorString = separator ?? " — ";

  return `${formattedStartDate}${separatorString}${formattedEndDate}`;
};

export const formatWeekDay = (
  weekDayIndex: number,
  { locales = "en-US", style = "long" }: IWeekDayFormatOptions
): string => {
  // Check if date is valid
  if (isNaN(weekDayIndex)) return "";

  const referenceDate = new Date(2024, 0, 1 + weekDayIndex);

  return new Intl.DateTimeFormat(locales, { weekday: style }).format(
    referenceDate
  );
};

export const formatDateRange = ({
  dates,
  locales,
  options,
  separator,
}: IDateRangeFormatOptions): string => {
  const startDate = formatDate(dates[0], { locales, options });
  const endDate = formatDate(dates[1], { locales, options });

  const separatorString = separator ?? " — ";

  return `${startDate}${separatorString}${endDate}`;
};

export const formatDate = (
  date: Date,
  { locales = "en", options = {} }: IDateFormatOptions = {}
): string => {
  // Check if date is valid
  if (isDate(date)) return "";

  const dateFormatter = new Intl.DateTimeFormat(locales, {
    ...options,
    timeZone: options.timeZone || "UTC",
  });
  return dateFormatter.format(date);
};

// Number
export interface INumberFormatOptions {
  locales?: Intl.LocalesArgument;
  options?: Intl.NumberFormatOptions;
}

export const formatNumber = (
  number: number,
  { locales = "en", options = {} }: INumberFormatOptions = {}
): string => {
  const signDisplay = options.style === "percent" ? "exceptZero" : "auto";
  const numberFormatter = new Intl.NumberFormat(locales, {
    ...options,
    notation: options.notation || "compact",
    signDisplay,
  });

  return numberFormatter.format(number);
};

// DURATION

export const formatDuration = (
  duration: IDuration = { milliseconds: 1 },
  { style, locales, maxUnits }: IDurationFormatOptions = {} // Add default empty object here
): string => {
  const durationFormatter = new Intl.DurationFormat(locales ?? "en-US", {
    style: style ?? "narrow",
  }); // Add fallback for style
  const normDuration = normalizeDuration(duration, { maxUnits });
  return durationFormatter.format(normDuration);
};

export interface IDurationFormatOptions {
  style?: TDurationStyle;
  locales?: Intl.LocalesArgument;
  maxUnits?: number;
}

interface IDurationNormalizeOptions {
  maxUnits?: number;
}

const isDate = (date: Date): boolean =>
  date === undefined ||
  date === null ||
  !(date instanceof Date) ||
  isNaN(date.getTime());

// DURATION TYPES
declare global {
  namespace Intl {
    class DurationFormat {
      constructor(
        locales?: Intl.LocalesArgument,
        options?: IDurationFormatOptions
      );
      format(duration: IDuration): string;
    }
  }

  interface IDuration {
    years?: number;
    months?: number;
    weeks?: number;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
    milliseconds?: number;
  }

  type TDurationStyle = "long" | "short" | "narrow" | "digital" | undefined;

  interface IDurationFormatOptions {
    style: TDurationStyle;
  }
}

// DURATION HELPERS
export type TDurationUnits = keyof IDuration;

const normalizeDuration = (
  duration: IDuration,
  options: IDurationNormalizeOptions = {}
): IDuration => {
  // First, normalize everything to milliseconds
  const { maxUnits } = options;
  const msPerUnit = {
    milliseconds: 1,
    seconds: 1000,
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    weeks: 7 * 24 * 60 * 60 * 1000,
    months: 30.44 * 24 * 60 * 60 * 1000, // Average month
    years: 365.25 * 24 * 60 * 60 * 1000, // Account for leap years
  };

  // Convert all values to milliseconds
  const units: (keyof IDuration)[] = [
    "years",
    "months",
    "weeks",
    "days",
    "hours",
    "minutes",
    "seconds",
    "milliseconds",
  ];
  const smallestProvidedUnit = units
    .reverse()
    .find((unit) => duration[unit] !== undefined);

  if (!smallestProvidedUnit) return { milliseconds: 1 };

  // Get the index of the smallest allowed unit
  const smallestUnitIndex = units.indexOf(smallestProvidedUnit);

  // Get all allowed units (from largest to smallest provided unit)
  const allowedUnits = units.slice(smallestUnitIndex).reverse();

  let totalMs = 0;
  for (const [unit, value] of Object.entries(duration)) {
    if (value && unit in msPerUnit) {
      totalMs += value * msPerUnit[unit as keyof typeof msPerUnit];
    }
  }

  const normalizedDuration: IDuration = {};
  let unitsAdded = 0;

  for (const unit of allowedUnits) {
    // Break if we've reached the maximum number of units
    if (maxUnits !== undefined && unitsAdded >= maxUnits) {
      // Round up the last unit if there's remaining time
      if (totalMs > 0) {
        const lastUnit = Object.keys(normalizedDuration).pop() as keyof IDuration;
        if (lastUnit) {
          normalizedDuration[lastUnit] = Math.ceil(
            normalizedDuration[lastUnit]! + totalMs / msPerUnit[lastUnit]
          );
        }
      }
      break;
    }

    const unitInMs = msPerUnit[unit];
    if (totalMs >= unitInMs) {
      const value = Math.floor(totalMs / unitInMs);
      normalizedDuration[unit] = value;
      totalMs = Math.round((totalMs - value * unitInMs) * 1000000) / 1000000;
      unitsAdded++;
    }
  }

  // Remove any zero values
  Object.keys(normalizedDuration).forEach((key) => {
    const value = normalizedDuration[key as keyof IDuration];
    if (value === 0 || value === undefined || Number.isNaN(value)) {
      delete normalizedDuration[key as keyof IDuration];
    }
  });

  return normalizedDuration;
};
