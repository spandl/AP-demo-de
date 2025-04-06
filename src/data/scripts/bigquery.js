import "dotenv/config";
import {BigQuery} from "@google-cloud/bigquery";

const {BQ_PROJECT_ID, BQ_CLIENT_EMAIL, BQ_PRIVATE_KEY} = process.env;

if (!BQ_PROJECT_ID) throw new Error("missing BQ_PROJECT_ID");
if (!BQ_CLIENT_EMAIL) throw new Error("missing BQ_CLIENT_EMAIL");
if (!BQ_PRIVATE_KEY) throw new Error("missing BQ_PRIVATE_KEY");

// Handle private key formatting
const formattedPrivateKey = BQ_PRIVATE_KEY.replace(/\\n/g, '\n');

const bigQueryClient = new BigQuery({
  projectId: BQ_PROJECT_ID,
  credentials: {
    client_email: BQ_CLIENT_EMAIL,
    private_key: formattedPrivateKey
  }
});

export async function runQuery(query) {
  return (await bigQueryClient.query({query}))[0];
}