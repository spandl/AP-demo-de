import type { DateRangeType, TComparisonType, DateRange } from "./dateRange.js";
import {formatDateRange } from "./format.js";
import { dateRange } from "./dateRange.js";

interface IDateRangeDefinition {
    name: string,
    value: DateRangeType
}
const dateRanges = [
  { name: "Last 28 days", value: "28-dd" },
  { name: "Last month", value: "last-mm" },
  { name: "Last quarter", value: "last-qq" },
];

export const dateRangeSelector = {
  dateRanges,
  sessionValue: dateRanges.find(
    (d) => d.value === sessionStorage.getItem("dateRangeType")
  ),
  getComparisonType: (dateRangeType: DateRangeType): TComparisonType => {
    switch (dateRangeType) {
      case "28-dd":
        return "day-to-day";
      case "last-mm":
        return "month-to-month";
      case "last-qq":
        return "quarter-to-quarter";
    }
  },
  getSelectedDateRangeObject: (selectedDateRange: IDateRangeDefinition) => dateRange.getDateRangePeriod(
    new Date(),
    selectedDateRange.value
  ),
  getCurrentDateRange: (selectedDateRangeObject: DateRange) => formatDateRange({
    dates: [selectedDateRangeObject.startDate, selectedDateRangeObject.endDate],
    options: {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  })
};
