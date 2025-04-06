import "dotenv/config";
import { csvFormat } from "d3-dsv";
import { runQuery } from "./scripts/bigquery.js";

const {TABLE_PATH} = process.env;  
const tableName = `${TABLE_PATH}.ga4_sessions`;

const startDate = new Date();
startDate.setDate(1); // Set to first day of the current month
startDate.setMonth(startDate.getMonth() - 3); // Get 3 month of data
const startDateString = `${startDate.toISOString().split("T")[0]}`;

const query = `
SELECT 
      COUNT(*) AS record_count,
      is_final AS is_final,
  platform AS platform,
  CAST(session_date AS STRING) AS session_date,
      
    SUM(time.engagement_time_msec) AS time_engagement_time_msec,
    AVG(time.engagement_time_msec) AS time_engagement_time_msec_avg,
    MIN(time.engagement_time_msec) AS time_engagement_time_msec_min,
    MAX(time.engagement_time_msec) AS time_engagement_time_msec_max
  ,
  
    SUM(time.session_duration_s) AS time_session_duration_s,
    AVG(time.session_duration_s) AS time_session_duration_s_avg,
    MIN(time.session_duration_s) AS time_session_duration_s_min,
    MAX(time.session_duration_s) AS time_session_duration_s_max
  
    FROM 
      \`${tableName}\`
    
WHERE session_date >= '${startDateString}'
  # AND landing_page.landing_page_hostname NOT LIKE '%127.0.0.1%' 
  # AND landing_page.landing_page_hostname NOT LIKE '%localhost%' 
  AND landing_page.landing_page_hostname NOT LIKE '%web.app' 
  AND landing_page.landing_page_referrer NOT LIKE '%urlumbrella%'
  
    GROUP BY is_final, platform, session_date
    ORDER BY session_date DESC, record_count DESC
`;

const rows = await runQuery(query);

process.stdout.write(csvFormat(rows));
// process.stdout.write(TABLE_SESSIONS);
