## Dashboard sample page

```js
const eventData = await FileAttachment("./data/events.csv").csv({
  typed: true,
});

const sessionData = await FileAttachment("./data/sessions.csv").csv({
  typed: true,
});

view(Inputs.table(eventData))
view(Inputs.table(sessionData))

```