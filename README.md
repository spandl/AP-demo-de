# Observaable Framework starter kit
This is an adaptation of a [Observable Framework](https://observablehq.com/framework/) app that fetches data from BigQuery tables, created by [GA4 Data Form](https://ga4dataform.com/)

## Clone the repo
`git clone git@github.com:spandl/observable-starter.git`

and go into the directory

`cd observable-starter`

## Get secrets to connect to BigQuery tables

See the `sample.env` file for required secrets

### BQ_CLIENT_EMAIL and BQ_PRIVATE_KEY:

* Go to Google Cloud Console
* Navigate to "IAM & Admin" > "Service Accounts"
* Either create a new service account or use an existing one
* For a new service account:
  * Click "Create Service Account"
  * Give it a name and description
  * Grant necessary roles (at minimum "BigQuery Data Viewer" for read access)
  * Click "Create and Continue"
* To get the credentials:
  * Find your service account in the list
  * Click the three dots (⋮) menu on the right
  * Select "Manage Keys"
  * Click "Add Key" > "Create new key"
  * Choose JSON format
  * Download the JSON file

The JSON file will contain both the client_email and private_key

### TABLE_PATH

* Go to BigQuery in Google Cloud Console
* Navigate to your dataset where GA4 Dataform created the tables
* The path will be in format: project-id.dataset_name
* You can copy this from the BigQuery UI when viewing your dataset

## Install dependencies
To install the required dependencies, run:
`npm install`

## Preview the dashboard
`npm run dev`

Then visit <http://localhost:3000> to preview your app.

## Steps to deploy the application on Netlify
* initialize git `git init`
* Change your remote address with `git remote set-url origin git@github.com:xxx` and validate with `git remote -v`
* Push your code to a GitHub account
* Create an [netlify account](https://www.netlify.com/)
* Add a new site from template
  * Connect with your Github repo
  * Import your environment variables from `.env` file 

## Setup daily builds
The repo contains a daily build file in `.github/workflows/daily-build.yml`.
To trigger these build command on a daily base:
* Create a build hook in Netlify
    * Site configurations > Build and deploy > Build hooks
* Create a secret in Github, called `NETLIFY_BUILD_HOOK` with the value (URL) of the build hook

## Getting started guide by Observable

For more, see <https://observablehq.com/framework/getting-started>.

## Project structure

A typical Framework project looks like this:

```ini
.
├─ src
│  ├─ components
│  │  └─ timeline.js           # an importable module
│  ├─ data
│  │  ├─ launches.csv.js       # a data loader
│  │  └─ events.json           # a static data file
│  ├─ example-dashboard.md     # a page
│  ├─ example-report.md        # another page
│  └─ index.md                 # the home page
├─ .gitignore
├─ observablehq.config.js      # the app config file
├─ package.json
└─ README.md
```

**`src`** - This is the “source root” — where your source files live. Pages go here. Each page is a Markdown file. Observable Framework uses [file-based routing](https://observablehq.com/framework/project-structure#routing), which means that the name of the file controls where the page is served. You can create as many pages as you like. Use folders to organize your pages.

**`src/index.md`** - This is the home page for your app. You can have as many additional pages as you’d like, but you should always have a home page, too.

**`src/data`** - You can put [data loaders](https://observablehq.com/framework/data-loaders) or static data files anywhere in your source root, but we recommend putting them here.

**`src/components`** - You can put shared [JavaScript modules](https://observablehq.com/framework/imports) anywhere in your source root, but we recommend putting them here. This helps you pull code out of Markdown files and into JavaScript modules, making it easier to reuse code across pages, write tests and run linters, and even share code with vanilla web applications.

**`observablehq.config.js`** - This is the [app configuration](https://observablehq.com/framework/config) file, such as the pages and sections in the sidebar navigation, and the app’s title.

## Command reference

| Command           | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `npm install`            | Install or reinstall dependencies                        |
| `npm run dev`        | Start local preview server                               |
| `npm run build`      | Build your static site, generating `./dist`              |
| `npm run clean`      | Clear the local data loader cache                        |
| `npm run observable` | Run commands like `observable help`                      |
