# MediTrust Web Frontend - Selenium E2E Test Suite

Comprehensive Selenium WebDriver End-to-End functional testing suite for the MediTrust Web Application frontend.

## Directory Structure
```
selenium-tests/
├── tests/
│   └── login-tests.js                # Selenium WebDriver E2E test suite
├── generate-test-cases-excel.js      # Excel report generator (320 test cases)
├── MediTrust_Web_E2E_Test_Cases_320.xlsx # Complete generated Excel report
└── package.json                      # Selenium and test dependencies
```

## Setup & Prerequisites
1. Ensure the web application is running locally:
   ```bash
   cd web
   npm run dev
   ```
   (Default URL: `http://localhost:5173`)

2. Install test dependencies:
   ```bash
   cd selenium-tests
   npm install
   ```

## Running the Selenium Tests
- **Headless Mode (CI / Default):**
  ```bash
  npm test
  ```
- **Visible Browser GUI Mode:**
  ```bash
  HEADLESS=false npm test
  ```

## Generating / Exporting the 300+ Test Cases Excel Workbook
To regenerate the complete Excel report with test summary and details:
```bash
npm run generate:report
```
The resulting spreadsheet `MediTrust_Web_E2E_Test_Cases_320.xlsx` contains:
- **Sheet 1: `Test Suite Summary`** - KPI metrics, pass rates, module-wise test case counts, severity breakdowns.
- **Sheet 2: `Detailed Test Cases`** - 320 structured test cases with Test ID, Category, Scenarios, Steps, Test Data, Expected Results, Severity, and Execution Status.
