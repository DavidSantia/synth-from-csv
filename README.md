[![New Relic Experimental header](https://github.com/newrelic/opensource-website/raw/master/src/images/categories/Experimental.png)](https://opensource.newrelic.com/oss-category/#new-relic-experimental)

# Synth From CSV

Bulk create synthetics monitors from CSV with configurable options and tags

## About this Nerdpack

This application uses a CSV file containing a locale, url, status, name, and additional columns to generate synthetics monitors.  It provides configuration options that:

- map the locale (a 2-character code) to one or more synthetics public locations.
- map the status (a pre-defined set of strings) to a monitor frequency
- select column names that auto-generate tags (key will be the column name, value the row value)

It does error checking to make sure the required fields can be parsed from the CSV, as well as make sure they have been specified in each row to properly generate the GraphQl mutation for creating the monitor.

![Settings Tab](screenshots/settings-tab.png)

## Open source license

This project is distributed under the [Apache 2 license](LICENSE).

## What do you need to make this work?

Required:

- User must have permissions for Synthetics Manager to create monitors

Execute the following command to clone this repository and run the code locally against your New Relic data:

```bash
nr1 nerdpack:clone -r https://github.com/DavidSantia/synth-from-csv.git
cd synth-from-csv
npm install
nr1 nerdpack:serve
```

Visit [https://one.newrelic.com/?nerdpacks=local](https://one.newrelic.com/?nerdpacks=local) to launch your app locally.

# Support

New Relic has open-sourced this project. This project is provided AS-IS WITHOUT WARRANTY OR DEDICATED SUPPORT. Issues and contributions should be reported to the project here on GitHub.

We encourage you to bring your experiences and questions to the [Explorers Hub](https://discuss.newrelic.com) where our community members collaborate on solutions and new ideas.

## Issues / enhancement requests

Issues and enhancement requests can be submitted in the [Issues tab of this repository](../../issues). Please search for and review the existing open issues before submitting a new issue.

# Contributing

> Work with the Open Source Office to update the email alias below.

Contributions are encouraged! If you submit an enhancement request, we'll invite you to contribute the change yourself. Please review our [Contributors Guide](CONTRIBUTING.md).
