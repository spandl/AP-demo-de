import "dotenv/config";
import { csvFormat } from "d3-dsv";
import { runQuery } from "./scripts/bigquery.js";

const {TABLE_PATH} = process.env;  
const tableName = `${TABLE_PATH}.ga4_events`;

const startDate = new Date();
startDate.setDate(1); // Set to first day of the current month
startDate.setMonth(startDate.getMonth() - 3); // Get 3 month of data
const startDateString = `${startDate.toISOString().split("T")[0]}`;

const query = `
SELECT 
COUNT(*) AS record_count,
event_name AS event_name,
CAST(event_date AS STRING) AS event_date,
session_id AS session_id,
is_final AS is_final,
page.hostname AS page_hostname,
page.location AS page_location,
page.path AS page_path,
page.referrer AS page_referrer,
page.title AS page_title

FROM 
\`${tableName}\`

WHERE event_date >= '${startDateString}'
# AND page.hostname NOT LIKE '%127.0.0.1%' 
# AND page.hostname NOT LIKE '%localhost%' 
AND page.hostname NOT LIKE '%web.app' 
AND page.referrer NOT LIKE '%urlumbrella%' 
AND event_name = 'page_view'
AND page.title IS NOT NULL

GROUP BY event_name, event_date, session_id, is_final, page.hostname, page.location, page.path, page.referrer, page.title
ORDER BY event_date DESC, record_count DESC
`;

const rows = await runQuery(query);

process.stdout.write(csvFormat(rows));
// process.stdout.write(query);
