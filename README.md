# My Budget

A simple personal budget tracker for paychecks, bills, and savings goals.

## Live site

Once GitHub Pages is enabled for this repository, the site deploys automatically from the `main` branch with the included GitHub Actions workflow.

Expected address:

`https://ethvnxd.github.io/BUDGETING-APP/`

## What it does

- Tracks take-home paychecks
- Tracks bills and assigns them to paycheck groups
- Shows monthly income, bills, money left after bills, and savings
- Tracks savings goals
- Imports paycheck history from a CSV file
- Exports and restores a local backup
- Stores budget data only in the current browser

## Payroll connections

The interface includes ADP, Paycom, Workday, Gusto, and UKG as payroll sources. A true sign-in connection cannot safely run only in GitHub Pages because payroll integration secrets must stay on a private server.

The working option in this static version is CSV import. A future direct connection should use a secure payroll aggregation service or official provider API with server-side token handling. Payroll usernames and passwords should never be stored in this repository or browser code.

## CSV format

The importer looks for a pay date column and a net pay column. Common names such as `pay date`, `check date`, `net pay`, and `net amount` are recognized. Employer/source and description/type columns are optional.

Example:

```csv
pay date,net pay,employer,description
2026-10-02,1200.50,Example Company,Regular paycheck
```

## Privacy

The repository contains no personal financial data, payroll passwords, API keys, or private tokens. Budget entries are stored in browser `localStorage`.
