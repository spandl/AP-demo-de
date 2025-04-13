```js
const eventData = await FileAttachment("./data/events.csv").csv({
  typed: true,
});

const sessionData = await FileAttachment("./data/sessions.csv").csv({
  typed: true,
});
```

```js
/* GENERAL IMPORTS & Data import */
import { dateRange } from "./scripts/dateRange.js";
import { filterDataByDateRange } from "./scripts/mergeAndCompare.js";
import { dateRangeSelector } from "./scripts/dateRangeSelector.js";
```

```js
const comparisonType = null;
const dateRangeObject = {
  current: [selectedDateRangeObject.startDate, selectedDateRangeObject.endDate],
  comparisonType,
};

const currentDateRange = [
  selectedDateRangeObject.startDate,
  selectedDateRangeObject.endDate,
];

const eventDataCompare = filterDataByDateRange(
  eventData,
  currentDateRange,
  "event_date"
);

const sessionDataCompare = filterDataByDateRange(
  sessionData,
  currentDateRange,
  "session_date"
);
```

```js
// DATE RANGE SELCTOR
const dateRangeInputs = Inputs.radio(dateRangeSelector.dateRanges, {
  format: (x) => x.name,
  value: dateRangeSelector.sessionValue ?? dateRangeSelector.dateRanges[0],
});

const selectedDateRange = Generators.input(dateRangeInputs);
```

```js
sessionStorage.setItem("dateRangeType", selectedDateRange.value);
```

```js
const selectedDateRangeObject =
  dateRangeSelector.getSelectedDateRangeObject(selectedDateRange);
const currentDateRangeString = dateRangeSelector.getCurrentDateRange(
  selectedDateRangeObject
);
```

<div class="hero">
  <div class="logo">
    <img
      class="logo"
      src="./assets/images/r42-logo-white.svg"
      alt="r42 communication"
    />
  </div>
  <div class="headline">
    <h1>Traffic analysis dashboard</h1>
    <p>r42 web properties – compared to previous date range</p>
    <div class="date-range">${ dateRangeInputs }<span class="date-range-label">${currentDateRangeString}</span></div>
  </div>
</div>

```js
/* SCORECARDS */
import { scoreCards } from "./scripts/visuals/scorecards.js";

// SESSIONS
const sessions = d3.sum(sessionDataCompare, (d) => d.record_count);

const sessionsScorecard = scoreCards.number({
  title: "Sessions",
  value: sessions,
  compareValue: null,
});

// PAGEVIEWS
const pageViews = d3.sum(
  eventDataCompare.filter((d) => d.event_name === "page_view"),
  (d) => d.record_count
);

const pageViewsScorecard = scoreCards.number({
  title: "Page views",
  value: pageViews,
  compareValue: null,
});

// DURATION
const duration = d3.mean(sessionDataCompare, (d) => d.time_session_duration_s_avg);

const durationScorecard = scoreCards.number({
  title: "Average session duration",
  value: duration,
  compareValue: null,
  durationUnit: "seconds",
});
```

<section class="grid grid-cols-3">
   <!-- Scorecards -->
   ${sessionsScorecard}
   ${pageViewsScorecard}
   ${durationScorecard}

</section>

```js
import { horizontalBarChart } from "./scripts/visuals/horizontalBarChart.js";

const accessors = {
  metric: "record_count",
  dimension: "page_title",
};
const config = {
  seriesConfiguration: {
    aggregateOther: true,
    maxSeries,
    aggregateOtherLabel: "Other",
    otherStyle: "striped",
    otherColor: null,
  },
};
const options = {
  accessors,
  config,
  size: {
    width,
  },
};
const barChart = (width) => horizontalBarChart.create(eventDataCompare, options);
```

```js
const slider = Inputs.range([1, 20], {
  step: 1,
  label: "Show top ...",
  value: 5,
});
const maxSeries = view(slider);
```

<section class="clear">
<h2>Most visited pages</h2>
  <p>${view(slider)}</p>
  <div>${resize((width) => barChart(width)) }</div>
  <!-- <div class="content-link-container">
    <a href="./dashboard/content" class="content-link">content analysis</a>
  </div> -->
</section>

```js
import { calendarHeatmap } from "./scripts/visuals/calendarHeatmap.js";
const threshold = 0.5;
const heatmap = (width) =>
  calendarHeatmap.create(
    eventDataCompare,
    null,
    {
      targets: {
        threshold: 50,
      },
    },
    { width }
  );
```

<section>
  <h2>Page views variations</h2>
  <p>+/- ${d3.format(".0%")(threshold)} variation, compared to previous date range</p>
  <div>${resize((width) => heatmap(width)) }</div>
  <!-- <div class="content-link-container">
    <a href="./dashboard/traffic-trends" class="content-link">sessions & events</a>
  </div> -->
</section>
