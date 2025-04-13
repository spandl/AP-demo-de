import * as d3 from "d3";

export type DateRangeType = "28-dd" | "last-mm" | "last-qq";

export type TComparisonType =
  | "day-to-day"
  | "weekday-to-weekday"
  | "month-to-month"
  | "quarter-to-quarter"
  | "week-to-week"
  | "year-to-year";

interface DateRangeConfig {
  current: [Date, Date];
  comparisonType: TComparisonType;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

const quarter = {
  floor: (date: Date) => {
    const month = date.getUTCMonth(); // Use UTC
    const quarterMonth = Math.floor(month / 3) * 3;
    return d3.utcMonth.floor(
      new Date(Date.UTC(date.getUTCFullYear(), quarterMonth, 1))
    );
  },
  offset: (date: Date, step: number) => {
    return d3.utcMonth.offset(date, step * 3);
  },
};

export const dateRange = {
  /**
   * Gets start and end dates for a specified date range type
   * @param referenceDate The date to calculate ranges from
   * @param dateRangeType Type of range to calculate
   * @returns Object with start and end dates
   */
  getDateRangePeriod: (
    referenceDate: Date,
    dateRangeType: DateRangeType
  ): DateRange => {
    const endDate = d3.utcDay.floor(referenceDate);
    const dateRange = calculateRangeByType(endDate, dateRangeType);

    return dateRange;
  },

  calculatePreviousDateRange: (config: DateRangeConfig): [Date, Date] => {
    const [start, end] = config.current;
    const dayCount = d3.utcDay.count(start, end) + 1;
  
    switch (config.comparisonType) {
      case "day-to-day": {
        return [
          d3.utcDay.offset(start, -dayCount),
          d3.utcDay.offset(end, -dayCount),
        ];
      }
      case "weekday-to-weekday": {
        // First get the basic previous period
        const previousStart = d3.utcDay.offset(start, -dayCount);
        const previousEnd = d3.utcDay.offset(end, -dayCount);
  
        // Adjust the start date to match weekday
        const weekdayOffset = getWeekdayOffset(previousStart, start);
        return [
          d3.utcDay.offset(previousStart, weekdayOffset),
          d3.utcDay.offset(previousEnd, weekdayOffset),
        ];
      }
  
      case "week-to-week": {
        // Not yet validated
        return [d3.utcDay.offset(start, -7), d3.utcDay.offset(end, -7)];
      }
  
      case "month-to-month": {
        // Get initial previous month dates
        const previousStart = d3.utcMonth.offset(start, -1);
        const previousEnd = d3.utcDay.offset(
          d3.utcMonth.ceil(d3.utcMonth.offset(end, -1)),
          -1
        );
        return [previousStart, previousEnd];
      }
  
      case "quarter-to-quarter": {
        const previousStart = d3.utcMonth.offset(start, -3);
        const nextQuarterStart = d3.utcMonth.offset(previousStart, 3);
        const previousEnd = d3.utcDay.offset(nextQuarterStart, -1);
  
        return [previousStart, previousEnd];
      }
  
      case "year-to-year": {
        // Not yet validated
        const previousStart = d3.utcMonth.offset(start, -12);
        const previousEnd = d3.utcMonth.offset(end, -12);
  
        return [previousStart, previousEnd];
      }
  
      default:
        throw new Error(`Invalid comparison type: ${config.comparisonType}`);
    }
  },
  domainFromDateRange: (
      dateRange: [Date, Date]
    ): Date[] => {
      const interval = d3.utcDay.every(1);
      if (!interval) {
        throw new Error("Failed to create time interval");
      }
    
      // Create the range of all required dates
      const startDate = d3.utcDay.floor(dateRange[0]);
      const endDate = d3.utcDay.floor(dateRange[1]);
      return interval.range(startDate, d3.utcDay.offset(endDate, 1));
    }
};



const getWeekdayOffset = (date: Date, targetDate: Date): number => {
  const weekday = date.getUTCDay();
  const targetWeekday = targetDate.getUTCDay();

  // Calculate both forward and backward offsets
  const forwardOffset = (targetWeekday - weekday + 7) % 7;
  const backwardOffset = -((weekday - targetWeekday + 7) % 7);

  // Return the offset with the smallest absolute value
  return Math.abs(forwardOffset) <= Math.abs(backwardOffset)
    ? forwardOffset
    : backwardOffset;
};



const calculateRangeByType = (
  referenceDate: Date,
  dateRangeType: DateRangeType
): { startDate: Date; endDate: Date } => {
  // Start with UTC day

  switch (dateRangeType) {
    case "28-dd":
      const dateRange = {
        startDate: d3.utcDay.offset(referenceDate, -28),
        endDate: d3.utcDay.offset(referenceDate, -1),
      };
      // printDateRange(dateRange);
      return dateRange;

    case "last-mm": {
      // Get first day of current month
      const thisMonth = d3.utcMonth.floor(referenceDate);
      // Get first day of last month
      const lastMonth = d3.utcMonth.offset(thisMonth, -1);
      // Get first day of next month
      const nextMonth = d3.utcMonth.offset(lastMonth, 1);

      return {
        startDate: lastMonth,
        endDate: d3.utcDay.offset(nextMonth, -1),
      };
    }

    case "last-qq": {
      // Get first day of this quarter
      const thisQuarter = quarter.floor(referenceDate);
      // Get first day of last quarter
      const lastQuarter = quarter.offset(thisQuarter, -1);
      // Get first day of next quarter
      const nextQuarter = quarter.offset(lastQuarter, 1);

      return {
        startDate: lastQuarter,
        endDate: d3.utcDay.offset(nextQuarter, -1),
      };
    }

    default:
      throw new Error(`Invalid date range type: ${dateRangeType}`);
  }
};
